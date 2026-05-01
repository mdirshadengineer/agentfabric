import { createFileRoute } from "@tanstack/react-router"
import { AppDashboardPage } from "@/features/app"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return <AppDashboardPage />
}
