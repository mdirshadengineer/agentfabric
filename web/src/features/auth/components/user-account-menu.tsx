import { IconLogout, IconMoon, IconSun } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

export type UserAccountMenuUser = {
	name?: string | null
	email?: string | null
	image?: string | null
}

type UserAccountMenuProps = {
	user?: UserAccountMenuUser | null
	variant?: "sidebar" | "header"
	signOutRedirectTo?: string
	onNavigate?: () => void
	className?: string
}

export function UserAccountMenu({
	user,
	variant = "sidebar",
	signOutRedirectTo = "/signin",
	onNavigate,
	className,
}: UserAccountMenuProps) {
	const signOut = useSignOut()
	const navigate = useNavigate()
	const { theme, setTheme } = useTheme()

	const displayName = user?.name ?? user?.email ?? "User"
	const initials = getUserInitials(user?.name)

	const handleSignOut = async () => {
		onNavigate?.()

		try {
			await signOut.mutateAsync()
		} catch {
			// navigate anyway
		}

		navigate({ to: signOutRedirectTo })
	}

	const handleToggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light")
	}

	const avatar = (
		<Avatar size={variant === "header" ? "sm" : "sm"}>
			<AvatarImage src={user?.image ?? undefined} alt={displayName} />
			<AvatarFallback>{initials}</AvatarFallback>
		</Avatar>
	)

	const menuContent = (
		<DropdownMenuContent
			align={variant === "header" ? "end" : "start"}
			side={variant === "sidebar" ? "top" : "bottom"}
			sideOffset={variant === "header" ? 8 : 4}
			className={cn(
				variant === "header" && "w-56 min-w-56 p-1",
				variant === "sidebar" && "w-[--radix-popper-anchor-width]",
				className
			)}
		>
			<DropdownMenuLabel
				className={cn(
					"font-normal",
					variant === "header" ? "px-1.5 py-1" : undefined
				)}
			>
				{variant === "header" ? (
					<div className="min-w-0 space-y-0.5">
						<p className="truncate text-sm font-medium leading-tight text-foreground">
							{displayName}
						</p>
						{user?.email ? (
							<p className="truncate text-xs leading-tight text-muted-foreground">
								{user.email}
							</p>
						) : null}
					</div>
				) : (
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{displayName}</span>
						{user?.email ? (
							<span className="text-xs text-muted-foreground">
								{user.email}
							</span>
						) : null}
					</div>
				)}
			</DropdownMenuLabel>
			<DropdownMenuSeparator
				className={variant === "header" ? "my-1" : undefined}
			/>
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
			<DropdownMenuSeparator
				className={variant === "header" ? "my-1" : undefined}
			/>
			<DropdownMenuGroup>
				<DropdownMenuItem onClick={handleSignOut}>
					<IconLogout className="size-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	)

	if (variant === "header") {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full"
						aria-label="Account menu"
					>
						<Avatar>
							<AvatarImage src={user?.image ?? undefined} alt={displayName} />
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				{menuContent}
			</DropdownMenu>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton>
					{avatar}
					<span className="truncate">{displayName}</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			{menuContent}
		</DropdownMenu>
	)
}
