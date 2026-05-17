import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema.js";

const DEFAULT_DB_IDLE_TIMEOUT_SECONDS = 20;
const DEFAULT_DB_CONNECT_TIMEOUT_SECONDS = 30;
const DEFAULT_DB_POOL_SIZE = 15;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("Missing DATABASE_URL environment variable");
}

const isProduction = process.env.NODE_ENV === "production";

function parsePositiveIntegerEnv(
	value: string | undefined,
	defaultValue: number,
	envName: string,
): number {
	if (value === undefined || value.trim().length === 0) {
		return defaultValue;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(
			`Invalid ${envName} value "${value}". Expected an integer >= 1.`,
		);
	}

	return parsed;
}

function shouldEnableDbSsl(): boolean {
	const raw = process.env.DB_SSL;
	if (raw === undefined) {
		return isProduction;
	}

	const normalized = raw.trim().toLowerCase();
	if (normalized === "1" || normalized === "true") {
		return true;
	}

	if (normalized === "0" || normalized === "false") {
		return false;
	}

	throw new Error(`Invalid DB_SSL value "${raw}". Expected true/false or 1/0.`);
}

export const postgresClient = postgres(connectionString, {
	// Named prepared statements are not supported by PgBouncer in transaction mode
	prepare: false,
	// Idle connections are released after this many seconds
	idle_timeout: parsePositiveIntegerEnv(
		process.env.DB_IDLE_TIMEOUT,
		DEFAULT_DB_IDLE_TIMEOUT_SECONDS,
		"DB_IDLE_TIMEOUT",
	),
	// Hard timeout for acquiring a connection
	connect_timeout: parsePositiveIntegerEnv(
		process.env.DB_CONNECT_TIMEOUT,
		DEFAULT_DB_CONNECT_TIMEOUT_SECONDS,
		"DB_CONNECT_TIMEOUT",
	),
	// Connection pool ceiling – tune via env for different deployment sizes
	max: parsePositiveIntegerEnv(
		process.env.DB_POOL_SIZE,
		DEFAULT_DB_POOL_SIZE,
		"DB_POOL_SIZE",
	),
	// Require SSL in production by default (override with DB_SSL)
	// ssl: shouldEnableDbSsl() ? "require" : false,
	// Suppress informational notices from Postgres
	onnotice: () => {},
});

export const db = drizzle(postgresClient, { schema });
