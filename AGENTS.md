# Memory

## Project Overview

AgentFabric is a pnpm workspace monorepo with Turborepo for building, deploying, and managing AI agents. It has two packages:

- **`packages/cli`** — publishable CLI (`agentfabric` / `afabric`) with Fastify API server, Better Auth, PostgreSQL/Drizzle, process management, logging, and metrics.
- **`web`** — Vite + React 19 SPA (TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS 4) with landing page, auth screens, and workspace shell.

See README.md for the full overview, tech stack, environment variables, and development commands.

## What's Implemented (Current State)

### CLI & Runtime
- Command dispatch with lifecycle hooks: `start` (foreground and `--detach`), `status`, `stop`, `doctor`, `init` (alias `initialize`)
- `init` — first-time setup: doctor preflight (mandatory env + DB connectivity) then apply Drizzle migrations
- `doctor` — preflight checks for env vars, PostgreSQL, migrations, schema tables, and build artifacts; human or JSON report
- Detached process store at `~/.agentfabric/processes.json` with atomic writes
- Runtime service container: starts services sequentially, stops in reverse on failure
- Only registered runtime service: Fastify API server

### API Server (Fastify, port 5678)
- Plugins: database (Postgres pool), auth (Better Auth), rate-limit (`/api/*` only), logging (Fastify/Pino to stdout + Prometheus log counters), metrics (Prometheus via prom-client)
- Frontend serving: Vite proxy in dev (`localhost:5173`), static SPA from `dist/ui` in production
- Graceful shutdown on SIGINT/SIGTERM

### Auth (Better Auth + Drizzle Adapter)
- Email/password with optional email verification (currently disabled)
- Admin plugin: roles `admin`/`user`, ban support, impersonation
- API Key plugin: dual config — `public` (`pk_`, 100 req/h) and `secret` (`sk_`, 1000 req/h, metadata enabled)
- Authentication hooks: `authenticate` (session), `authenticateApiKey` (Bearer token), `rejectAuthenticated`
- Session governance: `keep-latest`, `block-new-login`, `max-sessions` modes with per-device, per-IP, and global caps
- API keys use `Authorization: Bearer` header (not Better Auth's default `x-api-key`)

### Database (PostgreSQL + Drizzle)
- Tables: `user`, `session`, `account`, `verification`, `apikey` (Better Auth) + `workspace`, `workspace_member`, `invitation` (app-level)
- Migrations in `packages/cli/migrations/` (6 migration files)
- Configurable pool: `DB_IDLE_TIMEOUT`, `DB_CONNECT_TIMEOUT`, `DB_POOL_SIZE`, `DB_SSL`
- Disabled named prepared statements for PgBouncer compatibility

### API Routes
| Route | Auth | Purpose |
|-------|------|---------|
| `GET /health` | None | Health check |
| `GET /metrics` | None | Prometheus metrics |
| `/api/v1/auth/*` | Rate-limited | Better Auth proxy |
| `GET /api/v1/management/me` | Session | Current user/session |
| `POST /api/v1/management/bootstrap-admin` | Session | Admin promotion |
| `GET/POST /api/v1/management/roles` | Session (+ admin for writes) | Role CRUD |
| `PATCH /api/v1/management/roles/:id` | Admin | Role updates |
| `GET /api/v1/management/users` | Admin | User listing |
| `PATCH /api/v1/management/users/:id/role` | Admin | User role assignment |
| `GET /api/v1/table?name=session` | API Key | Session data (scoped to key owner) |
| `GET /api/v1/example/me` | Session | Echo user/session |

### Web Application
- **Routing**: TanStack Router — `/` (landing), `/signin`, `/signup`, `/_auth` (session guard), `/_auth/workspace` (preloads me + workspaces), `/_auth/workspace/$workspaceId`
- **Data fetching**: TanStack Query v5 with shared `QueryClient` (staleTime 30s, retry 1)
  - Cache keys: `auth.session`, `management.me`, `workspaces.list`
  - `beforeLoad` guards: `/_auth` preloads session and redirects to `/signin`, `/_auth/workspace` preloads `me` and workspaces in parallel
- **Auth client**: Better Auth client with admin and API key plugins, custom `createAuthFetch` injecting `x-device-id`
- **Device ID**: UUID v4 stored in `localStorage` under `agentfabric-device-id`, sent via `x-device-id` header on auth requests
- **Cookie consent**: GDPR popup with essential/functional/analytics/marketing categories, Google Analytics + Microsoft Clarity integration
- **Component library**: 40+ shadcn/ui components in `web/src/components/ui/`
- **Feature directories**: `auth`, `workspace`, `management`, `advisor`, `feedback`, `global-search`, `workflow` (most are scaffolded, only auth/workspace/management have active queries)

### What's NOT Implemented Yet
- No agent workflow engine or scheduler services (runtime only has API server)
- Workspace UI is a shell with mock data (`useWorkspaces` uses a hardcoded `queryFn`)
- No backend workspace list/detail endpoints exist
- OAuth providers (Google, GitHub) have disabled UI buttons
- Admin management queries (`roles`, `users`, `bootstrap-admin`) only used in test routes, not production UI
- No test files found in the scanned source tree (root `test` script exists but unused)

## Code Style Guidelines
- Use descriptive variable names
- Follow existing patterns in the codebase
- Extract complex conditions into meaningful boolean variables
- TypeScript with strict mode, use `satisfies` operator where applicable
- Fastify routes use `@fastify/autoload` with `autoPrefix: "/api/v1"`
- TanStack Query queries organized by feature: `features/<feature>/queries/`
- DB queries through Drizzle ORM, schema in `packages/cli/src/schema.ts`
- Auth hooks decorate Fastify's `request` object (`request.user`, `request.session`, `request.apiKey`)
- CLI commands implement `CommandLifecycle` base class, registered in command catalog

## Architecture Notes
- Monorepo: root `package.json` is private, workspace configuration in `pnpm-workspace.yaml`
- Catalog-based dependency management in `pnpm-workspace.yaml` (shared versions for `better-auth`, `drizzle-orm`, `vitest`, `typescript`, etc.)
- Build flow: web app built first → CLI compiled → web output copied into `packages/cli/dist/ui`
- Production artifact is a single CLI package that hosts its own SPA
- Fastify server trusts proxy headers (`X-Forwarded-*`) for proper IP resolution
- Better Auth base path: `/api/v1/auth` (consistent across server, proxy, and client)

## Common Workflows
- `pnpm dev` — runs all packages in dev mode (CLI watch + Vite dev server)
- `pnpm build` — builds web first, then CLI, then syncs UI
- `pnpm --filter agentfabric db:push` — push Drizzle schema to PostgreSQL
- `pnpm --filter agentfabric db:generate` — generate migration from schema changes
- `pnpm changeset` — create a changeset for versioning
- Start the API server directly: `node packages/cli/bin/agentfabric start` (after build) or `pnpm --filter agentfabric dev` (development)
