import {
	AGENTFABRIC_AUTH_MAX_SESSIONS,
	AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE,
	AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP,
	AGENTFABRIC_AUTH_SESSION_POLICY_MODE,
} from "../global.config.js";

export const AUTH_SESSION_POLICY_MODES = [
	"keep-latest",
	"block-new-login",
	"max-sessions",
] as const;

export type AuthSessionPolicyMode = (typeof AUTH_SESSION_POLICY_MODES)[number];

export interface AuthSessionPolicyConfig {
	mode: AuthSessionPolicyMode;
	maxSessions: number;
	maxSessionsPerDevice: number;
	maxSessionsPerIp: number;
}

function parseSessionPolicyMode(
	value: string | undefined,
): AuthSessionPolicyMode {
	if (!value) {
		return AGENTFABRIC_AUTH_SESSION_POLICY_MODE;
	}

	const normalized = value.trim().toLowerCase();
	if (AUTH_SESSION_POLICY_MODES.includes(normalized as AuthSessionPolicyMode)) {
		return normalized as AuthSessionPolicyMode;
	}

	throw new Error(
		`Invalid AGENTFABRIC_AUTH_SESSION_POLICY_MODE: "${value}". Supported values: ${AUTH_SESSION_POLICY_MODES.join(", ")}`,
	);
}

function parseMaxSessions(value: string | undefined): number {
	if (!value) {
		return AGENTFABRIC_AUTH_MAX_SESSIONS;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(
			`Invalid AGENTFABRIC_AUTH_MAX_SESSIONS: "${value}". Expected an integer >= 1.`,
		);
	}

	return parsed;
}

function parsePositiveInteger(
	value: string | undefined,
	fallback: number,
	envName: string,
): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(
			`Invalid ${envName}: "${value}". Expected an integer >= 1.`,
		);
	}

	return parsed;
}

export function getAuthSessionPolicyConfig(): AuthSessionPolicyConfig {
	const mode = parseSessionPolicyMode(
		process.env.AGENTFABRIC_AUTH_SESSION_POLICY_MODE,
	);
	const maxSessions =
		mode === "keep-latest"
			? 1
			: parseMaxSessions(process.env.AGENTFABRIC_AUTH_MAX_SESSIONS);
	const maxSessionsPerDevice = parsePositiveInteger(
		process.env.AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE,
		AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE,
		"AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE",
	);
	const maxSessionsPerIp = parsePositiveInteger(
		process.env.AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP,
		AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP,
		"AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP",
	);

	return {
		mode,
		maxSessions,
		maxSessionsPerDevice,
		maxSessionsPerIp,
	};
}

export function isEmailSignInPath(pathname: string): boolean {
	return pathname.endsWith("/sign-in/email");
}

export function extractEmailFromPayload(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const email = (payload as { email?: unknown }).email;
	if (typeof email !== "string") {
		return null;
	}

	const normalized = email.trim().toLowerCase();
	return normalized.length > 0 ? normalized : null;
}

export function extractDeviceIdFromPayload(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const deviceId = (payload as { deviceId?: unknown }).deviceId;
	if (typeof deviceId !== "string") {
		return null;
	}

	const normalized = deviceId.trim();
	return normalized.length > 0 ? normalized : null;
}
