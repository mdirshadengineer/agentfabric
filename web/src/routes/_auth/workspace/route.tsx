import { createFileRoute, Outlet } from "@tanstack/react-router"
import { WorkspaceLayout } from "@/features/workspace/layouts"

export const Route = createFileRoute("/_auth/workspace")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<WorkspaceLayout>
			<Outlet />
		</WorkspaceLayout>
	)
}
