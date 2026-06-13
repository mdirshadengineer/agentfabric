import { config as loadDotenv } from "dotenv";

export function loadDotenvIfAllowed(enabled: boolean | undefined): boolean {
	if (!enabled) {
		return true;
	}

	if (process.env.NODE_ENV === "production") {
		console.error(
			"The --dotenv flag is not allowed in production. Configure environment variables via the OS or deployment platform.",
		);
		process.exitCode = 1;
		return false;
	}

	loadDotenv({ quiet: true });
	return true;
}
