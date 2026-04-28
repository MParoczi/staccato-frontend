# Technology Stack

**Analysis Date:** 2026-04-28

## Languages

- **TypeScript 5.9.3** (strict mode) — all application code under `src/`
- **TSX/JSX** — React 19 components (automatic JSX runtime, `tsconfig.app.json`)
- **CSS** — single Tailwind v4 entry at `src/index.css`
- **JS (ESM)** — tooling configs only (`eslint.config.js`)

## Runtime

- **Browser target:** ES2023 (`tsconfig.app.json` → `target: ES2023`, `lib: ES2023 + DOM + DOM.Iterable`)
- **Node:** required by Vite 8 (≥ 20.19 / 22.12)
- **Module type:** ESM (`package.json` → `"type": "module"`)

## Package Manager

- **pnpm** (lockfile `pnpm-lock.yaml` at repo root; CLAUDE.md specifies `pnpm test` / `pnpm run lint`)

## Frameworks (versions from `package.json`)

### Core
- `react@^19.2.4` + `react-dom@^19.2.4`
- `react-router@^7.13.2` (v7 — `createBrowserRouter` API; see `src/routes/index.tsx`)
- `vite@^8.0.1` + `@vitejs/plugin-react@^6.0.1`
- `tailwindcss@^4.2.2` + `@tailwindcss/vite@^4.2.2` (v4 CSS-first config — no `tailwind.config.js`)
- `tw-animate-css@^1.4.0` — Tailwind animation utilities

### State & Data
- `zustand@^5.0.12` — client state stores (`src/stores/`)
- `@tanstack/react-query@^5.95.2` + `@tanstack/react-query-devtools@^5.95.2` — server state
  - QueryClient configured in `src/lib/query-client.ts` (5xx-only retry, `gcTime: 300_000`, `refetchOnWindowFocus: true`)

### Forms & Validation
- `react-hook-form@^7.72.0`
- `zod@^4.3.6`
- `@hookform/resolvers@^5.2.2`

### HTTP
- `axios@^1.14.0`
  - Configured client: `src/api/client.ts` (auth + i18n header injection, single-flight refresh on 401)
  - Interceptor-free: `src/api/raw-client.ts` (used by `silentRefresh`)

### UI Layer
- `radix-ui@^1.4.3` (unified package) — primitives backing shadcn
- `shadcn@^4.1.1` CLI; `components.json` → style `radix-nova`, base color `neutral`, CSS variables on
- `lucide-react@^1.7.0` — icons
- `cmdk@^1.1.1` — command palette
- `sonner@^2.0.7` — toasts (mounted in `src/App.tsx` via `<Toaster />`)
- `next-themes@^0.4.6` — theme switching
- `class-variance-authority@^0.7.1` + `clsx@^2.1.1` + `tailwind-merge@^3.5.0` (composed in `src/lib/utils.ts` `cn()`)
- `@fontsource-variable/geist@^5.2.8`

### Drag & Drop
- `@dnd-kit/core@^6.3.1` — used by spec 008 (grid canvas module placement)

### i18n
- `i18next@^26.0.2` + `react-i18next@^17.0.1` + `i18next-browser-languagedetector@^8.2.1`
- Init: `src/i18n/index.ts` (resources: `en.json`, `hu.json`)

### Realtime
- `@microsoft/signalr@^10.0.0` (declared; no instantiation found in current source — hub wrapper not yet scaffolded)

### Auth
- `@react-oauth/google@^0.13.4` — `<GoogleOAuthProvider>` mounted in `src/App.tsx` when `VITE_GOOGLE_CLIENT_ID` is set

## Testing

- `vitest@^4.1.2` (config in `vite.config.ts` `test` block)
- `@testing-library/react@^16.3.2` + `@testing-library/jest-dom@^6.9.1`
- `jsdom@^29.0.1` (test environment)
- `msw@^2.12.14` (HTTP mocking — declared, MSW server file not yet present)
- Setup: `src/test-setup.ts` (imports `@testing-library/jest-dom/vitest`)

## Linting

- `eslint@^9.39.4` (flat config, `eslint.config.js`)
- `typescript-eslint@^8.57.0`
- `eslint-plugin-react-hooks@^7.0.1`
- `eslint-plugin-react-refresh@^0.5.2`
- Ignores: `dist`, `build`, `coverage`, `**/*.min.js`

## TypeScript Configuration

- Solution `tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`
- `tsconfig.app.json`: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `moduleResolution: bundler`
- Path alias: `@/*` → `./src/*` (mirrored in `vite.config.ts` `resolve.alias`)

## Build Scripts (`package.json`)

```
dev     → vite
build   → tsc -b && vite build
lint    → eslint .
test    → vitest run
preview → vite preview
```

## Notable Absent / Not-Yet-Wired

- No CSS framework configs beyond Tailwind v4 — there is **no `tailwind.config.js`** (v4 idiomatic).
- No Prettier config detected — formatting follows ESLint defaults.
- `@microsoft/signalr` is installed but not yet referenced in `src/`; realtime layer pending.
- `msw` is installed but no handler/server file present yet.

