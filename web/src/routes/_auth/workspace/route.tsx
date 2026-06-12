import { createFileRoute, Outlet } from "@tanstack/react-router"
import { BannerStackProvider } from "@/components/alert-banner-stack/alert-banner-stack-provider"
import { meQueryOptions } from "@/features/management/queries/me"
import { WorkspaceLayout } from "@/features/workspace/layouts"
import { workspacesQueryOptions } from "@/features/workspace/queries/workspaces"

export const Route = createFileRoute("/_auth/workspace")({
	beforeLoad: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(meQueryOptions),
			context.queryClient.ensureQueryData(workspacesQueryOptions),
		])
	},
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<BannerStackProvider>
			<WorkspaceLayout>
				<Outlet />
			</WorkspaceLayout>
		</BannerStackProvider>
	)
}
