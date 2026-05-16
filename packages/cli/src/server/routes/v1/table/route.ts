import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { session } from "../../../../schema.js";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

type TableQuery = {
	name?: string;
	limit?: string;
	offset?: string;
};

function parsePositiveInteger(
	value: string | undefined,
	fallback: number,
): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return fallback;
	}

	return parsed;
}

function maskIpAddress(ipAddress: string | null): string | null {
	if (!ipAddress) {
		return null;
	}

	if (ipAddress.includes(".")) {
		const parts = ipAddress.split(".");
		if (parts.length === 4) {
			return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
		}
	}

	if (ipAddress.includes(":")) {
		const parts = ipAddress.split(":");
		if (parts.length > 1) {
			return `${parts.slice(0, -1).join(":")}:0000`;
		}
	}

	return null;
}

function sanitizeUserAgent(userAgent: string | null): string | null {
	if (!userAgent) {
		return null;
	}

	const normalized = userAgent.trim();
	if (normalized.length === 0) {
		return null;
	}

	const maxLength = 120;
	return normalized.length > maxLength
		? `${normalized.slice(0, maxLength)}...`
		: normalized;
}

export default async function (fastify: FastifyInstance) {
	fastify.get<{ Querystring: TableQuery }>(
		"/table",
		{
			preHandler: [fastify.authenticateApiKey],
			config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
		},
		async (
			request: FastifyRequest<{ Querystring: TableQuery }>,
			reply: FastifyReply,
		) => {
			const tableName = request.query.name?.trim();
			if (tableName !== "session") {
				return reply.code(400).send({
					code: "INVALID_TABLE_NAME",
					message: "Only the session table is available for this endpoint",
				});
			}

			if (!request.apiKey?.referenceId) {
				return reply.code(403).send({
					code: "FORBIDDEN",
					message: "API key is not authorized for session table access",
				});
			}

			const limit = Math.min(
				parsePositiveInteger(request.query.limit, DEFAULT_LIMIT),
				MAX_LIMIT,
			);
			const offset = parsePositiveInteger(request.query.offset, 0);

			const rows = await fastify.db
				.select({
					id: session.id,
					userId: session.userId,
					expiresAt: session.expiresAt,
					createdAt: session.createdAt,
					updatedAt: session.updatedAt,
					deviceId: session.deviceId,
					ipAddress: session.ipAddress,
					userAgent: session.userAgent,
				})
				.from(session)
				.where(and(eq(session.userId, request.apiKey.referenceId)))
				.orderBy(desc(session.createdAt), desc(session.id))
				.limit(limit + 1)
				.offset(offset);

			const hasMore = rows.length > limit;
			const pageRows = hasMore ? rows.slice(0, limit) : rows;

			request.log.info(
				{
					apiKeyId: request.apiKey.id,
					referenceId: request.apiKey.referenceId,
					limit,
					offset,
					resultCount: pageRows.length,
				},
				"session table fetched via api key",
			);

			return reply.send({
				table: "session",
				data: pageRows.map((row) => ({
					id: row.id,
					userId: row.userId,
					expiresAt: row.expiresAt,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
					deviceId: row.deviceId,
					ipAddress: maskIpAddress(row.ipAddress),
					userAgent: sanitizeUserAgent(row.userAgent),
				})),
				pagination: {
					limit,
					offset,
					hasMore,
					nextOffset: hasMore ? offset + limit : null,
				},
			});
		},
	);
}
