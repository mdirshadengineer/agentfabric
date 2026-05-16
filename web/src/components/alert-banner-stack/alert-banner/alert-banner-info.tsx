import type { ReactNode } from "react"

import { AlertBanner, type AlertBannerProps } from "../alert-banner-stack"

type AlertBannerInfoProps = Omit<
	AlertBannerProps,
	"tone" | "title" | "description" | "action"
> & {
	title?: ReactNode
	description?: ReactNode
	action?: ReactNode
	onLearnMore?: () => void
	learnMoreLabel?: string
}

export function AlertBannerInfo({
	title = "We've updated our Terms of Service",
	description = "Please review what changed before continuing your next deployment.",
	action,
	onLearnMore,
	learnMoreLabel = "Learn more",
	...props
}: AlertBannerInfoProps) {
	const resolvedAction =
		action ??
		(onLearnMore ? (
			<button
				type="button"
				className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-inherit hover:text-foreground cursor-pointer"
				onClick={onLearnMore}
			>
				{learnMoreLabel}
			</button>
		) : null)

	return (
		<AlertBanner
			tone="info"
			title={title}
			description={description}
			action={resolvedAction}
			{...props}
		/>
	)
}
