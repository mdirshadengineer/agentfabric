---
name: API Playground UX
overview: Restructure the API key playground so authentication is a compact header strip (not a workflow tab), main tabs focus on Create / Verify / Reference, and logged-in users land directly on key actions without repeated sign-in prompts.
todos:
  - id: auth-strip
    content: Replace Account tab with compact auth strip above tabs (logged-in vs logged-out variants)
    status: completed
  - id: three-tabs
    content: Reduce tabs to Create | Verify | Reference; default to create; inline lock state instead of disabled tab
    status: completed
  - id: status-defaults
    content: Simplify status messages, remove hardcoded credentials, auto-switch to create on sign-in
    status: completed
  - id: organize-panels
    content: Group Create/Verify fields into DevPanelCard sections with consistent action rows
    status: completed
  - id: verify
    content: Typecheck, biome, manual smoke test signed-in and signed-out flows
    status: completed
isProject: false
---

# API Playground Tab & Auth UX

Target file: [`web/src/routes/dev/api-playground.tsx`](web/src/routes/dev/api-playground.tsx)

## Current problems

- **Account is a first-class tab** even though it is only needed when unauthenticated; logged-in users still land on it and see redundant copy (“You are signed in… open Create key…”).
- **Auth UI is heavy** when a session already exists: read-only name/email fields, duplicate badges, full session JSON block, and Refresh/Sign out mixed with sign-in buttons.
- **Hardcoded credentials** in state (`mdirshadengineer@gmail.com`, `Developer@123`) pre-fill forms even for users who are already signed in via the main app.
- **Actions are scattered** — status bar, tab content, and inline buttons repeat the same “sign in first” guidance.

## Proposed layout

```mermaid
flowchart TB
  header[DevPageHeader with session badge]
  authStrip[Auth strip - compact, always above tabs]
  status[DevStatusBar - action feedback only]
  tabs[Tabs: Create key | Verify key | Reference]
  header --> authStrip --> status --> tabs
```

### 1. Auth strip (outside tabs)

Replace the **Account** tab with a always-visible `DevPanelCard` (or slim bordered strip) above the tab card:

**When authenticated** (`sessionQuery.data?.data` present):
- One line: user name + email + `Session active` badge + device ID badge
- Actions: **Sign out**, **Refresh session** (ghost/secondary)
- Session JSON moved into a **Collapsible** (“Session details”) — hidden by default, for debugging only
- No email/password fields, no sign-in/sign-up toggle, no “go to Account tab” copy

**When not authenticated**:
- Short note: “Sign in to create user-owned API keys.”
- Inline **Sign in / Sign up** toggle (keep existing `accountMode` state)
- Minimal form: email + password (+ name for sign-up)
- Primary **Sign in** or **Sign up** button only — no duplicate refresh/sign-out controls

On successful sign-in/sign-up: auto-switch to **Create key** tab (`setActiveTab("create")`).

On sign-out: clear `apiKeyToVerify`, switch tab logic stays on Create (locked) or Verify.

### 2. Main tabs — workflow only (3 tabs)

Remove `account` from `ApiPlaygroundTab`. New type:

```ts
type ApiPlaygroundTab = "create" | "verify" | "reference"
```

| Tab | Content |
|-----|---------|
| **Create key** | Form + **Create API key** action + response panel. If not authenticated: dashed empty state with link-style prompt pointing at auth strip above (not a separate tab). |
| **Verify key** | Key input, config, permissions JSON, **Verify** + **Copy** actions, response panel (unchanged logic). |
| **Server reference** | `SERVER_CONFIGS` grid + metadata/permissions docs (unchanged). |

**Default tab behavior:**
- Initial state: `"create"`
- `useEffect` when session resolves: if authenticated and user is still on a locked create empty-state, ensure tab is `"create"` (no forced jump if user chose Verify/Reference)

Remove lock icon + `disabled={!isAuthenticated}` from Create tab trigger — tab stays clickable; content shows inline lock message instead (clearer than a disabled tab).

### 3. Simplify status messaging

- `authStatusMessage` only when **not** authenticated: `"Sign in above to create API keys."`
- When authenticated: `DevStatusBar` shows **mutation feedback only** (`actionMessage`), not repeated auth instructions
- Trim header description to focus on the three actions, not “work through account sign-in first”

Update header badge: `"Session active"` / `"Sign in required"` (drop “Account sign-in required”).

### 4. Clean up defaults & types

- Remove hardcoded email/password/name defaults → empty strings with placeholders
- Keep all existing mutations, arktype schemas, and API calls unchanged
- `signOutMutation.onSuccess`: remove `setActiveTab("account")` → stay on current tab or `"create"`

### 5. Organize actions within tabs

Apply consistent structure per tab (matches other dev pages using `DevPanelCard`):

**Create tab**
- `DevPanelCard` “Key settings” — name, config, expiry
- `DevPanelCard` “Metadata” — secret-only textarea (existing conditional styling)
- Collapsed note panel for permissions server-only restriction (keep existing copy, less prominent)
- Sticky-style action row at bottom: **Create API key**
- `DevPanelCard` “Create response” — existing `DevJsonBlock`

**Verify tab**
- `DevPanelCard` “Key to verify” — input + config
- `DevPanelCard` “Permission assertion (optional)” — textarea + helper text
- Action row: **Verify key** + **Copy key**
- `DevPanelCard` “Verification response” — existing block

## Files to change

- [`web/src/routes/dev/api-playground.tsx`](web/src/routes/dev/api-playground.tsx) — sole file; no new shared components unless the auth strip exceeds ~80 lines (then optional `web/src/features/dev/components/dev-auth-strip.tsx`)

## Out of scope

- [`web/src/routes/dev/impersonate-user.tsx`](web/src/routes/dev/impersonate-user.tsx) — separate admin playground; not part of this pass
- Backend / auth config changes
- Extracting shared auth logic across dev pages (future cleanup)

## Verification

1. Visit `/dev/api-playground` **while signed in** (via main app `/signin`): auth strip shows user info only, Create tab is default, no sign-in form
2. **Signed out**: auth strip shows sign-in form; Create tab shows lock empty state; Verify/Reference work without session
3. Sign in from strip → lands on Create tab, can mint key, key pre-fills Verify tab
4. Sign out → key field cleared, create locked again
5. `pnpm --filter agentfabric-web typecheck` and `biome check src/routes/dev/api-playground.tsx`
