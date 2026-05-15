import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import autoLoad from "@fastify/autoload";
import httpProxy from "@fastify/http-proxy";
import fastifyStatic from "@fastify/static";
import { type FastifyReply, type FastifyRequest, fastify } from "fastify";
import {
	AGENTFABRIC_API_SERVER_PORT,
	AGENTFABRIC_FRONTEND_ENABLED,
} from "../global.config.js";
import { createFastifyLoggerOptions } from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV !== "production";

const DEFAULT_BIND_HOST = "0.0.0.0";
const MIN_PORT = 1;
const MAX_PORT = 65_535;

/**
 * Safely parse the AGENTFABRIC_FRONTEND_ENABLED env var.
 * Accepts "true"/"1" as truthy, everything else as falsy.
 * Falls back to the compiled default when unset.
 */
function isFrontendEnabled(): boolean {
	const raw = process.env.AGENTFABRIC_FRONTEND_ENABLED;
	if (raw === undefined) return AGENTFABRIC_FRONTEND_ENABLED;
	return raw === "true" || raw === "1";
}

function resolvePort(): number {
	const rawPort = process.env.PORT;
	if (!rawPort) {
		return AGENTFABRIC_API_SERVER_PORT;
	}

	const parsedPort = Number(rawPort);
	if (
		!Number.isInteger(parsedPort) ||
		parsedPort < MIN_PORT ||
		parsedPort > MAX_PORT
	) {
		throw new Error(
			`Invalid PORT value "${rawPort}". Expected an integer between ${MIN_PORT} and ${MAX_PORT}.`,
		);
	}

	return parsedPort;
}

function createAPIServer() {
	const app = fastify({
		logger: createFastifyLoggerOptions(),
		// Trust X-Forwarded-* headers when running behind a reverse proxy
		trustProxy: true,
		// // Normalise trailing slashes so /foo and /foo/ resolve to the same handler
		// ignoreTrailingSlash: true,
		// Reject payloads larger than 1 MiB by default (override per-route as needed)
		bodyLimit: 1_048_576,
	});
	let isShuttingDown = false;

	// ─── Plugins ────────────────────────────────────────────────────────────────
	// Plugins are loaded first so their decorators are available to hooks & routes
	app.register(autoLoad, {
		dir: join(__dirname, "plugins"),
		// Ensure a consistent load order: db → auth → rate-limit
		options: {},
	});

	// ─── Hooks ──────────────────────────────────────────────────────────────────
	app.register(autoLoad, {
		dir: join(__dirname, "hooks"),
	});

	// ─── API Routes ─────────────────────────────────────────────────────────────
	app.register(autoLoad, {
		dir: join(__dirname, "routes"),
		options: { prefix: "/api" },
		// Autoload routes in sub-directories recursively
		routeParams: true,
	});

	// ─── Health check ───────────────────────────────────────────────────────────
	app.get(
		"/health",
		{ config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
		async () => ({ status: "ok", uptime: process.uptime() }),
	);

	// ─── Frontend handling ──────────────────────────────────────────────────────
	if (isDev) {
		// DEV: Proxy everything except /api to Vite dev server
		app.register(httpProxy, {
			upstream: "http://localhost:5173",
			prefix: "/",
			rewritePrefix: "/",
		});
	} else if (isFrontendEnabled()) {
		// PROD: Serve the pre-built SPA
		app.register(fastifyStatic, {
			root: join(__dirname, "..", "ui"),
			prefix: "/",
			wildcard: false,
		});

		// SPA fallback – let the client-side router handle unknown paths
		app.setNotFoundHandler(async (req: FastifyRequest, reply: FastifyReply) => {
			if (req.url.startsWith("/api")) {
				return reply.code(404).send({ error: "Not found" });
			}
			return reply.sendFile("index.html");
		});
	}

	// ─── Graceful shutdown ──────────────────────────────────────────────────────
	const gracefulShutdown = async (signal: string) => {
		if (isShuttingDown) {
			return;
		}

		isShuttingDown = true;
		app.log.info({ signal }, "received shutdown signal");
		try {
			await app.close();
			app.log.info("all connections drained");
		} catch (error: unknown) {
			process.exitCode = 1;
			app.log.error({ error, signal }, "graceful shutdown failed");
		}
	};

	const onSigInt = () => {
		void gracefulShutdown("SIGINT");
	};
	const onSigTerm = () => {
		void gracefulShutdown("SIGTERM");
	};

	process.once("SIGINT", onSigInt);
	process.once("SIGTERM", onSigTerm);

	app.addHook("onClose", async () => {
		process.off("SIGINT", onSigInt);
		process.off("SIGTERM", onSigTerm);
	});

	return {
		start: async () => {
			const port = resolvePort();
			try {
				await app.listen({ port, host: DEFAULT_BIND_HOST });
				app.log.info(
					`API server listening on http://${DEFAULT_BIND_HOST}:${port}`,
				);
			} catch (err: unknown) {
				if ((err as { code?: string })?.code === "EADDRINUSE") {
					app.log.error(`Port ${port} is already in use.`);
				} else {
					app.log.error(err);
				}
				throw err;
			}
		},
		stop: async () => {
			await app.close();
			app.log.info("API server stopped.");
		},
	};
}

export { createAPIServer };
