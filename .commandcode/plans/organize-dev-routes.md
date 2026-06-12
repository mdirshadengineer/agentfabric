# Organize Test & Playground Routes Under `/dev`

## Summary

Move 5 flat test routes into a `_dev` pathless TanStack Router layout that:
- Wraps all dev pages under `/dev/*` URLs
- Shows a persistent "Development" banner with a "Back to app" link
- Cleans up route file names (drops `test-` prefix)

Also remove 4 empty feature directories and update a README path reference.

---

## Files to Change

### 1. Create layout route: `web/src/routes/dev.tsx`

New file. A layout route that renders a dev banner bar + `<Outlet />`.

```tsx
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dev")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div className="sticky top-0 z-50 flex items-center justify-between bg-yellow-500 px-4 py-2 text-sm font-medium text-black">
        <span>🛠️ Development Tools</span>
        <Link to="/" className="underline">
          ← Back to app
        </Link>
      </div>
      <Outlet />
    </>
  )
}
```

### 2. Move & rename test routes into `web/src/routes/dev/`

For each of the 5 files, move it from `web/src/routes/test-X.tsx` to `web/src/routes/dev/X.tsx` and update the `createFileRoute` string argument from `"/test-X"` to `"/dev/X"`:

| Old file | New file | Old route path | New route path |
|---|---|---|---|
| `routes/test-alert-banner.tsx` | `routes/dev/alert-banner.tsx` | `/test-alert-banner` | `/dev/alert-banner` |
| `routes/test-analytics.tsx` | `routes/dev/analytics.tsx` | `/test-analytics` | `/dev/analytics` |
| `routes/test-api-playground.tsx` | `routes/dev/api-playground.tsx` | `/test-api-playground` | `/dev/api-playground` |
| `routes/test-impersonate-user.tsx` | `routes/dev/impersonate-user.tsx` | `/test-impersonate-user` | `/dev/impersonate-user` |
| `routes/test-table-apikey-integration.tsx` | `routes/dev/table-apikey-integration.tsx` | `/test-table-apikey-integration` | `/dev/table-apikey-integration` |

Each file needs exactly one line changed: the `createFileRoute` string argument. No imports, components, or logic change.

### 3. Update README path reference

**File: `web/src/components/alert-banner-stack/README.md`**, line 206

Change:
```
Route [web/src/routes/test-alert-banner.tsx](web/src/routes/test-alert-banner.tsx) demonstrates:
```
To:
```
Route [web/src/routes/dev/alert-banner.tsx](web/src/routes/dev/alert-banner.tsx) demonstrates:
```

### 4. Remove empty feature directories

Delete these 4 empty directories:
```
web/src/features/advisor/
web/src/features/feedback/
web/src/features/global-search/
web/src/features/workflow/
```

### 5. Auto-generated: `web/src/routeTree.gen.ts`

No manual edits needed. The `@tanstack/router-vite-plugin` regenerates this file on next build/dev start, reflecting the new `dev.tsx` layout and the renamed/moved child routes.

---

## How It Works

- `dev.tsx` creates a normal layout route at `/dev` (no `_` prefix means it contributes `/dev` to the URL)
- Child files in `routes/dev/` become nested under `/dev/` automatically (e.g., `dev/alert-banner.tsx` → `/dev/alert-banner`)
- The banner is sticky at the top, yellow with black text, easily visible on every dev page
- `autoCodeSplitting: true` in vite.config.ts means each dev page stays isolated in its own chunk
- No routes require authentication — dev pages are public, same as before

---

## Verification

1. Run `pnpm dev` from project root
2. Navigate to `http://localhost:5173/dev/alert-banner` — should see the yellow "Development Tools" banner + the existing alert banner demo
3. Navigate to `http://localhost:5173/dev/api-playground` — same banner, API playground content
4. Verify all 5 `/dev/X` routes work with browser devtools showing separate chunk loads
5. Click "Back to app" link — goes to landing page (`/`)
6. Vite should auto-regenerate `routeTree.gen.ts` without errors
