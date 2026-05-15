import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
	await fastify.register(rateLimit, {
		// Apply defaults globally; individual routes can override via route.config.rateLimit
		global: true,
		max: Number(process.env.RATE_LIMIT_MAX) || 100,
		timeWindow: process.env.RATE_LIMIT_WINDOW ?? "1 minute",
		// Use X-Forwarded-For when behind a proxy (trustProxy is set on the server)
		keyGenerator: (req) => req.ip,
		errorResponseBuilder: (_req, context) => ({
			statusCode: 429,
			error: "Too Many Requests",
			message: `Rate limit exceeded. Retry after ${context.after}.`,
		}),
	});
});
