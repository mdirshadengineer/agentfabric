import {
	IconBrandGithub,
	IconExternalLink,
	IconSparkles,
} from "@tabler/icons-react"
import { Separator } from "@/components/ui/separator"
import { footerExternalLinks, footerNavLinks } from "@/features/landing/content"

export function LandingFooter() {
	const year = new Date().getFullYear()

	return (
		<footer className="rounded-2xl border border-border/60 bg-card/50 px-5 py-6 sm:px-6">
			<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
				<div className="space-y-3">
					<a href="/" className="inline-flex items-center gap-2.5">
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<IconSparkles className="size-4" />
						</div>
						<span className="text-sm font-semibold text-foreground">
							AgentFabric
						</span>
					</a>
					<p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
						Built for teams shipping AI systems on a solid foundation — CLI,
						API, auth, and web control plane in one stack.
					</p>
				</div>

				<div className="grid grid-cols-2 gap-6 sm:gap-8">
					<div className="space-y-3">
						<p className="text-xs font-medium uppercase tracking-wide text-foreground">
							Explore
						</p>
						<ul className="space-y-2">
							{footerNavLinks.map((link) => (
								<li key={link.href}>
									<a
										href={link.href}
										className="text-sm text-muted-foreground transition hover:text-foreground"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>
					<div className="space-y-3">
						<p className="text-xs font-medium uppercase tracking-wide text-foreground">
							Resources
						</p>
						<ul className="space-y-2">
							{footerExternalLinks.map((link) => (
								<li key={link.href}>
									<a
										href={link.href}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
									>
										{link.label === "GitHub" ? (
											<IconBrandGithub
												className="size-3.5"
												aria-hidden="true"
											/>
										) : (
											<IconExternalLink
												className="size-3.5"
												aria-hidden="true"
											/>
										)}
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			<Separator className="my-6" />

			<div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
				<p>© {year} AgentFabric. All rights reserved.</p>
				<p>Licensed under Apache-2.0</p>
			</div>
		</footer>
	)
}
