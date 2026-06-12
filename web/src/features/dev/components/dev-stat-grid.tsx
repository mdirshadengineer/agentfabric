import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type DevStatGridProps = {
	items: Array<{ label: string; value: ReactNode; mono?: boolean }>
	className?: string
}

export function DevStatGrid({ items, className }: DevStatGridProps) {
	return (
		<div
			className={cn(
				"grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
				className
			)}
		>
			{items.map((item) => (
				<div
					key={item.label}
					className="rounded-xl border border-border/70 bg-muted/30 p-3.5"
				>
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{item.label}
					</p>
					<p
						className={cn(
							"mt-1.5 text-sm leading-6 text-foreground break-words",
							item.mono && "font-mono text-xs"
						)}
					>
						{item.value}
					</p>
				</div>
			))}
		</div>
	)
}

export function DevStatusBar({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<p
			className={cn(
				"rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm leading-6 text-muted-foreground",
				className
			)}
		>
			{children}
		</p>
	)
}
