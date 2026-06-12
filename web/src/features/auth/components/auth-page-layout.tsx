import {
	IconBrandGithub,
	IconBrandGoogle,
	IconSparkles,
} from "@tabler/icons-react"
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
			"bg-[radial-gradient(circle_at_15%_8%,rgba(20,184,166,0.2),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.2),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_52%,#f8fafc_100%)]",
		dark: "dark:bg-[radial-gradient(circle_at_15%_8%,rgba(20,184,166,0.18),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.14),transparent_40%),linear-gradient(180deg,#020617_0%,#0b1326_58%,#111827_100%)]",
		icon: "from-teal-500 to-cyan-500",
	},
	emerald: {
		light:
			"bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.2),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(6,182,212,0.18),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#f0fdfa_52%,#f8fafc_100%)]",
		dark: "dark:bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(6,182,212,0.14),transparent_42%),linear-gradient(180deg,#020617_0%,#0a1528_58%,#111827_100%)]",
		icon: "from-emerald-500 to-cyan-500",
	},
}

const badgeAccentMap: Record<string, string> = {
	teal: "bg-teal-500/12 text-teal-700 dark:text-teal-200",
	emerald: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
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
		<div
			className={`relative min-h-screen overflow-hidden ${g.light} ${g.dark} px-4 py-8 sm:px-6`}
		>
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[58px_58px] mask-[radial-gradient(circle_at_center,black_45%,transparent_95%)]" />
			<div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
				<header className="flex items-center justify-between rounded-3xl border border-white/40 bg-white/65 px-4 py-3 shadow-[0_18px_70px_-48px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-slate-900/55">
					<a href="/" className="flex items-center gap-2">
						<div
							className={`flex size-8 items-center justify-center rounded-lg bg-linear-to-br ${g.icon} text-white`}
						>
							<IconSparkles className="size-4" />
						</div>
						<span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							AgentFabric
						</span>
					</a>
					<a
						href={headerLinkHref}
						className="text-sm text-slate-700 underline-offset-4 transition hover:underline dark:text-slate-200"
					>
						{headerLinkText}
					</a>
				</header>

				<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
					<Card className="border-white/25 bg-white/72 py-0 shadow-[0_24px_90px_-55px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
						<CardHeader className="pt-6">
							<Badge className={`w-fit ${badgeAccentMap[badgeAccent]}`}>
								{badgeText}
							</Badge>
							<CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
								{title}
							</CardTitle>
							<CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
								{description}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pb-6">
							{children}

							<div className="space-y-2">
								<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
									OAuth coming soon
								</p>
								<div className="grid gap-2 sm:grid-cols-2">
									<Button
										type="button"
										variant="outline"
										disabled
										className="h-9 justify-start"
									>
										<IconBrandGoogle className="size-4" />
										Continue with Google
									</Button>
									<Button
										type="button"
										variant="outline"
										disabled
										className="h-9 justify-start"
									>
										<IconBrandGithub className="size-4" />
										Continue with GitHub
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-white/25 bg-slate-950 py-0 text-white shadow-[0_24px_90px_-55px_rgba(15,23,42,0.95)]">
						<CardHeader className="pt-6">
							<CardTitle className="text-2xl text-white">{infoTitle}</CardTitle>
							<CardDescription className="text-slate-300">
								{infoDescription}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 pb-6 text-sm leading-6 text-slate-200">
							{infoBullets.map((text, i) => (
								<p key={i}>
									{i + 1}. {text}
								</p>
							))}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
