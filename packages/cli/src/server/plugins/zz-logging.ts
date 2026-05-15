import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { serverLog } from "../../schema.js";

function resolveStatusLevel(statusCode: number): "info" | "warn" | "error" {
	if (statusCode >= 500) {
		return "error";
	}

	if (statusCode >= 400) {
		return "warn";
	}

	return "info";
}

function getUserAgent(
	value: string | string[] | undefined,
): string | undefined {
	if (typeof value === "string") {
		const normalized = value.trim();
		return normalized.length > 0 ? normalized : undefined;
	}

	if (Array.isArray(value)) {
		const firstValue = value[0];
		if (typeof firstValue === "string") {
			const normalized = firstValue.trim();
			return normalized.length > 0 ? normalized : undefined;
		}
	}

	return undefined;
}

async function persistServerLog(
	fastify: FastifyInstance,
	entry: {
		level: "info" | "warn" | "error";
		scope: string;
		message: string;
		requestId?: string;
		method?: string;
		path?: string;
		statusCode?: number;
		durationMs?: number;
		ipAddress?: string;
		userAgent?: string;
		userId?: string;
		errorName?: string;
		errorMessage?: string;
		errorStack?: string;
	},
): Promise<void> {
	try {
		await fastify.db.insert(serverLog).values({
			id: randomUUID(),
			...entry,
		});
	} catch (error: unknown) {
		fastify.log.warn(
			{ error },
			"failed to persist server log entry to postgres",
		);
	}
}

export default fp(async (fastify) => {
	fastify.addHook("onRequest", async (request) => {
		request.logStartedAt = performance.now();
	});

	fastify.addHook("onResponse", async (request, reply) => {
		const durationMs = request.logStartedAt
			? Math.round(performance.now() - request.logStartedAt)
			: undefined;
		const userAgent = getUserAgent(request.headers["user-agent"]);
		const statusCode = reply.statusCode;
		const baseEntry = {
			level: resolveStatusLevel(statusCode),
			scope: "http",
			message: "request completed",
			requestId: request.id,
			method: request.method,
			path: request.routeOptions?.url ?? request.url,
			statusCode,
			ipAddress: request.ip,
		};

		void persistServerLog(fastify, {
			...baseEntry,
			...(userAgent ? { userAgent } : {}),
			...(request.user?.id ? { userId: request.user.id } : {}),
			...(durationMs !== undefined ? { durationMs } : {}),
		});
	});

	fastify.addHook("onError", async (request, reply, error) => {
		const durationMs = request.logStartedAt
			? Math.round(performance.now() - request.logStartedAt)
			: undefined;
		const userAgent = getUserAgent(request.headers["user-agent"]);
		const baseEntry = {
			level: "error" as const,
			scope: "http",
			message: error.message,
			requestId: request.id,
			method: request.method,
			path: request.routeOptions?.url ?? request.url,
			statusCode: reply.statusCode,
			ipAddress: request.ip,
			errorName: error.name,
			errorMessage: error.message,
		};

		void persistServerLog(fastify, {
			...baseEntry,
			...(userAgent ? { userAgent } : {}),
			...(request.user?.id ? { userId: request.user.id } : {}),
			...(error.stack ? { errorStack: error.stack } : {}),
			...(durationMs !== undefined ? { durationMs } : {}),
		});
	});
});
