import { existsSync } from "node:fs";
import { join } from "node:path";
import {
	AGENTFABRIC_API_SERVER_PORT,
	AGENTFABRIC_FRONTEND_ENABLED,
	AGENTFABRIC_LOG_LEVEL,
} from "../../global.config.js";
import { AUTH_SESSION_POLICY_MODES } from "../../lib/auth-session-policy.js";
import { createCheck, createGroup, type DoctorGroup } from "../types.js";

const MIN_PORT = 1;
const MAX_PORT = 65_535;
const MIN_SECRET_LENGTH = 32;

function isSet(value: string | undefined): value is string {
	return value !== undefined && value.trim().length > 0;
}

function parsePositiveInteger(
	value: string | undefined,
): { ok: true; value: number } | { ok: false; message: string } {
	if (!isSet(value)) {
		return { ok: true, value: -1 };
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		return {
			ok: false,
			message: `invalid value "${value}" (expected integer >= 1)`,
		};
	}

	return { ok: true, value: parsed };
}

function parsePort(
	value: string | undefined,
): { ok: true; value: number } | { ok: false; message: string } {
	if (!isSet(value)) {
		return { ok: true, value: AGENTFABRIC_API_SERVER_PORT };
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < MIN_PORT || parsed > MAX_PORT) {
		return {
			ok: false,
			message: `invalid value "${value}" (expected integer ${MIN_PORT}-${MAX_PORT})`,
		};
	}

	return { ok: true, value: parsed };
}

function parseDbSsl(
	value: string | undefined,
): { ok: true } | { ok: false; message: string } {
	if (!isSet(value)) {
		return { ok: true };
	}

	const normalized = value.trim().toLowerCase();
	if (
		normalized === "1" ||
		normalized === "true" ||
		normalized === "0" ||
		normalized === "false"
	) {
		return { ok: true };
	}

	return {
		ok: false,
		message: `invalid value "${value}" (expected true/false or 1/0)`,
	};
}

function parseSessionPolicyMode(
	value: string | undefined,
): { ok: true } | { ok: false; message: string } {
	if (!isSet(value)) {
		return { ok: true };
	}

	const normalized = value.trim().toLowerCase();
	if (
		AUTH_SESSION_POLICY_MODES.includes(
			normalized as (typeof AUTH_SESSION_POLICY_MODES)[number],
		)
	) {
		return { ok: true };
	}

	return {
		ok: false,
		message: `invalid value "${value}" (supported: ${AUTH_SESSION_POLICY_MODES.join(", ")})`,
	};
}

function parseUrl(
	value: string | undefined,
): { ok: true } | { ok: false; message: string } {
	if (!isSet(value)) {
		return { ok: false, message: "not set" };
	}

	try {
		new URL(value);
		return { ok: true };
	} catch {
		return { ok: false, message: `invalid URL "${value}"` };
	}
}

function parseBooleanEnv(
	value: string | undefined,
	defaultLabel: string,
): { ok: true; message: string } | { ok: false; message: string } {
	if (!isSet(value)) {
		return { ok: true, message: `unset (default: ${defaultLabel})` };
	}

	if (value === "true" || value === "1" || value === "false" || value === "0") {
		return { ok: true, message: value };
	}

	return {
		ok: false,
		message: `invalid value "${value}" (expected true/false or 1/0)`,
	};
}

export function runEnvironmentChecks(): DoctorGroup {
	const checks = [];

	if (!isSet(process.env.DATABASE_URL)) {
		checks.push(
			createCheck(
				"database-url",
				"DATABASE_URL",
				"fail",
				"not set",
				"Set your PostgreSQL connection string",
			),
		);
	} else {
		checks.push(createCheck("database-url", "DATABASE_URL", "pass", "set"));
	}

	if (!isSet(process.env.BETTER_AUTH_SECRET)) {
		checks.push(
			createCheck(
				"better-auth-secret",
				"BETTER_AUTH_SECRET",
				"fail",
				"not set",
				"Generate a strong random secret for Better Auth",
			),
		);
	} else {
		const secret = process.env.BETTER_AUTH_SECRET as string;
		checks.push(
			createCheck("better-auth-secret", "BETTER_AUTH_SECRET", "pass", "set"),
		);

		if (secret.length < MIN_SECRET_LENGTH) {
			checks.push(
				createCheck(
					"better-auth-secret-length",
					"BETTER_AUTH_SECRET length",
					"warn",
					`only ${secret.length} characters (recommend >= ${MIN_SECRET_LENGTH})`,
				),
			);
		}
	}

	const baseUrl = parseUrl(process.env.BETTER_AUTH_BASE_URL);
	if (!isSet(process.env.BETTER_AUTH_BASE_URL)) {
		checks.push(
			createCheck(
				"better-auth-base-url",
				"BETTER_AUTH_BASE_URL",
				"fail",
				"not set",
				"Set the public base URL for auth callbacks",
			),
		);
	} else if (!baseUrl.ok) {
		checks.push(
			createCheck(
				"better-auth-base-url",
				"BETTER_AUTH_BASE_URL",
				"warn",
				baseUrl.message,
			),
		);
	} else {
		checks.push(
			createCheck(
				"better-auth-base-url",
				"BETTER_AUTH_BASE_URL",
				"pass",
				process.env.BETTER_AUTH_BASE_URL as string,
			),
		);
	}

	const port = parsePort(process.env.PORT);
	checks.push(
		createCheck(
			"port",
			"PORT",
			port.ok ? "pass" : "warn",
			port.ok
				? isSet(process.env.PORT)
					? String(port.value)
					: `unset (default: ${AGENTFABRIC_API_SERVER_PORT})`
				: port.message,
		),
	);

	const dbSsl = parseDbSsl(process.env.DB_SSL);
	checks.push(
		createCheck(
			"db-ssl",
			"DB_SSL",
			dbSsl.ok ? "pass" : "warn",
			dbSsl.ok
				? isSet(process.env.DB_SSL)
					? (process.env.DB_SSL as string)
					: "unset (auto)"
				: dbSsl.message,
		),
	);

	for (const envName of [
		"DB_IDLE_TIMEOUT",
		"DB_CONNECT_TIMEOUT",
		"DB_POOL_SIZE",
	] as const) {
		const parsed = parsePositiveInteger(process.env[envName]);
		checks.push(
			createCheck(
				envName.toLowerCase().replaceAll("_", "-"),
				envName,
				parsed.ok ? "pass" : "warn",
				parsed.ok
					? isSet(process.env[envName])
						? String(parsed.value)
						: "unset (default)"
					: parsed.message,
			),
		);
	}

	const sessionPolicy = parseSessionPolicyMode(
		process.env.AGENTFABRIC_AUTH_SESSION_POLICY_MODE,
	);
	checks.push(
		createCheck(
			"auth-session-policy-mode",
			"AGENTFABRIC_AUTH_SESSION_POLICY_MODE",
			sessionPolicy.ok ? "pass" : "warn",
			sessionPolicy.ok
				? isSet(process.env.AGENTFABRIC_AUTH_SESSION_POLICY_MODE)
					? (process.env.AGENTFABRIC_AUTH_SESSION_POLICY_MODE as string)
					: "unset (default: max-sessions)"
				: sessionPolicy.message,
		),
	);

	for (const envName of [
		"AGENTFABRIC_AUTH_MAX_SESSIONS",
		"AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE",
		"AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP",
	] as const) {
		const parsed = parsePositiveInteger(process.env[envName]);
		checks.push(
			createCheck(
				envName.toLowerCase().replaceAll("_", "-"),
				envName,
				parsed.ok ? "pass" : "warn",
				parsed.ok
					? isSet(process.env[envName])
						? String(parsed.value)
						: "unset (default)"
					: parsed.message,
			),
		);
	}

	const rateLimitMax = parsePositiveInteger(process.env.RATE_LIMIT_MAX);
	checks.push(
		createCheck(
			"rate-limit-max",
			"RATE_LIMIT_MAX",
			rateLimitMax.ok ? "pass" : "warn",
			rateLimitMax.ok
				? isSet(process.env.RATE_LIMIT_MAX)
					? String(rateLimitMax.value)
					: "unset (default: 100)"
				: rateLimitMax.message,
		),
	);

	checks.push(
		createCheck(
			"rate-limit-window",
			"RATE_LIMIT_WINDOW",
			"pass",
			isSet(process.env.RATE_LIMIT_WINDOW)
				? (process.env.RATE_LIMIT_WINDOW as string)
				: "unset (default: 1 minute)",
		),
	);

	checks.push(
		createCheck(
			"log-level",
			"AGENTFABRIC_LOG_LEVEL",
			"pass",
			isSet(process.env.AGENTFABRIC_LOG_LEVEL)
				? (process.env.AGENTFABRIC_LOG_LEVEL as string)
				: `unset (default: ${AGENTFABRIC_LOG_LEVEL})`,
		),
	);

	const frontendEnabled = parseBooleanEnv(
		process.env.AGENTFABRIC_FRONTEND_ENABLED,
		String(AGENTFABRIC_FRONTEND_ENABLED),
	);
	checks.push(
		createCheck(
			"frontend-enabled",
			"AGENTFABRIC_FRONTEND_ENABLED",
			frontendEnabled.ok ? "pass" : "warn",
			frontendEnabled.message,
		),
	);

	const envFilePath = join(process.cwd(), ".env");
	checks.push(
		createCheck(
			"env-file",
			".env file",
			"info",
			existsSync(envFilePath)
				? `found at ${envFilePath}`
				: "not found in current directory (production expects OS environment)",
		),
	);

	return createGroup("environment", "Environment", checks);
}
