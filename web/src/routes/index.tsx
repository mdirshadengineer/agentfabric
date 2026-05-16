import {
	IconArrowRight,
	IconBolt,
	IconBrandGithub,
	IconBuildingFactory2,
	IconCode,
	IconDeviceLaptop,
	IconLock,
	IconRocket,
	IconRoute,
	IconSparkles,
	IconTarget,
	IconUsers,
} from "@tabler/icons-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

const featurePillars = [
	{
		icon: IconRoute,
		title: "Orchestrate agent workflows",
		description:
			"Design multi-step automations with clear state, retries, and predictable outputs.",
	},
	{
		icon: IconBuildingFactory2,
		title: "Run infrastructure-ready",
		description:
			"Start locally, then scale to production with environment-aware runtime controls.",
	},
	{
		icon: IconLock,
		title: "Secure by default",
		description:
			"Use session-aware auth, scoped API keys, and auditable access paths across services.",
	},
	{
		icon: IconCode,
		title: "Developer-first surfaces",
		description:
			"Unify CLI, API, and UI so teams can ship from prompt to production without context switching.",
	},
]

const buildSteps = [
	{
		title: "Model your workflow",
		description:
			"Define agents, dependencies, and runtime edges in one composable system.",
	},
	{
		title: "Connect your tools",
		description:
			"Attach auth, data stores, and external APIs with predictable adapters.",
	},
	{
		title: "Deploy and iterate",
		description:
			"Observe runs, tune steps, and release updates with confidence.",
	},
]

const statCards = [
	{ value: "CLI + Web", label: "Unified control surface" },
	{ value: "Auth-ready", label: "Built-in identity primitives" },
	{ value: "Composable", label: "Modules across runtime layers" },
]

const workflowThemes = [
	"SaaS operations",
	"Support copilots",
	"Internal tooling",
	"Agentic ETL",
	"Developer automation",
	"Research workflows",
]

function RouteComponent() {
	return (
		<div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(20,184,166,0.24),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(249,115,22,0.18),transparent_35%),linear-gradient(180deg,#f7fafc_0%,#ecfeff_50%,#f8fafc_100%)] px-4 py-6 text-slate-900 dark:bg-[radial-gradient(circle_at_12%_8%,rgba(20,184,166,0.22),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(249,115,22,0.12),transparent_35%),linear-gradient(180deg,#020617_0%,#0b1326_55%,#111827_100%)] dark:text-slate-50 sm:px-6 lg:px-10">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(circle_at_center,black_42%,transparent_95%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)]" />
			<div className="pointer-events-none absolute -left-20 top-30 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
			<div className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-orange-300/20 blur-3xl" />
			<div className="pointer-events-none absolute inset-x-0 top-80 h-80 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.12),transparent_68%)]" />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
				<header className="animate-in fade-in slide-in-from-top-3 sticky top-3 z-10 flex items-center justify-between rounded-3xl border border-white/45 bg-white/60 px-4 py-3 shadow-[0_20px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur md:px-5 dark:border-white/10 dark:bg-slate-900/55">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-600/30">
							<IconSparkles className="size-4" />
						</div>
						<div>
							<p className="text-sm font-semibold tracking-wide">AgentFabric</p>
							<p className="text-xs text-slate-600 dark:text-slate-300">
								Build autonomous systems that stay understandable.
							</p>
						</div>
					</div>

					<div className="hidden items-center gap-2 md:flex">
						<a
							href="#features"
							className="rounded-lg px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
						>
							Features
						</a>
						<a
							href="#how-it-works"
							className="rounded-lg px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
						>
							How it works
						</a>
						<a
							href="#architecture"
							className="rounded-lg px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
						>
							Architecture
						</a>
					</div>
				</header>

				<section className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-slate-950 px-6 py-10 text-white shadow-[0_35px_120px_-45px_rgba(15,23,42,0.85)] sm:px-8 lg:px-10">
					<div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(20,184,166,0.28),transparent_40%,rgba(249,115,22,0.2)_75%,transparent)]" />
					<div className="absolute -right-20 top-8 h-48 w-48 rounded-full border border-white/15 bg-white/5 [animation:spin_18s_linear_infinite]" />
					<div className="absolute bottom-0 left-12 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />
					<div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
						<div className="animate-in fade-in slide-in-from-bottom-4 space-y-5 duration-700">
							<Badge className="bg-white/12 text-white hover:bg-white/20">
								Developer platform for AI automation
							</Badge>
							<h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
								From agent idea to production workflow in one continuous stack.
							</h1>
							<p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
								AgentFabric helps teams compose intelligent workflows, secure
								them, and ship faster with a connected CLI, runtime, and web
								control plane.
							</p>
							<div className="flex flex-wrap gap-3 pt-1">
								<Button
									asChild
									className="h-9 bg-white text-slate-900 hover:bg-white/90"
								>
									<Link to="/signup">Get started</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="h-9 border-white/40 bg-transparent text-white hover:bg-white/10"
								>
									<Link to="/signin">
										Sign in
										<IconArrowRight className="size-4" />
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="h-9 border-white/30 bg-black/10 text-white hover:bg-white/10"
								>
									<a
										href="https://github.com/mdirshadengineer/agentfabric"
										target="_blank"
										rel="noreferrer"
									>
										View GitHub
										<IconBrandGithub className="size-4" />
									</a>
								</Button>
							</div>
						</div>

						<div className="animate-in fade-in slide-in-from-bottom-6 grid gap-3 duration-1000">
							{statCards.map((stat) => (
								<div
									key={stat.label}
									className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
								>
									<p className="text-xl font-semibold tracking-tight">
										{stat.value}
									</p>
									<p className="text-sm text-slate-300">{stat.label}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="rounded-3xl border border-white/35 bg-white/68 px-4 py-4 shadow-[0_20px_80px_-52px_rgba(15,23,42,0.65)] backdrop-blur dark:border-white/10 dark:bg-slate-900/58">
					<div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
						<Badge
							variant="outline"
							className="border-teal-400/45 bg-teal-500/10 text-teal-700 dark:text-teal-200"
						>
							Built for
						</Badge>
						{workflowThemes.map((theme) => (
							<span
								key={theme}
								className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200"
							>
								{theme}
							</span>
						))}
					</div>
				</section>

				<section className="space-y-3 pt-1">
					<Badge
						variant="outline"
						className="border-orange-400/45 text-orange-700 dark:text-orange-200"
					>
						Product pillars
					</Badge>
					<div className="max-w-3xl space-y-2">
						<h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
							A clear brand system from orchestration to production.
						</h2>
						<p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
							Every capability in AgentFabric is designed to feel connected:
							same mental model, same security posture, and the same operator
							experience.
						</p>
					</div>
				</section>

				<section id="features" className="grid gap-4 md:grid-cols-2">
					{featurePillars.map((pillar) => (
						<Card
							key={pillar.title}
							className="group border-white/20 bg-gradient-to-b from-white/85 to-white/62 py-0 shadow-[0_22px_80px_-44px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_100px_-42px_rgba(15,23,42,0.55)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.58))]"
						>
							<CardHeader className="pt-4">
								<div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-orange-400/20 text-teal-700 dark:text-teal-200">
									<pillar.icon className="size-5" />
								</div>
								<CardTitle className="text-lg text-slate-900 dark:text-slate-50">
									{pillar.title}
								</CardTitle>
								<CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
									{pillar.description}
								</CardDescription>
								<div className="mt-2 text-xs font-medium text-teal-700 group-hover:text-teal-800 dark:text-teal-200 dark:group-hover:text-teal-100">
									Built on modular runtime components.
								</div>
							</CardHeader>
						</Card>
					))}
				</section>

				<section
					id="how-it-works"
					className="grid gap-6 rounded-[1.75rem] border border-white/30 bg-white/70 p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.75)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60 lg:grid-cols-[0.9fr_1.1fr]"
				>
					<div className="space-y-4">
						<Badge
							variant="outline"
							className="border-teal-400/40 text-teal-700 dark:text-teal-200"
						>
							How it works
						</Badge>
						<h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
							Three moves to operational automation.
						</h2>
						<p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
							AgentFabric keeps your automation stack explainable. Every layer
							is modular, so teams can ship quickly without introducing workflow
							debt.
						</p>
					</div>

					<div className="grid gap-3">
						{buildSteps.map((step, index) => (
							<div
								key={step.title}
								className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/55"
							>
								<p className="mb-2 text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-200">
									STEP 0{index + 1}
								</p>
								<p className="text-base font-medium text-slate-900 dark:text-slate-50">
									{step.title}
								</p>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									{step.description}
								</p>
							</div>
						))}
					</div>
				</section>

				<section
					id="architecture"
					className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
				>
					<Card className="border-white/20 bg-slate-950 py-0 text-white shadow-[0_30px_100px_-50px_rgba(15,23,42,0.9)]">
						<CardHeader className="pt-5">
							<CardTitle className="text-white">
								Runtime architecture at a glance
							</CardTitle>
							<CardDescription className="text-slate-300">
								A small core with focused modules gives you flexibility without
								losing operational clarity.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<pre className="overflow-auto rounded-xl border border-white/15 bg-slate-900 px-4 py-4 text-xs leading-6 text-slate-100">
								{`agentfabric/
  packages/cli        -> command lifecycle + process management
  web                 -> dashboard + workspace control plane
  auth + api server   -> identity, key issuance, verification
  runtime modules     -> orchestrated task execution`}
							</pre>
						</CardContent>
					</Card>

					<div className="grid gap-4">
						<Card className="border-white/20 bg-gradient-to-r from-cyan-500/85 to-teal-500/85 py-0 text-white dark:from-cyan-600/75 dark:to-teal-600/75">
							<CardHeader className="pt-4">
								<CardTitle className="flex items-center gap-2 text-white">
									<IconSparkles className="size-4" />
									Brand promise
								</CardTitle>
								<CardDescription className="text-cyan-50">
									Ship intelligent automation that teams can trust and
									understand.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-white/20 bg-white/78 py-0 dark:bg-slate-900/70">
							<CardHeader className="pt-4">
								<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
									<IconRocket className="size-4 text-orange-500" />
									Fast onboarding
								</CardTitle>
								<CardDescription>
									Start in minutes with opinionated defaults and room to extend.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-white/20 bg-white/78 py-0 dark:bg-slate-900/70">
							<CardHeader className="pt-4">
								<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
									<IconUsers className="size-4 text-teal-600" />
									Team collaboration
								</CardTitle>
								<CardDescription>
									Share workflows, credentials, and operational context across
									engineering and ops.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-white/20 bg-white/78 py-0 dark:bg-slate-900/70">
							<CardHeader className="pt-4">
								<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
									<IconTarget className="size-4 text-cyan-600" />
									Production confidence
								</CardTitle>
								<CardDescription>
									Observability hooks and policy controls keep workflows
									reliable.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</section>

				<section className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-8 text-white shadow-[0_35px_120px_-55px_rgba(8,145,178,0.9)] sm:px-8">
					<div className="absolute -right-8 -top-10 h-44 w-44 rounded-full border border-white/30 bg-white/10" />
					<div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
					<div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="max-w-2xl space-y-2">
							<p className="text-sm uppercase tracking-[0.2em] text-white/85">
								Build with intent
							</p>
							<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
								Design your next agent platform on AgentFabric.
							</h2>
							<p className="text-sm leading-6 text-cyan-50 sm:text-base">
								Ship your first workflow quickly, then evolve into a
								production-grade automation system.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								asChild
								className="h-9 bg-white text-cyan-700 hover:bg-cyan-50"
							>
								<Link to="/signup">Create account</Link>
							</Button>
							<Button
								asChild
								variant="secondary"
								className="h-9 bg-cyan-700/45 text-white hover:bg-cyan-700/55"
							>
								<Link to="/signin">
									Sign in
									<IconArrowRight className="size-4" />
								</Link>
							</Button>
						</div>
					</div>
				</section>

				<footer className="flex flex-col gap-2 pb-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-300">
					<p className="flex items-center gap-2">
						<IconDeviceLaptop className="size-3.5" />
						Built for teams shipping AI systems in the real world.
					</p>
					<p className="flex items-center gap-2">
						<IconBolt className="size-3.5" />
						AgentFabric by Md Irshad
					</p>
				</footer>
			</div>
		</div>
	)
}
