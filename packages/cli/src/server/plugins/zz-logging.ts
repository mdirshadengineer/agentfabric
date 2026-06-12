import { performance } from "node:perf_hooks";
import fp from "fastify-plugin";
import { incrementLogEntryMetric } from "../../lib/prometheus.js";

function resolveStatusLevel(statusCode: number): "info" | "warn" | "error" {
	if (statusCode >= 500) {
		return "error";
	}

	if (statusCode >= 400) {
		return "warn";
	}

	return "info";
}

export default fp(async (fastify) => {
	fastify.addHook("onRequest", async (request) => {
		request.logStartedAt = performance.now();
	});

	fastify.addHook("onResponse", async (_request, reply) => {
		const statusCode = reply.statusCode;
		incrementLogEntryMetric(resolveStatusLevel(statusCode), "http");
	});

	fastify.addHook("onError", async (_request, _reply, _error) => {
		incrementLogEntryMetric("error", "http");
	});
});
