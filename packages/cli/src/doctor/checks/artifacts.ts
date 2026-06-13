import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { join } from "node:path";
import { AGENTFABRIC_FRONTEND_ENABLED } from "../../global.config.js";
import { ProcessStore } from "../../process/process-store.js";
import type { ProcessRecord } from "../../process/process-types.js";
import { getPackageRoot } from "../paths.js";
import { createCheck, createGroup, type DoctorGroup } from "../types.js";

const VITE_DEV_PORT = 5173;
const PROBE_TIMEOUT_MS = 2000;

function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function listRunningProcesses(): ProcessRecord[] {
	const store = new ProcessStore();
	return store
		.load()
		.filter((processRecord) => isProcessAlive(processRecord.pid));
}

function isFrontendEnabled(): boolean {
	const raw = process.env.AGENTFABRIC_FRONTEND_ENABLED;
	if (raw === undefined) {
		return AGENTFABRIC_FRONTEND_ENABLED;
	}
	return raw === "true" || raw === "1";
}

function getBuiltUiPath(): string {
	return join(getPackageRoot(), "dist", "ui", "index.html");
}

function probeTcpPort(host: string, port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = createConnection({ host, port });
		const timer = setTimeout(() => {
			socket.destroy();
			resolve(false);
		}, PROBE_TIMEOUT_MS);

		socket.on("connect", () => {
			clearTimeout(timer);
			socket.end();
			resolve(true);
		});

		socket.on("error", () => {
			clearTimeout(timer);
			resolve(false);
		});
	});
}

export async function runArtifactChecks(): Promise<DoctorGroup> {
	const checks = [];
	const isDev = process.env.NODE_ENV !== "production";
	const uiPath = getBuiltUiPath();
	const uiExists = existsSync(uiPath);

	if (isDev) {
		checks.push(
			createCheck(
				"built-ui",
				"Built UI",
				"info",
				uiExists
					? `dist/ui/index.html found (not required in development)`
					: "dist/ui/index.html not found (not required in development)",
			),
		);

		const viteReachable = await probeTcpPort("127.0.0.1", VITE_DEV_PORT);
		checks.push(
			createCheck(
				"vite-dev-server",
				"Vite dev server",
				viteReachable ? "pass" : "warn",
				viteReachable
					? `reachable at localhost:${VITE_DEV_PORT}`
					: `not reachable at localhost:${VITE_DEV_PORT}`,
				viteReachable ? undefined : "Start the web dev server with pnpm dev",
			),
		);
	} else if (isFrontendEnabled()) {
		checks.push(
			createCheck(
				"built-ui",
				"Built UI",
				uiExists ? "pass" : "warn",
				uiExists ? "dist/ui/index.html found" : "dist/ui/index.html not found",
				uiExists ? undefined : "Run pnpm build before starting in production",
			),
		);
	} else {
		checks.push(
			createCheck(
				"built-ui",
				"Built UI",
				"info",
				"frontend serving disabled (AGENTFABRIC_FRONTEND_ENABLED=false)",
			),
		);
	}

	let processMessage = "none";

	try {
		const processes = listRunningProcesses();
		processMessage =
			processes.length === 0
				? "none"
				: `${processes.length} process${processes.length === 1 ? "" : "es"} (${processes.map((p) => p.id).join(", ")})`;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		processMessage = `unable to read process registry (${message})`;
	}

	checks.push(
		createCheck(
			"running-processes",
			"Running processes",
			"info",
			processMessage,
		),
	);

	return createGroup("artifacts", "Artifacts", checks);
}
