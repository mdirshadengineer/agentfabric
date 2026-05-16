import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth/workspace/")({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/_auth/workspaces/"!</div>
}
