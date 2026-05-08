---
"agentfabric": patch
"agentfabric-web": patch
---

`agentfabric` cli starts the fastify server and serves the `agentfabric-web` static files from the `dist/ui` directory. This means that:

- vite build of `agentfabric-web` is now part of the `agentfabric` build process, and the output is placed in the `dist/ui` directory.
- tanstack router is now used in `agentfabric-web` for client-side routing, which allows for better performance and a more seamless user experience.
- shadcn UI components are now used in `agentfabric-web` for a more modern and consistent design.
- the `agentfabric` cli will serve the static files from the `dist/ui` directory when it starts the fastify server.
