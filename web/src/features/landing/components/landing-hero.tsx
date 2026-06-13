import { IconArrowRight, IconBrandGithub } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	GITHUB_REPO_URL,
	heroAtAGlance,
	README_URL,
} from "@/features/landing/content"

export function LandingHero() {
	return (
		<section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
			<div className="space-y-5">
				<Badge variant="secondary" className="w-fit">
					Open-source framework
				</Badge>
				<h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
					Build, deploy, and manage AI agents — starting with the platform
					foundation.
				</h1>
				<p className="max-w-xl text-base leading-7 text-muted-foreground">
					AgentFabric is a monorepo framework: a publishable CLI that runs a
					Fastify API server, PostgreSQL-backed auth, and a React control plane
					— one artifact in production.
				</p>
				<div className="flex flex-wrap gap-3">
					<Button asChild>
						<Link to="/signup">Get started</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/signin">
							Sign in
							<IconArrowRight className="size-4" />
						</Link>
					</Button>
					<Button asChild variant="outline">
						<a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
							View on GitHub
							<IconBrandGithub className="size-4" />
						</a>
					</Button>
					<Button asChild variant="ghost">
						<a href={README_URL} target="_blank" rel="noreferrer">
							Read docs
						</a>
					</Button>
				</div>
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
