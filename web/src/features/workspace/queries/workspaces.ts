import { queryOptions, useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import type { WorkspaceSummary } from "@/lib/api/types"

async function fetchWorkspaces(): Promise<WorkspaceSummary[]> {
	// TODO: Replace with GET /api/v1/workspaces when the endpoint is available.
	return [
		{ id: "workspace-1", name: "Workspace 1" },
		{ id: "workspace-2", name: "Workspace 2" },
	]
}

export const workspacesQueryOptions = queryOptions({
	queryKey: queryKeys.workspaces.list(),
	queryFn: fetchWorkspaces,
	staleTime: 30_000,
})

export function useWorkspaces() {
	return useQuery(workspacesQueryOptions)
}
