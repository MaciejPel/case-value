import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, int } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
	id: text("id").primaryKey(),
	nick: text("nick").notNull(),
	avatarHash: text("avatar_hash").notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const usersRelations = relations(users, ({ many }) => ({
	items: many(userItems),
}));

export const userItems = sqliteTable("user_item", {
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	itemId: text("item_id")
		.notNull()
		.references(() => items.id),
	count: int("count").notNull(),
});

export const items = sqliteTable("item", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	iconHash: text("icon_hash").notNull(),
});

export const itemsRelations = relations(items, ({ many }) => ({
	items: many(itemsPrice),
	users: many(userItems),
}));

export const itemsPrice = sqliteTable("item_price", {
	itemId: text("item_id")
		.notNull()
		.references(() => items.id),
	price: real("price").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const currencyRates = sqliteTable("currency_rates", {
	code: text("code", { length: 3 }).notNull(),
	rate: real("rate").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});
