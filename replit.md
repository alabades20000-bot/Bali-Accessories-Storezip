# Bali Accessories Store

Arabic-first mobile accessories storefront with a Bali-inspired visual identity,
an Express API, and a component preview sandbox.

## Run & Operate

- `pnpm install --frozen-lockfile` — install the workspace dependencies
- `pnpm --filter @workspace/bali-store run dev` — run the storefront
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/mockup-sandbox run dev` — run the component preview sandbox
- `pnpm run typecheck` — full typecheck across all packages
- `PORT=18250 BASE_PATH=/ pnpm --filter @workspace/bali-store run build` — build the storefront
- `pnpm --filter @workspace/api-server run build` — build the API server
- Storefront workflow environment: `PORT=18250`, `BASE_PATH=/`
- API server listens on the workflow-provided `PORT` and exposes `/api/healthz`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React, Vite, TanStack Router/Start compatibility layer, Tailwind CSS
- API: Express 5 with esbuild
- Data integrations: Supabase client and shared workspace libraries

## Where things live

- `artifacts/bali-store/` — storefront source and Vite configuration
- `artifacts/api-server/` — Express API source and build configuration
- `artifacts/mockup-sandbox/` — component preview source
- `artifacts/*/.replit-artifact/artifact.toml` — artifact paths, ports, and workflow settings

## Architecture decisions

- The existing pnpm workspace and artifact structure are preserved.
- The storefront uses `/` as its preview base path.
- The API is routed through `/api` and provides `/api/healthz` for health checks.

## Product

Users can browse mobile accessories, search products, explore categories, and use
cart and promotion flows through an Arabic-first storefront.

## User preferences

No project-specific preferences recorded.

## Gotchas

- The storefront Vite config requires both `PORT` and `BASE_PATH`; artifact workflows provide them automatically.
- Run production builds with those variables set when invoking them manually.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
