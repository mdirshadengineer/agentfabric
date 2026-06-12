import {
	IconActivityHeartbeat,
	IconAlertTriangle,
	IconCookie,
	IconRefresh,
	IconSend2,
	IconTrash,
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import {
	COOKIE_CONSENT_CHANGED_EVENT,
	type CookieConsentRecord,
	openCookieSettings,
} from "@/components/cookie-popup"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DevJsonBlock } from "@/features/dev/components/dev-json-block"
import { DevPageHeader } from "@/features/dev/components/dev-page-header"
import { DevPanelCard } from "@/features/dev/components/dev-panel-card"
import {
	DevStatGrid,
	DevStatusBar,
} from "@/features/dev/components/dev-stat-grid"
import {
	applyAnalyticsConsent,
	applyStoredConsent,
} from "@/lib/consent-analytics"

export const Route = createFileRoute("/dev/analytics")({
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
	if (value === null || value === undefined) return null
	if (typeof value === "string") return value
	return value
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

function StatusBadge({ active }: { active: boolean }) {
	return (
		<Badge variant={active ? "default" : "secondary"}>
			{active ? "Active" : "Inactive"}
		</Badge>
	)
}

function ConsentBadge({ allowed }: { allowed: boolean }) {
	return (
		<Badge variant={allowed ? "default" : "outline"}>
			{allowed ? "Allowed" : "Denied"}
		</Badge>
	)
}

const analyticsQueryKey = ["dev", "analytics", "snapshot"] as const

function RouteComponent() {
	const queryClient = useQueryClient()

	const snapshotQuery = useQuery({
		queryKey: analyticsQueryKey,
		queryFn: getSnapshot,
		staleTime: 2_000,
		refetchInterval: 10_000,
	})

	const snapshot = snapshotQuery.data ?? null
	const [statusMessage, setStatusMessage] = useState("Ready")

	useEffect(() => {
		const refreshSnapshot = () => {
			queryClient.invalidateQueries({ queryKey: analyticsQueryKey })
		}

		window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, refreshSnapshot)
		return () =>
			window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, refreshSnapshot)
	}, [queryClient])

	const reapplyConsent = useMutation({
		mutationFn: async () => {
			applyStoredConsent(getStorageKey())
		},
		onSuccess: () => {
			setStatusMessage("Re-applied consent from localStorage.")
			queryClient.invalidateQueries({ queryKey: analyticsQueryKey })
		},
	})

	const disableAnalytics = useMutation({
		mutationFn: async () => {
			window.localStorage.removeItem(getStorageKey())
			applyAnalyticsConsent({
				essential: true,
				functional: false,
				analytics: false,
				marketing: false,
			})
		},
		onSuccess: () => {
			setStatusMessage("Consent removed and analytics disabled.")
			queryClient.invalidateQueries({ queryKey: analyticsQueryKey })
		},
	})

	const sendTestEvents = useMutation({
		mutationFn: async () => {
			window.gtag?.("event", "consent_test_event", {
				source: "test-analytics-route",
				timestamp: new Date().toISOString(),
			})
			window.clarity?.("event", "consent_test_event")
		},
		onSuccess: () => {
			setStatusMessage(
				"Sent test event to GA and Clarity (if currently enabled)."
			)
			queryClient.invalidateQueries({ queryKey: analyticsQueryKey })
		},
	})

	const preferences = snapshot?.consentRecord?.preferences
	const analyticsAllowed = preferences?.analytics === true
	const trackersActive =
		Boolean(snapshot?.gaScriptLoaded) ||
		Boolean(snapshot?.clarityScriptLoaded) ||
		Boolean(snapshot?.hasGtag) ||
		Boolean(snapshot?.hasClarity)
	const consentTrackerMismatch =
		Boolean(snapshot?.hasConsent) &&
		((analyticsAllowed && !trackersActive) ||
			(!analyticsAllowed && trackersActive))

	return (
		<div className="space-y-6">
			<DevPageHeader
				icon={<IconActivityHeartbeat className="size-5" />}
				badges={
					<>
						<Badge variant={analyticsAllowed ? "default" : "secondary"}>
							{analyticsAllowed ? "Analytics allowed" : "Analytics denied"}
						</Badge>
						{snapshot?.hasConsent ? (
							<Badge variant="outline">Consent stored</Badge>
						) : (
							<Badge variant="outline">No consent yet</Badge>
						)}
					</>
				}
				title="Consent-gated tracking diagnostics"
				description="Change cookie preferences with the button below, then verify the live tracker state updates. On dev routes the privacy dialog opens as a centered modal instead of the floating banner."
			/>

			<Card className="border-border/70 bg-card/95 shadow-sm">
				<CardContent className="space-y-4 pt-6">
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={openCookieSettings}
						>
							<IconCookie className="size-4" />
							Open privacy settings
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => snapshotQuery.refetch()}
						>
							<IconRefresh className="size-4" />
							Refresh snapshot
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => reapplyConsent.mutate()}
						>
							<IconRefresh className="size-4" />
							Re-apply stored consent
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => disableAnalytics.mutate()}
						>
							<IconTrash className="size-4" />
							Clear consent + disable
						</Button>
						<Button
							type="button"
							onClick={() => sendTestEvents.mutate()}
							disabled={!analyticsAllowed}
						>
							<IconSend2 className="size-4" />
							Send test event
						</Button>
					</div>

					{consentTrackerMismatch && (
						<Alert variant="destructive">
							<IconAlertTriangle />
							<AlertTitle>Consent and tracker state mismatch</AlertTitle>
							<AlertDescription>
								{analyticsAllowed
									? "Analytics consent is granted but trackers are not active. Click Re-apply stored consent to load scripts, or save preferences again from privacy settings."
									: "Analytics consent is denied but tracker scripts appear active. Click Clear consent + disable to reset runtime state."}
							</AlertDescription>
						</Alert>
					)}

					<DevStatusBar>{statusMessage}</DevStatusBar>

					{snapshot && (
						<DevStatGrid
							items={[
								{
									label: "Storage key",
									value: snapshot.storageKey,
									mono: true,
								},
								{
									label: "Last action",
									value: snapshot.consentRecord?.action ?? "none",
								},
								{
									label: "Analytics consent",
									value: <ConsentBadge allowed={analyticsAllowed} />,
								},
								{
									label: "GA script",
									value: <StatusBadge active={snapshot.gaScriptLoaded} />,
								},
								{
									label: "Clarity script",
									value: <StatusBadge active={snapshot.clarityScriptLoaded} />,
								},
								{
									label: "gtag / clarity APIs",
									value: (
										<span className="inline-flex flex-wrap gap-1.5">
											<StatusBadge active={snapshot.hasGtag} />
											<StatusBadge active={snapshot.hasClarity} />
										</span>
									),
								},
							]}
						/>
					)}

					<Separator />

					<div className="grid gap-4 md:grid-cols-2">
						<DevPanelCard title="Runtime tracker state">
							<DevJsonBlock
								value={
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
								}
							/>
						</DevPanelCard>

						<DevPanelCard title="Current consent record">
							<DevJsonBlock
								value={
									snapshot
										? {
												storageKey: snapshot.storageKey,
												hasConsent: snapshot.hasConsent,
												record: snapshot.consentRecord,
											}
										: null
								}
							/>
						</DevPanelCard>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<DevPanelCard
							title="Last debug consent record"
							description="Available when manual testing mode stores callback payloads."
						>
							<DevJsonBlock
								value={prettyJson(snapshot?.lastConsentRecord ?? null)}
								maxHeightClassName="max-h-64"
							/>
						</DevPanelCard>

						<DevPanelCard title="Last debug consent metric">
							<DevJsonBlock
								value={prettyJson(snapshot?.lastConsentMetric ?? null)}
								maxHeightClassName="max-h-64"
							/>
						</DevPanelCard>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
