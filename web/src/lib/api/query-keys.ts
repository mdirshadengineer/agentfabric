export const queryKeys = {
	auth: {
		session: () => ["auth", "session"] as const,
	},
	management: {
		me: () => ["management", "me"] as const,
	},
	admin: {
		users: () => ["admin", "users"] as const,
	},
	workspaces: {
		list: () => ["workspaces", "list"] as const,
		detail: (id: string) => ["workspaces", "detail", id] as const,
		members: (id: string) => ["workspaces", "members", id] as const,
	},
}
