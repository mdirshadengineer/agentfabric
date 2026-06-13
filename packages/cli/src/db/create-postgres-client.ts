import postgres from "postgres";

const DEFAULT_DB_IDLE_TIMEOUT_SECONDS = 20;
const DEFAULT_DB_CONNECT_TIMEOUT_SECONDS = 30;

type InvalidEnvPolicy = "default" | "throw";

export interface CreatePostgresClientOptions {
	connectionString: string;
	poolSize?: number;
	poolSizeEnvName?: string;
	invalidEnvPolicy?: InvalidEnvPolicy;
}

function parsePositiveIntegerEnv(
	value: string | undefined,
	defaultValue: number,
	envName: string,
	policy: InvalidEnvPolicy,
): number {
	if (value === undefined || value.trim().length === 0) {
		return defaultValue;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		if (policy === "throw") {
			throw new Error(
				`Invalid ${envName} value "${value}". Expected an integer >= 1.`,
			);
		}
		return defaultValue;
	}

	return parsed;
}

function shouldEnableDbSsl(policy: InvalidEnvPolicy): boolean {
	const raw = process.env.DB_SSL;
	const isProduction = process.env.NODE_ENV === "production";

	if (raw === undefined) {
		if (process.env.IS_MANUAL_TESTING === "true") {
			return false;
		}
		return isProduction;
	}

	const normalized = raw.trim().toLowerCase();
	if (normalized === "1" || normalized === "true") {
		return true;
	}

	if (normalized === "0" || normalized === "false") {
		return false;
	}

	if (policy === "throw") {
		throw new Error(
			`Invalid DB_SSL value "${raw}". Expected true/false or 1/0.`,
		);
	}

	return isProduction;
}

export function createPostgresClient(options: CreatePostgresClientOptions) {
	const {
		connectionString,
		poolSize = 1,
		poolSizeEnvName = "DB_POOL_SIZE",
		invalidEnvPolicy = "default",
	} = options;

	return postgres(connectionString, {
		prepare: false,
		max: parsePositiveIntegerEnv(
			process.env.DB_POOL_SIZE,
			poolSize,
			poolSizeEnvName,
			invalidEnvPolicy,
		),
		idle_timeout: parsePositiveIntegerEnv(
			process.env.DB_IDLE_TIMEOUT,
			DEFAULT_DB_IDLE_TIMEOUT_SECONDS,
			"DB_IDLE_TIMEOUT",
			invalidEnvPolicy,
		),
		connect_timeout: parsePositiveIntegerEnv(
			process.env.DB_CONNECT_TIMEOUT,
			DEFAULT_DB_CONNECT_TIMEOUT_SECONDS,
			"DB_CONNECT_TIMEOUT",
			invalidEnvPolicy,
		),
		ssl: shouldEnableDbSsl(invalidEnvPolicy) ? "require" : false,
		onnotice: () => {},
	});
}
