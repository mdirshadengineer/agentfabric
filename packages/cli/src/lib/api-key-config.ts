const API_KEY_CONFIG_IDS = {
	public: "public",
	secret: "secret",
} as const;

function inferApiKeyConfigIdFromKey(key: string): string | null {
	if (key.startsWith("pk_")) {
		return API_KEY_CONFIG_IDS.public;
	}

	if (key.startsWith("sk_")) {
		return API_KEY_CONFIG_IDS.secret;
	}

	return null;
}

export { API_KEY_CONFIG_IDS, inferApiKeyConfigIdFromKey };
