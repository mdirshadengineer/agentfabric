# CLI Package Architecture

Internal layout and conventions for `packages/cli/`. See [README.md](./README.md) for user-facing docs.

## Entry Flow

```
bin/agentfabric
  → Node/bootstrap checks
  → import dist/index.js
  → runBootstrapPreflight()   (only when command is start / default)
  → CommandDiscovery.discover()
  → command class execute()
```

**Dev shortcut:** `pnpm dev` runs `src/dev/main.ts`, which starts the API server directly and bypasses CLI commands, bootstrap preflight, and the process manager.

## Bootstrap Paths

Three related flows share doctor preflight checks and migration utilities. Do not change one without verifying the others.

| Entry | Checks | Migrations |
|-------|--------|------------|
| `agentfabric doctor` | Full (env, DB, schema, artifacts) | Report only, never apply |
| `agentfabric init` | Preflight subset via `runSetup({ mode: "auto" })` | Auto-apply |
| `agentfabric start` | Preflight subset in bin via `runSetup({ mode: "confirm" })` | Interactive confirm, then apply |

Shared orchestration lives in [`src/init/run-setup.ts`](src/init/run-setup.ts). Migration status and apply logic live in [`src/init/apply-migrations.ts`](src/init/apply-migrations.ts).

## Module Ownership

| Module | Owns |
|--------|------|
| `commands/` | CLI command classes, flag parsing, user output |
| `commands/_shared/` | Cross-command helpers (e.g. `--dotenv` guard) |
| `doctor/` | Diagnostic checks, reports, DB probes, migration journal |
| `init/` | First-time setup and migration apply |
| `preflight/` | Start-time bootstrap gate (runs from bin before dispatch) |
| `runtime/` | Service container (API server today) |
| `process/` | Detached process store and lifecycle |
| `server/` | Fastify API, plugins, routes, hooks |
| `db/` | Production Postgres pool and shared client builder |
| `lib/` | Auth, logging, metrics helpers |
| `schema.ts` | Drizzle schema and `EXPECTED_TABLES` |

## Dependency Rules

```
commands/     → doctor/, init/, preflight/, runtime/, process/
preflight/    → doctor/, init/
init/         → doctor/ (preflight checks), preflight/ (confirm prompt)
doctor/       → init/apply-migrations (migration status only; exception)
runtime/      → server/, db/, lib/
server/       → db/, lib/, schema
```

`doctor/checks/database.ts` imports `getPendingMigrations()` from `init/apply-migrations.ts` so migration pending state has a single source of truth.

## Adding a Command

1. Create `src/commands/<name>.ts` with flags, metadata, `@Command` class, and `*CommandDefinition`.
2. Register the definition in [`src/command-catalog.ts`](src/command-catalog.ts).
3. Add domain logic in a feature folder if the command class grows beyond wiring.

## Key Shared Utilities

| File | Purpose |
|------|---------|
| `commands/_shared/load-dotenv-if-allowed.ts` | `--dotenv` production guard |
| `doctor/format-migration-count.ts` | `"1 migration"` / `"N migrations"` labels |
| `doctor/exit-with-report.ts` | Exit-code policy and stderr report rendering |
| `db/create-postgres-client.ts` | Shared Postgres client config (probe vs production) |

## Build Notes

- `sync-migration-journal` copies `migrations/meta/_journal.json` to `dist/doctor/migration-journal.json` for packaged doctor checks.
- Web UI is synced into `dist/ui/` after compile.

## Follow-ups (out of scope)

- Move migration utilities out of `doctor/` into a dedicated `migrations/` module
- Move bootstrap preflight into the `start` command lifecycle
- Add tests for command parsing, migration journal, and process store
