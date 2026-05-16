import {
	IconKey,
	IconPlayerPlay,
	IconRefresh,
	IconShieldLock,
} from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authBaseURL } from "@/lib/auth"

export const Route = createFileRoute("/test-table-apikey-integration")({
	component: RouteComponent,
})

type RequestState = "idle" | "loading"

function formatJson(value: unknown) {
	if (value === undefined) {
		return ""
	}

	return JSON.stringify(value, null, 2)
}

function buildEndpoint(
	baseUrl: string,
	table: string,
	limit: number,
	offset: number
) {
	const normalizedBase = baseUrl.trim().replace(/\/$/, "") || authBaseURL
	const url = new URL(`${normalizedBase}/api/v1/table/table`)
	url.searchParams.set("name", table)
	url.searchParams.set("limit", String(limit))
	url.searchParams.set("offset", String(offset))
	return url.toString()
}

function RouteComponent() {
	const [baseUrl, setBaseUrl] = useState(authBaseURL)
	const [apiKey, setApiKey] = useState("")
	const [tableName, setTableName] = useState("session")
	const [limit, setLimit] = useState("25")
	const [offset, setOffset] = useState("0")
	const [requestState, setRequestState] = useState<RequestState>("idle")
	const [status, setStatus] = useState("Ready")
	const [responseStatus, setResponseStatus] = useState<number | null>(null)
	const [responseHeaders, setResponseHeaders] = useState<
		Record<string, string>
	>({})
	const [responseBody, setResponseBody] = useState<unknown>(null)

	const requestPreview = useMemo(() => {
		const parsedLimit = Number.parseInt(limit, 10)
		const parsedOffset = Number.parseInt(offset, 10)
		const requestUrl = buildEndpoint(
			baseUrl,
			tableName,
			Number.isFinite(parsedLimit) && parsedLimit >= 0 ? parsedLimit : 25,
			Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0
		)

		const maskedKey = apiKey
			? `${apiKey.slice(0, 6)}...${apiKey.slice(Math.max(apiKey.length - 4, 6))}`
			: "<missing>"

		return {
			method: "GET",
			url: requestUrl,
			headers: {
				Authorization: `Bearer ${maskedKey}`,
				"Content-Type": "application/json",
			},
		}
	}, [apiKey, baseUrl, limit, offset, tableName])

	async function handleRunRequest() {
		setRequestState("loading")
		setStatus("Sending request...")

		try {
			const parsedLimit = Number.parseInt(limit, 10)
			const parsedOffset = Number.parseInt(offset, 10)
			const endpoint = buildEndpoint(
				baseUrl,
				tableName,
				Number.isFinite(parsedLimit) && parsedLimit >= 0 ? parsedLimit : 25,
				Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0
			)

			const response = await fetch(endpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${apiKey.trim()}`,
				},
			})

			const headersObject = Object.fromEntries(response.headers.entries())
			setResponseHeaders(headersObject)
			setResponseStatus(response.status)

			let payload: unknown = null
			try {
				payload = await response.json()
			} catch {
				payload = await response.text()
			}

			setResponseBody(payload)
			setStatus(
				response.ok
					? "Request completed successfully"
					: "Request failed. Inspect status and payload below."
			)
		} catch (error) {
			setResponseStatus(null)
			setResponseHeaders({})
			setResponseBody({
				message: error instanceof Error ? error.message : "Unknown error",
			})
			setStatus("Request failed due to network/runtime error")
		} finally {
			setRequestState("idle")
		}
	}

	function resetScenario() {
		setApiKey("")
		setTableName("session")
		setLimit("25")
		setOffset("0")
		setResponseStatus(null)
		setResponseHeaders({})
		setResponseBody(null)
		setStatus("Ready")
	}

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-10">
			<Card className="border-border/70">
				<CardHeader className="space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline" className="gap-1.5 border-primary/30">
							<IconShieldLock className="size-3.5 text-primary" />
							API Key Integration Test
						</Badge>
						<Badge variant="secondary">Third-party style Bearer auth</Badge>
					</div>
					<CardTitle>Session table access playground</CardTitle>
					<CardDescription>
						Use this page to test GET /api/v1/table/table?name=session using
						Authorization Bearer API key, same as Postman.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-medium">API base URL</label>
							<Input
								value={baseUrl}
								onChange={(event) => setBaseUrl(event.target.value)}
								placeholder="http://localhost:5678"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Authorization Bearer API key
							</label>
							<Input
								value={apiKey}
								onChange={(event) => setApiKey(event.target.value)}
								placeholder="pk_xxx or sk_xxx"
								type="password"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Table name</label>
							<Input
								value={tableName}
								onChange={(event) => setTableName(event.target.value)}
								placeholder="session"
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-2">
								<label className="text-sm font-medium">Limit</label>
								<Input
									value={limit}
									onChange={(event) => setLimit(event.target.value)}
									inputMode="numeric"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium">Offset</label>
								<Input
									value={offset}
									onChange={(event) => setOffset(event.target.value)}
									inputMode="numeric"
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							onClick={handleRunRequest}
							disabled={requestState === "loading"}
						>
							<IconPlayerPlay className="size-4" />
							{requestState === "loading" ? "Running..." : "Run request"}
						</Button>
						<Button type="button" variant="outline" onClick={resetScenario}>
							<IconRefresh className="size-4" />
							Reset
						</Button>
					</div>

					<p className="text-sm text-muted-foreground">{status}</p>

					<div className="grid gap-4 lg:grid-cols-3">
						<Card className="border-border/60 lg:col-span-1">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<IconKey className="size-4" />
									Request preview
								</CardTitle>
							</CardHeader>
							<CardContent>
								<pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-5">
									{formatJson(requestPreview)}
								</pre>
							</CardContent>
						</Card>

						<Card className="border-border/60 lg:col-span-2">
							<CardHeader>
								<CardTitle className="text-base">
									Response{" "}
									{responseStatus !== null ? `(HTTP ${responseStatus})` : ""}
								</CardTitle>
								<CardDescription>
									Use invalid/missing key and invalid table name to verify
									security constraints.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-sm font-medium mb-2">Headers</p>
									<pre className="max-h-40 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-5">
										{formatJson(responseHeaders)}
									</pre>
								</div>
								<div>
									<p className="text-sm font-medium mb-2">Body</p>
									<pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-5">
										{formatJson(responseBody)}
									</pre>
								</div>
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
