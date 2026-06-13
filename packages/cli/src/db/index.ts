import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../schema.js";
import { createPostgresClient } from "./create-postgres-client.js";

const DEFAULT_DB_POOL_SIZE = 15;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("Missing DATABASE_URL environment variable");
}

export const postgresClient = createPostgresClient({
	connectionString,
	poolSize: DEFAULT_DB_POOL_SIZE,
	invalidEnvPolicy: "throw",
});

export const db = drizzle(postgresClient, { schema });
