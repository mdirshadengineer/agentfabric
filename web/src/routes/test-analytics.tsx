import {
	IconActivityHeartbeat,
	IconRefresh,
	IconSend2,
	IconTrash,
} from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"

import type { CookieConsentRecord } from "@/components/cookie-popup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
	applyAnalyticsConsent,
	applyStoredConsent,
} from "@/lib/consent-analytics"

export const Route = createFileRoute("/test-analytics")({
	component: RouteComponent,
})

type AnalyticsSnapshot = {
	storageKey: string
	hasConsent: boolean
	consentRecord: CookieConsentRecord | null
	gaMeasurementId: string
	clarityProjectId: string
	gaScriptLoaded: boolean
	clarityScriptLoaded: boolean
	gaDisabledFlag: boolean
	hasGtag: boolean
	hasDataLayer: boolean
	hasClarity: boolean
	lastConsentRecord: string | null
	lastConsentMetric: string | null
}

function prettyJson(value: unknown) {
	if (value === null || value === undefined) {
		return "-"
	}

	if (typeof value === "string") {
		return value
	}

	return JSON.stringify(value, null, 2)
}

function getStorageKey() {
	const manualConsentTestingEnabled =
		import.meta.env.DEV || import.meta.env.VITE_COOKIE_MANUAL_TESTING === "true"

	return manualConsentTestingEnabled
		? "agentfabric.cookie-consent.testing"
		: "agentfabric.cookie-consent"
}

function getSnapshot(): AnalyticsSnapshot {
	const storageKey = getStorageKey()
	const rawConsent = window.localStorage.getItem(storageKey)

	let consentRecord: CookieConsentRecord | null = null
	if (rawConsent) {
		try {
			consentRecord = JSON.parse(rawConsent) as CookieConsentRecord
		} catch {
			consentRecord = null
		}
	}

	const gaMeasurementId =
		import.meta.env.VITE_GA_MEASUREMENT_ID || "G-39CPWJJ31H"
	const clarityProjectId =
		import.meta.env.VITE_CLARITY_PROJECT_ID || "wruuxwkpkg"

	return {
		storageKey,
		hasConsent: Boolean(consentRecord),
		consentRecord,
		gaMeasurementId,
		clarityProjectId,
		gaScriptLoaded: Boolean(
			document.querySelector(
				`script[src*="googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}"]`
			)
		),
		clarityScriptLoaded: Boolean(
			document.querySelector(
				`script[src*="clarity.ms/tag/${encodeURIComponent(clarityProjectId)}"]`
			)
		),
		gaDisabledFlag: Boolean(window[`ga-disable-${gaMeasurementId}`]),
		hasGtag: typeof window.gtag === "function",
		hasDataLayer: Array.isArray(window.dataLayer),
		hasClarity: typeof window.clarity === "function",
		lastConsentRecord: window.localStorage.getItem(
			"agentfabric.cookie-consent.last-record"
		),
		lastConsentMetric: window.localStorage.getItem(
			"agentfabric.cookie-consent.last-metric"
		),
	}
}

function RouteComponent() {
	const [snapshot, setSnapshot] = React.useState<AnalyticsSnapshot | null>(null)
	const [status, setStatus] = React.useState("Ready")

	const refresh = React.useCallback(() => {
		setSnapshot(getSnapshot())
	}, [])

	React.useEffect(() => {
		refresh()
	}, [refresh])

	const handleReapplyStoredConsent = () => {
		applyStoredConsent(getStorageKey())
		setStatus("Re-applied consent from localStorage.")
		refresh()
	}

	const handleDisableAnalytics = () => {
		window.localStorage.removeItem(getStorageKey())
		applyAnalyticsConsent({
			essential: true,
			functional: false,
			analytics: false,
			marketing: false,
		})
		setStatus("Consent removed and analytics disabled.")
		refresh()
	}

	const handleSendTestEvents = () => {
		window.gtag?.("event", "consent_test_event", {
			source: "test-analytics-route",
			timestamp: new Date().toISOString(),
		})

		window.clarity?.("event", "consent_test_event")

		setStatus("Sent test event to GA and Clarity (if currently enabled).")
		refresh()
	}

	const analyticsAllowed =
		snapshot?.consentRecord?.preferences.analytics === true

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-10">
			<Card className="border-border/70">
				<CardHeader className="space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline" className="gap-1.5">
							<IconActivityHeartbeat className="size-3.5" />
							Analytics Consent Test
						</Badge>
						<Badge variant={analyticsAllowed ? "default" : "secondary"}>
							{analyticsAllowed ? "Analytics allowed" : "Analytics denied"}
						</Badge>
					</div>
					<CardTitle>Consent-gated tracking diagnostics</CardTitle>
					<CardDescription>
						Use your cookie popup to change preferences, then verify the live
						tracker state here.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button type="button" variant="outline" onClick={refresh}>
							<IconRefresh className="size-4" />
							Refresh snapshot
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={handleReapplyStoredConsent}
						>
							<IconRefresh className="size-4" />
							Re-apply stored consent
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDisableAnalytics}
						>
							<IconTrash className="size-4" />
							Clear consent + disable
						</Button>
						<Button
							type="button"
							onClick={handleSendTestEvents}
							disabled={!analyticsAllowed}
						>
							<IconSend2 className="size-4" />
							Send test event
						</Button>
					</div>

					<p className="text-sm text-muted-foreground">{status}</p>
					<Separator />

					<div className="grid gap-4 md:grid-cols-2">
						<Card className="border-border/60">
							<CardHeader>
								<CardTitle className="text-base">
									Runtime tracker state
								</CardTitle>
							</CardHeader>
							<CardContent>
								<pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-5">
									{prettyJson(
										snapshot
											? {
													gaMeasurementId: snapshot.gaMeasurementId,
													clarityProjectId: snapshot.clarityProjectId,
													gaScriptLoaded: snapshot.gaScriptLoaded,
													clarityScriptLoaded: snapshot.clarityScriptLoaded,
													gaDisabledFlag: snapshot.gaDisabledFlag,
													hasGtag: snapshot.hasGtag,
													hasDataLayer: snapshot.hasDataLayer,
													hasClarity: snapshot.hasClarity,
												}
											: null
									)}
								</pre>
							</CardContent>
						</Card>

						<Card className="border-border/60">
							<CardHeader>
								<CardTitle className="text-base">
									Current consent record
								</CardTitle>
							</CardHeader>
							<CardContent>
								<pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-5">
									{prettyJson(
										snapshot
											? {
													storageKey: snapshot.storageKey,
													hasConsent: snapshot.hasConsent,
													record: snapshot.consentRecord,
												}
											: null
									)}
								</pre>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<Card className="border-border/60">
							<CardHeader>
								<CardTitle className="text-base">
									Last debug consent record
								</CardTitle>
								<CardDescription>
									Available when manual testing mode stores callback payloads.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-5">
									{prettyJson(snapshot?.lastConsentRecord ?? null)}
								</pre>
							</CardContent>
						</Card>

						<Card className="border-border/60">
							<CardHeader>
								<CardTitle className="text-base">
									Last debug consent metric
								</CardTitle>
							</CardHeader>
							<CardContent>
								<pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-5">
									{prettyJson(snapshot?.lastConsentMetric ?? null)}
								</pre>
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
