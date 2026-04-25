// Global configuration for the agentfabric application.
export const AGENTFABRIC_DEFAULT_COMMAND = "start";

export const AGENTFABRIC_API_SERVER_PORT = 3000;

export const AGENTFABRIC_LOG_LEVEL: string = "info"; // Default log level

export const AGENTFABRIC_RUNTIME_DIR: string = ".agentfabric"; // Directory for runtime files

export const AGENTFABRIC_LOG_DIR: string = "logs"; // Directory for log files within the runtime directory

export const AGENTFABRIC_FRONTEND_ENABLED: boolean = true; // Whether to serve the frontend UI

export const POLL_INTERVAL_MS: number = 200; // 200ms

export const GRACEFUL_SHUTDOWN_TIMEOUT_MS: number = 5000; // 5 seconds
