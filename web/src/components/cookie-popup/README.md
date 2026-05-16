# Cookie Popup (GDPR Trust-First)

This folder contains the `CookiePopup` React component used to collect and manage user cookie consent with clear transparency controls.

## Design Idea

The design follows a trust-first and GDPR-aligned approach:

- Start from privacy by default: only essential cookies are enabled initially.
- Give users granular control: functional, analytics, and marketing can be opted in independently.
- Make consent understandable: show lawful basis, purpose, retention, and provider metadata.
- Keep consent reversible: users can withdraw consent and reopen settings at any time.
- Make behavior auditable: emit structured consent and metric events for logging/reporting.

## What Problem It Solves

Without a consent layer, teams often face:

- Legal risk from firing non-essential trackers before consent.
- Poor user trust due to vague banners and missing detail.
- Inconsistent consent handling across analytics platforms.
- Weak observability on consent behavior and conversion.

`CookiePopup` solves these by combining UI controls, consent persistence, and integration hooks in one component.

## GDPR-Focused Behavior

The current component behavior includes:

- Explicit action choices:
  - Accept all
  - Reject non-essential
  - Save preferences (granular)
- Essential category is always required.
- Consent record includes metadata:
  - `consentId`
  - `region` (`GDPR`)
  - `policyVersion`
  - `updatedAt` (ISO timestamp)
  - `action`
  - `preferences`
  - `storageKey`
  - `policyUrl` (optional)
- Consent can be withdrawn from the manage state.

> Note: This component supports GDPR-friendly implementation patterns, but legal compliance also depends on your legal text, policy content, jurisdiction, and actual cookies/scripts used in production.

## API

### Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `storageKey` | `string` | `agentfabric.cookie-consent` | localStorage key for consent record |
| `policyVersion` | `string` | `2026-05-16` | policy/version tag stored with consent |
| `policyUrl` | `string \| undefined` | `undefined` | optional link in details panel |
| `onConsentChange` | `(record) => void` | `undefined` | callback when consent is saved |
| `onMetric` | `(metric) => void` | `undefined` | callback for popup interaction metrics |
| `className` | `string \| undefined` | `undefined` | custom styling hook |
| `manageButtonLabel` | `string` | `Privacy settings` | label for reopen settings button |
| `showManageButton` | `boolean` | `true` | show/hide fixed manage button |

### Consent Categories

- `essential` (always true)
- `functional`
- `analytics`
- `marketing`

### Metric Events (`onMetric`)

- `popup_viewed`
- `details_opened`
- `details_closed`
- `consent_saved`
- `consent_withdrawn`

`consent_saved` includes selected category flags in `details`.

## Quick Usage

```tsx
import { CookiePopup } from "@/components/cookie-popup"

export function AppShell() {
  return (
    <>
      {/* your app */}
      <CookiePopup
        policyUrl="/privacy"
        policyVersion="2026-05-16"
      />
    </>
  )
}
```

## Full Utilization Pattern (Recommended)

Use both callbacks:

1. `onConsentChange`: update runtime trackers/scripts and persist server-side audit if needed.
2. `onMetric`: measure UX of consent interaction (view/open/save/withdraw).

```tsx
import { CookiePopup, type CookieConsentRecord, type CookieMetric } from "@/components/cookie-popup"

function handleConsentChange(record: CookieConsentRecord) {
  // Optional: send consent record to your backend audit endpoint
  // fetch("/api/privacy/consent", { method: "POST", body: JSON.stringify(record) })
}

function handleMetric(metric: CookieMetric) {
  // Optional: send to your analytics/event pipeline
  // fetch("/api/metrics", { method: "POST", body: JSON.stringify(metric) })
}

export function PrivacyLayer() {
  return (
    <CookiePopup
      policyUrl="/privacy"
      policyVersion="2026-05-16"
      onConsentChange={handleConsentChange}
      onMetric={handleMetric}
      showManageButton
    />
  )
}
```

## Google Analytics 4 Integration (Consent Mode)

For GA4, do not grant analytics/ads storage before consent.

### 1) Initialize default denied state early

Place this before loading GA scripts (typically in `index.html` or the earliest app bootstrap path):

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
</script>
```

### 2) Update consent from `onConsentChange`

```tsx
import { CookiePopup, type CookieConsentRecord } from "@/components/cookie-popup"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function syncGaConsent(record: CookieConsentRecord) {
  const gtag = window.gtag
  if (!gtag) return

  const analyticsGranted = record.preferences.analytics
  const marketingGranted = record.preferences.marketing

  gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: marketingGranted ? "granted" : "denied",
    ad_user_data: marketingGranted ? "granted" : "denied",
    ad_personalization: marketingGranted ? "granted" : "denied",
  })
}

export function ConsentWithGA() {
  return (
    <CookiePopup
      policyUrl="/privacy"
      onConsentChange={syncGaConsent}
    />
  )
}
```

### 3) Gate custom analytics events

Only send your custom GA events when `record.preferences.analytics === true`.

## Integration With Any Analytics Platform

This component is platform-agnostic. You can connect it to:

- Segment
- PostHog
- Mixpanel
- RudderStack
- Amplitude
- Self-hosted event pipelines

Pattern:

- Use `onConsentChange(record)` to enable/disable platform SDK features.
- Use `onMetric(metric)` to track consent UX funnel.
- If needed, keep your own centralized consent state in app context.

Example generic adapter:

```tsx
function analyticsAdapter(record: CookieConsentRecord) {
  // Example pseudo-logic:
  // analytics.setConsent({
  //   analytics: record.preferences.analytics,
  //   marketing: record.preferences.marketing,
  //   functional: record.preferences.functional,
  // })
}
```

## Compatibility Notes

Yes, this is compatible for usage inside this folder and from any route/component in the web app.

- File location: `web/src/components/cookie-popup/index.tsx`
- Recommended placement: near app root/layout so it is globally available.
- Storage: browser `localStorage` (client-side).
- Rendering: component is client-side and safely waits until ready before rendering.

## Operational Checklist

Before production rollout:

- Replace placeholder cookie names/providers with your real cookie inventory.
- Ensure your privacy policy URL and policy version are accurate.
- Ensure third-party scripts are actually blocked until consent is granted.
- Test these paths:
  - first visit (no consent)
  - accept all
  - reject non-essential
  - custom save
  - withdraw consent
  - reload persistence

## Future Enhancements (Optional)

- Add geolocation-aware behavior (GDPR region detection).
- Add localization/i18n for consent copy.
- Add server-side consent audit API.
- Split cookie register metadata into configurable props.
