import { IconLayoutSidebar, IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, Outlet } from "@tanstack/react-router"
import { useState } from "react"
import { AlertBannerStackFromProvider } from "@/components/alert-banner-stack/alert-banner-stack"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserAccountMenu } from "@/features/auth/components/user-account-menu"
import { meQueryOptions } from "@/features/management/queries/me"
import { CreateWorkspaceDialog } from "@/features/workspace/components/create-workspace-dialog"
import { useWorkspaces } from "@/features/workspace/queries/workspaces"

export function WorkspaceLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const { data: me } = useQuery(meQueryOptions)
	const { data: workspaces } = useWorkspaces()
	const [showCreate, setShowCreate] = useState(false)

	const user = me?.user

	return (
		<SidebarProvider>
			<Sidebar variant="inset">
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
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Workspaces</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{(workspaces ?? []).map((ws) => (
									<SidebarMenuItem key={ws.id}>
										<SidebarMenuButton asChild isActive={false}>
											<Link
												to="/workspace/$workspaceId"
												params={{ workspaceId: ws.id }}
												className="flex items-center gap-2"
											>
												<div className="flex size-5 items-center justify-center rounded bg-primary/10 shrink-0">
													<span className="text-[10px] font-semibold text-primary">
														{ws.name.charAt(0).toUpperCase()}
													</span>
												</div>
												<span className="truncate">{ws.name}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
								<SidebarMenuItem>
									<SidebarMenuButton onClick={() => setShowCreate(true)}>
										<IconPlus className="size-4" />
										<span>New Workspace</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarSeparator />
				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<UserAccountMenu user={user} variant="sidebar" />
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
			<div className="flex flex-1 flex-col min-h-svh">
				<AlertBannerStackFromProvider />
				<header className="flex h-12 items-center gap-2 border-b px-4 shrink-0">
					<SidebarTrigger className="-ml-1">
						<IconLayoutSidebar className="size-4" />
					</SidebarTrigger>
					<div className="flex items-center gap-2 ml-auto">
						<CreateWorkspaceDialog
							open={showCreate}
							onOpenChange={setShowCreate}
						/>
					</div>
				</header>
				<div className="flex-1 overflow-y-auto">{children || <Outlet />}</div>
			</div>
		</SidebarProvider>
	)
}
