import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/** App-level roles stored on `user.role` (Better Auth admin plugin). */
export const ADMIN_APP_ROLES = ["user", "operations_admin", "admin"] as const;

export type AdminAppRole = (typeof ADMIN_APP_ROLES)[number];

export const statement = {
	...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

/** Default for new accounts — no admin-plugin actions. */
export const userRole = ac.newRole({});

/**
 * Restricted admin: read users, impersonate non-admins, list sessions.
 * Cannot set roles, ban, delete, or create users.
 */
export const operationsAdminRole = ac.newRole({
	user: ["list", "get", "impersonate"],
	session: ["list"],
});

/** Full admin — all default Better Auth admin permissions. */
export const adminRole = ac.newRole({
	...adminAc.statements,
});

export const adminPluginRoles = {
	user: userRole,
	operations_admin: operationsAdminRole,
	admin: adminRole,
} as const;
