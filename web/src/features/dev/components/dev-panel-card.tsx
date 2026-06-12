import type { ReactNode } from "react"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type DevPanelCardProps = {
	title: ReactNode
	description?: ReactNode
	children: ReactNode
	className?: string
	contentClassName?: string
}

export function DevPanelCard({
	title,
	description,
	children,
	className,
	contentClassName,
}: DevPanelCardProps) {
	return (
		<Card className={cn("border-border/70 bg-card/95 shadow-sm", className)}>
			<CardHeader className="space-y-1.5">
				<CardTitle className="text-base">{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className={contentClassName}>{children}</CardContent>
		</Card>
	)
}
