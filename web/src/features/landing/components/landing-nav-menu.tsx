import type { TablerIcon } from "@tabler/icons-react"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import type { NavMenuGroup } from "@/features/landing/content"
import { navMenuGroups } from "@/features/landing/content"
import { cn } from "@/lib/utils"

function ListItem({
	icon: Icon,
	title,
	children,
	href,
	external,
	...props
}: ComponentPropsWithoutRef<"li"> & {
	icon: TablerIcon
	title: string
	href: string
	external?: boolean
	children: ReactNode
}) {
	return (
		<li {...props}>
			<NavigationMenuLink asChild>
				<a
					href={href}
					target={external ? "_blank" : undefined}
					rel={external ? "noreferrer" : undefined}
				>
					<div className="flex items-start gap-3 text-sm">
						<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-muted-foreground">
							<Icon className="size-4" />
						</div>
						<div className="flex flex-col gap-1">
							<div className="font-medium leading-none">{title}</div>
							<div className="line-clamp-2 text-muted-foreground">
								{children}
							</div>
						</div>
					</div>
				</a>
			</NavigationMenuLink>
		</li>
	)
}

function NavDropdownPanel({ group }: { group: NavMenuGroup }) {
	const isMultiColumn = group.label === "Platform"

	return (
		<ul
			className={cn(
				isMultiColumn
					? "grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]"
					: "w-96"
			)}
		>
			{group.items.map((item) => (
				<ListItem
					key={item.title}
					icon={item.icon}
					title={item.title}
					href={item.href}
					external={item.external}
				>
					{item.description}
				</ListItem>
			))}
		</ul>
	)
}

export function LandingNavMenu() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				{navMenuGroups.map((group) => (
					<NavigationMenuItem key={group.label}>
						<NavigationMenuTrigger className="gap-1.5">
							<group.icon className="size-4" aria-hidden="true" />
							{group.label}
						</NavigationMenuTrigger>
						<NavigationMenuContent>
							<NavDropdownPanel group={group} />
						</NavigationMenuContent>
					</NavigationMenuItem>
				))}
			</NavigationMenuList>
		</NavigationMenu>
	)
}
