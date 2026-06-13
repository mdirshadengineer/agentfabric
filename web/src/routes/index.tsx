import { createFileRoute } from "@tanstack/react-router"
import { sessionQueryOptions } from "@/features/auth/queries/session"
import { LandingPage } from "@/features/landing/components/landing-page"

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(sessionQueryOptions)
	},
	component: RouteComponent,
})

function RouteComponent() {
	return <LandingPage />
}
