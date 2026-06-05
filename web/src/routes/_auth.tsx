import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { sessionQueryOptions } from "@/features/auth/queries/session"

export const Route = createFileRoute("/_auth")({
	beforeLoad: async ({ context, location }) => {
		const session =
			await context.queryClient.ensureQueryData(sessionQueryOptions)

		if (!session?.session) {
			throw redirect({
				to: "/signin",
				search: { redirect: location.href },
			})
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
