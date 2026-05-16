import type { ReactNode } from "react"
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"

export const BANNER_DISMISS_ANIMATION_MS = 300
export const BANNER_DISMISS_STORAGE_KEY = "alert-banner-stack.dismissed"

export type BannerTone = "info" | "warning" | "error" | "success" | "neutral"
export type BannerDismissStorageType = "none" | "localStorage" | "cookie"

export interface BannerDismissPersistenceConfig {
	type?: BannerDismissStorageType
	key?: string
	cookieMaxAgeSeconds?: number
	cookiePath?: string
}

interface BannerDismissPersistenceResolved {
	type: BannerDismissStorageType
	key: string
	cookieMaxAgeSeconds: number
	cookiePath: string
}

export const BANNER_ID = {
	METRICS_API: "metrics-api-banner",
	INDEX_ADVISOR: "index-advisor-banner",
	TABLE_EDITOR_QUEUE_OPERATIONS: "table-editor-queue-operations-banner",
	RLS_EVENT_TRIGGER: "rls-event-trigger-banner",
	RLS_TESTER: "rls-tester-banner",
	FREE_MICRO_UPGRADE: "free-micro-upgrade-banner",
} as const

export type BannerId = (typeof BANNER_ID)[keyof typeof BANNER_ID] | string

export interface Banner {
	id: BannerId
	title?: ReactNode
	description?: ReactNode
	content?: ReactNode
	action?: ReactNode
	icon?: ReactNode
	tone?: BannerTone
	className?: string
	dismissible?: boolean
	isDismissed: boolean
	priority?: number
	autoDismissMs?: number
	persistDismissal?: boolean
	dismissalKey?: string
	createdAt: number
	onDismiss?: () => void
}

export interface BannerInput {
	id: BannerId
	title?: ReactNode
	description?: ReactNode
	content?: ReactNode
	action?: ReactNode
	icon?: ReactNode
	tone?: BannerTone
	className?: string
	dismissible?: boolean
	priority?: number
	autoDismissMs?: number
	persistDismissal?: boolean
	dismissalKey?: string
	onDismiss?: () => void
	replaceExisting?: boolean
}

interface BannerStackContextType {
	banners: Banner[]
	addBanner: (banner: BannerInput) => void
	updateBanner: (id: BannerId, patch: Partial<BannerInput>) => void
	dismissBanner: (id: BannerId) => void
	removeBanner: (id: BannerId) => void
	clearBanners: () => void
	resetBannerDismissal: (id: BannerId, dismissalKey?: string) => void
	clearDismissedPersistence: () => void
	isDismissedPersisted: (id: BannerId, dismissalKey?: string) => boolean
}

const BannerStackContext = createContext<BannerStackContextType | undefined>(
	undefined
)

const isBrowser =
	typeof window !== "undefined" && typeof document !== "undefined"

function normalizePersistenceConfig(
	persistence?: BannerDismissPersistenceConfig
): BannerDismissPersistenceResolved {
	return {
		type: persistence?.type ?? "none",
		key: persistence?.key ?? BANNER_DISMISS_STORAGE_KEY,
		cookieMaxAgeSeconds: persistence?.cookieMaxAgeSeconds ?? 60 * 60 * 24 * 30,
		cookiePath: persistence?.cookiePath ?? "/",
	}
}

function parseDismissedKeys(raw: string | null | undefined): string[] {
	if (!raw) return []
	try {
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return []
		return parsed.filter((value): value is string => typeof value === "string")
	} catch {
		return []
	}
}

function readCookieValue(name: string): string | null {
	if (!isBrowser) return null
	const cookie = document.cookie
	if (!cookie) return null
	const segments = cookie.split(";")
	for (const segment of segments) {
		const [rawName, ...rest] = segment.trim().split("=")
		if (decodeURIComponent(rawName) !== name) continue
		return decodeURIComponent(rest.join("="))
	}
	return null
}

function writeCookieValue(
	name: string,
	value: string,
	maxAgeSeconds: number,
	path: string
) {
	if (!isBrowser) return
	document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=${path}; SameSite=Lax`
}

function readPersistedDismissedKeys(
	config: BannerDismissPersistenceResolved
): Set<string> {
	if (!isBrowser || config.type === "none") return new Set<string>()

	if (config.type === "localStorage") {
		const raw = window.localStorage.getItem(config.key)
		return new Set(parseDismissedKeys(raw))
	}

	const raw = readCookieValue(config.key)
	return new Set(parseDismissedKeys(raw))
}

function writePersistedDismissedKeys(
	config: BannerDismissPersistenceResolved,
	keys: Set<string>
) {
	if (!isBrowser || config.type === "none") return
	const serialized = JSON.stringify(Array.from(keys.values()))

	if (config.type === "localStorage") {
		window.localStorage.setItem(config.key, serialized)
		return
	}

	writeCookieValue(
		config.key,
		serialized,
		config.cookieMaxAgeSeconds,
		config.cookiePath
	)
}

export const BannerStackProvider = ({
	children,
	persistence,
}: {
	children: ReactNode
	persistence?: BannerDismissPersistenceConfig
}) => {
	const [banners, setBanners] = useState<Banner[]>([])
	const autoDismissTimersRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({})
	const persistedDismissedKeysRef = useRef<Set<string>>(new Set())
	const persistenceConfig = useMemo(
		() => normalizePersistenceConfig(persistence),
		[persistence]
	)

	const clearAutoDismissTimer = useCallback((id: BannerId) => {
		const key = String(id)
		const timer = autoDismissTimersRef.current[key]
		if (!timer) return
		clearTimeout(timer)
		delete autoDismissTimersRef.current[key]
	}, [])

	const getDismissalStorageKey = useCallback(
		(id: BannerId, dismissalKey?: string) => dismissalKey ?? String(id),
		[]
	)

	const persistDismissedKey = useCallback(
		(key: string) => {
			if (persistenceConfig.type === "none") return
			persistedDismissedKeysRef.current.add(key)
			writePersistedDismissedKeys(
				persistenceConfig,
				persistedDismissedKeysRef.current
			)
		},
		[persistenceConfig]
	)

	const removePersistedDismissedKey = useCallback(
		(key: string) => {
			if (persistenceConfig.type === "none") return
			persistedDismissedKeysRef.current.delete(key)
			writePersistedDismissedKeys(
				persistenceConfig,
				persistedDismissedKeysRef.current
			)
		},
		[persistenceConfig]
	)

	const clearPersistedDismissedKeys = useCallback(() => {
		if (persistenceConfig.type === "none") return
		persistedDismissedKeysRef.current = new Set<string>()
		writePersistedDismissedKeys(
			persistenceConfig,
			persistedDismissedKeysRef.current
		)
	}, [persistenceConfig])

	const isDismissedPersisted = useCallback(
		(id: BannerId, dismissalKey?: string) => {
			if (persistenceConfig.type === "none") return false
			const key = getDismissalStorageKey(id, dismissalKey)
			return persistedDismissedKeysRef.current.has(key)
		},
		[getDismissalStorageKey, persistenceConfig.type]
	)

	const dismissBanner = useCallback(
		(id: BannerId) => {
			let shouldPersistDismissal = false
			let dismissStorageKey = String(id)

			setBanners((prev) =>
				prev.map((b) => {
					if (b.id !== id) return b
					shouldPersistDismissal = Boolean(b.persistDismissal)
					dismissStorageKey = getDismissalStorageKey(b.id, b.dismissalKey)
					b.onDismiss?.()
					return { ...b, isDismissed: true }
				})
			)

			if (shouldPersistDismissal) {
				persistDismissedKey(dismissStorageKey)
			}

			clearAutoDismissTimer(id)
			setTimeout(() => {
				setBanners((prev) => prev.filter((b) => b.id !== id))
			}, BANNER_DISMISS_ANIMATION_MS)
		},
		[clearAutoDismissTimer, getDismissalStorageKey, persistDismissedKey]
	)

	const registerAutoDismiss = useCallback(
		(id: BannerId, autoDismissMs?: number) => {
			clearAutoDismissTimer(id)
			if (!autoDismissMs || autoDismissMs <= 0) return
			autoDismissTimersRef.current[String(id)] = setTimeout(() => {
				dismissBanner(id)
			}, autoDismissMs)
		},
		[clearAutoDismissTimer, dismissBanner]
	)

	const addBanner = useCallback(
		(banner: BannerInput) => {
			const dismissStorageKey = getDismissalStorageKey(
				banner.id,
				banner.dismissalKey
			)

			if (
				banner.persistDismissal &&
				!banner.replaceExisting &&
				persistedDismissedKeysRef.current.has(dismissStorageKey)
			) {
				return
			}

			if (banner.persistDismissal && banner.replaceExisting) {
				removePersistedDismissedKey(dismissStorageKey)
			}

			setBanners((prev) => {
				const exists = prev.find((b) => b.id === banner.id)
				if (exists && !banner.replaceExisting) {
					return prev
				}

				const nextBanner: Banner = {
					id: banner.id,
					title: banner.title,
					description: banner.description,
					content: banner.content,
					action: banner.action,
					icon: banner.icon,
					tone: banner.tone ?? "info",
					className: banner.className,
					dismissible: banner.dismissible ?? true,
					isDismissed: false,
					priority: banner.priority ?? 0,
					autoDismissMs: banner.autoDismissMs,
					persistDismissal: banner.persistDismissal ?? false,
					dismissalKey: banner.dismissalKey,
					onDismiss: banner.onDismiss,
					createdAt: exists?.createdAt ?? Date.now(),
				}

				const withoutExisting = prev.filter((b) => b.id !== banner.id)
				const newBanners = [...withoutExisting, nextBanner]
				return newBanners.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
			})

			registerAutoDismiss(banner.id, banner.autoDismissMs)
		},
		[getDismissalStorageKey, registerAutoDismiss, removePersistedDismissedKey]
	)

	const updateBanner = useCallback(
		(id: BannerId, patch: Partial<BannerInput>) => {
			const { replaceExisting: _replaceExisting, ...safePatch } = patch
			if (patch.replaceExisting) {
				const dismissStorageKey = getDismissalStorageKey(id, patch.dismissalKey)
				removePersistedDismissedKey(dismissStorageKey)
			}

			setBanners((prev) => {
				const next = prev.map((banner) => {
					if (banner.id !== id) return banner
					return {
						...banner,
						...safePatch,
						isDismissed: patch.replaceExisting ? false : banner.isDismissed,
					}
				})

				return next.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
			})

			if (patch.autoDismissMs !== undefined) {
				registerAutoDismiss(id, patch.autoDismissMs)
			}
		},
		[getDismissalStorageKey, registerAutoDismiss, removePersistedDismissedKey]
	)

	const removeBanner = useCallback(
		(id: BannerId) => {
			clearAutoDismissTimer(id)
			setBanners((prev) => prev.filter((b) => b.id !== id))
		},
		[clearAutoDismissTimer]
	)

	const clearBanners = useCallback(() => {
		Object.values(autoDismissTimersRef.current).forEach((timer) => {
			clearTimeout(timer)
		})
		autoDismissTimersRef.current = {}
		setBanners([])
	}, [])

	const resetBannerDismissal = useCallback(
		(id: BannerId, dismissalKey?: string) => {
			const key = getDismissalStorageKey(id, dismissalKey)
			removePersistedDismissedKey(key)
		},
		[getDismissalStorageKey, removePersistedDismissedKey]
	)

	useEffect(() => {
		persistedDismissedKeysRef.current =
			readPersistedDismissedKeys(persistenceConfig)
	}, [persistenceConfig])

	useEffect(() => {
		return () => {
			Object.values(autoDismissTimersRef.current).forEach((timer) => {
				clearTimeout(timer)
			})
			autoDismissTimersRef.current = {}
		}
	}, [])

	const value = useMemo(
		() => ({
			banners,
			addBanner,
			updateBanner,
			dismissBanner,
			removeBanner,
			clearBanners,
			resetBannerDismissal,
			clearDismissedPersistence: clearPersistedDismissedKeys,
			isDismissedPersisted,
		}),
		[
			banners,
			addBanner,
			updateBanner,
			dismissBanner,
			removeBanner,
			clearBanners,
			resetBannerDismissal,
			clearPersistedDismissedKeys,
			isDismissedPersisted,
		]
	)

	return (
		<BannerStackContext.Provider value={value}>
			{children}
		</BannerStackContext.Provider>
	)
}

export const useBannerStack = () => {
	const context = useContext(BannerStackContext)
	if (!context)
		throw new Error("useBannerStack must be used within BannerStackProvider")
	return context
}
