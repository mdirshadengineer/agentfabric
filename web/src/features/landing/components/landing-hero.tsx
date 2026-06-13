import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { LandingAccountActions } from "@/features/landing/components/landing-account-actions"
import { heroAtAGlance } from "@/features/landing/content"
import { useLandingAuth } from "@/features/landing/hooks/use-landing-auth"
import { getUserFirstName } from "@/lib/user-display"

export function LandingHero() {
	const { isAuthenticated, isPending, user } = useLandingAuth()
	const firstName = getUserFirstName(user?.name)

	return (
		<section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
			<div className="space-y-5">
				{!isPending && isAuthenticated ? (
					<Badge variant="secondary" className="w-fit">
						Signed in as {firstName}
					</Badge>
				) : (
					<Badge variant="secondary" className="w-fit">
						Open-source framework
					</Badge>
				)}
				<h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
					Build, deploy, and manage AI agents — starting with the platform
					foundation.
				</h1>
				<p className="max-w-xl text-base leading-7 text-muted-foreground">
					AgentFabric is a monorepo framework: a publishable CLI that runs a
					Fastify API server, PostgreSQL-backed auth, and a React control plane
					— one artifact in production.
				</p>
				<LandingAccountActions layout="hero" />
			</div>

			<Card className="border-border/60 bg-card/80 py-0 shadow-sm backdrop-blur">
				<CardHeader className="pt-5">
					<CardTitle className="text-lg">At a glance</CardTitle>
					<CardDescription>
						What ships today in the foundation stack.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 pb-5">
					{heroAtAGlance.map((item) => (
						<div
							key={item.label}
							className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3"
						>
							<p className="font-mono text-sm font-bold text-primary">
								{item.label}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{item.detail}
							</p>
						</div>
					))}
				</CardContent>
			</Card>
		</section>
	)
}
