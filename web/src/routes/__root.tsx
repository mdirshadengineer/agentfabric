import { IconSparkles } from "@tabler/icons-react"
import type { QueryClient } from "@tanstack/react-query"
import {
	createRootRouteWithContext,
	Outlet,
	useRouterState,
} from "@tanstack/react-router"
import * as React from "react"
import {
	type CookieConsentRecord,
	type CookieMetric,
	CookiePopup,
} from "@/components/cookie-popup"
import { Skeleton } from "@/components/ui/skeleton"
import {
	applyAnalyticsConsent,
	applyStoredConsent,
} from "@/lib/consent-analytics"

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
}>()({
	pendingComponent: RootPending,
	errorComponent: RootError,
	component: RootComponent,
})

function RootPending() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-4">
				<div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-cyan-500 text-white">
					<IconSparkles className="size-6 animate-pulse" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-1 w-32 rounded-full" />
				</div>
			</div>
		</div>
	)
}

function RootError() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background p-4">
			<div className="flex flex-col items-center gap-4 text-center max-w-sm">
				<p className="text-sm font-semibold text-destructive">
					Something went wrong
				</p>
				<p className="text-xs text-muted-foreground">
					An unexpected error occurred. Please reload the page to try again.
				</p>
				<button
					type="button"
					className="text-sm underline underline-offset-4 text-primary hover:text-primary/80"
					onClick={() => window.location.reload()}
				>
					Reload page
				</button>
			</div>
		</div>
	)
}

function RootComponent() {
	const isDevRoute = useRouterState({
		select: (state) => state.location.pathname.startsWith("/dev"),
	})

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
				showManageButton={!isDevRoute}
				presentation={isDevRoute ? "modal" : "banner"}
			/>
		</>
	)
}
