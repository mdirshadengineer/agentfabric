import { IconCircleCheck, IconSparkles } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LandingAccountActions } from "@/features/landing/components/landing-account-actions"
import { useLandingAuth } from "@/features/landing/hooks/use-landing-auth"

const ctaBenefits = [
	"Workspace shell with auth flows",
	"Management APIs and session governance",
	"Foundation stack ready to extend",
]

const authedBenefits = [
	"Jump back into your workspace dashboard",
	"Manage auth flows and session governance",
	"Extend the foundation stack for your agents",
]

export function LandingCta() {
	const { isAuthenticated, isPending, user } = useLandingAuth()
	const displayName = user?.name ?? user?.email ?? "there"
	const benefits = isAuthenticated ? authedBenefits : ctaBenefits

	return (
		<section aria-labelledby="landing-cta-heading">
			<Card className="relative overflow-hidden border-primary/25 bg-card/80 py-0 shadow-sm">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_55%)]" />
				<CardHeader className="relative border-b border-border/50 pt-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-3">
							{isPending ? (
								<Skeleton className="h-6 w-24" />
							) : (
								<Badge
									variant="outline"
									className="border-primary/30 bg-primary/5 text-primary"
								>
									{isAuthenticated ? "Welcome back" : "Get started"}
								</Badge>
							)}
							<div className="flex items-start gap-3">
								<div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
									<IconSparkles className="size-5" />
								</div>
								<div className="space-y-1">
									{isPending ? (
										<>
											<Skeleton className="h-7 w-64" />
											<Skeleton className="mt-2 h-4 w-80" />
										</>
									) : (
										<>
											<CardTitle
												id="landing-cta-heading"
												className="text-xl sm:text-2xl"
											>
												{isAuthenticated
													? `Welcome back, ${displayName}`
													: "Ready to explore the dashboard?"}
											</CardTitle>
											<CardDescription className="text-sm leading-relaxed sm:text-base">
												{isAuthenticated
													? "Pick up where you left off in your workspace, or browse what's new on the platform."
													: "Create an account to try the workspace shell, auth flows, and management APIs built on the foundation stack."}
											</CardDescription>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
					<ul className="space-y-2.5">
						{benefits.map((benefit) => (
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

					<LandingAccountActions layout="cta" />
				</CardContent>
			</Card>
		</section>
	)
}
