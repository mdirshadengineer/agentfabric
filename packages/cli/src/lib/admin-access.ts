import type { AdminAppRole } from "./admin-permissions.js";

const FULL_ADMIN_ROLE: AdminAppRole = "admin";
const OPERATIONS_ADMIN_ROLE: AdminAppRole = "operations_admin";

export function parseUserRoles(role: string | null | undefined): string[] {
	if (!role?.trim()) {
		return ["user"];
	}

	return role
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

export function hasUserRole(
	role: string | null | undefined,
	target: AdminAppRole,
): boolean {
	return parseUserRoles(role).includes(target);
}

/** Full admin — all Better Auth admin plugin permissions. */
export function hasFullAdminRole(role: string | null | undefined): boolean {
	return hasUserRole(role, FULL_ADMIN_ROLE);
}

/** Restricted admin (list users, impersonate, list sessions). */
export function hasOperationsAdminRole(
	role: string | null | undefined,
): boolean {
	return hasUserRole(role, OPERATIONS_ADMIN_ROLE);
}

/** Can call admin plugin endpoints (listUsers, impersonate, etc.). */
export function canUseAdminPlugin(role: string | null | undefined): boolean {
	return hasFullAdminRole(role) || hasOperationsAdminRole(role);
}

/** Can assign roles via setRole — full admin only. */
export function canManageUserRoles(role: string | null | undefined): boolean {
	return hasFullAdminRole(role);
}

/** @deprecated Use hasFullAdminRole */
export function hasAdminRole(role: string | null | undefined): boolean {
	return hasFullAdminRole(role);
}
