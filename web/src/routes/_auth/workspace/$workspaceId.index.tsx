import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth/workspace/$workspaceId/")({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/_auth/workspaces/$workspaceId/"!</div>
}
