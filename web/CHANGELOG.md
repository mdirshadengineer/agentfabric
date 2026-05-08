# agentfabric-web

## 0.0.2

### Patch Changes

- [#5](https://github.com/mdirshadengineer/agentfabric/pull/5) [`f1068b8`](https://github.com/mdirshadengineer/agentfabric/commit/f1068b8ce4f5399ea5785a6e34508f4673ec210a) Thanks [@mdirshadengineer](https://github.com/mdirshadengineer)! - `agentfabric` cli starts the fastify server and serves the `agentfabric-web` static files from the `dist/ui` directory. This means that:

  - vite build of `agentfabric-web` is now part of the `agentfabric` build process, and the output is placed in the `dist/ui` directory.
  - tanstack router is now used in `agentfabric-web` for client-side routing, which allows for better performance and a more seamless user experience.
  - shadcn UI components are now used in `agentfabric-web` for a more modern and consistent design.
  - the `agentfabric` cli will serve the static files from the `dist/ui` directory when it starts the fastify server.
