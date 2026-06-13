import { IconArrowDown, IconArrowRight, IconCommand } from "@tabler/icons-react"
import { Fragment } from "react"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import type {
	ArchitectureLayer,
	ArchitecturePackage,
} from "@/features/landing/content"
import {
	architectureHost,
	architectureLayers,
	architecturePackages,
} from "@/features/landing/content"
import { cn } from "@/lib/utils"

function ArchitectureLayerNode({ layer }: { layer: ArchitectureLayer }) {
	return (
		<div className="flex min-w-0 flex-1 flex-col rounded-xl border border-border/60 bg-muted/20 p-4">
			<div className="inline-flex size-9 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
				<layer.icon className="size-4" />
			</div>
			<p className="mt-3 font-semibold leading-none">{layer.title}</p>
			<p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
				{layer.subtitle}
			</p>
			<div className="mt-auto flex flex-wrap gap-1.5 pt-3">
				{layer.highlights.map((tag) => (
					<Badge
						key={tag}
						variant="outline"
						className="font-normal text-muted-foreground"
					>
						{tag}
					</Badge>
				))}
			</div>
		</div>
	)
}

function FlowConnector({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center text-muted-foreground",
				className
			)}
			aria-hidden="true"
		>
			<IconArrowDown className="size-4 lg:hidden" />
			<IconArrowRight className="hidden size-4 lg:block" />
		</div>
	)
}

function ArchitecturePackageTile({ pkg }: { pkg: ArchitecturePackage }) {
	return (
		<div className="rounded-xl border border-border/60 bg-muted/20 p-4">
			<div className="flex items-start gap-3">
				<div className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground">
					<pkg.icon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-mono text-sm font-semibold">{pkg.name}</p>
					<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
						{pkg.description}
					</p>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap gap-1.5">
				{pkg.highlights.map((tag) => (
					<Badge
						key={tag}
						variant="outline"
						className="font-normal text-muted-foreground"
					>
						{tag}
					</Badge>
				))}
			</div>
		</div>
	)
}

export function LandingArchitecture() {
	return (
		<section id="architecture" className="scroll-mt-24 space-y-6">
			<div className="space-y-2">
				<Badge variant="outline">Architecture</Badge>
				<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
					How the stack fits together
				</h2>
				<p className="max-w-2xl text-muted-foreground">
					One CLI binary hosts the API and production SPA. Requests move from
					the browser through Fastify to PostgreSQL in a single deployable
					artifact.
				</p>
			</div>

			<Card className="border-border/60 bg-card/80 py-0 shadow-sm">
				<CardHeader className="border-b border-border/50 pt-5">
					<CardTitle className="text-lg">System overview</CardTitle>
					<CardDescription>
						Runtime request path, process host, and monorepo layout in one view.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-8 px-4 py-6 sm:px-6">
					<div className="space-y-4">
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Request path
						</p>
						<div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
							{architectureLayers.map((layer, index) => (
								<Fragment key={layer.title}>
									{index > 0 && (
										<FlowConnector className="py-1 lg:px-0 lg:py-0" />
									)}
									<ArchitectureLayerNode layer={layer} />
								</Fragment>
							))}
						</div>
					</div>

					<div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
							<div className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
								<architectureHost.icon className="size-5" />
							</div>
							<div className="min-w-0 flex-1 space-y-1">
								<p className="text-xs font-medium uppercase tracking-wide text-primary">
									Hosted by
								</p>
								<p className="font-semibold">{architectureHost.title}</p>
								<p className="font-mono text-sm text-primary">
									{architectureHost.subtitle}
								</p>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{architectureHost.description}
								</p>
							</div>
							<div className="flex flex-wrap gap-1.5 sm:max-w-xs sm:justify-end">
								{architectureHost.highlights.map((tag) => (
									<Badge key={tag} variant="secondary" className="font-normal">
										{tag}
									</Badge>
								))}
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<IconCommand className="size-4 text-primary" />
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Monorepo packages
							</p>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							{architecturePackages.map((pkg) => (
								<ArchitecturePackageTile key={pkg.name} pkg={pkg} />
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	)
}
