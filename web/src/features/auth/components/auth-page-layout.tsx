import {
	IconBrandGithub,
	IconBrandGoogle,
	IconCircleCheck,
	IconSparkles,
} from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type AuthPageLayoutProps = {
	children: ReactNode
	gradient: "teal" | "emerald"
	headerLinkHref: string
	headerLinkText: string
	badgeText: string
	badgeAccent: "teal" | "emerald"
	title: string
	description: string
	infoTitle: string
	infoDescription: string
	infoBullets: string[]
}

const gradientMap = {
	teal: {
		light:
			"bg-[radial-gradient(circle_at_15%_8%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_42%)]",
		dark: "dark:bg-[radial-gradient(circle_at_15%_8%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_42%)]",
	},
	emerald: {
		light:
			"bg-[radial-gradient(circle_at_10%_10%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_42%)]",
		dark: "dark:bg-[radial-gradient(circle_at_10%_10%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_42%)]",
	},
}

const badgeAccentMap: Record<string, string> = {
	teal: "border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-200",
	emerald:
		"border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200",
}

const infoAccentMap: Record<string, string> = {
	teal: "from-teal-500/15 to-cyan-500/5",
	emerald: "from-emerald-500/15 to-cyan-500/5",
}

export function AuthPageLayout({
	children,
	gradient,
	headerLinkHref,
	headerLinkText,
	badgeText,
	badgeAccent,
	title,
	description,
	infoTitle,
	infoDescription,
	infoBullets,
}: AuthPageLayoutProps) {
	const g = gradientMap[gradient]

	return (
		<div className="relative min-h-screen overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10">
			<div
				className={cn("pointer-events-none absolute inset-0", g.light, g.dark)}
			/>
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--border)_60%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_60%,transparent)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(circle_at_center,black_42%,transparent_95%)]" />

			<div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6">
				<header className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 md:px-5">
					<Link to="/" className="flex shrink-0 items-center gap-3">
						<img
							src="/agentfabric.png"
							alt="AgentFabric"
							className="h-6 w-auto"
						/>
						<div className="hidden sm:block">
							<p className="text-sm font-semibold tracking-wide">AgentFabric</p>
							<p className="text-xs text-muted-foreground">
								AI agent platform foundation
							</p>
						</div>
					</Link>
					<Button asChild variant="outline" size="sm" className="shrink-0">
						<Link to={headerLinkHref}>{headerLinkText}</Link>
					</Button>
				</header>

				<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
					<Card className="border-border/60 bg-card/80 py-0 shadow-sm backdrop-blur">
						<CardHeader className="space-y-3 border-b border-border/50 pt-6 pb-5">
							<Badge
								variant="outline"
								className={cn("w-fit", badgeAccentMap[badgeAccent])}
							>
								{badgeText}
							</Badge>
							<div className="space-y-2">
								<CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
									{title}
								</CardTitle>
								<CardDescription className="text-sm leading-relaxed">
									{description}
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="space-y-6 px-6 py-6">
							{children}

							<div className="space-y-4">
								<div className="relative">
									<Separator />
									<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
										Or continue with
									</span>
								</div>
								<div className="grid gap-2 sm:grid-cols-2">
									<Button
										type="button"
										variant="outline"
										disabled
										className="h-9 justify-start gap-2"
									>
										<IconBrandGoogle className="size-4" />
										Google
									</Button>
									<Button
										type="button"
										variant="outline"
										disabled
										className="h-9 justify-start gap-2"
									>
										<IconBrandGithub className="size-4" />
										GitHub
									</Button>
								</div>
								<p className="text-center text-xs text-muted-foreground">
									OAuth providers coming soon
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden border-primary/25 bg-card/80 py-0 shadow-sm lg:sticky lg:top-6">
						<div
							className={cn(
								"pointer-events-none absolute inset-0 bg-linear-to-br",
								infoAccentMap[badgeAccent]
							)}
						/>
						<CardHeader className="relative space-y-3 pt-6">
							<div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
								<IconSparkles className="size-5" />
							</div>
							<div className="space-y-2">
								<CardTitle className="text-xl sm:text-2xl">
									{infoTitle}
								</CardTitle>
								<CardDescription className="text-sm leading-relaxed">
									{infoDescription}
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="relative pb-6">
							<ul className="space-y-3">
								{infoBullets.map((text) => (
									<li
										key={text}
										className="flex items-start gap-2.5 text-sm text-muted-foreground"
									>
										<IconCircleCheck
											className="mt-0.5 size-4 shrink-0 text-primary"
											aria-hidden="true"
										/>
										<span>{text}</span>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
