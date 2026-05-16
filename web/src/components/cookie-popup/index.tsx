import {
	IconChevronDown,
	IconCookie,
	IconExternalLink,
	IconShieldCheck,
} from "@tabler/icons-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type CookieCategory = "essential" | "functional" | "analytics" | "marketing"

export interface CookiePreferences {
	essential: true
	functional: boolean
	analytics: boolean
	marketing: boolean
}

type ConsentAction = "accept_all" | "reject_non_essential" | "save_preferences"

export interface CookieConsentRecord {
	consentId: string
	region: "GDPR"
	policyVersion: string
	updatedAt: string
	action: ConsentAction
	preferences: CookiePreferences
	storageKey: string
	policyUrl?: string
}

export type CookieMetricName =
	| "popup_viewed"
	| "details_opened"
	| "details_closed"
	| "consent_saved"
	| "consent_withdrawn"

export interface CookieMetric {
	name: CookieMetricName
	timestamp: string
	dwellTimeMs?: number
	consentId?: string
	details?: Record<string, string | number | boolean>
}

interface CookieCategoryMeta {
	key: CookieCategory
	title: string
	required: boolean
	description: string
	lawfulBasis: string
	retention: string
	providers: string
	cookies: string
	purpose: string
}

const COOKIE_CATEGORIES: CookieCategoryMeta[] = [
	{
		key: "essential",
		title: "Essential",
		required: true,
		description:
			"Required for authentication, security, and core app functionality.",
		lawfulBasis: "GDPR Art. 6(1)(b) and 6(1)(f)",
		retention: "Session to 12 months",
		providers: "First-party (AgentFabric)",
		cookies: "af_session, af_csrf",
		purpose: "Keep you signed in and protect against abuse.",
	},
	{
		key: "functional",
		title: "Functional",
		required: false,
		description:
			"Remembers preferences such as UI choices and workflow defaults.",
		lawfulBasis: "GDPR Art. 6(1)(a) consent",
		retention: "Up to 6 months",
		providers: "First-party (AgentFabric)",
		cookies: "af_theme, af_workspace_pref",
		purpose: "Improve usability without tracking ad behavior.",
	},
	{
		key: "analytics",
		title: "Analytics",
		required: false,
		description:
			"Helps us understand product performance and usage trends in aggregate.",
		lawfulBasis: "GDPR Art. 6(1)(a) consent",
		retention: "Up to 13 months",
		providers: "Configurable third-party or self-hosted analytics",
		cookies: "af_analytics_id, af_analytics_session",
		purpose: "Measure usage to improve reliability and feature quality.",
	},
	{
		key: "marketing",
		title: "Marketing",
		required: false,
		description:
			"Used to personalize campaigns and measure ad effectiveness across channels.",
		lawfulBasis: "GDPR Art. 6(1)(a) consent",
		retention: "Up to 90 days",
		providers: "Optional third-party ad platforms",
		cookies: "af_campaign, af_attribution",
		purpose: "Attribute conversions and limit repeated campaign impressions.",
	},
]

const DEFAULT_PREFERENCES: CookiePreferences = {
	essential: true,
	functional: false,
	analytics: false,
	marketing: false,
}

function createConsentId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID()
	}

	return `consent-${Date.now()}`
}

interface CookiePopupProps {
	storageKey?: string
	policyVersion?: string
	policyUrl?: string
	onConsentChange?: (record: CookieConsentRecord) => void
	onMetric?: (metric: CookieMetric) => void
	className?: string
	manageButtonLabel?: string
	showManageButton?: boolean
}

export function CookiePopup({
	storageKey = "agentfabric.cookie-consent",
	policyVersion = "2026-05-16",
	policyUrl,
	onConsentChange,
	onMetric,
	className,
	manageButtonLabel = "Privacy settings",
	showManageButton = true,
}: CookiePopupProps) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [isReady, setIsReady] = React.useState(false)
	const [detailsOpen, setDetailsOpen] = React.useState(false)
	const [preferences, setPreferences] =
		React.useState<CookiePreferences>(DEFAULT_PREFERENCES)
	const [hasStoredConsent, setHasStoredConsent] = React.useState(false)
	const [viewedAt, setViewedAt] = React.useState<number | null>(null)
	const [consentId, setConsentId] = React.useState<string>(createConsentId)

	const emitMetric = React.useCallback(
		(
			name: CookieMetricName,
			details?: Record<string, string | number | boolean>
		) => {
			onMetric?.({
				name,
				timestamp: new Date().toISOString(),
				dwellTimeMs: viewedAt ? Date.now() - viewedAt : undefined,
				consentId,
				details,
			})
		},
		[consentId, onMetric, viewedAt]
	)

	React.useEffect(() => {
		const rawConsent = window.localStorage.getItem(storageKey)
		if (!rawConsent) {
			setIsOpen(true)
			setIsReady(true)
			return
		}

		try {
			const parsed = JSON.parse(rawConsent) as CookieConsentRecord
			if (
				parsed?.preferences &&
				typeof parsed.preferences.functional === "boolean" &&
				typeof parsed.preferences.analytics === "boolean" &&
				typeof parsed.preferences.marketing === "boolean"
			) {
				setPreferences(parsed.preferences)
				setConsentId(parsed.consentId || createConsentId())
				setHasStoredConsent(true)
			}
		} catch {
			window.localStorage.removeItem(storageKey)
			setIsOpen(true)
		}

		setIsReady(true)
	}, [storageKey])

	React.useEffect(() => {
		if (!isOpen) {
			return
		}

		setViewedAt(Date.now())
		emitMetric("popup_viewed")
	}, [emitMetric, isOpen])

	const saveConsent = React.useCallback(
		(action: ConsentAction, nextPreferences: CookiePreferences) => {
			const nextConsentId = hasStoredConsent ? consentId : createConsentId()
			const record: CookieConsentRecord = {
				consentId: nextConsentId,
				region: "GDPR",
				policyVersion,
				updatedAt: new Date().toISOString(),
				action,
				preferences: nextPreferences,
				storageKey,
				policyUrl,
			}

			window.localStorage.setItem(storageKey, JSON.stringify(record))
			setConsentId(nextConsentId)
			setPreferences(nextPreferences)
			setHasStoredConsent(true)
			setIsOpen(false)
			onConsentChange?.(record)
			emitMetric("consent_saved", {
				action,
				functional: nextPreferences.functional,
				analytics: nextPreferences.analytics,
				marketing: nextPreferences.marketing,
			})
		},
		[
			consentId,
			emitMetric,
			hasStoredConsent,
			onConsentChange,
			policyUrl,
			policyVersion,
			storageKey,
		]
	)

	const handleAcceptAll = () => {
		saveConsent("accept_all", {
			essential: true,
			functional: true,
			analytics: true,
			marketing: true,
		})
	}

	const handleRejectNonEssential = () => {
		saveConsent("reject_non_essential", DEFAULT_PREFERENCES)
	}

	const handleSavePreferences = () => {
		saveConsent("save_preferences", preferences)
	}

	const handleWithdrawConsent = () => {
		window.localStorage.removeItem(storageKey)
		setConsentId(createConsentId())
		setPreferences(DEFAULT_PREFERENCES)
		setHasStoredConsent(false)
		setDetailsOpen(false)
		setIsOpen(true)
		emitMetric("consent_withdrawn")
	}

	if (!isReady) {
		return null
	}

	return (
		<>
			{isOpen && (
				<div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-3xl">
					<Card
						className={cn(
							"w-full border border-border/70 bg-card/98 backdrop-blur shadow-2xl",
							className
						)}
					>
						<CardHeader className="space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-2">
									<Badge
										variant="outline"
										className="gap-1.5 border-primary/30"
									>
										<IconShieldCheck className="size-3.5 text-primary" />
										GDPR consent
									</Badge>
									<CardTitle className="flex items-center gap-2">
										<IconCookie className="size-5 text-primary" />
										Cookies and tracking controls
									</CardTitle>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setDetailsOpen((current) => {
											const next = !current
											emitMetric(next ? "details_opened" : "details_closed")
											return next
										})
									}}
									className="shrink-0"
								>
									Details
									<IconChevronDown
										className={cn(
											"size-4 transition-transform",
											detailsOpen && "rotate-180"
										)}
									/>
								</Button>
							</div>
							<CardDescription>
								Trust-first consent: optional categories stay disabled until you
								choose them. You can update or withdraw consent anytime.
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							<div className="space-y-2">
								{COOKIE_CATEGORIES.map((category) => {
									const enabled = preferences[category.key]

									return (
										<div
											key={category.key}
											className="rounded-lg border border-border/70 p-3"
										>
											<div className="flex items-center justify-between gap-3">
												<div>
													<p className="font-medium leading-tight">
														{category.title}
													</p>
													<p className="text-xs text-muted-foreground mt-1">
														{category.description}
													</p>
												</div>
												<div className="flex items-center gap-2">
													{category.required && (
														<Badge variant="secondary">Required</Badge>
													)}
													<Switch
														size="sm"
														checked={enabled}
														disabled={category.required}
														onCheckedChange={(nextChecked) => {
															if (category.required) {
																return
															}

															setPreferences((current) => ({
																...current,
																[category.key]: nextChecked,
															}))
														}}
														aria-label={`${category.title} cookies`}
													/>
												</div>
											</div>
										</div>
									)
								})}
							</div>

							{detailsOpen && (
								<div className="space-y-4 rounded-lg border border-border/70 bg-muted/30 p-3">
									<Separator />
									<div className="space-y-2">
										<p className="text-sm font-medium">
											Consent metadata recorded
										</p>
										<ul className="text-xs text-muted-foreground space-y-1">
											<li>Region: GDPR</li>
											<li>Policy version: {policyVersion}</li>
											<li>Storage key: {storageKey}</li>
											<li>
												Timestamp: Consent update time is stored in ISO-8601
												format
											</li>
											<li>
												Action: accept all, reject non-essential, or custom save
											</li>
										</ul>
									</div>

									<div className="space-y-2">
										<p className="text-sm font-medium">
											Metrics events available
										</p>
										<ul className="text-xs text-muted-foreground space-y-1">
											<li>popup_viewed</li>
											<li>details_opened / details_closed</li>
											<li>consent_saved (with category choices)</li>
											<li>consent_withdrawn</li>
											<li>Optional dwellTimeMs to measure decision latency</li>
										</ul>
									</div>

									<div className="space-y-2">
										<p className="text-sm font-medium">Cookie register</p>
										<div className="overflow-x-auto">
											<table className="w-full text-xs">
												<thead>
													<tr className="text-left text-muted-foreground">
														<th className="pr-3 pb-2">Category</th>
														<th className="pr-3 pb-2">Purpose</th>
														<th className="pr-3 pb-2">Providers</th>
														<th className="pr-3 pb-2">Lawful basis</th>
														<th className="pb-2">Retention</th>
													</tr>
												</thead>
												<tbody>
													{COOKIE_CATEGORIES.map((category) => (
														<tr
															key={`meta-${category.key}`}
															className="align-top border-t"
														>
															<td className="pr-3 py-2 font-medium">
																{category.title}
															</td>
															<td className="pr-3 py-2">{category.purpose}</td>
															<td className="pr-3 py-2">
																{category.providers}
															</td>
															<td className="pr-3 py-2">
																{category.lawfulBasis}
															</td>
															<td className="py-2">{category.retention}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>

									{policyUrl && (
										<Button
											variant="link"
											asChild
											className="h-auto p-0 text-xs"
										>
											<a href={policyUrl} target="_blank" rel="noreferrer">
												View full privacy policy
												<IconExternalLink className="size-3.5" />
											</a>
										</Button>
									)}
								</div>
							)}
						</CardContent>

						<CardFooter className="flex flex-wrap items-center gap-2 justify-between">
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={handleRejectNonEssential}
								>
									Reject non-essential
								</Button>
								<Button
									type="button"
									variant="secondary"
									onClick={handleSavePreferences}
								>
									Save preferences
								</Button>
								<Button type="button" onClick={handleAcceptAll}>
									Accept all
								</Button>
							</div>
							{hasStoredConsent && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleWithdrawConsent}
								>
									Withdraw consent
								</Button>
							)}
						</CardFooter>
					</Card>
				</div>
			)}

			{showManageButton && hasStoredConsent && !isOpen && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setIsOpen(true)}
					className="fixed left-3 bottom-3 z-40 sm:left-4 sm:bottom-4"
				>
					<IconCookie className="size-4" />
					{manageButtonLabel}
				</Button>
			)}
		</>
	)
}
