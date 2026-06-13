import type { SetupResult } from "./run-setup.js";
import { runSetup } from "./run-setup.js";

export type InitResult = SetupResult;

export async function runInit(): Promise<InitResult> {
	return runSetup({ mode: "auto" });
}
