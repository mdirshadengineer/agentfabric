import { IconClockHour4 } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import type { RoadmapItem } from "@/features/landing/content"
import { roadmapItems } from "@/features/landing/content"
import { cn } from "@/lib/utils"

function RoadmapItemCard({
	item,
	step,
	isLast,
}: {
	item: RoadmapItem
	step: number
	isLast: boolean
}) {
	return (
		<div className="relative flex gap-4 lg:block">
			<div className="flex flex-col items-center lg:hidden">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted/30 text-xs font-semibold text-muted-foreground">
					{step}
				</div>
				{!isLast && (
					<div className="my-2 w-px flex-1 border-l border-dashed border-border" />
				)}
			</div>

			<Card
				className={cn(
					"min-w-0 flex-1 border-dashed border-border/70 bg-muted/15 py-0 shadow-none lg:flex lg:h-full lg:flex-col"
				)}
			>
				<CardHeader className="flex-1 gap-3 pt-5">
					<div className="flex items-start gap-3">
						<div className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground">
							<item.icon className="size-5" />
						</div>
						<div className="min-w-0 flex-1 space-y-1.5">
							<div className="flex flex-wrap items-center gap-2">
								<Badge
									variant="outline"
									className="hidden font-normal text-muted-foreground lg:inline-flex"
								>
									Step {step}
								</Badge>
								<CardTitle className="text-base font-semibold leading-snug">
									{item.title}
								</CardTitle>
							</div>
							<CardDescription className="text-sm leading-relaxed">
								{item.description}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardFooter className="flex flex-wrap gap-1.5 border-t border-dashed border-border/50 bg-muted/20 px-4 pb-4 pt-3">
					{item.highlights.map((tag) => (
						<Badge
							key={tag}
							variant="outline"
							className="font-normal text-muted-foreground"
						>
							{tag}
						</Badge>
					))}
				</CardFooter>
			</Card>
		</div>
	)
}

export function LandingRoadmap() {
	return (
		<section id="roadmap" className="scroll-mt-24 space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<Badge variant="outline">Roadmap</Badge>
					<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Coming next
					</h2>
					<p className="max-w-2xl text-muted-foreground">
						Planned capabilities that build on the foundation — not yet
						implemented.
					</p>
				</div>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<IconClockHour4 className="size-4" aria-hidden="true" />
					<span>{roadmapItems.length} initiatives planned</span>
				</div>
			</div>

			<Card className="border-border/60 bg-card/80 py-0 shadow-sm">
				<CardHeader className="border-b border-border/50 pt-5">
					<CardTitle className="text-lg">Product roadmap</CardTitle>
					<CardDescription>
						Ordered by expected build sequence on top of the current platform
						foundation.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
					{roadmapItems.map((item, index) => (
						<RoadmapItemCard
							key={item.title}
							item={item}
							step={index + 1}
							isLast={index === roadmapItems.length - 1}
						/>
					))}
				</CardContent>
			</Card>
		</section>
	)
}
