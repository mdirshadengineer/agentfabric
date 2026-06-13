import {
	IconArrowRight,
	IconCircleCheck,
	IconSparkles,
} from "@tabler/icons-react"
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

const ctaBenefits = [
	"Workspace shell with auth flows",
	"Management APIs and session governance",
	"Foundation stack ready to extend",
]

export function LandingCta() {
	return (
		<section aria-labelledby="landing-cta-heading">
			<Card className="relative overflow-hidden border-primary/25 bg-card/80 py-0 shadow-sm">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_55%)]" />
				<CardHeader className="relative border-b border-border/50 pt-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-3">
							<Badge
								variant="outline"
								className="border-primary/30 bg-primary/5 text-primary"
							>
								Get started
							</Badge>
							<div className="flex items-start gap-3">
								<div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
									<IconSparkles className="size-5" />
								</div>
								<div className="space-y-1">
									<CardTitle
										id="landing-cta-heading"
										className="text-xl sm:text-2xl"
									>
										Ready to explore the dashboard?
									</CardTitle>
									<CardDescription className="text-sm leading-relaxed sm:text-base">
										Create an account to try the workspace shell, auth flows,
										and management APIs built on the foundation stack.
									</CardDescription>
								</div>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
					<ul className="space-y-2.5">
						{ctaBenefits.map((benefit) => (
							<li
								key={benefit}
								className="flex items-start gap-2.5 text-sm text-muted-foreground"
							>
								<IconCircleCheck
									className="mt-0.5 size-4 shrink-0 text-primary"
									aria-hidden="true"
								/>
								<span>{benefit}</span>
							</li>
						))}
					</ul>

					<div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
						<Button asChild size="lg" className="w-full sm:w-auto">
							<Link to="/signup">Create account</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							size="lg"
							className="w-full sm:w-auto"
						>
							<Link to="/signin">
								Sign in
								<IconArrowRight className="size-4" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	)
}
