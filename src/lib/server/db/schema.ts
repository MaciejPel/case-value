import { relations, sql } from "drizzle-orm";
import { mysqlTable, primaryKey, int, varchar, double, datetime } from "drizzle-orm/mysql-core";

export const users = mysqlTable("user", {
	id: varchar("id", { length: 32 }).primaryKey(),
	nick: varchar("nick", { length: 128 }).notNull(),
	avatarHash: varchar("avatar_hash", { length: 256 }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
	userItems: many(userItems),
	updates: many(updates),
}));

export const updates = mysqlTable("user_updates", {
	id: int("id", { unsigned: true }).primaryKey().autoincrement(),
	userId: varchar("user_id", { length: 32 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	updatedAt: datetime("updated_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export const updatesRelations = relations(updates, ({ one }) => ({
	user: one(users, { fields: [updates.userId], references: [users.id] }),
}));

export const userItems = mysqlTable(
	"user_item",
	{
		userId: varchar("user_id", { length: 32 })
			.notNull()
			.references(() => users.id),
		itemId: varchar("item_id", { length: 32 })
			.notNull()
			.references(() => items.id),
		count: int("count", { unsigned: true }).notNull(),
	},
	(table) => {
		return { pk: primaryKey({ columns: [table.userId, table.itemId] }) };
	},
);

export const userItemsRelations = relations(userItems, ({ one }) => ({
	user: one(users, { fields: [userItems.itemId], references: [users.id] }),
}));

export const items = mysqlTable("item", {
	id: varchar("id", { length: 32 }).primaryKey(),
	name: varchar("name", { length: 128 }).notNull(),
	iconHash: varchar("icon_hash", { length: 256 }).notNull(),
});

export const itemsRelations = relations(items, ({ many }) => ({
	itemsPrice: many(itemsPrice),
}));

export const itemsPrice = mysqlTable("item_price", {
	itemId: varchar("item_id", { length: 32 })
		.notNull()
		.references(() => items.id),
	price: double("price", { precision: 10, scale: 2 }).notNull(),
	updateId: int("update_id", { unsigned: true })
		.notNull()
		.references(() => updates.id, { onDelete: "cascade" }),
});

export const itemsPriceRelations = relations(itemsPrice, ({ one }) => ({
	item: one(items, { fields: [itemsPrice.itemId], references: [items.id] }),
}));

export const currencyRates = mysqlTable("currency_rates", {
	code: varchar("code", { length: 3 }).notNull(),
	rate: double("rate", { precision: 10, scale: 8 }).notNull(),
	updateId: int("update_id", { unsigned: true })
		.notNull()
		.references(() => updates.id, { onDelete: "cascade" }),
});
