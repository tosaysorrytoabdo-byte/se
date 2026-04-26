import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  boolean,
} from "drizzle-orm/mysql-core";

// Kimi dashboard users (admins/owners who can access the web dashboard)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Bot controllers (Discord IDs who can use the bot via Discord - set by owner)
export const botControllers = mysqlTable("bot_controllers", {
  id: serial("id").primaryKey(),
  discordId: varchar("discord_id", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  addedBy: varchar("added_by", { length: 255 }), // who added this controller
  isOwner: boolean("is_owner").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BotController = typeof botControllers.$inferSelect;
export type InsertBotController = typeof botControllers.$inferInsert;

// Discord OAuth users (member stock - people who did OAuth2)
export const discordUsers = mysqlTable("discord_users", {
  id: serial("id").primaryKey(),
  discordId: varchar("discord_id", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  avatar: text("avatar"),
  email: varchar("email", { length: 320 }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  nitro: mysqlEnum("nitro", ["yes", "no", "unknown"]).default("unknown"),
  status: mysqlEnum("status", ["active", "expired", "used", "banned"]).default("active"),
  lastUsedAt: timestamp("last_used_at"),
  totalJoins: int("total_joins").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DiscordUser = typeof discordUsers.$inferSelect;
export type InsertDiscordUser = typeof discordUsers.$inferInsert;

// Orders (member purchases)
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  buyerDiscordId: varchar("buyer_discord_id", { length: 255 }).notNull(),
  buyerUsername: varchar("buyer_username", { length: 255 }),
  serverId: varchar("server_id", { length: 255 }).notNull(),
  serverName: varchar("server_name", { length: 255 }),
  amount: int("amount").notNull(), // how many members ordered
  delivered: int("delivered").default(0), // how many successfully joined
  price: int("price").notNull(), // price in coins/credits
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Tickets (support/buy requests)
export const tickets = mysqlTable("tickets", {
  id: serial("id").primaryKey(),
  userDiscordId: varchar("user_discord_id", { length: 255 }).notNull(),
  userUsername: varchar("user_username", { length: 255 }),
  channelId: varchar("channel_id", { length: 255 }),
  type: mysqlEnum("type", ["buy_members", "buy_coins", "support"]).notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "closed"]).default("open").notNull(),
  metadata: text("metadata"), // JSON: { serverId, amount, price }
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// Bot Settings (welcome message, price per member, etc.)
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"), // JSON string
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// Target Servers (servers the bot has joined and can add members to)
export const servers = mysqlTable("servers", {
  id: serial("id").primaryKey(),
  serverId: varchar("server_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  icon: text("icon"),
  ownerId: varchar("owner_id", { length: 255 }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  active: boolean("active").default(true),
});

export type Server = typeof servers.$inferSelect;
export type InsertServer = typeof servers.$inferInsert;

// Activity logs (for tracking what the bot does)
export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: mysqlEnum("type", ["join", "order", "ticket", "oauth", "error"]).notNull(),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
