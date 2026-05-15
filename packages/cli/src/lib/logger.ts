import { AGENTFABRIC_LOG_LEVEL } from "../global.config.js";

const isProduction = process.env.NODE_ENV === "production";

export function createFastifyLoggerOptions() {
	const level = process.env.AGENTFABRIC_LOG_LEVEL ?? AGENTFABRIC_LOG_LEVEL;

	if (!isProduction) {
		return {
			level,
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
					ignore: "pid,hostname",
					translateTime: "HH:MM:ss Z"
				},
			},
		};
	}

	return {
		level,
		base: {
			service: "agentfabric",
		},
	};
}
