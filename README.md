# AgentFabric

A framework for building, deploying, and managing AI agents — built as a pnpm workspace monorepo with Turborepo task orchestration.

## Architecture

```
agentfabric/
├── packages/cli/      # Publishable CLI + Fastify API server (package: agentfabric)
├── web/               # Vite + React SPA (package: agentfabric-web)
└── docs/              # Implementation and integration documentation
```

- **CLI (`packages/cli`)**: Node.js CLI binary (`afabric` / `agentfabric`) that manages the runtime, hosts the Fastify API server, handles auth via Better Auth, connects to PostgreSQL via Drizzle ORM, and serves the production SPA.
- **Web (`web`)**: TanStack Router + React 19 SPA with shadcn/ui components, TanStack Query data fetching, and the Better Auth client. Provides the landing page, auth screens, and workspace shell.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Package manager | pnpm (enforced via `only-allow`) |
| Task orchestration | Turborepo |
| Language | TypeScript 6 |
| Runtime | Node.js >= 24 |
| Linting / formatting | Biome |
| Versioning | Changesets |
| API server | Fastify 5 |
| Auth | Better Auth (Drizzle adapter) |
| Database | PostgreSQL + Drizzle ORM |
| Frontend framework | React 19 + Vite |
| Routing | TanStack Router |
| Data fetching | TanStack Query v5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Metrics | prom-client |

## What's Implemented

### CLI & Runtime
- Command dispatch system (`start`, `status`, `stop`) with lifecycle hooks
- Detached process management with process store at `~/.agentfabric/processes.json`
- Graceful shutdown with `SIGINT`/`SIGTERM` handling
- Runtime service container with reverse-order startup/shutdown

### API Server (Fastify)
- Database plugin with PostgreSQL connection pooling
- Better Auth plugin with email/password, admin, and API key support
- Rate limiting on `/api/*` routes
- HTTP request/error logging to `server_log` table
- Prometheus metrics at `/metrics` (`agentfabric_http_requests_total`, `agentfabric_http_request_duration_seconds`, `agentfabric_log_entries_total`)
- Health endpoint at `/health`
- Frontend serving: Vite proxy in dev, static SPA in production

### Authentication & Authorization
- Email/password sign-in and sign-up via Better Auth
- Admin plugin with role-based access (`admin` / `user`)
- API key plugin with dual config: `public` (prefix `pk_`) and `secret` (prefix `sk_`)
- Three authentication hooks: `authenticate` (session), `authenticateApiKey` (bearer token), `rejectAuthenticated`
- Session governance with per-device, per-IP, and global session limits
- Ban system with automatic expiry clearance

### Database Schema
- Better Auth tables: `user`, `session`, `account`, `verification`, `apikey`
- Application tables: `role_definition`, `role_permission`, `server_log`
- Drizzle migrations under `packages/cli/migrations/`

### API Routes
| Route | Purpose |
|-------|---------|
| `GET /health` | Health check with uptime |
| `GET /metrics` | Prometheus metrics |
| `/api/v1/auth/*` | Better Auth proxy (rate-limited) |
| `/api/v1/management/me` | Current user/session info |
| `/api/v1/management/bootstrap-admin` | Admin bootstrap |
| `/api/v1/management/roles` | Role CRUD (admin) |
| `/api/v1/management/users` | User listing (admin) |
| `GET /api/v1/table?name=session` | API key-protected session data |

### Web Application
- Public landing page with marketing content
- Sign-in and sign-up pages with form validation and error handling
- `/_auth` route layout with session guard (redirects to `/signin`)
- `/_auth/workspace` layout shell with TanStack Query preloads
- TanStack Query integration: `auth.session`, `management.me`, `workspaces.list` cache keys
- Custom auth fetch interceptor injecting `x-device-id` for session governance
- Device ID manager with `localStorage` persistence (UUID v4)
- Cookie consent / GDPR popup with Google Analytics and Microsoft Clarity integration
- Comprehensive shadcn/ui component library (40+ components)
- Test/demo routes: alert banners, API playground, impersonation, analytics

## Environment Variables

### Server (packages/cli)
| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `BETTER_AUTH_SECRET` | Session/token signing secret | required |
| `BETTER_AUTH_BASE_URL` | Auth callback/base URL | required |
| `PORT` | API server port | `5678` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW` | Rate limit window | `1 minute` |
| `AGENTFABRIC_AUTH_SESSION_POLICY_MODE` | `keep-latest` / `block-new-login` / `max-sessions` | `max-sessions` |
| `AGENTFABRIC_AUTH_MAX_SESSIONS` | Global per-user session cap | `5` |
| `AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE` | Per-device session cap | `2` |
| `AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP` | Per-IP session cap | `5` |
| `AGENTFABRIC_FRONTEND_ENABLED` | Serve SPA from dist | `true` |
| `DB_SSL` | Force/disable SSL | auto |
| `DB_IDLE_TIMEOUT` | Postgres idle timeout | — |
| `DB_CONNECT_TIMEOUT` | Postgres connect timeout | — |
| `DB_POOL_SIZE` | Postgres pool size | — |

### Web (web/)
| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | API server origin | `http://localhost:5678` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID | — |
| `VITE_CLARITY_PROJECT_ID` | Microsoft Clarity ID | — |

## Development

```bash
# Install dependencies
pnpm install

# Start all packages in dev mode
pnpm dev

# Run lint, typecheck, and tests across all packages
pnpm lint
pnpm typecheck
pnpm test

# Build everything
pnpm build

# Database operations (from packages/cli)
pnpm --filter agentfabric db:push     # Push schema to DB
pnpm --filter agentfabric db:generate # Generate migrations
pnpm --filter agentfabric db:migrate  # Run migrations
pnpm --filter agentfabric db:studio   # Open Drizzle Studio

# Create a changeset
pnpm changeset
```

### Build Flow

The CLI build (`pnpm build` from `packages/cli`):
1. Builds the web app (`agentfabric-web ui-build`)
2. Compiles the CLI TypeScript
3. Copies the built web SPA into `packages/cli/dist/ui`

This lets the production CLI serve the full SPA from a single package.

## Documentation

- [`docs/implementation_detail.md`](docs/implementation_detail.md) — Full platform architecture
- [`docs/BETTER_AUTH_CONFIGURATION.md`](docs/BETTER_AUTH_CONFIGURATION.md) — Auth configuration audit
- [`docs/DEVICE_ID_INTEGRATION.md`](docs/DEVICE_ID_INTEGRATION.md) — Device-based session governance

## License

Apache-2.0
