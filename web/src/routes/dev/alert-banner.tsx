import { IconAlertTriangle } from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

import {
	BANNER_ID,
	useBannerStack,
} from "@/components/alert-banner-stack/alert-banner-stack-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DevPageHeader } from "@/features/dev/components/dev-page-header"

export const Route = createFileRoute("/dev/alert-banner")({
	component: RouteComponent,
})

function RouteComponent() {
	return <DemoControls />
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
			autoDismissMs: 12_000,
			replaceExisting: true,
		})
	}, [addBanner])

	const warningDismissed = isDismissedPersisted(BANNER_ID.METRICS_API)

	return (
		<div className="space-y-6">
			<DevPageHeader
				icon={<IconAlertTriangle className="size-5" />}
				badges={
					<Badge variant={warningDismissed ? "secondary" : "default"}>
						{warningDismissed ? "Warning dismissed" : "Warning visible"}
					</Badge>
				}
				title="Banner stack diagnostics"
				description="Test add, replace, update, dismiss, and persistence flows for site-wide alert banners."
			/>

			<Card className="border-border/70 bg-card/95 shadow-sm">
				<CardContent className="space-y-4 pt-6">
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() =>
								addBanner({
									id: BANNER_ID.RLS_EVENT_TRIGGER,
									tone: "error",
									title: "RLS trigger sync failed",
									description:
										"Apply migration 0003 and retry workspace deployment.",
									priority: 100,
									replaceExisting: true,
								})
							}
						>
							Add Error Banner
						</Button>
						<Button
							variant="secondary"
							onClick={() =>
								addBanner({
									id: BANNER_ID.FREE_MICRO_UPGRADE,
									tone: "success",
									title: "Workspace upgraded",
									description:
										"New limits are active. Enjoy improved throughput.",
									priority: 40,
									autoDismissMs: 8_000,
									replaceExisting: true,
								})
							}
						>
							Add Success Banner
						</Button>
						<Button
							variant="outline"
							onClick={() =>
								updateBanner(BANNER_ID.METRICS_API, {
									title: "Metrics API recovered",
									tone: "success",
									description:
										"Latency is back to baseline. Dashboards are up to date.",
									autoDismissMs: 5_000,
								})
							}
						>
							Update Metrics → Success
						</Button>
					</div>

					<Separator />

					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							onClick={() =>
								addBanner({
									id: BANNER_ID.METRICS_API,
									tone: "warning",
									title: "Metrics API is currently degraded",
									description: "Data freshness may lag by up to 2 minutes.",
									priority: 80,
									persistDismissal: true,
									replaceExisting: true,
								})
							}
						>
							Re-show Warning
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
							Clear Storage
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
