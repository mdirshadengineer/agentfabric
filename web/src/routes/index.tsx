import { createFileRoute } from "@tanstack/react-router"
import { LandingPage } from "@/features/landing/components/landing-page"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return <LandingPage />
}
