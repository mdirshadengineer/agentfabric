import { queryOptions, useQuery } from "@tanstack/react-query"
import type { WorkspaceMember } from "@/features/workspace/types"
import { queryKeys } from "@/lib/api/query-keys"
import { requestWorkspace } from "@/lib/api/workspace-client"

async function fetchWorkspaceMembers(id: string): Promise<WorkspaceMember[]> {
	const data = await requestWorkspace<{ members: WorkspaceMember[] }>(
		`/${id}/members`
	)
	return data.members ?? []
}

export const workspaceMembersQueryOptions = (id: string) =>
	queryOptions({
		queryKey: queryKeys.workspaces.members(id),
		queryFn: () => fetchWorkspaceMembers(id),
		staleTime: 30_000,
		enabled: !!id,
	})

export function useWorkspaceMembers(id: string) {
	return useQuery(workspaceMembersQueryOptions(id))
}
