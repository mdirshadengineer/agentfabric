import { useWorkspaces } from "@/features/workspace/queries/workspaces"

function useWorkspaceList() {
	const { data = [] } = useWorkspaces()
	return data
}

export { useWorkspaceList }
