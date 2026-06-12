import {
	IconLayoutSidebar,
	IconLogout,
	IconMoon,
	IconPlus,
	IconSparkles,
	IconSun,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { AlertBannerStackFromProvider } from "@/components/alert-banner-stack/alert-banner-stack"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useSignOut } from "@/features/auth/queries/mutations"
import { meQueryOptions } from "@/features/management/queries/me"
import { CreateWorkspaceDialog } from "@/features/workspace/components/create-workspace-dialog"
import { useWorkspaces } from "@/features/workspace/queries/workspaces"

export function WorkspaceLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const { data: me } = useQuery(meQueryOptions)
	const { data: workspaces } = useWorkspaces()
	const signOut = useSignOut()
	const navigate = useNavigate()
	const { theme, setTheme } = useTheme()
	const [showCreate, setShowCreate] = useState(false)

	const user = me?.user
	const initials = user?.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2)

	const handleSignOut = async () => {
		try {
			await signOut.mutateAsync()
		} catch {
			// navigate anyway
		}
		navigate({ to: "/signin" })
	}

	return (
		<SidebarProvider>
			<Sidebar variant="inset">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild>
								<Link to="/workspace">
									<div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-teal-500 to-cyan-500 text-white">
										<IconSparkles className="size-4" />
									</div>
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
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton>
										<Avatar size="sm">
											<AvatarImage src={undefined} />
											<AvatarFallback>{initials ?? "?"}</AvatarFallback>
										</Avatar>
										<span className="truncate">
											{user?.name ?? user?.email ?? "User"}
										</span>
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side="top"
									className="w-[--radix-popper-anchor-width]"
								>
									<DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											setTheme(theme === "light" ? "dark" : "light")
										}
									>
										{theme === "dark" ? (
											<IconSun className="size-4" />
										) : (
											<IconMoon className="size-4" />
										)}
										Toggle theme
										<DropdownMenuShortcut>D</DropdownMenuShortcut>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleSignOut}>
										<IconLogout className="size-4" />
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
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
