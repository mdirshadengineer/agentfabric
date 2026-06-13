import { Link, useRouterState } from "@tanstack/react-router"
import type { UserAccountMenuUser } from "@/features/auth/components/user-account-menu"
import { UserAccountMenu } from "@/features/auth/components/user-account-menu"

type WorkspaceDesktopHeaderProps = {
	user?: UserAccountMenuUser | null
}

export function WorkspaceDesktopHeader({ user }: WorkspaceDesktopHeaderProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	const workspaceIdMatch = pathname.match(/^\/workspace\/([^/]+)/)
	const isWorkspaceList =
		pathname === "/workspace" || pathname === "/workspace/"

	return (
		<header className="hidden md:flex h-12 items-center shrink-0 border-b px-4">
			<div className="flex items-center gap-2 text-sm min-w-0">
				{workspaceIdMatch ? (
					<>
						<Link
							to="/workspace"
							className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
						>
							Workspaces
						</Link>
						<span className="text-muted-foreground shrink-0">/</span>
						<span className="truncate text-foreground font-medium">
							Workspace
						</span>
					</>
				) : isWorkspaceList ? (
					<span className="text-muted-foreground">Workspaces</span>
				) : null}
			</div>

			<div className="flex items-center gap-x-2 ml-auto">
				<UserAccountMenu user={user} variant="header" />
			</div>
		</header>
	)
}
