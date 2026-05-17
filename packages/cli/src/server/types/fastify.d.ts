import "fastify";
import type { apiKey } from "@better-auth/api-key";
import type { InferSelectModel } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { db } from "../../db/index.ts";
import type { auth } from "../../lib/auth.ts";
import type { session, user } from "../../schema.ts";

type User = InferSelectModel<typeof user>;
type Session = InferSelectModel<typeof session>;
type ApiKey = InferSelectModel<typeof apiKey>;

/** Reusable hook signature used by authenticate / rejectAuthenticated decorators */
type AuthHook = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

declare module "fastify" {
	interface FastifyInstance {
		db: typeof db;
		auth: typeof auth;
		/**
		 * Validates the session and populates `request.user` / `request.session`.
		 * Returns 401 when no valid session exists.
		 * Use as a `preHandler` hook on protected routes.
		 */
		authenticate: AuthHook;
		/**
		 * Short-circuits with 200 when the caller is already authenticated.
		 * Use on auth routes (sign-in, sign-up) to prevent double sign-in.
		 */
		rejectAuthenticated: AuthHook;
		/**
		 * Validates Bearer API keys and populates `request.apiKey`.
		 * Returns 401 when key is missing/invalid/expired.
		 */
		authenticateApiKey: AuthHook;
	}

	interface FastifyRequest {
		logStartedAt?: number;
		user?: {
			id: User["id"];
			name: User["name"];
			email: User["email"];
			emailVerified: User["emailVerified"];
			image: User["image"];
			role: User["role"];
		};
		session?: {
			id: Session["id"];
			expiresAt: Session["expiresAt"];
			ipAddress: Session["ipAddress"];
			userAgent: Session["userAgent"];
			deviceId: Session["deviceId"];
			impersonatedBy: Session["impersonatedBy"];
		};
		apiKey?: {
			id: ApiKey["id"];
			configId: ApiKey["configId"];
			referenceId: ApiKey["referenceId"];
			prefix: ApiKey["prefix"];
			expiresAt: ApiKey["expiresAt"];
			permissions: ApiKey["permissions"];
		};
	}
}
