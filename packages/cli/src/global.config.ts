// Global configuration for the agentfabric application.
export const AGENTFABRIC_DEFAULT_COMMAND = "start";

export const AGENTFABRIC_API_SERVER_PORT = 5678; // Port for the API server

export const AGENTFABRIC_LOG_LEVEL: string = "info"; // Default log level

export const AGENTFABRIC_RUNTIME_DIR: string = ".agentfabric"; // Directory for runtime files

export const AGENTFABRIC_LOG_DIR: string = "logs"; // Directory for log files within the runtime directory

export const AGENTFABRIC_FRONTEND_ENABLED: boolean = true; // Whether to serve the frontend UI

export const AGENTFABRIC_AUTH_SESSION_POLICY_MODE = "max-sessions"; // keep-latest | block-new-login | max-sessions

export const AGENTFABRIC_AUTH_MAX_SESSIONS = 5; // Used when policy mode is max-sessions or block-new-login

export const AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE = 2; // Max active sessions per user/deviceId

export const AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP = 5; // Max active sessions per user/IP

export const POLL_INTERVAL_MS: number = 200; // 200ms

export const GRACEFUL_SHUTDOWN_TIMEOUT_MS: number = 5000; // 5 seconds
