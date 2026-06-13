import { useSession } from "@/features/auth/queries/session"
import { useMe } from "@/features/management/queries/me"
import { useWorkspaces } from "@/features/workspace/queries/workspaces"
import type { Workspace } from "@/features/workspace/types"

function resolveWorkspaceHref(workspaces: Workspace[]): string {
	if (workspaces.length === 1) {
		return `/workspace/${workspaces[0].id}`
	}

	return "/workspace"
}

export function useLandingAuth() {
	const sessionQuery = useSession()
	const session = sessionQuery.data
	const isAuthenticated = Boolean(session?.session)
	const isPending = sessionQuery.isPending

	const meQuery = useMe({ enabled: isAuthenticated })
	const workspacesQuery = useWorkspaces({ enabled: isAuthenticated })

	const user = meQuery.data?.user ?? session?.user
	const workspaces = workspacesQuery.data ?? []
	const workspaceHref = resolveWorkspaceHref(workspaces)

	return {
		isAuthenticated,
		isPending,
		user,
		workspaces,
		workspaceHref,
	}
}
