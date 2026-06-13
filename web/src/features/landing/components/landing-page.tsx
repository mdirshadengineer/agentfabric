import { LandingArchitecture } from "@/features/landing/components/landing-architecture"
import { LandingCta } from "@/features/landing/components/landing-cta"
import { LandingFooter } from "@/features/landing/components/landing-footer"
import { LandingHeader } from "@/features/landing/components/landing-header"
import { LandingHero } from "@/features/landing/components/landing-hero"
import { LandingPlatform } from "@/features/landing/components/landing-platform"
import { LandingQuickstart } from "@/features/landing/components/landing-quickstart"
import { LandingRoadmap } from "@/features/landing/components/landing-roadmap"

export function LandingPage() {
	return (
		<div className="relative min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_42%)]" />
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--border)_60%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_60%,transparent)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(circle_at_center,black_42%,transparent_95%)]" />

			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16">
				<LandingHeader />
				<LandingHero />
				<LandingPlatform />
				<LandingArchitecture />
				<LandingQuickstart />
				<LandingRoadmap />
				<LandingCta />
				<LandingFooter />
			</div>
		</div>
	)
}
