import { queryOptions, useQuery } from "@tanstack/react-query"
import type { WorkspaceWithMembers } from "@/features/workspace/types"
import { queryKeys } from "@/lib/api/query-keys"
import { requestWorkspace } from "@/lib/api/workspace-client"

async function fetchWorkspace(id: string): Promise<WorkspaceWithMembers> {
	const data = await requestWorkspace<{ workspace: WorkspaceWithMembers }>(
		`/${id}`
	)
	return data.workspace
}

export const workspaceDetailQueryOptions = (id: string) =>
	queryOptions({
		queryKey: queryKeys.workspaces.detail(id),
		queryFn: () => fetchWorkspace(id),
		staleTime: 30_000,
		enabled: !!id,
	})

export function useWorkspaceDetail(id: string) {
	return useQuery(workspaceDetailQueryOptions(id))
}
