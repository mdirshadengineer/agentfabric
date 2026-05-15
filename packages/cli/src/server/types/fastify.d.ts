import "fastify";
import type { InferSelectModel } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { db } from "../../db/index.ts";
import type { auth } from "../../lib/auth.ts";
import type { session, user } from "../../schema.ts";

type User = InferSelectModel<typeof user>;
type Session = InferSelectModel<typeof session>;

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
	}

	interface FastifyRequest {
		logStartedAt?: number;
		user?: {
			id: User["id"];
			name: User["name"];
			email: User["email"];
			emailVerified: User["emailVerified"];
			image: User["image"];
		};
		session?: {
			id: Session["id"];
			expiresAt: Session["expiresAt"];
			ipAddress: Session["ipAddress"];
			userAgent: Session["userAgent"];
			deviceId: Session["deviceId"];
		};
	}
}
