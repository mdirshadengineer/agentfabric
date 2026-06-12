import type { AdminAppRole } from "./admin-permissions"

const FULL_ADMIN_ROLE: AdminAppRole = "admin"
const OPERATIONS_ADMIN_ROLE: AdminAppRole = "operations_admin"

export function parseUserRoles(role: string | null | undefined): string[] {
	if (!role?.trim()) {
		return ["user"]
	}

	return role
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean)
}

export function hasUserRole(
	role: string | null | undefined,
	target: AdminAppRole
): boolean {
	return parseUserRoles(role).includes(target)
}

export function hasFullAdminRole(role: string | null | undefined): boolean {
	return hasUserRole(role, FULL_ADMIN_ROLE)
}

export function hasOperationsAdminRole(
	role: string | null | undefined
): boolean {
	return hasUserRole(role, OPERATIONS_ADMIN_ROLE)
}

export function canUseAdminPlugin(role: string | null | undefined): boolean {
	return hasFullAdminRole(role) || hasOperationsAdminRole(role)
}

export function canManageUserRoles(role: string | null | undefined): boolean {
	return hasFullAdminRole(role)
}

/** @deprecated Use hasFullAdminRole */
export function hasAdminRole(role: string | null | undefined): boolean {
	return hasFullAdminRole(role)
}
