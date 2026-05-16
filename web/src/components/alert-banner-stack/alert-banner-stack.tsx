import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import {
	BANNER_DISMISS_ANIMATION_MS,
	type Banner,
	type BannerId,
	type BannerTone,
	useBannerStack,
} from "./alert-banner-stack-provider"

interface AlertBannerToneStyles {
	container: string
	icon: string
}

const TONE_STYLES: Record<BannerTone, AlertBannerToneStyles> = {
	info: {
		container: "bg-primary/12 border-primary/30",
		icon: "text-primary-foreground bg-primary",
	},
	warning: {
		container: "bg-warning/16 border-warning/40",
		icon: "text-warning-foreground bg-warning",
	},
	error: {
		container: "bg-destructive/14 border-destructive/40",
		icon: "text-destructive-foreground bg-destructive",
	},
	success: {
		container: "bg-success/16 border-success/40",
		icon: "text-success-foreground bg-success",
	},
	neutral: {
		container: "bg-muted/60 border-border",
		icon: "text-foreground bg-muted-foreground/20",
	},
}

export interface AlertBannerProps
	extends Omit<
		Banner,
		"id" | "priority" | "autoDismissMs" | "createdAt" | "content"
	> {
	id?: BannerId
	content?: ReactNode
	showPattern?: boolean
	onDismiss?: () => void
}

const DEFAULT_ICON = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 16 16"
		fill="currentColor"
		className="p-0.5 rounded-sm shrink-0 w-5 h-5 md:w-4 md:h-4"
	>
		<path
			fillRule="evenodd"
			d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
			clipRule="evenodd"
		></path>
	</svg>
)

export function AlertBanner({
	tone = "info",
	title,
	description,
	content,
	action,
	icon,
	dismissible = true,
	isDismissed = false,
	className,
	showPattern = true,
	onDismiss,
}: AlertBannerProps) {
	const toneStyles = TONE_STYLES[tone]

	return (
		<div
			className={cn(
				"relative border-b overflow-hidden transition-all ease-out",
				isDismissed
					? "opacity-0 -translate-y-2 pointer-events-none"
					: "opacity-100 translate-y-0",
				toneStyles.container,
				className
			)}
			style={{ transitionDuration: `${BANNER_DISMISS_ANIMATION_MS}ms` }}
		>
			<div className="px-4 py-4 md:py-3 flex items-center md:justify-center">
				{showPattern && (
					<div
						className="absolute inset-0 opacity-[1.6%] dark:opacity-[0.8%]"
						style={{
							background:
								"repeating-linear-gradient(45deg, currentcolor, currentcolor 10px, transparent 10px, transparent 20px)",
							maskImage: "linear-gradient(transparent 0%, black 90%)",
						}}
					></div>
				)}
				<div className="relative items-start md:items-center flex flex-row gap-3 min-w-0 flex-1 pr-8 md:pr-10">
					<div className={cn("shrink-0", toneStyles.icon)}>
						{icon ?? DEFAULT_ICON}
					</div>
					{content ? (
						<div className="flex-1 min-w-0">{content}</div>
					) : (
						<div className="flex flex-col md:flex-row gap-0.5 md:gap-1.5 text-balance md:flex-nowrap min-w-0 flex-1">
							{title && (
								<p className="text-sm text-foreground font-medium md:truncate">
									{title}
								</p>
							)}
							{description && (
								<div className="flex flex-row items-center gap-1.5 min-w-0 md:flex-nowrap text-sm">
									{title && (
										<span className="hidden md:inline text-foreground-muted">
											·
										</span>
									)}
									<div className="text-foreground-light md:truncate [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-foreground-muted/80 [&_a]:hover:decoration-foreground [&_a]:hover:text-foreground [&_a]:transition-all">
										{description}
									</div>
								</div>
							)}
							{action && <div className="shrink-0">{action}</div>}
						</div>
					)}
				</div>
				{dismissible && (
					<button
						data-size="tiny"
						type="button"
						className="justify-center cursor-pointer inline-flex items-center space-x-2 text-center font-regular ease-out duration-200 rounded-md outline-hidden transition-all outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 border text-foreground hover:bg-surface-300 shadow-none focus-visible:outline-border-strong data-[state=open]:bg-surface-300 data-[state=open]:outline-border-strong border-transparent text-xs opacity-75 z-1 shrink-0 p-0.5 h-auto absolute right-5 md:right-4 top-1/2 -translate-y-1/2"
						aria-label="Dismiss banner"
						tabIndex={0}
						onClick={onDismiss}
					>
						<span className="truncate">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M18 6 6 18"></path>
								<path d="m6 6 12 12"></path>
							</svg>
						</span>
					</button>
				)}
			</div>
		</div>
	)
}

export interface AlertBannerStackProps {
	banners: Banner[]
	className?: string
	onDismissBanner?: (id: BannerId) => void
	renderBanner?: (banner: Banner, dismiss: () => void) => ReactNode
}

export function AlertBannerStack({
	banners,
	className,
	onDismissBanner,
	renderBanner,
}: AlertBannerStackProps) {
	if (!banners.length) return null

	return (
		<div className={cn("flex flex-col shrink-0", className)}>
			{banners.map((banner) => {
				const dismiss = () => onDismissBanner?.(banner.id)

				if (renderBanner) {
					return <div key={banner.id}>{renderBanner(banner, dismiss)}</div>
				}

				return (
					<AlertBanner
						key={banner.id}
						tone={banner.tone}
						title={banner.title}
						description={banner.description}
						content={banner.content}
						action={banner.action}
						icon={banner.icon}
						dismissible={banner.dismissible}
						isDismissed={banner.isDismissed}
						className={banner.className}
						onDismiss={dismiss}
					/>
				)
			})}
		</div>
	)
}

export function AlertBannerStackFromProvider({
	className,
	renderBanner,
}: Omit<AlertBannerStackProps, "banners" | "onDismissBanner">) {
	const { banners, dismissBanner } = useBannerStack()

	return (
		<AlertBannerStack
			banners={banners}
			className={className}
			onDismissBanner={dismissBanner}
			renderBanner={renderBanner}
		/>
	)
}
