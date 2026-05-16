import { apiKey } from "@better-auth/api-key";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "../db/index.js";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing ${name} environment variable`);
	}

	return value;
}

requireEnv("DATABASE_URL");
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET");
const betterAuthBaseUrl = requireEnv("BETTER_AUTH_BASE_URL");

const config = {
	basePath: "/api/v1/auth",
	baseURL: betterAuthBaseUrl,
	secret: betterAuthSecret,
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	plugins: [
		admin(),
		apiKey([
			{
				configId: "public",
				defaultPrefix: "pk_",
				enableSessionForAPIKeys: true,
				rateLimit: {
					enabled: true,
					maxRequests: 100,
					timeWindow: 1000 * 60 * 60, // 1 hour
				},
			},
			{
				configId: "secret",
				defaultPrefix: "sk_",
				enableSessionForAPIKeys: true,
				enableMetadata: true,
				rateLimit: {
					enabled: true,
					maxRequests: 1000,
					timeWindow: 1000 * 60 * 60, // 1 hour
				},
			},
		]),
	],
} satisfies BetterAuthOptions;

export const auth = betterAuth(config);
