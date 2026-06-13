import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPackageRoot } from "../paths.js";
import { createCheck, createGroup, type DoctorGroup } from "../types.js";

function isNodeVersionSupported(current: string, range: string): boolean {
	const match = /^>=(\d+)/.exec(range);
	if (!match) {
		return true;
	}

	const minMajor = Number(match[1]);
	const currentMajor = Number(current.split(".")[0]);
	return Number.isInteger(currentMajor) && currentMajor >= minMajor;
}

export function runRuntimeChecks(): DoctorGroup {
	const { version, engines } = JSON.parse(
		readFileSync(join(getPackageRoot(), "package.json"), "utf8"),
	) as {
		version: string;
		engines: { node: string };
	};

	const checks = [];
	const currentNodeVersion = process.versions.node;
	const nodeSupported = isNodeVersionSupported(
		currentNodeVersion,
		engines.node,
	);

	checks.push(
		createCheck(
			"node-version",
			"Node.js",
			nodeSupported ? "pass" : "fail",
			nodeSupported
				? `v${currentNodeVersion} (requires ${engines.node})`
				: `v${currentNodeVersion} does not satisfy ${engines.node}`,
			nodeSupported
				? undefined
				: "Upgrade Node.js: https://nodejs.org/en/download",
		),
	);

	checks.push(createCheck("cli-version", "agentfabric", "pass", version));

	return createGroup("runtime", "Runtime", checks);
}
