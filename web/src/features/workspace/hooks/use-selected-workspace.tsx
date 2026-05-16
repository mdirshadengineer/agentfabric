import { useParams } from "@tanstack/react-router"

function useSelectedWorkspace() {
	const params = useParams({ strict: false })

	return {
		workspaceId: params?.workspaceId ?? null,
		isSelected: !!params?.workspaceId,
	}
}

export { useSelectedWorkspace }
