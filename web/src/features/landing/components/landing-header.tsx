import { IconMenu2 } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { LandingNavMenu } from "@/features/landing/components/landing-nav-menu"
import { navMenuGroups } from "@/features/landing/content"

export function LandingHeader() {
	const [mobileOpen, setMobileOpen] = useState(false)

	return (
		<div className="sticky top-0 z-50 -mx-4 px-4 pt-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
			<header className="flex items-center gap-4 overflow-visible rounded-2xl border border-border/60 bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 md:px-5">
				<a href="/" className="flex shrink-0 items-center gap-3">
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
				</a>

				<div className="flex max-lg:hidden flex-1 justify-center overflow-visible">
					<LandingNavMenu />
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="hidden sm:inline-flex"
					>
						<Link to="/signin">Sign in</Link>
					</Button>
					<Button asChild size="sm" className="hidden sm:inline-flex">
						<Link to="/signup">Get started</Link>
					</Button>

					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="icon-sm"
								className="lg:hidden"
								aria-label="Open navigation menu"
							>
								<IconMenu2 className="size-4" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-full max-w-sm">
							<SheetHeader>
								<SheetTitle>Menu</SheetTitle>
							</SheetHeader>
							<nav className="mt-6 flex flex-col gap-6">
								{navMenuGroups.map((group) => (
									<div key={group.label} className="space-y-2">
										{group.href ? (
											<a
												href={group.href}
												onClick={() => setMobileOpen(false)}
												className="flex items-center gap-2 text-sm font-semibold text-foreground"
											>
												<group.icon className="size-4 text-muted-foreground" />
												{group.label}
											</a>
										) : (
											<p className="flex items-center gap-2 text-sm font-semibold text-foreground">
												<group.icon className="size-4 text-muted-foreground" />
												{group.label}
											</p>
										)}
										<ul className="space-y-1 border-l border-border pl-3">
											{group.items.map((item) => (
												<li key={item.title}>
													<a
														href={item.href}
														target={item.external ? "_blank" : undefined}
														rel={item.external ? "noreferrer" : undefined}
														onClick={() => setMobileOpen(false)}
														className="flex items-center gap-2 rounded-md py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
													>
														<item.icon className="size-3.5 shrink-0" />
														{item.title}
													</a>
												</li>
											))}
										</ul>
									</div>
								))}

								<div className="space-y-2 border-t border-border pt-4">
									<p className="text-sm font-semibold text-foreground">
										Account
									</p>
									<div className="flex flex-col gap-2">
										<Button asChild variant="outline" size="sm">
											<Link to="/signin" onClick={() => setMobileOpen(false)}>
												Sign in
											</Link>
										</Button>
										<Button asChild size="sm">
											<Link to="/signup" onClick={() => setMobileOpen(false)}>
												Get started
											</Link>
										</Button>
									</div>
								</div>
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</header>
		</div>
	)
}
