# Alert Banner Stack

Reusable, extensible alert banner primitives for workspace-level messaging.

## What You Get

- `BannerStackProvider` for centralized banner state
- `useBannerStack()` hook with add, update, dismiss, remove, and clear operations
- Dismiss tracking with explicit persistence strategy (`localStorage` or `cookie`)
- `AlertBanner` base UI component
- `AlertBannerStack` controlled renderer
- `AlertBannerStackFromProvider` provider-connected renderer
- Preset wrappers:
  - `AlertBannerInfo`
  - `AlertBannerWarning`
  - `AlertBannerError`

## Quick Start

```tsx
import {
  BannerStackProvider,
  BANNER_ID,
  BANNER_DISMISS_STORAGE_KEY,
  useBannerStack,
} from "@/components/alert-banner-stack/alert-banner-stack-provider"
import { AlertBannerStackFromProvider } from "@/components/alert-banner-stack/alert-banner-stack"

function BannerBootstrap() {
  const { addBanner } = useBannerStack()

  useEffect(() => {
    addBanner({
      id: BANNER_ID.METRICS_API,
      tone: "warning",
      title: "Metrics API is degraded",
      description: "Requests may be delayed for a few minutes.",
      persistDismissal: true,
      priority: 90,
      autoDismissMs: 12000,
      dismissible: true,
    })
  }, [addBanner])

  return null
}

export function AppLayout() {
  return (
    <BannerStackProvider
      persistence={{
        type: "localStorage",
        key: `${BANNER_DISMISS_STORAGE_KEY}.workspace`,
      }}
    >
      <AlertBannerStackFromProvider />
      <BannerBootstrap />
      {/* rest of app */}
    </BannerStackProvider>
  )
}
```

## Hook API

```ts
const {
  banners,
  addBanner,
  updateBanner,
  dismissBanner,
  removeBanner,
  clearBanners,
  resetBannerDismissal,
  clearDismissedPersistence,
  isDismissedPersisted,
} = useBannerStack()
```

## Provider Persistence Configuration

`BannerStackProvider` accepts an optional `persistence` prop:

```ts
{
  type?: "none" | "localStorage" | "cookie"
  key?: string
  cookieMaxAgeSeconds?: number
  cookiePath?: string
}
```

- `type` default: `"none"`
- `key` default: `"alert-banner-stack.dismissed"`
- Dismiss persistence is only applied when a banner has `persistDismissal: true`

### `addBanner(banner)`

Adds a banner (or replaces an existing one when `replaceExisting: true`).

Supported fields:

- `id: string`
- `tone?: "info" | "warning" | "error" | "success" | "neutral"`
- `title?: ReactNode`
- `description?: ReactNode`
- `content?: ReactNode` (full custom content)
- `action?: ReactNode`
- `icon?: ReactNode`
- `className?: string`
- `dismissible?: boolean` (default: true)
- `priority?: number` (higher renders first)
- `autoDismissMs?: number`
- `persistDismissal?: boolean` (default: false)
- `dismissalKey?: string` (defaults to `id`)
- `onDismiss?: () => void`
- `replaceExisting?: boolean`

### `updateBanner(id, patch)`

Patches an existing banner in place. You can also update `autoDismissMs`.

### `dismissBanner(id)`

Animates out and removes after the configured dismiss animation duration.

### `removeBanner(id)`

Removes immediately (without dismiss animation).

### `clearBanners()`

Clears all banners and auto-dismiss timers.

### `resetBannerDismissal(id, dismissalKey?)`

Removes one persisted dismissed entry, allowing that banner to render again.

### `clearDismissedPersistence()`

Clears all persisted dismissed entries managed by the provider.

### `isDismissedPersisted(id, dismissalKey?)`

Returns whether a banner dismissal is currently persisted.

## Rendering Modes

### 1) Connected Rendering

```tsx
<AlertBannerStackFromProvider className="shrink-0" />
```

### 2) Controlled Rendering

```tsx
<AlertBannerStack
  banners={banners}
  onDismissBanner={(id) => dismissBanner(id)}
/>
```

### 3) Custom Row Renderer

```tsx
<AlertBannerStackFromProvider
  renderBanner={(banner, dismiss) => (
    <AlertBanner
      {...banner}
      tone={banner.tone ?? "neutral"}
      onDismiss={dismiss}
      showPattern={false}
      className="border-l-4"
    />
  )}
/>
```

## Preset Components

Use preset wrappers when you want sensible defaults with override points:

```tsx
<AlertBannerInfo onLearnMore={() => setOpen(true)} />

<AlertBannerWarning
  title="Maintenance starts soon"
  description="Expect short write delays during the rollout window."
/>

<AlertBannerError dismissible={false} />
```

## Notes

- Banner ordering is priority-based (descending).
- IDs should be stable and unique per logical banner.
- Auto-dismiss is per-banner and reset on replacement/update.
- Supported tones: `info`, `warning`, `error`, `success`, `neutral`.
- Warning banners are first-class and can be persisted on dismiss via `persistDismissal: true`.
- `dismissBanner` animates and removes; `removeBanner` removes immediately.

## Test Route Example

Route [web/src/routes/test-alert-banner.tsx](web/src/routes/test-alert-banner.tsx) demonstrates:

- Provider setup with `localStorage` persistence
- Warning banner with persisted dismissal
- Re-show warning flow using `replaceExisting: true`
- Reset/clear persisted dismissal actions
