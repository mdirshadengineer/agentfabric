import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import * as React from "react"

import {
	type CookieConsentRecord,
	type CookieMetric,
	CookiePopup,
} from "@/components/cookie-popup"
import {
	applyAnalyticsConsent,
	applyStoredConsent,
} from "@/lib/consent-analytics"

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
}>()({
	component: RootComponent,
})

function RootComponent() {
	const manualConsentTestingEnabled =
		import.meta.env.DEV || import.meta.env.VITE_COOKIE_MANUAL_TESTING === "true"

	const storageKey = manualConsentTestingEnabled
		? "agentfabric.cookie-consent.testing"
		: "agentfabric.cookie-consent"

	React.useEffect(() => {
		applyStoredConsent(storageKey)
	}, [storageKey])

	const handleConsentChange = (record: CookieConsentRecord) => {
		applyAnalyticsConsent(record.preferences)

		if (!manualConsentTestingEnabled) {
			return
		}

		window.localStorage.setItem(
			"agentfabric.cookie-consent.last-record",
			JSON.stringify(record)
		)
		console.info("[cookie-popup] consent changed", record)
	}

	const handleConsentMetric = (metric: CookieMetric) => {
		if (metric.name === "consent_withdrawn") {
			applyAnalyticsConsent({
				essential: true,
				functional: false,
				analytics: false,
				marketing: false,
			})
		}

		if (!manualConsentTestingEnabled) {
			return
		}

		window.localStorage.setItem(
			"agentfabric.cookie-consent.last-metric",
			JSON.stringify(metric)
		)
		console.info("[cookie-popup] metric", metric)
	}

	return (
		<>
			<Outlet />
			<CookiePopup
				storageKey={storageKey}
				policyUrl="/privacy"
				policyVersion="2026-05-16"
				onConsentChange={handleConsentChange}
				onMetric={handleConsentMetric}
				showManageButton
			/>
		</>
	)
}
