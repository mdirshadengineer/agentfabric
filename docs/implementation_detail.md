# AgentFabric Implementation Detail

## Overview

AgentFabric is implemented as a pnpm/Turbo monorepo with two main packages:

- `packages/cli`: a publishable Node.js CLI package named `agentfabric` that starts and manages the AgentFabric runtime, hosts the Fastify API server, handles auth, database access, API keys, logging, metrics, and process supervision.
- `web`: a Vite + React application named `agentfabric-web` that provides the public landing page, authentication screens, workspace shell, cookie consent, client auth integration, and reusable UI components.

The current codebase is best described as an early platform foundation: the CLI/runtime/API/auth layers are functional and relatively substantial, while the workspace product experience and agent workflow execution are still placeholders or future-facing surfaces.

## Monorepo Tooling

The repository root defines shared package and task orchestration:

- Package manager: `pnpm`, enforced by the `preinstall` script with `only-allow pnpm`.
- Task runner: Turbo, with root scripts for `dev`, `build`, `test`, `lint`, `format`, `typecheck`, and `clean`.
- Formatting/linting: Biome.
- Language/runtime: TypeScript and Node.js `>=24`.
- Versioning and publishing: Changesets.

The root package is private and describes AgentFabric as a framework for building, deploying, and managing AI agents.

## CLI Package

The CLI package exports a binary under both `agentfabric` and `afabric`.

### Command Discovery

Command dispatch is implemented in `packages/cli/src/command-discovery.ts`.

Implemented behavior:

- Reads the command from `process.argv[2]`.
- Defaults to the global default command, currently `start`.
- Supports global help via `--help` or `-h`.
- Looks up commands through a command catalog.
- Parses command arguments and flags.
- Validates command flags when a command supplies a parser.
- Resolves command classes through `tsyringe`.
- Executes commands through a shared lifecycle abstraction.

### Command Catalog

The command catalog currently registers:

- `start`
- `status`
- `stop`

Aliases are supported by the catalog infrastructure, though the current command metadata does not define aliases.

### Command Context Parsing

The command parser supports:

- Positional args.
- Long flags such as `--json`.
- Inline flag values such as `--id=default`.
- Separated flag values such as `--id default`.
- Boolean coercion for `true` and `false`.
- Numeric coercion for numeric-looking values.
- `--` to stop flag parsing.

### Command Lifecycle

All commands can extend `CommandLifecycle`, which provides:

- `onInit`
- `onBeforeExecute`
- `run`
- `onAfterExecute`
- `onError`
- `onFinally`

This creates a consistent lifecycle for command initialization, execution, error handling, and cleanup.

### Start Command

`agentfabric start` starts the runtime in the foreground.

Implemented behavior:

- Starts the shared runtime.
- Logs successful startup.
- Handles `SIGINT` and `SIGTERM`.
- Stops the runtime during shutdown.
- Handles `uncaughtException` and `unhandledRejection`.
- Keeps the foreground process alive until shutdown is signaled.

`agentfabric start --detach` starts the process in detached background mode.

Detached behavior:

- Spawns the current Node executable.
- Removes the `--detach` flag to prevent recursive detaching.
- Runs the child detached with ignored stdio.
- Stores a process record in the local process store.
- Prints the detached process PID.

### Status Command

`agentfabric status` lists currently tracked detached processes.

Implemented behavior:

- Reads tracked processes from the process store.
- Self-heals by removing stale process records whose PIDs are no longer alive.
- Prints a human-readable process list with PID and uptime.
- Supports `--json` for raw JSON output.

### Stop Command

`agentfabric stop` stops a tracked process.

Implemented behavior:

- Defaults to process id `default`.
- Supports `--id <id>`.
- Supports `--force`.
- Gracefully stops processes with `SIGTERM` where available.
- Escalates to `SIGKILL` after a timeout.
- Handles already-exited processes.
- Cleans the process record from the local store.

## Process Management

Detached process management is implemented with:

- `ProcessManager`
- `ProcessStore`
- `ProcessRecord`

Process records are stored in:

```text
~/.agentfabric/processes.json
```

The store implementation:

- Creates `~/.agentfabric` with owner-only permissions.
- Writes process state through a temporary file and atomic rename.
- Applies owner-only permissions to the final JSON file.
- Replaces existing records for the same id.
- Removes stale records during process listing.

The manager includes platform-aware signal handling for Windows and POSIX platforms.

## Runtime

The runtime is implemented in `AgentFabricRuntime`.

Implemented behavior:

- Maintains a list of registered services.
- Starts services sequentially.
- Tracks successfully started services.
- If startup fails, stops already-started services in reverse order.
- Preserves startup and cleanup errors using `cause`.
- Stops services in reverse registration order.
- Aggregates stop failures into an `AggregateError`.

Currently registered service:

- Fastify API server.

Future runtime comments mention possible scheduler and worker services, but those are not implemented yet.

## API Server

The API server is implemented with Fastify.

Implemented behavior:

- Runs on port `5678` by default.
- Accepts `PORT` from the environment.
- Validates that `PORT` is an integer between 1 and 65535.
- Binds to `0.0.0.0`.
- Enables proxy trust for `X-Forwarded-*` headers.
- Enforces a default 1 MiB request body limit.
- Loads plugins, hooks, and routes with `@fastify/autoload`.
- Exposes `/health`.
- Exposes `/metrics` through the metrics plugin.
- Handles graceful shutdown for `SIGINT` and `SIGTERM`.

### Frontend Serving

In development:

- Non-API routes are proxied to the Vite dev server at `http://localhost:5173`.

In production:

- If frontend serving is enabled, the server serves the built SPA from `dist/ui`.
- Unknown non-API routes fall back to `index.html`.
- Unknown API routes return a JSON 404.

Frontend serving can be toggled with `AGENTFABRIC_FRONTEND_ENABLED`.

## Fastify Plugins and Hooks

### Database Plugin

The database plugin decorates Fastify with `db` and closes the Postgres connection pool on server shutdown.

### Auth Plugin

The auth plugin decorates Fastify with the Better Auth instance.

### Rate Limit Plugin

Rate limiting is enabled with `@fastify/rate-limit` for `/api` routes only.

Scoped paths:

- `/api/*` — rate limited (default and per-route overrides).
- All other paths — exempt (`/health`, `/metrics`, SPA assets, static files, Vite dev proxy).

Defaults for `/api` routes:

- `RATE_LIMIT_MAX` or `100`.
- `RATE_LIMIT_WINDOW` or `1 minute`.
- Keyed by request IP.

Non-API traffic is excluded via an `allowList` path filter. Routes under `/api` can override limits through route config.

### Logging Plugin

The logging plugin persists HTTP request and error logs to Postgres.

Implemented behavior:

- Records request start time.
- Persists completed requests to the `server_log` table.
- Persists route errors with error metadata and stack traces when available.
- Includes method, path, status code, duration, IP address, user agent, request id, and user id when available.
- Classifies status codes as `info`, `warn`, or `error`.
- Increments Prometheus log counters after successful persistence.

### Metrics Plugin

The metrics plugin uses `prom-client`.

Implemented metrics:

- Default Node.js metrics under the `agentfabric_nodejs_` prefix.
- `agentfabric_http_requests_total`.
- `agentfabric_http_request_duration_seconds`.
- `agentfabric_log_entries_total`.

The `/metrics` endpoint returns Prometheus-formatted metrics.

### Authentication Hooks

Implemented Fastify decorators:

- `authenticate`: validates a Better Auth session, rejects unauthenticated requests, rejects currently banned users, clears expired bans, and populates `request.user` and `request.session`.
- `rejectAuthenticated`: probes for an existing session and short-circuits with a success response when a user is already authenticated.
- `authenticateApiKey`: validates bearer API keys through Better Auth, infers API key config from `pk_` or `sk_`, and populates `request.apiKey`.

## Authentication and Authorization

Authentication is based on Better Auth with the Drizzle adapter.

Implemented auth features:

- Email/password authentication enabled.
- Email verification not required.
- Admin plugin enabled.
- Default role is `user`.
- Admin role is `admin`.
- API key plugin enabled with public and secret key configurations.

API key configurations:

- `public`: prefix `pk_`, 100 requests per hour.
- `secret`: prefix `sk_`, metadata enabled, 1000 requests per hour.

Required environment variables:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_BASE_URL`

## Session Governance

The backend implements session governance around email sign-in requests.

Supported policy modes:

- `keep-latest`
- `block-new-login`
- `max-sessions`

Defaults:

- Mode: `max-sessions`
- Max sessions: `5`
- Max sessions per device: `2`
- Max sessions per IP: `5`

Environment variables:

- `AGENTFABRIC_AUTH_SESSION_POLICY_MODE`
- `AGENTFABRIC_AUTH_MAX_SESSIONS`
- `AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE`
- `AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP`

Implemented behavior:

- Detects email sign-in paths.
- Extracts email from the request body.
- Extracts device id from the `x-device-id` header or legacy `deviceId` body field.
- Normalizes and validates device ids.
- Tracks session counts globally, by device id, and by IP address.
- In `block-new-login` mode, rejects sign-in when configured limits are reached.
- In pruning modes, allows successful sign-in and then prunes older sessions by device, IP, and global session count.
- Tags the newest session with the resolved device id.

## Database Layer

Database access uses:

- `postgres`
- `drizzle-orm`
- Drizzle schema definitions in `packages/cli/src/schema.ts`
- Drizzle migrations under `packages/cli/migrations`

Connection behavior:

- Requires `DATABASE_URL`.
- Disables named prepared statements for PgBouncer transaction-mode compatibility.
- Supports configurable idle timeout, connect timeout, and pool size.
- Enables SSL by default in production unless `DB_SSL` overrides it.
- Allows manual testing to default SSL off with `IS_MANUAL_TESTING=true`.

Configurable database environment variables:

- `DB_IDLE_TIMEOUT`
- `DB_CONNECT_TIMEOUT`
- `DB_POOL_SIZE`
- `DB_SSL`

### Schema

Implemented tables:

- `user`: Better Auth user fields plus role and ban metadata.
- `session`: Better Auth sessions plus `device_id` and impersonation metadata.
- `account`: Better Auth account/provider credentials.
- `verification`: Better Auth verification tokens.
- `apikey`: Better Auth API key storage.
- `role_definition`: custom role registry.
- `role_permission`: permissions attached to custom roles.
- `server_log`: persisted HTTP request and error logs.

Defined permissions:

- `manage_users`
- `view_audit`
- `manage_roles`
- `manage_api_keys`

## API Routes

### Health

`GET /health`

Returns:

- `status: "ok"`
- process uptime

### Metrics

`GET /metrics`

Returns Prometheus metrics.

### Auth Proxy

`/api/v1/auth/*`

Implemented behavior:

- Proxies GET and POST auth requests to Better Auth.
- Applies a tighter auth route rate limit.
- Injects forwarded IP and normalized device id into auth requests.
- Handles session governance around email sign-in.
- Includes a compatibility endpoint for API key verification at paths ending in `/api-key/verify`.

### Management API

Base path:

```text
/api/v1/management
```

Implemented endpoints:

- `GET /me`: returns authenticated user/session and impersonation status.
- `POST /bootstrap-admin`: promotes the current user to admin if no admin exists, or allows an existing admin to promote themselves again.
- `GET /roles`: lists registered roles and their permissions for authenticated users.
- `POST /roles`: admin-only role creation.
- `PATCH /roles/:roleId`: admin-only role update, including optional permission replacement and optional replacement of the role name in existing users.
- `GET /users`: admin-only user listing.
- `PATCH /users/:userId/role`: admin-only user role assignment.

### Example API

`GET /api/v1/example/me`

Protected by session authentication and returns the current request user/session.

### Table API

`GET /api/v1/table?name=session`

Implemented behavior:

- Protected by bearer API key authentication.
- Only supports the `session` table.
- Restricts rows to the API key's `referenceId`, interpreted as the user id.
- Supports `limit` and `offset`.
- Caps limit at `100`.
- Masks IP addresses.
- Truncates long user agents.
- Returns pagination metadata.

## Web Application

The web app is a Vite + React application.

Core libraries:

- React 19.
- TanStack Router.
- TanStack Query.
- TanStack Devtools.
- Tailwind CSS 4.
- shadcn-style UI components.
- Base UI and Radix primitives.
- Tabler icons.
- Better Auth client with admin and API key plugins.

### Application Providers

The root provider composition includes:

- Theme provider.
- shadcn provider.
- TanStack Query provider.
- TanStack Router provider.
- TanStack Devtools provider.

The TanStack Query provider and TanStack Router share a single `QueryClient` instance from `web/src/lib/api/query-client.ts`, so route `beforeLoad` preloads and component hooks read from the same cache.

In development or test mode, the app also initializes `react-scan` and imports `react-grab`.

### Data Fetching with TanStack Query

TanStack Query v5 is the standard data-fetching layer for the web app. Queries and mutations are organized by feature under `web/src/features/*/queries/`, with shared infrastructure under `web/src/lib/api/`.

#### Shared infrastructure

| File | Purpose |
|------|---------|
| `web/src/lib/env.ts` | `apiBaseURL` from `VITE_API_BASE_URL` (fallback `http://localhost:5678`) |
| `web/src/lib/api/query-client.ts` | Shared `QueryClient` with defaults (`staleTime: 30s`, query `retry: 1`, mutation `retry: 0`) |
| `web/src/lib/api/query-keys.ts` | Hierarchical query key factory for cache invalidation |
| `web/src/lib/api/management-client.ts` | Cookie-session `fetch` helper for `/api/v1/management` |
| `web/src/lib/api/types.ts` | Shared response types (`MeResponse`, `RoleDefinition`, `UserRecord`, `WorkspaceSummary`) |

#### Query modules

| Module | Exports | Data source |
|--------|---------|-------------|
| `features/auth/queries/session.ts` | `sessionQueryOptions`, `useSession`, `fetchSession` | Better Auth `authClient.getSession()` |
| `features/auth/queries/mutations.ts` | `useSignIn`, `useSignUp`, `useSignOut` | Better Auth sign-in, sign-up, and sign-out |
| `features/management/queries/me.ts` | `meQueryOptions`, `useMe`, `fetchMe` | `GET /api/v1/management/me` |
| `features/workspace/queries/workspaces.ts` | `workspacesQueryOptions`, `useWorkspaces` | Temporary mock list (no backend endpoint yet) |

#### Cache keys

- `["auth", "session"]` — current Better Auth session.
- `["management", "me"]` — authenticated user, session, and impersonation flag from the management API.
- `["workspaces", "list"]` — workspace list (mock until a real endpoint exists).

#### Router integration

- `/_auth` `beforeLoad` calls `ensureQueryData(sessionQueryOptions)` and redirects unauthenticated users to `/signin` with a `redirect` search param.
- `/_auth/workspace` `beforeLoad` preloads `meQueryOptions` and `workspacesQueryOptions` in parallel to avoid render waterfalls in the workspace shell.

Auth mutations invalidate `auth.session` and `management.me` on success. `useSignOut` removes both caches on success.

Test routes such as `test-impersonate-user` import `requestManagement` from the shared management client instead of defining their own fetch helper.

### Routing

Implemented route areas:

- `/`: public landing page.
- `/signin`: email/password sign-in page.
- `/signup`: email/password sign-up page.
- `/_auth`: authenticated route layout shell with session guard (`beforeLoad`).
- `/_auth/workspace`: workspace layout shell with `me` and workspace list preloaded.
- `/_auth/workspace/`: placeholder workspace index.
- `/_auth/workspace/$workspaceId/`: placeholder workspace detail route.

There are also several test/demo routes for alert banners, API playground behavior, analytics, table API key integration, and impersonation.

### Landing Page

The public landing page is a polished product marketing page for AgentFabric.

It includes:

- Sticky header.
- Feature pillars.
- Build/workflow steps.
- Architecture overview.
- Calls to action for sign-up, sign-in, and GitHub.
- Themed visual styling with cards, badges, gradients, and icons.

The content describes the intended product direction: AI automation workflows, secure runtime infrastructure, developer-first control surfaces, and team collaboration.

### Sign In and Sign Up

The sign-in page:

- Accepts email and password.
- Submits via the `useSignIn` TanStack Query mutation (wraps `authClient.signIn.email`).
- Invalidates session and management caches on success, then navigates to `/workspace`.
- Surfaces mutation errors in the UI (`isPending`, `error`).
- Includes disabled Google and GitHub OAuth buttons for future integration.

The sign-up page:

- Accepts full name, email, and password.
- Submits via the `useSignUp` TanStack Query mutation (wraps `authClient.signUp.email`).
- Invalidates session and management caches on success, then navigates to `/workspace`.
- Surfaces mutation errors in the UI (`isPending`, `error`).
- Includes disabled Google and GitHub OAuth buttons for future integration.

### Auth Client

The web auth client:

- Uses Better Auth client.
- Points at `apiBaseURL` from `web/src/lib/env.ts` (overridable via `VITE_API_BASE_URL`, default `http://localhost:5678`).
- Uses base path `/api/v1/auth`.
- Enables admin and API key client plugins.
- Uses a custom fetch implementation that injects `x-device-id` into auth requests.
- Exposes a `signOut` helper that signs out and clears the stored device id.
- Exports `authBaseURL` as an alias of `apiBaseURL` for routes and test pages that build absolute API URLs.

### Device ID Management

The web app implements a device id manager for session governance.

Implemented behavior:

- Stores device id in `localStorage` under `agentfabric-device-id`.
- Generates UUIDv4-like values.
- Reuses valid existing ids.
- Provides `getOrCreateDeviceId`, `getDeviceId`, and `clearDeviceId`.
- Falls back to generating an id if `localStorage` is unavailable.

The custom auth fetch wrapper adds `x-device-id` only for absolute or relative auth requests.

### Cookie Consent and Analytics

The app includes a GDPR-oriented cookie popup.

Implemented behavior:

- Consent categories: essential, functional, analytics, marketing.
- Essential cookies are always required.
- Stores a structured consent record in `localStorage`.
- Supports accept all, reject non-essential, and save preferences.
- Emits consent metrics such as popup viewed, details opened/closed, consent saved, and consent withdrawn.
- Can show a persistent privacy settings button.

Analytics integration:

- Applies stored consent on app startup.
- Keeps Google Analytics disabled until analytics consent is granted.
- Boots Google Analytics and Microsoft Clarity when consent allows analytics.
- Updates/denies analytics consent when preferences change.

Default analytics IDs exist in code but can be overridden with:

- `VITE_GA_MEASUREMENT_ID`
- `VITE_CLARITY_PROJECT_ID`

Web API configuration:

- `VITE_API_BASE_URL` — backend origin for auth and management requests (default `http://localhost:5678`).

### Workspace Area

The workspace shell is present but not fully implemented.

Implemented pieces:

- `WorkspaceLayout` using a full-screen flex structure.
- Placeholder regions for alert banners, mobile header, desktop header, and sidebar.
- `ResizablePanelGroup` around workspace children.
- Placeholder workspace index route.
- Placeholder workspace id route.
- `useWorkspaces` TanStack Query hook backed by a temporary mock `queryFn` (two sample workspaces).
- `useWorkspaceList` thin wrapper over `useWorkspaces` that returns the workspace array.
- `useSelectedWorkspace` reads `workspaceId` from route params only (no server-side validation yet).
- `useMe` available for workspace shell profile and impersonation context once header UI is wired.

## UI Component System

The web app includes a broad local component library under `web/src/components/ui`.

Implemented components include:

- Buttons, button groups, badges, cards, inputs, labels, textareas.
- Dialogs, drawers, sheets, popovers, hover cards, tooltips.
- Selects, comboboxes, checkboxes, switches, sliders, radio groups, toggles.
- Tabs, accordions, navigation menus, breadcrumbs, pagination.
- Tables, charts, calendars, carousels.
- Sidebar, resizable panels, scroll areas, separators.
- Alerts, alert dialogs, system banners, skeletons, spinners, empty states, status indicators.

There are also feature components:

- Cookie popup.
- Alert banner stack and provider.
- Theme provider.

## Build and Packaging Flow

The CLI package build flow composes the full product artifact:

1. Builds the web app with `pnpm --filter agentfabric-web ui-build`.
2. Compiles the CLI TypeScript project.
3. Copies the built web output into `packages/cli/dist/ui`.

This lets the production CLI server host the compiled SPA from the same package.

The CLI package publishes:

- `dist`
- `bin`
- `README.md`
- `CHANGELOG.md`
- `package.json`

## Existing Documentation

Existing documentation includes:

- Root `README.md`, currently only a title.
- `docs/DEVICE_ID_INTEGRATION.md`, which explains the client-side device id and session governance integration.
- Package README/changelog files for CLI and web packages.

## Current Gaps and Placeholders

The following areas are not fully implemented yet:

- No actual agent workflow engine is present beyond the runtime service container.
- Scheduler and worker services are mentioned as future runtime services but are not implemented.
- Workspace UI is mostly a shell with placeholder routes.
- No backend workspace list or detail API exists; `useWorkspaces` still uses a mock `queryFn`.
- Workspace shell header profile, sidebar, and workspace switcher are not wired to query data yet.
- Admin management queries (`roles`, `users`, bootstrap-admin) are only used in test routes, not production UI.
- OAuth buttons are present but disabled.
- The root README does not yet describe setup, development, environment variables, or architecture.
- There are root test scripts, but no test files were found in the scanned source tree.

## High-Level Data Flow

Typical local runtime flow:

1. User runs `agentfabric start`.
2. CLI command discovery resolves the `start` command.
3. The runtime starts the Fastify API server.
4. In development, Fastify proxies non-API routes to Vite.
5. The React app loads with a shared TanStack Query cache and TanStack Router context.
6. Visiting a protected route triggers `beforeLoad` session preload; unauthenticated users are redirected to `/signin`.
7. The React app calls Better Auth endpoints under `/api/v1/auth` (session queries and auth mutations).
8. The auth fetch interceptor injects `x-device-id`.
9. Authenticated workspace routes preload `GET /api/v1/management/me` and the workspace list query.
10. The backend proxies auth requests to Better Auth.
11. Session governance enforces or prunes sessions.
12. Auth, API key, management, table, logging, and metrics data are persisted in Postgres.

## Summary

AgentFabric currently implements a strong foundation for a unified CLI, API server, authentication layer, session governance system, API key access, operational logging, metrics, database schema, and React web shell with TanStack Query–based data fetching, route-level auth guards, and management API preloading. The codebase is ready for the next layer of product implementation: real workspace APIs and UI wiring, agent/workflow orchestration, OAuth providers, richer admin screens, and production-ready documentation.
