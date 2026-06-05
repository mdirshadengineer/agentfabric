export const queryKeys = {
	auth: {
		session: () => ["auth", "session"] as const,
	},
	management: {
		me: () => ["management", "me"] as const,
	},
	workspaces: {
		list: () => ["workspaces", "list"] as const,
	},
}
