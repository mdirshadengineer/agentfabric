import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	quickstartPaths,
	README_URL,
	requiredEnvVars,
} from "@/features/landing/content"

export function LandingQuickstart() {
	return (
		<section id="quickstart" className="scroll-mt-24 space-y-6">
			<div className="space-y-2">
				<Badge variant="outline">Quick start</Badge>
				<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
					Run locally in minutes
				</h2>
				<p className="max-w-2xl text-muted-foreground">
					Install from npm for the fastest path, or clone the repo to develop
					against the monorepo. Both use the same CLI commands and flags.
				</p>
			</div>

			<Card className="border-border/60 bg-card/80 py-0 shadow-sm">
				<CardHeader className="pt-5">
					<CardTitle className="text-lg">Commands</CardTitle>
					<CardDescription>
						Set required environment variables, then start the runtime.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 pb-5">
					<Tabs defaultValue="npm">
						<TabsList>
							{quickstartPaths.map((path) => (
								<TabsTrigger key={path.id} value={path.id}>
									{path.label}
								</TabsTrigger>
							))}
						</TabsList>
						{quickstartPaths.map((path) => (
							<TabsContent key={path.id} value={path.id} className="space-y-3">
								<p className="text-sm text-muted-foreground">
									{path.description}
								</p>
								<pre className="overflow-auto rounded-xl border border-border bg-muted/50 px-4 py-4 font-mono text-sm leading-7 text-foreground">
									{path.commands}
								</pre>
							</TabsContent>
						))}
					</Tabs>
					<p className="text-sm text-muted-foreground">
						Required environment variables:{" "}
						{requiredEnvVars.map((name, index) => (
							<span key={name}>
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
									{name}
								</code>
								{index < requiredEnvVars.length - 1 ? ", " : ". "}
							</span>
						))}
						Optional: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">PORT</code>{" "}
						(default 5678). See the{" "}
						<a
							href={README_URL}
							target="_blank"
							rel="noreferrer"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							README
						</a>{" "}
						for full configuration details.
					</p>
				</CardContent>
			</Card>
		</section>
	)
}
