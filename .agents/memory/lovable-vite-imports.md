---
name: Imported Lovable apps in Vite artifacts
description: Durable guidance for bringing a Lovable/TanStack Start export into a Replit React-Vite artifact.
---

When a Lovable export is moved into a CSR Vite artifact, preserve its TanStack Router route tree but adapt the Start-only shell/server-function boundary for the client bundle. Keep the source project's public Supabase runtime configuration available if the generated client is strict about missing values.

**Why:** The export can typecheck and build while still failing at runtime if its Start shell renders nested document tags or if the generated Supabase client throws before the app's local fallbacks can render.

**How to apply:** Mount the imported router through the artifact's `main.tsx`, make the root shell fragment-only for CSR, provide a client-safe Start shim for imported server-function calls, and validate the preview in addition to typechecking/building.