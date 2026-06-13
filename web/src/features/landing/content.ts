import type { TablerIcon } from "@tabler/icons-react"
import {
	IconActivity,
	IconBook,
	IconBrandGithub,
	IconCode,
	IconCommand,
	IconDatabase,
	IconLayoutDashboard,
	IconLock,
	IconRocket,
	IconRoute,
	IconServer,
	IconStack2,
	IconTopologyStar,
} from "@tabler/icons-react"

export const GITHUB_REPO_URL = "https://github.com/mdirshadengineer/agentfabric"
export const README_URL = `${GITHUB_REPO_URL}#readme`

export const footerNavLinks = [
	{ label: "Platform", href: "#platform" },
	{ label: "Architecture", href: "#architecture" },
	{ label: "Quick start", href: "#quickstart" },
	{ label: "Roadmap", href: "#roadmap" },
] as const

export const footerExternalLinks = [
	{ label: "GitHub", href: GITHUB_REPO_URL },
	{ label: "Documentation", href: README_URL },
] as const

export type PlatformFeature = {
	icon: TablerIcon
	title: string
	description: string
	highlights: string[]
}

export type RoadmapItem = {
	icon: TablerIcon
	title: string
	description: string
	highlights: string[]
}

export type AtAGlanceItem = {
	label: string
	detail: string
}

export const heroAtAGlance: AtAGlanceItem[] = [
	{
		label: "agentfabric start",
		detail: "Detached process management with API on port 5678",
	},
	{
		label: "Better Auth",
		detail: "Sessions, admin roles, and pk_ / sk_ API keys",
	},
	{
		label: "Single deploy",
		detail: "CLI serves the built SPA from dist/ui",
	},
]

export const platformFeatures: PlatformFeature[] = [
	{
		icon: IconCommand,
		title: "CLI runtime",
		description:
			"Manage the runtime with detached process storage and graceful shutdown.",
		highlights: ["start · status · stop", "Detached processes"],
	},
	{
		icon: IconServer,
		title: "API server",
		description:
			"Autoloaded routes with rate limiting and reverse-order service lifecycle.",
		highlights: ["Fastify 5", "/api/* rate limits"],
	},
	{
		icon: IconLock,
		title: "Auth & access",
		description:
			"Email/password sign-in, admin roles, Bearer API keys, and device-aware sessions.",
		highlights: ["Better Auth", "pk_ / sk_ keys", "x-device-id"],
	},
	{
		icon: IconDatabase,
		title: "Database",
		description:
			"PostgreSQL persistence with versioned migrations and production pool tuning.",
		highlights: ["PostgreSQL", "Drizzle ORM", "PgBouncer-safe"],
	},
	{
		icon: IconActivity,
		title: "Observability",
		description:
			"Health checks, Prometheus metrics, and Fastify request logging to stdout.",
		highlights: ["/health", "/metrics", "Prometheus"],
	},
	{
		icon: IconLayoutDashboard,
		title: "Web dashboard",
		description:
			"Landing, auth flows, and workspace shell in a single React SPA.",
		highlights: ["React 19", "TanStack", "shadcn/ui"],
	},
]

export type ArchitectureLayer = {
	icon: TablerIcon
	title: string
	subtitle: string
	highlights: string[]
}

export type ArchitecturePackage = {
	icon: TablerIcon
	name: string
	description: string
	highlights: string[]
}

export const architectureLayers: ArchitectureLayer[] = [
	{
		icon: IconLayoutDashboard,
		title: "Browser",
		subtitle: "React SPA served in dev (Vite proxy) or production (dist/ui)",
		highlights: ["TanStack Router", "Better Auth client"],
	},
	{
		icon: IconServer,
		title: "Fastify API",
		subtitle: "Single HTTP entry point on port 5678",
		highlights: ["/api/v1/auth", "/metrics", "/health"],
	},
	{
		icon: IconDatabase,
		title: "PostgreSQL",
		subtitle: "Auth, sessions, API keys, and workspace data via Drizzle ORM",
		highlights: ["Migrations", "Connection pool"],
	},
]

export const architectureHost = {
	icon: IconCommand,
	title: "CLI runtime",
	subtitle: "agentfabric start",
	description:
		"Detached process manager that boots the API server and serves the built SPA from dist/ui.",
	highlights: ["start · status · stop", "Single production artifact"],
}

export const architecturePackages: ArchitecturePackage[] = [
	{
		icon: IconCommand,
		name: "packages/cli",
		description:
			"Publishable CLI binary (agentfabric / afabric) with Fastify, Better Auth, Drizzle, and process management.",
		highlights: ["Fastify 5", "Better Auth", "Drizzle"],
	},
	{
		icon: IconLayoutDashboard,
		name: "web",
		description:
			"Vite + React SPA — landing page, auth flows, and workspace control plane.",
		highlights: ["React 19", "TanStack Query", "shadcn/ui"],
	},
]

export type QuickstartPath = {
	id: string
	label: string
	description: string
	commands: string
}

export const quickstartPaths: QuickstartPath[] = [
	{
		id: "npm",
		label: "npm package",
		description:
			"Install the published CLI globally (or run via npx). Both agentfabric and afabric invoke the same binary.",
		commands: `# Install
pnpm add -g agentfabric
# or: npm install -g agentfabric
# or run without install: npx agentfabric <command>

# Required env (set before start)
export DATABASE_URL="postgresql://user:pass@localhost:5432/agentfabric"
export BETTER_AUTH_SECRET="your-secret"
export BETTER_AUTH_BASE_URL="http://localhost:5678"

# Start API + SPA (foreground)
agentfabric start
# shorthand: afabric start

# Optional flags
agentfabric start --detach    # run in background
agentfabric status            # optional: --json
agentfabric stop              # optional: --force, --id default`,
	},
	{
		id: "source",
		label: "From source",
		description:
			"Clone the monorepo. The agentfabric command is not on PATH — use the repo binary after building.",
		commands: `git clone ${GITHUB_REPO_URL}.git
cd agentfabric
pnpm install

# Required env (set before start)
export DATABASE_URL="postgresql://user:pass@localhost:5432/agentfabric"
export BETTER_AUTH_SECRET="your-secret"
export BETTER_AUTH_BASE_URL="http://localhost:5678"

# Development — CLI watch + Vite dev server
pnpm dev

# Production-style — build first, then run the repo binary
pnpm build
./packages/cli/bin/agentfabric start
./packages/cli/bin/agentfabric start --detach   # optional

# Database (from repo root)
pnpm --filter agentfabric db:migrate   # or db:push for prototyping

# Process management (same optional flags as npm install)
./packages/cli/bin/agentfabric status            # optional: --json
./packages/cli/bin/agentfabric stop              # optional: --force, --id default`,
	},
]

export const requiredEnvVars = [
	"DATABASE_URL",
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_BASE_URL",
]

export const roadmapItems: RoadmapItem[] = [
	{
		icon: IconRoute,
		title: "Agent workflow engine",
		description:
			"Multi-step agent orchestration with scheduling, retries, and runtime task execution.",
		highlights: ["Scheduling", "Retries", "Task runtime"],
	},
	{
		icon: IconLayoutDashboard,
		title: "Workspace API",
		description:
			"Backend endpoints for workspace list and detail, replacing the current mock data layer.",
		highlights: ["List & detail", "Real data layer", "Workspace UI"],
	},
	{
		icon: IconLock,
		title: "OAuth providers",
		description:
			"Google and GitHub sign-in — auth UI is already scaffolded on sign-in and sign-up pages.",
		highlights: ["Google", "GitHub", "Auth UI ready"],
	},
]

export type NavMenuLink = {
	icon: TablerIcon
	title: string
	href: string
	description: string
	external?: boolean
}

export type NavMenuGroup = {
	label: string
	icon: TablerIcon
	href?: string
	items: NavMenuLink[]
}

export const platformNavItems: NavMenuLink[] = [
	{
		icon: IconCommand,
		title: "CLI runtime",
		href: "#platform",
		description: "Start, stop, and monitor detached processes.",
	},
	{
		icon: IconServer,
		title: "API server",
		href: "#platform",
		description: "Fastify 5 with rate limiting and graceful shutdown.",
	},
	{
		icon: IconLock,
		title: "Auth & access",
		href: "#platform",
		description: "Sessions, admin roles, and Bearer API keys.",
	},
	{
		icon: IconDatabase,
		title: "Database",
		href: "#platform",
		description: "PostgreSQL with Drizzle ORM and migrations.",
	},
	{
		icon: IconActivity,
		title: "Observability",
		href: "#platform",
		description: "Health checks, Prometheus metrics, and Fastify logging.",
	},
	{
		icon: IconLayoutDashboard,
		title: "Web dashboard",
		href: "#platform",
		description: "React SPA with auth flows and workspace shell.",
	},
]

export const developerNavItems: NavMenuLink[] = [
	{
		icon: IconRocket,
		title: "Quick start",
		href: "#quickstart",
		description:
			"Install dependencies and run AgentFabric locally or in production.",
	},
	{
		icon: IconTopologyStar,
		title: "Architecture",
		href: "#architecture",
		description: "How the CLI, API server, database, and web SPA connect.",
	},
	{
		icon: IconBrandGithub,
		title: "GitHub",
		href: GITHUB_REPO_URL,
		description: "Source code, issues, and contribution guidelines.",
		external: true,
	},
	{
		icon: IconBook,
		title: "Documentation",
		href: README_URL,
		description: "Environment variables, API routes, and development commands.",
		external: true,
	},
]

export const roadmapNavItems: NavMenuLink[] = [
	{
		icon: IconRoute,
		title: "Agent workflow engine",
		href: "#roadmap",
		description: "Multi-step orchestration with scheduling and retries.",
	},
	{
		icon: IconLayoutDashboard,
		title: "Workspace API",
		href: "#roadmap",
		description: "Backend endpoints for workspace list and detail.",
	},
	{
		icon: IconLock,
		title: "OAuth providers",
		href: "#roadmap",
		description: "Google and GitHub sign-in integration.",
	},
]

export const navMenuGroups: NavMenuGroup[] = [
	{
		label: "Platform",
		icon: IconStack2,
		href: "#platform",
		items: platformNavItems,
	},
	{ label: "Developers", icon: IconCode, items: developerNavItems },
	{
		label: "Roadmap",
		icon: IconRoute,
		href: "#roadmap",
		items: roadmapNavItems,
	},
]
