import { IconLayoutSidebar } from "@tabler/icons-react"
import { useRouterState } from "@tanstack/react-router"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { UserAccountMenuUser } from "@/features/auth/components/user-account-menu"
import { UserAccountMenu } from "@/features/auth/components/user-account-menu"

type WorkspaceMobileHeaderProps = {
	user?: UserAccountMenuUser | null
}

export function WorkspaceMobileHeader({ user }: WorkspaceMobileHeaderProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	const isWorkspaceList =
		pathname === "/workspace" || pathname === "/workspace/"
	const workspaceIdMatch = pathname.match(/^\/workspace\/([^/]+)/)

	const contextLabel = isWorkspaceList
		? "Workspaces"
		: workspaceIdMatch
			? "Workspace"
			: "AgentFabric"

	return (
		<header className="flex md:hidden h-12 items-center gap-2 border-b px-4 shrink-0">
			<SidebarTrigger className="-ml-1">
				<IconLayoutSidebar className="size-4" />
			</SidebarTrigger>
			<span className="text-sm font-medium truncate">{contextLabel}</span>
			<div className="flex items-center gap-2 ml-auto">
				<UserAccountMenu user={user} variant="header" />
			</div>
		</header>
	)
}
