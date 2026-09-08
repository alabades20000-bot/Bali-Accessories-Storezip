# AI Rules & Architecture Guidelines

## Tech Stack Overview

- **<dyad-write path="AI_RULES.md" description="Create AI_RULES.md detailing tech stack and library rules">
# AI Rules & Architectural Guidelines

## Tech Stack Overview

- **Framework & SSR**: TanStack Start (full-stack React 19 framework) on Vite with SSR and Nitro deployment targets.
- **Routing**: TanStack Router using file-based routing (`src/routes/`) with typesafe navigation, route loaders, and search/path params.
- **Data Fetching & Cache**: TanStack React Query v5 for client queries, mutations, cache invalidation, and server state synchronisation.
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security, Storage buckets for images, and Supabase Auth).
- **Server Functions**: TanStack Start `createServerFn` (`*.functions.ts`) with service-role Supabase clients for secure operations (e.g., wholesale prices, wheel spins).
- **Styling**: Tailwind CSS v4 using CSS variable tokens defined in `src/styles.css` (OKLCH color system, RTL direction, Tajawal & Cairo typography).
- **UI Components**: shadcn/ui components built on Radix UI primitives, styled with Tailwind and `class-variance-authority`.
- **Form Handling & Validation**: React Hook Form with Zod schemas for validation and type-safety.
- **Notifications**: Sonner (`toast`) for user alerts, errors, and progress updates.
- **Language & Direction**: Arabic-first application (`dir="rtl"`) with specialized Iraqi Dinar formatting and localized text.

---

## Library & Tooling Rules

### 1. Routing & Navigation
- **Use TanStack Router**: Always define pages inside `src/routes/` following file-based routing conventions (`index.tsx`, `$slug.tsx`, etc.).
- **Do Not Use**: React Router, Next.js page routers, or custom history managers.
- **Navigation**: Use the `<Link>` component or `useNavigate()` from `@tanstack/react-router`. Never use raw `<a>` tags for internal links.

### 2. State Management & Server State
- **Server State**: Use `@tanstack/react-query` (`useQuery`, `useMutation`, `useQueryClient`) for all remote data fetching and caching.
- **Client/UI State**: Use React standard hooks (`useState`, `useReducer`, `useMemo`, `useCallback`) or dedicated context providers (such as `CartProvider` in `src/lib/cart.tsx`).
- **Do Not Introduce**: Redux, Zustand, MobX, or other external state managers unless explicitly asked.

### 3. Backend, Database & Auth
- **Client-side DB Access**: Use `supabase` from `@/integrations/supabase/client` for operations covered by RLS policies.
- **Server-side & Admin Operations**: Use `supabaseAdmin` from `@/integrations/supabase/client.server` strictly inside server functions (`createServerFn`) or server entry points. Never expose service role keys to the browser.
- **Wholesale & Protected Data**: Any sensitive data (such as product wholesale costs, lottery algorithms, admin actions) must execute via server functions in `src/lib/*.functions.ts`.

### 4. UI Components & Styling
- **Shadcn / Radix**: Use the existing UI components in `@/components/ui/*` (Button, Input, Dialog, Select, Tabs, etc.). Do not re-install or build custom implementations of components that already exist in this folder.
- **Styling Standards**:
  - Use Tailwind CSS classes exclusively.
  - Rely on semantic tokens (`bg-background`, `text-foreground`, `text-primary`, `bg-card`, `text-muted-foreground`, etc.).
  - Avoid hardcoding arbitrary hex colors or inline style overrides.
  - Maintain marine aesthetic utilities (`glass-card`, `sea-gradient`, `glow-shadow`, `deep-shadow`).
- **Icons**: Always import icons from `lucide-react`.

### 5. Images & Media
- **Product & Category Images**: Use the `<SmartImage>` component (`@/components/site/SmartImage`) for responsive widths, aspect ratio containment, blurry placeholder previews, and fallback handling.
- **Image Optimization**: Use helper functions from `@/lib/img` (`fastImage`, `imageSrcSet`, `tinyImage`) to leverage Supabase image transforms where available.

### 6. Forms & Validation
- **Complex Forms**: Use `react-hook-form` paired with `zod` and `@hookform/resolvers/zod`.
- **Lightweight / Controlled Inputs**: Standard React state is acceptable for simple single-field search inputs or modal dialogs.
- **Feedback**: Display validation and operation status using `toast` from `sonner`.

### 7. Localization & RTL
- Every view and copy must default to Arabic with proper grammatical phrasing and right-to-left layout awareness.
- Format currency amounts using `formatPrice` from `@/lib/cart` (Iraqi Dinar / `د.ع`).