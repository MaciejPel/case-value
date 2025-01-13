import { error, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { STEAM_API_KEY } from "$env/static/private";
import { db } from "$lib/server/db";
import { currencyRates, items, itemsPrice, userItems, users } from "$lib/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { union } from "drizzle-orm/sqlite-core";

interface Inventory {
	assets: Asset[];
	descriptions: AssetDescription[];
	total_inventory_count: number;
	success: number;
	rwgrsn: number;
}

interface Asset {
	appid: number;
	contextid: string;
	assetid: string;
	classid: string;
	instanceid: string;
	amount: string;
}

interface AssetDescription {
	appid: number;
	classid: string;
	instanceid: string;
	currency: number;
	background_color: string;
	icon_url: string;
	descriptions: ItemDescription[];
	tradable: number;
	name: string;
	name_color: string;
	type: string;
	market_name: string;
	market_hash_name: string;
	commodity: number;
	market_tradable_restriction: number;
	market_marketable_restriction: number;
	marketable: number;
	tags: Tag[];
	actions?: {
		link: string;
		name: string;
	}[];
	market_actions?: {
		link: string;
		name: string;
	}[];
}

interface ItemDescription {
	type: string;
	value: string;
	name: string;
	color?: string;
}

interface Tag {
	category: string;
	internal_name: string;
	localized_category_name: string;
	localized_tag_name: string;
	color?: string;
}

interface MarketPrice {
	success: boolean;
	lowest_price: string;
	volume: string;
	median_price: string;
}

interface PlayerSummaries {
	response: { players: Player[] };
}

interface Player {
	steamid: string;
	communityvisibilitystate: number;
	profilestate: number;
	personaname: string;
	commentpermission: number;
	profileurl: string;
	avatar: string;
	avatarmedium: string;
	avatarfull: string;
	avatarhash: string;
	lastlogoff: number;
	personastate: number;
	primaryclanid: string;
	timecreated: number;
	personastateflags: number;
}

interface SteamUser {
	response: {
		steamid: string;
		success: number;
	};
}

const endpoints = {
	inventory: (id: string) => `https://steamcommunity.com/inventory/${id}/730/2`,
	profile: (id: string) =>
		`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${id}`,
	user: (name: string) =>
		`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${name}`,
	price: (name: string) =>
		`https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=${encodeURIComponent(name)}`,
	currency: "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
};

async function getUserComputedInventory(id: string) {
	const inventoryResponse = await fetch(endpoints.inventory(id));
	const inventoryData: Inventory = await inventoryResponse.json();

	const inventory = inventoryData.descriptions
		.filter((v) => v.marketable && v.name.includes("Case"))
		.map((v) => ({ id: v.classid, iconHash: v.icon_url, name: v.name, price: 0, count: 0, sum: 0 }))
		.filter((v, idx, self) => idx === self.findIndex((t) => t.id === v.id));
	const idCount = inventoryData.assets.reduce(
		(acc, item) => {
			const classId = item.classid;
			acc[classId] = (acc[classId] || 0) + 1;
			return acc;
		},
		<{ [key: string]: number }>{},
	);
	for (const [k, n] of Object.entries(idCount)) {
		const item = inventory.find((v) => v.id === k);
		if (item) {
			item.count = n;
			item.sum = n * item.price;
		}
	}

	return inventory;
}

async function getUserProfile(id: string) {
	const response = await fetch(endpoints.profile(id));
	const data: PlayerSummaries = await response.json();
	const player = data.response.players[0];
	return {
		id,
		nick: player.personaname,
		avatarHash: player.avatarhash,
	};
}

async function getUserInfo(name: string) {
	const response = await fetch(endpoints.user(name));
	const data: SteamUser = await response.json();

	return data;
}

export const load: PageServerLoad = async ({ params }) => {
	const now = new Date();
	const { name } = params;

	const steamUser = await getUserInfo(name);
	if (steamUser.response.success !== 1) error(404, "not found");
	const steamUserId = steamUser.response.steamid;

	const cachedUsers = await db.select().from(users).where(eq(users.id, steamUserId));
	const cachedUser = cachedUsers.length ? cachedUsers[0] : null;

	let useCache = false;
	if (cachedUser) {
		const refreshAvailableAt = new Date(cachedUser.updatedAt.getTime());
		refreshAvailableAt.setHours(refreshAvailableAt.getHours() + 2);
		console.log(refreshAvailableAt, now);
		useCache = refreshAvailableAt > now;
	}

	if (useCache && cachedUser) {
		const inventory = await db
			.select({
				id: items.id,
				iconHash: items.iconHash,
				name: items.name,
				price: itemsPrice.price,
				count: userItems.count,
				sum: sql<number>`round(item_price.price * user_item.count, 2)`.as("sum"),
			})
			.from(userItems)
			.innerJoin(items, eq(userItems.itemId, items.id))
			.innerJoin(itemsPrice, eq(items.id, itemsPrice.itemId))
			.where(
				and(eq(userItems.userId, steamUserId), eq(itemsPrice.createdAt, cachedUser.updatedAt)),
			);
		const currencyRate = await db
			.select()
			.from(currencyRates)
			.where(eq(currencyRates.createdAt, cachedUser.updatedAt));
		const chartData = await union(
			db
				.select({
					sum: sql<number>`round(sum(item_price.price * user_item.count), 2)`.as("sum"),
					code: sql<string>`"USD"`,
					createdAt: itemsPrice.createdAt,
				})
				.from(userItems)
				.innerJoin(itemsPrice, eq(userItems.itemId, itemsPrice.itemId))
				.where(eq(userItems.userId, steamUserId))
				.groupBy(itemsPrice.createdAt),
			db
				.select({
					sum: sql<number>`round(sum(item_price.price * user_item.count * currency_rates.rate), 2)`.as(
						"sum",
					),
					code: currencyRates.code,
					createdAt: itemsPrice.createdAt,
				})
				.from(userItems)
				.innerJoin(itemsPrice, eq(userItems.itemId, itemsPrice.itemId))
				.innerJoin(currencyRates, eq(currencyRates.createdAt, itemsPrice.createdAt))
				.where(eq(userItems.userId, steamUserId))
				.orderBy(itemsPrice.createdAt)
				.groupBy(itemsPrice.createdAt, currencyRates.code),
		);

		return { profileInfo: cachedUser, inventory, currencyRate, search: name, chartData };
	} else {
		const profileInfo = await getUserProfile(steamUserId);
		if (!profileInfo) error(404, { message: "not found" });
		const inventory = await getUserComputedInventory(steamUserId);

		const marketPromises = inventory.map(async (v) => {
			const res = await fetch(endpoints.price(v.name));
			const data: MarketPrice = await res.json();
			return {
				id: v.id,
				price: Number(data.lowest_price.replace(/[^0-9.,]/g, "").replace(",", ".")),
			};
		});
		const fulfilledMarketPromises = (await Promise.allSettled(marketPromises))
			.filter((v) => v.status === "fulfilled")
			.map((v) => v.value);
		inventory.forEach((item) => {
			const marketData = fulfilledMarketPromises.find((data) => data.id === item.id);
			if (marketData) item.price = marketData.price;
		});
		if (inventory.length !== fulfilledMarketPromises.length)
			error(429, { message: "Too many requests" });

		const currencyResponse = await fetch(endpoints.currency);
		const currencyData: { date: string; usd: { eur: number; pln: number } } =
			await currencyResponse.json();
		const currencyRate = [
			{ code: "PLN", rate: currencyData.usd.pln, createdAt: now },
			{ code: "EUR", rate: currencyData.usd.eur, createdAt: now },
		];

		if (!cachedUser) {
			await db.insert(users).values({ ...profileInfo, updatedAt: now });
			await db
				.insert(items)
				.values(inventory.map((v) => ({ id: v.id, iconHash: v.iconHash, name: v.name })))
				.onConflictDoNothing({ target: items.id });
			await db
				.insert(userItems)
				.values(inventory.map((v) => ({ userId: profileInfo.id, itemId: v.id, count: v.count })));
		} else await db.update(users).set({ updatedAt: now });
		await db
			.insert(itemsPrice)
			.values(inventory.map((v) => ({ itemId: v.id, price: v.price, createdAt: now })));
		await db.insert(currencyRates).values(currencyRate);

		const chartData = await union(
			db
				.select({
					sum: sql<number>`round(sum(item_price.price * user_item.count), 2)`.as("sum"),
					code: sql<string>`"USD"`,
					createdAt: itemsPrice.createdAt,
				})
				.from(userItems)
				.innerJoin(itemsPrice, eq(userItems.itemId, itemsPrice.itemId))
				.where(eq(userItems.userId, steamUserId))
				.groupBy(itemsPrice.createdAt),
			db
				.select({
					sum: sql<number>`round(sum(item_price.price * user_item.count * currency_rates.rate), 2)`.as(
						"sum",
					),
					code: currencyRates.code,
					createdAt: itemsPrice.createdAt,
				})
				.from(userItems)
				.innerJoin(itemsPrice, eq(userItems.itemId, itemsPrice.itemId))
				.innerJoin(currencyRates, eq(currencyRates.createdAt, itemsPrice.createdAt))
				.where(eq(userItems.userId, steamUserId))
				.orderBy(itemsPrice.createdAt)
				.groupBy(itemsPrice.createdAt, currencyRates.code),
		);

		return {
			profileInfo: { ...profileInfo, updatedAt: now },
			inventory,
			currencyRate,
			search: name,
			chartData,
		};
	}
};

export const actions = {
	updateProfile: async () => {},
	updateInventory: async () => {},
} satisfies Actions;
