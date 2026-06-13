import { queryOptions, useQuery } from "@tanstack/react-query"
import type { Workspace } from "@/features/workspace/types"
import { queryKeys } from "@/lib/api/query-keys"
import { requestWorkspace } from "@/lib/api/workspace-client"

async function fetchWorkspaces(): Promise<Workspace[]> {
	const data = await requestWorkspace<{ workspaces: Workspace[] }>("/")
	return data.workspaces ?? []
}

export const workspacesQueryOptions = queryOptions({
	queryKey: queryKeys.workspaces.list(),
	queryFn: fetchWorkspaces,
	staleTime: 30_000,
})

export function useWorkspaces(options?: { enabled?: boolean }) {
	return useQuery({
		...workspacesQueryOptions,
		enabled: options?.enabled ?? true,
	})
}
