import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

import { AlertBannerStackFromProvider } from "@/components/alert-banner-stack/alert-banner-stack"
import {
	BANNER_DISMISS_STORAGE_KEY,
	BANNER_ID,
	BannerStackProvider,
	useBannerStack,
} from "@/components/alert-banner-stack/alert-banner-stack-provider"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/test-alert-banner")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<BannerStackProvider
			persistence={{
				type: "localStorage",
				key: `${BANNER_DISMISS_STORAGE_KEY}.demo`,
			}}
		>
			<div className="min-h-svh bg-background text-foreground">
				<AlertBannerStackFromProvider />
				<div className="mx-auto w-full max-w-4xl p-6 md:p-8">
					<DemoControls />
				</div>
			</div>
		</BannerStackProvider>
	)
}

function DemoControls() {
	const {
		addBanner,
		updateBanner,
		dismissBanner,
		clearBanners,
		resetBannerDismissal,
		clearDismissedPersistence,
		isDismissedPersisted,
	} = useBannerStack()

	useEffect(() => {
		addBanner({
			id: BANNER_ID.INDEX_ADVISOR,
			tone: "info",
			title: "Index advisor update available",
			description: "Review recommended indexes to improve query latency.",
			priority: 30,
			replaceExisting: true,
		})

		addBanner({
			id: BANNER_ID.METRICS_API,
			tone: "warning",
			title: "Metrics API is currently degraded",
			description: "Data freshness may lag by up to 2 minutes.",
			priority: 80,
			persistDismissal: true,
			autoDismissMs: 12000,
			replaceExisting: true,
		})
	}, [addBanner])

	const warningDismissed = isDismissedPersisted(BANNER_ID.METRICS_API)

	return (
		<div className="space-y-5">
			<div className="space-y-1">
				<h1 className="text-xl font-semibold">Alert Banner Stack Demo</h1>
				<p className="text-sm text-muted-foreground">
					Use these controls to test add, replace, update, dismiss, and clear
					flows.
				</p>
				<p className="text-sm text-muted-foreground">
					Warning dismiss persistence:{" "}
					{warningDismissed ? "stored (hidden on reload)" : "not stored"}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<Button
					onClick={() => {
						addBanner({
							id: BANNER_ID.RLS_EVENT_TRIGGER,
							tone: "error",
							title: "RLS trigger sync failed",
							description:
								"Apply migration 0003 and retry workspace deployment.",
							priority: 100,
							replaceExisting: true,
						})
					}}
				>
					Add Error Banner
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						addBanner({
							id: BANNER_ID.FREE_MICRO_UPGRADE,
							tone: "success",
							title: "Workspace upgraded",
							description: "New limits are active. Enjoy improved throughput.",
							priority: 40,
							autoDismissMs: 8000,
							replaceExisting: true,
						})
					}}
				>
					Add Success Banner
				</Button>

				<Button
					variant="outline"
					onClick={() => {
						updateBanner(BANNER_ID.METRICS_API, {
							title: "Metrics API recovered",
							tone: "success",
							description:
								"Latency is now back to baseline and dashboards are up to date.",
							autoDismissMs: 5000,
						})
					}}
				>
					Update Metrics Banner
				</Button>

				<Button
					variant="outline"
					onClick={() => {
						addBanner({
							id: BANNER_ID.METRICS_API,
							tone: "warning",
							title: "Metrics API is currently degraded",
							description: "Data freshness may lag by up to 2 minutes.",
							priority: 80,
							persistDismissal: true,
							replaceExisting: true,
						})
					}}
				>
					Re-show Warning Banner
				</Button>

				<Button
					variant="ghost"
					onClick={() => dismissBanner(BANNER_ID.INDEX_ADVISOR)}
				>
					Dismiss Info Banner
				</Button>

				<Button variant="destructive" onClick={clearBanners}>
					Clear All
				</Button>

				<Button
					variant="ghost"
					onClick={() => resetBannerDismissal(BANNER_ID.METRICS_API)}
				>
					Reset Warning Dismissal
				</Button>

				<Button variant="ghost" onClick={clearDismissedPersistence}>
					Clear Dismissed Storage
				</Button>
			</div>
		</div>
	)
}
