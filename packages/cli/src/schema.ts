import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	role: text("role"),
	banned: boolean("banned"),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { precision: 6, withTimezone: true }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		deviceId: text("device_id"),
		impersonatedBy: text("impersonated_by"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const serverLog = pgTable(
	"server_log",
	{
		id: text("id").primaryKey(),
		level: text("level").notNull(),
		scope: text("scope").notNull(),
		message: text("message").notNull(),
		requestId: text("request_id"),
		method: text("method"),
		path: text("path"),
		statusCode: integer("status_code"),
		durationMs: integer("duration_ms"),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id"),
		errorName: text("error_name"),
		errorMessage: text("error_message"),
		errorStack: text("error_stack"),
		createdAt: timestamp("created_at", {
			precision: 6,
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("server_log_created_at_idx").on(table.createdAt),
		index("server_log_level_idx").on(table.level),
	],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const apikey = pgTable("apikey", {
	id: text("id").primaryKey().unique(),
	configId: text("config_id").notNull(),
	name: text("name"),
	start: text("start"),
	prefix: text("prefix"),
	key: text("key").notNull(),
	referenceId: text("reference_id").notNull(),
	refillInterval: integer("refill_interval"),
	refillAmount: integer("refill_amount"),
	lastRefillAt: timestamp("last_refill_at", {
		precision: 6,
		withTimezone: true,
	}),
	enabled: boolean("enabled"),
	rateLimitEnabled: boolean("rate_limit_enabled"),
	rateLimitTimeWindow: integer("rate_limit_time_window"),
	rateLimitMax: integer("rate_limit_max"),
	requestCount: integer("request_count"),
	remaining: integer("remaining"),
	lastRequest: timestamp("last_request", { precision: 6, withTimezone: true }),
	expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }),
	createdAt: timestamp("created_at", {
		precision: 6,
		withTimezone: true,
	}).notNull(),
	updatedAt: timestamp("updated_at", {
		precision: 6,
		withTimezone: true,
	}).notNull(),
	permissions: text("permissions"),
	metadata: text("metadata"),
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));
