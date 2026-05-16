import type { ReactNode } from "react"

import { AlertBanner, type AlertBannerProps } from "../alert-banner-stack"

type AlertBannerWarningProps = Omit<
	AlertBannerProps,
	"tone" | "title" | "description"
> & {
	title?: ReactNode
	description?: ReactNode
}

export function AlertBannerWarning({
	title = "Service degradation detected",
	description = "Some workspace features may be slower than usual while we stabilize the system.",
	...props
}: AlertBannerWarningProps) {
	return (
		<AlertBanner
			tone="warning"
			title={title}
			description={description}
			{...props}
		/>
	)
}
