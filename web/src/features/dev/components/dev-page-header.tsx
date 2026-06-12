import type { ReactNode } from "react"

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type DevPageHeaderProps = {
	icon?: ReactNode
	badges?: ReactNode
	title: string
	description?: string
	meta?: ReactNode
	className?: string
}

export function DevPageHeader({
	icon,
	badges,
	title,
	description,
	meta,
	className,
}: DevPageHeaderProps) {
	return (
		<Card
			className={cn(
				"overflow-hidden border-border/70 bg-card/90 shadow-sm backdrop-blur-sm",
				className
			)}
		>
			<CardHeader className="space-y-4">
				<div className="space-y-3">
					{(badges || icon) && (
						<div className="flex flex-wrap items-center gap-2">
							{icon && (
								<div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
									{icon}
								</div>
							)}
							{badges}
						</div>
					)}
					<div className="space-y-1.5">
						<CardTitle className="text-2xl tracking-tight sm:text-3xl">
							{title}
						</CardTitle>
						{description && (
							<CardDescription className="max-w-3xl text-sm leading-6 sm:text-base">
								{description}
							</CardDescription>
						)}
					</div>
				</div>
				{meta && (
					<div className="w-full border-t border-border/60 pt-4">{meta}</div>
				)}
			</CardHeader>
		</Card>
	)
}
