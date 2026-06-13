import {
	IconArrowRight,
	IconBrandGithub,
	IconChevronDown,
	IconFolders,
	IconLogout,
} from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAccountMenu } from "@/features/auth/components/user-account-menu"
import { useSignOut } from "@/features/auth/queries/mutations"
import { GITHUB_REPO_URL, README_URL } from "@/features/landing/content"
import { useLandingAuth } from "@/features/landing/hooks/use-landing-auth"
import type { Workspace } from "@/features/workspace/types"
import { cn } from "@/lib/utils"

type LandingAccountActionsProps = {
	layout: "header" | "hero" | "cta" | "mobile"
	onNavigate?: () => void
}

const MAX_HEADER_WORKSPACES = 5

function WorkspaceIcon({ name }: { name: string }) {
	return (
		<div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10">
			<span className="text-[10px] font-semibold text-primary">
				{name.charAt(0).toUpperCase()}
			</span>
		</div>
	)
}

function GuestHeaderActions({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Button
				asChild
				variant="outline"
				size="sm"
				className="hidden sm:inline-flex"
			>
				<Link to="/signin">Sign in</Link>
			</Button>
			<Button asChild size="sm" className="hidden sm:inline-flex">
				<Link to="/signup">Get started</Link>
			</Button>
		</div>
	)
}

function OpenWorkspaceButton({
	workspaces,
	size = "sm",
	className,
	onNavigate,
}: {
	workspaces: Workspace[]
	size?: "sm" | "default" | "lg"
	className?: string
	onNavigate?: () => void
}) {
	if (workspaces.length === 1) {
		return (
			<Button asChild size={size} className={className}>
				<Link
					to="/workspace/$workspaceId"
					params={{ workspaceId: workspaces[0].id }}
					onClick={onNavigate}
				>
					Open workspace
				</Link>
			</Button>
		)
	}

	return (
		<Button asChild size={size} className={className}>
			<Link to="/workspace" onClick={onNavigate}>
				Open workspace
			</Link>
		</Button>
	)
}

function WorkspacesDropdown({
	workspaces,
	onNavigate,
}: {
	workspaces: Workspace[]
	onNavigate?: () => void
}) {
	const visibleWorkspaces = workspaces.slice(0, MAX_HEADER_WORKSPACES)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="hidden sm:inline-flex"
					aria-label="Your workspaces"
				>
					Workspaces
					<IconChevronDown className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Your workspaces</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{visibleWorkspaces.map((workspace) => (
					<DropdownMenuItem key={workspace.id} asChild>
						<Link
							to="/workspace/$workspaceId"
							params={{ workspaceId: workspace.id }}
							onClick={onNavigate}
							className="flex items-center gap-2"
						>
							<WorkspaceIcon name={workspace.name} />
							<span className="truncate">{workspace.name}</span>
						</Link>
					</DropdownMenuItem>
				))}
				{workspaces.length > MAX_HEADER_WORKSPACES ? (
					<DropdownMenuItem asChild>
						<Link to="/workspace" onClick={onNavigate}>
							View all ({workspaces.length})
						</Link>
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem asChild>
						<Link to="/workspace" onClick={onNavigate}>
							View all workspaces
						</Link>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function AuthenticatedHeaderActions({
	user,
	workspaces,
	onNavigate,
}: {
	user: ReturnType<typeof useLandingAuth>["user"]
	workspaces: Workspace[]
	onNavigate?: () => void
}) {
	return (
		<>
			<OpenWorkspaceButton
				workspaces={workspaces}
				onNavigate={onNavigate}
				className="hidden sm:inline-flex"
			/>
			{workspaces.length >= 2 ? (
				<WorkspacesDropdown workspaces={workspaces} onNavigate={onNavigate} />
			) : null}
			<UserAccountMenu
				user={user}
				variant="header"
				signOutRedirectTo="/"
				onNavigate={onNavigate}
			/>
		</>
	)
}

function HeaderLoadingSkeleton() {
	return (
		<>
			<Skeleton className="hidden h-8 w-24 sm:block" />
			<Skeleton className="hidden h-8 w-28 sm:block" />
		</>
	)
}

function MobileAuthenticatedSection({
	user,
	workspaces,
	onNavigate,
}: {
	user: ReturnType<typeof useLandingAuth>["user"]
	workspaces: Workspace[]
	onNavigate?: () => void
}) {
	const signOut = useSignOut()
	const displayName = user?.name ?? user?.email ?? "User"

	const handleSignOut = async () => {
		onNavigate?.()

		try {
			await signOut.mutateAsync()
		} catch {
			// stay on landing after sign out
		}
	}

	return (
		<div className="space-y-4 border-t border-border pt-4">
			<div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
					{displayName.charAt(0).toUpperCase()}
				</div>
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{displayName}</p>
					{user?.email ? (
						<p className="truncate text-xs text-muted-foreground">
							{user.email}
						</p>
					) : null}
				</div>
			</div>

			<div className="space-y-2">
				<p className="text-sm font-semibold text-foreground">Workspaces</p>
				{workspaces.length > 0 ? (
					<ul className="space-y-1">
						{workspaces.map((workspace) => (
							<li key={workspace.id}>
								<Link
									to="/workspace/$workspaceId"
									params={{ workspaceId: workspace.id }}
									onClick={onNavigate}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
								>
									<WorkspaceIcon name={workspace.name} />
									<span className="truncate">{workspace.name}</span>
								</Link>
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-muted-foreground">
						No workspaces yet. Create one from the dashboard.
					</p>
				)}
				<Button asChild variant="outline" size="sm" className="w-full">
					<Link to="/workspace" onClick={onNavigate}>
						<IconFolders className="size-4" />
						All workspaces
					</Link>
				</Button>
			</div>

			<Button
				variant="ghost"
				size="sm"
				className="w-full justify-start text-muted-foreground"
				onClick={handleSignOut}
			>
				<IconLogout className="size-4" />
				Sign out
			</Button>
		</div>
	)
}

function MobileGuestSection({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<div className="space-y-2 border-t border-border pt-4">
			<p className="text-sm font-semibold text-foreground">Account</p>
			<div className="flex flex-col gap-2">
				<Button asChild variant="outline" size="sm">
					<Link to="/signin" onClick={onNavigate}>
						Sign in
					</Link>
				</Button>
				<Button asChild size="sm">
					<Link to="/signup" onClick={onNavigate}>
						Get started
					</Link>
				</Button>
			</div>
		</div>
	)
}

export function LandingAccountActions({
	layout,
	onNavigate,
}: LandingAccountActionsProps) {
	const { isAuthenticated, isPending, user, workspaces } = useLandingAuth()

	if (layout === "header") {
		if (isPending) {
			return <HeaderLoadingSkeleton />
		}

		if (isAuthenticated) {
			return (
				<AuthenticatedHeaderActions
					user={user}
					workspaces={workspaces}
					onNavigate={onNavigate}
				/>
			)
		}

		return <GuestHeaderActions />
	}

	if (layout === "mobile") {
		if (isPending) {
			return (
				<div className="space-y-2 border-t border-border pt-4">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-9 w-full" />
				</div>
			)
		}

		if (isAuthenticated) {
			return (
				<MobileAuthenticatedSection
					user={user}
					workspaces={workspaces}
					onNavigate={onNavigate}
				/>
			)
		}

		return <MobileGuestSection onNavigate={onNavigate} />
	}

	if (layout === "hero") {
		if (isPending) {
			return (
				<div className="flex flex-wrap gap-3">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-9 w-28" />
				</div>
			)
		}

		if (isAuthenticated) {
			return (
				<div className="flex flex-wrap gap-3">
					<OpenWorkspaceButton workspaces={workspaces} size="default" />
					{workspaces.length >= 2 ? (
						<Button asChild variant="outline">
							<Link to="/workspace">
								All workspaces
								<IconArrowRight className="size-4" />
							</Link>
						</Button>
					) : null}
					<Button asChild variant="outline">
						<a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
							View on GitHub
							<IconBrandGithub className="size-4" />
						</a>
					</Button>
					<Button asChild variant="ghost">
						<a href={README_URL} target="_blank" rel="noreferrer">
							Read docs
						</a>
					</Button>
				</div>
			)
		}

		return (
			<div className="flex flex-wrap gap-3">
				<Button asChild>
					<Link to="/signup">Get started</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to="/signin">
						Sign in
						<IconArrowRight className="size-4" />
					</Link>
				</Button>
				<Button asChild variant="outline">
					<a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
						View on GitHub
						<IconBrandGithub className="size-4" />
					</a>
				</Button>
				<Button asChild variant="ghost">
					<a href={README_URL} target="_blank" rel="noreferrer">
						Read docs
					</a>
				</Button>
			</div>
		)
	}

	if (layout === "cta") {
		if (isPending) {
			return (
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
					<Skeleton className="h-11 w-full sm:w-48" />
					<Skeleton className="h-11 w-full sm:w-48" />
				</div>
			)
		}

		if (isAuthenticated) {
			return (
				<div className="flex w-full flex-col gap-3 sm:min-w-64">
					{workspaces.length > 0 ? (
						<div className="space-y-2">
							{workspaces.slice(0, 4).map((workspace) => (
								<Card
									key={workspace.id}
									className="p-3 transition-colors hover:bg-accent/50"
								>
									<Link
										to="/workspace/$workspaceId"
										params={{ workspaceId: workspace.id }}
										className="flex items-center gap-3"
									>
										<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
											<span className="text-sm font-semibold text-primary">
												{workspace.name.charAt(0).toUpperCase()}
											</span>
										</div>
										<div className="min-w-0">
											<p className="truncate font-medium">{workspace.name}</p>
											<p className="truncate text-xs text-muted-foreground">
												{workspace.slug}
											</p>
										</div>
									</Link>
								</Card>
							))}
						</div>
					) : null}
					<OpenWorkspaceButton
						workspaces={workspaces}
						size="lg"
						className="w-full sm:w-auto"
					/>
					{workspaces.length >= 2 ? (
						<Button
							asChild
							variant="outline"
							size="lg"
							className="w-full sm:w-auto"
						>
							<Link to="/workspace">
								View all workspaces
								<IconArrowRight className="size-4" />
							</Link>
						</Button>
					) : null}
				</div>
			)
		}

		return (
			<div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
				<Button asChild size="lg" className="w-full sm:w-auto">
					<Link to="/signup">Create account</Link>
				</Button>
				<Button
					asChild
					variant="outline"
					size="lg"
					className="w-full sm:w-auto"
				>
					<Link to="/signin">
						Sign in
						<IconArrowRight className="size-4" />
					</Link>
				</Button>
			</div>
		)
	}

	return null
}
