import { IconFolders } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { AlertBannerStackFromProvider } from "@/components/alert-banner-stack/alert-banner-stack"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar"
import { meQueryOptions } from "@/features/management/queries/me"
import { WorkspaceAccountSelector } from "@/features/workspace/components/workspace-account-selector"
import { WorkspaceDesktopHeader } from "@/features/workspace/layouts/workspace-desktop-header"
import { WorkspaceMobileHeader } from "@/features/workspace/layouts/workspace-mobile-header"

export function WorkspaceLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const { data: me } = useQuery(meQueryOptions)
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	const user = me?.user
	const isWorkspaceList =
		pathname === "/workspace" || pathname === "/workspace/"

	return (
		<SidebarProvider>
			<Sidebar variant="sidebar">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild>
								<Link to="/workspace">
									<img
										src="/agentfabric.png"
										alt="AgentFabric"
										className="size-8 rounded-lg object-contain"
									/>
									<div className="flex flex-col gap-0.5 leading-none">
										<span className="font-semibold">AgentFabric</span>
									</div>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<WorkspaceAccountSelector user={user} />
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton asChild isActive={isWorkspaceList}>
										<Link to="/workspace">
											<IconFolders className="size-4" />
											<span>Workspaces</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
			<div className="flex flex-1 flex-col min-h-svh">
				<AlertBannerStackFromProvider />
				<WorkspaceDesktopHeader user={user} />
				<WorkspaceMobileHeader user={user} />
				<div className="flex-1 overflow-y-auto">{children || <Outlet />}</div>
			</div>
		</SidebarProvider>
	)
}
