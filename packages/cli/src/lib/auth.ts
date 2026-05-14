import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js"; // your drizzle instance

if (!process.env.DATABASE_URL) {
	throw new Error("Missing DATABASE_URL environment variable");
}

if (!process.env.BETTER_AUTH_SECRET) {
	throw new Error("Missing BETTER_AUTH_SECRET environment variable");
}

if (!process.env.BETTER_AUTH_BASE_URL) {
	throw new Error("Missing BETTER_AUTH_BASE_URL environment variable");
}

export const auth = betterAuth({
	basePath: "/api/v1/auth",
	baseURL: process.env.BETTER_AUTH_BASE_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg", // or "mysql", "sqlite"
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // optional, defaults to false
	},
});
