import { IconCircleCheck } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import type { PlatformFeature } from "@/features/landing/content"
import { platformFeatures } from "@/features/landing/content"

function PlatformFeatureCard({ feature }: { feature: PlatformFeature }) {
	return (
		<Card className="flex h-full flex-col border-border/60 bg-card/80 py-0 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/25">
			<CardHeader className="flex-1 gap-3 pt-5">
				<div className="flex items-start gap-3">
					<div className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
						<feature.icon className="size-5" />
					</div>
					<div className="min-w-0 space-y-1.5">
						<CardTitle className="text-base font-semibold leading-snug">
							{feature.title}
						</CardTitle>
						<CardDescription className="text-sm leading-relaxed">
							{feature.description}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardFooter className="flex flex-wrap gap-1.5 border-t border-border/50 bg-muted/25 px-4 pb-4 pt-3">
				{feature.highlights.map((tag) => (
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
	)
}

export function LandingPlatform() {
	return (
		<section id="platform" className="scroll-mt-24 space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<Badge variant="outline">Available today</Badge>
					<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Platform foundation
					</h2>
					<p className="max-w-2xl text-muted-foreground">
						Everything below is implemented and running in the current codebase
						— CLI, API server, auth, database, observability, and web dashboard.
					</p>
				</div>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<IconCircleCheck className="size-4 text-primary" aria-hidden="true" />
					<span>{platformFeatures.length} modules shipped</span>
				</div>
			</div>

			<div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{platformFeatures.map((feature) => (
					<PlatformFeatureCard key={feature.title} feature={feature} />
				))}
			</div>
		</section>
	)
}
