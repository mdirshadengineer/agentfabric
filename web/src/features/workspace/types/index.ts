export type Workspace = {
	id: string
	name: string
	slug: string
	logo?: string | null
	createdAt: string
	metadata?: Record<string, unknown> | null
}

export type WorkspaceWithMembers = Workspace & {
	members: WorkspaceMember[]
	invitations: WorkspaceInvitation[]
}

export type WorkspaceMember = {
	id: string
	userId: string
	workspaceId?: string
	organizationId?: string
	role: string
	createdAt: string
	user?: {
		id: string
		name: string
		email: string
		image?: string | null
	}
}

export type WorkspaceInvitation = {
	id: string
	organizationId: string
	email: string
	role: string
	status: string
	expiresAt: string
	createdAt: string
	inviterId: string
}

export type CreateWorkspaceInput = {
	name: string
	slug?: string
	metadata?: Record<string, unknown>
}

export type UpdateWorkspaceInput = {
	name?: string
	metadata?: Record<string, unknown>
}

export type AddMemberInput = {
	userId: string
	role?: string
}
