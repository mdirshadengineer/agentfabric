import type { ReactNode } from "react"

import { AlertBanner, type AlertBannerProps } from "../alert-banner-stack"

type AlertBannerErrorProps = Omit<
	AlertBannerProps,
	"tone" | "title" | "description"
> & {
	title?: ReactNode
	description?: ReactNode
}

export function AlertBannerError({
	title = "We are investigating a technical issue",
	description = (
		<>
			Follow the{" "}
			<a
				className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-inherit hover:text-foreground"
				href="https://status.supabase.com"
				target="_blank"
				rel="noreferrer noopener"
			>
				status page
			</a>{" "}
			for updates
		</>
	),
	...props
}: AlertBannerErrorProps) {
	return (
		<AlertBanner
			tone="error"
			title={title}
			description={description}
			{...props}
		/>
	)
}
