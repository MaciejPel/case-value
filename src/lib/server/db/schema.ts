import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
	id: text("id").primaryKey(),
	nick: text("nick").notNull(),
	avatarHash: text("avatar_hash").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
	userItems: many(userItems),
	updates: many(updates),
}));

export const updates = sqliteTable("user_updates", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const updatesRelations = relations(updates, ({ one }) => ({
	user: one(users, { fields: [updates.userId], references: [users.id] }),
}));

export const userItems = sqliteTable(
	"user_item",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		itemId: text("item_id")
			.notNull()
			.references(() => items.id),
		count: integer("count").notNull(),
	},
	(table) => {
		return { pk: primaryKey({ columns: [table.userId, table.itemId] }) };
	},
);

export const userItemsRelations = relations(userItems, ({ one }) => ({
	user: one(users, { fields: [userItems.itemId], references: [users.id] }),
}));

export const items = sqliteTable("item", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	iconHash: text("icon_hash").notNull(),
});

export const itemsRelations = relations(items, ({ many }) => ({
	itemsPrice: many(itemsPrice),
}));

export const itemsPrice = sqliteTable("item_price", {
	itemId: text("item_id")
		.notNull()
		.references(() => items.id),
	price: real("price").notNull(),
	updateId: integer("update_id")
		.notNull()
		.references(() => updates.id, { onDelete: "cascade" }),
});

export const itemsPriceRelations = relations(itemsPrice, ({ one }) => ({
	item: one(items, { fields: [itemsPrice.itemId], references: [items.id] }),
}));

export const currencyRates = sqliteTable("currency_rates", {
	code: text("code", { length: 3 }).notNull(),
	rate: real("rate").notNull(),
	updateId: integer("update_id")
		.notNull()
		.references(() => updates.id, { onDelete: "cascade" }),
});
