import type {
	CookieConsentRecord,
	CookiePreferences,
} from "@/components/cookie-popup"

declare global {
	interface Window {
		dataLayer?: unknown[]
		gtag?: (...args: unknown[]) => void
		clarity?: (...args: unknown[]) => void
		[key: `ga-disable-${string}`]: boolean | undefined
	}
}

const GA_MEASUREMENT_ID =
	import.meta.env.VITE_GA_MEASUREMENT_ID || "G-39CPWJJ31H"
const CLARITY_PROJECT_ID =
	import.meta.env.VITE_CLARITY_PROJECT_ID || "wruuxwkpkg"

const GA_SCRIPT_ID = "agentfabric-ga-script"
const CLARITY_SCRIPT_ID = "agentfabric-clarity-script"

let gaConfigured = false
let clarityBootstrapped = false

function loadScriptOnce(id: string, src: string) {
	if (document.getElementById(id)) {
		return
	}

	const script = document.createElement("script")
	script.id = id
	script.async = true
	script.src = src
	document.head.appendChild(script)
}

function initGaWhenConsented() {
	if (!GA_MEASUREMENT_ID) {
		return
	}

	window.dataLayer = window.dataLayer || []
	window.gtag =
		window.gtag ||
		function gtag(...args: unknown[]) {
			window.dataLayer?.push(args)
		}

	// Keep GA disabled until explicit analytics consent is granted.
	window[`ga-disable-${GA_MEASUREMENT_ID}`] = false
	loadScriptOnce(
		GA_SCRIPT_ID,
		`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
	)

	window.gtag("js", new Date())
	window.gtag("consent", "default", {
		analytics_storage: "granted",
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
	})

	if (!gaConfigured) {
		window.gtag("config", GA_MEASUREMENT_ID)
		gaConfigured = true
	}
}

function denyGaTracking() {
	if (!GA_MEASUREMENT_ID) {
		return
	}

	window[`ga-disable-${GA_MEASUREMENT_ID}`] = true
	window.gtag?.("consent", "update", {
		analytics_storage: "denied",
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
	})
}

function initClarityWhenConsented() {
	if (!CLARITY_PROJECT_ID || clarityBootstrapped) {
		window.clarity?.("consent", true)
		return
	}

	;(function (c, l, a, r, i) {
		c[a] =
			c[a] ||
			function (...args: unknown[]) {
				;(c[a].q = c[a].q || []).push(args)
			}

		const t = l.createElement(r)
		// @ts-ignore
		t.async = true
		t.id = CLARITY_SCRIPT_ID
		// @ts-ignore
		t.src = `https://www.clarity.ms/tag/${encodeURIComponent(i)}`
		const y = l.getElementsByTagName(r)[0]
		y.parentNode?.insertBefore(t, y)
	})(
		window as Record<string, any>,
		document,
		"clarity",
		"script",
		CLARITY_PROJECT_ID
	)

	window.clarity?.("consent", true)
	clarityBootstrapped = true
}

function denyClarityTracking() {
	if (!CLARITY_PROJECT_ID) {
		return
	}

	window.clarity?.("consent", false)
}

export function applyAnalyticsConsent(preferences: CookiePreferences) {
	if (preferences.analytics) {
		initGaWhenConsented()
		initClarityWhenConsented()
		return
	}

	denyGaTracking()
	denyClarityTracking()
}

export function applyStoredConsent(storageKey: string) {
	const rawConsent = window.localStorage.getItem(storageKey)
	if (!rawConsent) {
		applyAnalyticsConsent({
			essential: true,
			functional: false,
			analytics: false,
			marketing: false,
		})
		return
	}

	try {
		const parsed = JSON.parse(rawConsent) as CookieConsentRecord
		if (parsed?.preferences) {
			applyAnalyticsConsent(parsed.preferences)
			return
		}
	} catch {
		window.localStorage.removeItem(storageKey)
	}

	applyAnalyticsConsent({
		essential: true,
		functional: false,
		analytics: false,
		marketing: false,
	})
}
