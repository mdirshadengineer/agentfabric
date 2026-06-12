export type UserRecord = {
	id: string
	name: string
	email: string
	role: string | null
	createdAt: string
	updatedAt: string
}

export type MeResponse = {
	user: UserRecord
	session: {
		id: string
		userId: string
		expiresAt: string
		impersonatedBy?: string | null
	}
	isImpersonating: boolean
}

export type WorkspaceSummary = {
	id: string
	name: string
}
