import { performance } from "node:perf_hooks";
import fp from "fastify-plugin";
import {
	getPrometheusRegistry,
	recordHttpRequestMetric,
} from "../../lib/prometheus.js";

export default fp(async (fastify) => {
	const registry = getPrometheusRegistry();

	fastify.addHook("onRequest", async (request) => {
		request.metricsStartedAt = performance.now();
	});

	fastify.addHook("onResponse", async (request, reply) => {
		const startedAt = request.metricsStartedAt;
		const durationSeconds =
			typeof startedAt === "number"
				? (performance.now() - startedAt) / 1000
				: undefined;
		const baseMetric = {
			method: request.method,
			route: request.routeOptions?.url ?? request.url,
			statusCode: reply.statusCode,
		};

		if (typeof durationSeconds === "number") {
			recordHttpRequestMetric({
				...baseMetric,
				durationSeconds,
			});
			return;
		}

		recordHttpRequestMetric(baseMetric);
	});

	fastify.get("/metrics", async (_request, reply) => {
		reply.header("content-type", registry.contentType);
		return registry.metrics();
	});
});
