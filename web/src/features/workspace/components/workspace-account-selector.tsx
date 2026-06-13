import {
	IconChevronDown,
	IconLogout,
	IconMoon,
	IconSun,
} from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { useSignOut } from "@/features/auth/queries/mutations"
import { getUserInitials } from "@/lib/user-display"

type WorkspaceAccountSelectorUser = {
	name?: string | null
	email?: string | null
	image?: string | null
}

type WorkspaceAccountSelectorProps = {
	user?: WorkspaceAccountSelectorUser | null
}

export function WorkspaceAccountSelector({
	user,
}: WorkspaceAccountSelectorProps) {
	const signOut = useSignOut()
	const navigate = useNavigate()
	const { theme, setTheme } = useTheme()

	const displayName = user?.name ?? user?.email ?? "Account"
	const initials = getUserInitials(user?.name)

	const handleSignOut = async () => {
		try {
			await signOut.mutateAsync()
		} catch {
			// navigate anyway
		}

		navigate({ to: "/signin" })
	}

	const handleToggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light")
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<Avatar className="size-8 rounded-lg">
						<AvatarImage src={user?.image ?? undefined} alt={displayName} />
						<AvatarFallback className="rounded-lg text-xs">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">{displayName}</span>
						{user?.email ? (
							<span className="truncate text-xs text-muted-foreground">
								{user.email}
							</span>
						) : null}
					</div>
					<IconChevronDown className="ml-auto size-4 shrink-0 opacity-50" />
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[--radix-popper-anchor-width] min-w-56"
				align="start"
				side="bottom"
				sideOffset={4}
			>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{displayName}</span>
						{user?.email ? (
							<span className="text-xs text-muted-foreground">
								{user.email}
							</span>
						) : null}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={handleToggleTheme}>
						{theme === "dark" ? (
							<IconSun className="size-4" />
						) : (
							<IconMoon className="size-4" />
						)}
						Toggle theme
						<DropdownMenuShortcut>D</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={handleSignOut}>
						<IconLogout className="size-4" />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
