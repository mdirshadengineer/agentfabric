import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router"

import { AlertBannerStackFromProvider } from "@/components/alert-banner-stack/alert-banner-stack"
import {
	BANNER_DISMISS_STORAGE_KEY,
	BannerStackProvider,
} from "@/components/alert-banner-stack/alert-banner-stack-provider"
import { DevNav } from "@/features/dev/components/dev-nav"

export const Route = createFileRoute("/dev")({
	component: RouteComponent,
})

function DevLayoutShell({ showBanners = false }: { showBanners?: boolean }) {
	return (
		<div className="min-h-svh bg-[radial-gradient(circle_at_0%_0%,rgba(245,158,11,0.08),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,var(--muted))_100%)]">
			{showBanners ? <AlertBannerStackFromProvider /> : null}
			<DevNav
				trailing={
					<Link
						to="/"
						className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
					>
						Back to app
					</Link>
				}
			/>
			<main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<Outlet />
			</main>
		</div>
	)
}

function RouteComponent() {
	const isAlertBannerDemo = useRouterState({
		select: (state) => state.location.pathname === "/dev/alert-banner",
	})

	if (!isAlertBannerDemo) {
		return <DevLayoutShell />
	}

	return (
		<BannerStackProvider
			persistence={{
				type: "localStorage",
				key: `${BANNER_DISMISS_STORAGE_KEY}.demo`,
			}}
		>
			<DevLayoutShell showBanners />
		</BannerStackProvider>
	)
}
