import {
	IconActivityHeartbeat,
	IconAlertTriangle,
	IconKey,
	IconMask,
	IconShieldLock,
} from "@tabler/icons-react"
import { Link, useRouterState } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const devTools = [
	{
		to: "/dev/api-playground",
		label: "API Playground",
		icon: IconKey,
	},
	{
		to: "/dev/impersonate-user",
		label: "Admin Playground",
		icon: IconMask,
	},
	{
		to: "/dev/table-apikey-integration",
		label: "Table API Playground",
		icon: IconShieldLock,
	},
	{
		to: "/dev/analytics",
		label: "Analytics",
		icon: IconActivityHeartbeat,
	},
	{
		to: "/dev/alert-banner",
		label: "Alert Banners",
		icon: IconAlertTriangle,
	},
] as const

function DevNavLink({
	to,
	label,
	icon: Icon,
}: {
	to: string
	label: string
	icon: typeof IconKey
}) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	const active = pathname === to

	return (
		<Link
			to={to}
			className={cn(
				"inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
				active
					? "bg-amber-950/10 text-amber-950 shadow-sm ring-1 ring-amber-900/10 dark:bg-amber-400/10 dark:text-amber-100 dark:ring-amber-300/20"
					: "text-muted-foreground hover:bg-background/80 hover:text-foreground"
			)}
		>
			<Icon className="size-4 shrink-0" />
			<span className="hidden sm:inline">{label}</span>
		</Link>
	)
}

export function DevNav({ trailing }: { trailing?: ReactNode }) {
	return (
		<header className="sticky top-0 z-50 border-b border-amber-900/10 bg-amber-50/90 backdrop-blur-md dark:border-amber-300/10 dark:bg-amber-950/40">
			<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
					<div className="flex items-center gap-2 pr-1">
						<div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
							<IconKey className="size-4" />
						</div>
						<div className="hidden md:block">
							<p className="text-sm font-semibold text-foreground">Dev Tools</p>
							<p className="text-xs text-muted-foreground">Local diagnostics</p>
						</div>
					</div>
					<nav className="flex flex-wrap items-center gap-1">
						{devTools.map((tool) => (
							<DevNavLink key={tool.to} {...tool} />
						))}
					</nav>
				</div>
				{trailing}
			</div>
		</header>
	)
}
