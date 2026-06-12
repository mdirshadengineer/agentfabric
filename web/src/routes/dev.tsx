import { createFileRoute, Link, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dev")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<>
			<div className="sticky top-0 z-50 flex items-center justify-between bg-yellow-500 px-4 py-2 text-sm font-medium text-black">
				<span>🛠️ Development Tools</span>
				<Link to="/" className="underline">
					← Back to app
				</Link>
			</div>
			<Outlet />
		</>
	)
}
