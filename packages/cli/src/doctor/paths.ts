import { createRequire } from "node:module";
import { dirname } from "node:path";

export function getPackageRoot(): string {
	const require = createRequire(import.meta.url);
	const packageJsonPath = require.resolve("../../package.json");
	return dirname(packageJsonPath);
}
