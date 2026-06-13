import {
	Counter,
	collectDefaultMetrics,
	Histogram,
	Registry,
} from "prom-client";

const register = new Registry();

collectDefaultMetrics({
	register,
	prefix: "agentfabric_nodejs_",
});

const httpRequestsTotal = new Counter({
	name: "agentfabric_http_requests_total",
	help: "Total number of HTTP requests handled by Fastify",
	labelNames: ["method", "route", "status_code"],
	registers: [register],
});

const httpRequestDurationSeconds = new Histogram({
	name: "agentfabric_http_request_duration_seconds",
	help: "HTTP request duration in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
	registers: [register],
});

const logEntriesTotal = new Counter({
	name: "agentfabric_log_entries_total",
	help: "Total number of HTTP responses and errors counted by level and scope",
	labelNames: ["level", "scope"],
	registers: [register],
});

export function recordHttpRequestMetric(params: {
	method: string;
	route: string;
	statusCode: number;
	durationSeconds?: number;
}) {
	const labels = {
		method: params.method,
		route: params.route,
		status_code: String(params.statusCode),
	};

	httpRequestsTotal.inc(labels);

	if (
		typeof params.durationSeconds === "number" &&
		params.durationSeconds >= 0
	) {
		httpRequestDurationSeconds.observe(labels, params.durationSeconds);
	}
}

export function incrementLogEntryMetric(level: string, scope: string) {
	logEntriesTotal.inc({ level, scope });
}

export function getPrometheusRegistry() {
	return register;
}
