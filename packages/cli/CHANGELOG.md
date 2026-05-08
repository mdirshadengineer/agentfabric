# agentfabric

## 0.0.2

### Patch Changes

- [#5](https://github.com/mdirshadengineer/agentfabric/pull/5) [`f1068b8`](https://github.com/mdirshadengineer/agentfabric/commit/f1068b8ce4f5399ea5785a6e34508f4673ec210a) Thanks [@mdirshadengineer](https://github.com/mdirshadengineer)! - `agentfabric` cli starts the fastify server and serves the `agentfabric-web` static files from the `dist/ui` directory. This means that:

  - vite build of `agentfabric-web` is now part of the `agentfabric` build process, and the output is placed in the `dist/ui` directory.
  - tanstack router is now used in `agentfabric-web` for client-side routing, which allows for better performance and a more seamless user experience.
  - shadcn UI components are now used in `agentfabric-web` for a more modern and consistent design.
  - the `agentfabric` cli will serve the static files from the `dist/ui` directory when it starts the fastify server.

## 0.0.1

### Patch Changes

- [#3](https://github.com/mdirshadengineer/agentfabric/pull/3) [`78888e7`](https://github.com/mdirshadengineer/agentfabric/commit/78888e7fcf010286f46e9bdf239f1ed4e2e0b435) Thanks [@mdirshadengineer](https://github.com/mdirshadengineer)! - # 🧠 AgentFabric
  AgentFabric is a **minimal CLI tool** for managing agent processes. It provides a simple interface to start, stop, and monitor agents, ensuring they run reliably in the background.

  # 🛠️ Changes Made

  - Added a new CLI tool for process lifecycle management.
  - Implemented features for detached execution, status inspection, and graceful shutdown.
  - Designed the tool to be self-healing and maintain an active process registry.

  # 🚀 Benefits

  - Simplifies agent management with a user-friendly CLI.
  - Improves reliability through self-healing capabilities.
  - Ensures no stale processes remain in the registry, providing accurate status information.
