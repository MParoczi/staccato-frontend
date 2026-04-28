# Codebase Structure

**Analysis Date:** 2026-04-28

## Repository Layout

```
Frontend/
├── index.html                  # Vite shell — loads /src/main.tsx
├── package.json                # Scripts + deps (pnpm)
├── pnpm-lock.yaml
├── vite.config.ts              # Vite + Tailwind v4 + React plugin; @ → ./src; vitest config
├── tsconfig.json               # Solution refs
├── tsconfig.app.json           # App build (strict, paths @/* → ./src/*)
├── tsconfig.node.json          # Tooling files
├── eslint.config.js            # Flat config (ts-eslint, react-hooks, react-refresh)
├── components.json             # shadcn (style: radix-nova; aliases @/components, @/lib/utils, …)
├── CLAUDE.md                   # Frontend dev guidelines (Speckit-driven)
├── README.md
├── STACCATO_FRONTEND_DOCUMENTATION.md
├── frontend-speckit-prompts.md
├── public/                     # Static assets (favicon.svg, icons.svg)
├── issues/
│   └── bug-audit-2026-04.md    # 15-item bug audit
├── specs/                      # Speckit feature specs
│   ├── 001-project-infra-setup/
│   ├── 002-auth-token-management/
│   ├── 003-user-profile-settings/
│   ├── 004-notebook-dashboard/
│   ├── 005-notebook-shell-navigation/
│   ├── 006-app-nav-sidebar/
│   ├── 007-module-styling-system/
│   ├── 008-grid-canvas-module-placement/   # CURRENT
│   └── main/
└── src/
    ├── main.tsx                # createRoot → QueryClientProvider → App; imports @/i18n + index.css
    ├── App.tsx                 # [GoogleOAuthProvider?] → RouterProvider → Toaster
    ├── index.css               # Tailwind v4 entry (CSS-first config)
    ├── test-setup.ts           # @testing-library/jest-dom/vitest matchers
    ├── api/                    # Axios + per-resource modules (+ co-located *.test.ts)
    │   ├── client.ts           # Single axios instance + interceptors + silentRefresh
    │   ├── raw-client.ts       # Interceptor-free axios instance (for refresh)
    │   ├── auth.ts | chords.ts | exports.ts | instruments.ts | lessons.ts
    │   ├── modules.ts | notebooks.ts | pages.ts | presets.ts | users.ts
    │   ├── client.test.ts | modules.test.ts | notebooks.test.ts | presets.test.ts
    ├── routes/                 # React Router v7 tree + layout/guards
    │   ├── index.tsx           # createBrowserRouter([...])
    │   ├── root-redirect.tsx
    │   ├── public-layout.tsx
    │   ├── protected-route.tsx (+ test)
    │   ├── app-layout.tsx
    │   ├── notebook-layout.tsx (+ test)
    │   ├── not-found.tsx
    │   └── placeholders.tsx    # ExportsPage, ChordsPage stubs
    ├── features/               # Vertical slices (NO cross-feature imports)
    │   ├── auth/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── components/  hooks/  schemas/
    │   ├── notebooks/
    │   │   └── components/  hooks/  schemas/  utils/
    │   ├── profile/
    │   │   └── components/  hooks/  schemas/
    │   └── styling/            # Module styling (spec 007)
    │       └── components/  hooks/  utils/
    ├── components/
    │   ├── layout/             # AppSidebar, UserMenu, nav-items.ts (+ tests)
    │   ├── common/             # DottedPaper, DeletionBanner, PageErrorBoundary
    │   └── ui/                 # shadcn primitives (kebab-case files)
    │       ├── alert-dialog.tsx · avatar.tsx · badge.tsx · button.tsx · card.tsx
    │       ├── checkbox.tsx · command.tsx · dialog.tsx · dropdown-menu.tsx
    │       ├── input.tsx · input-group.tsx · label.tsx · popover.tsx
    │       ├── scroll-area.tsx · select.tsx · separator.tsx · sheet.tsx
    │       ├── skeleton.tsx · sonner.tsx · table.tsx · tabs.tsx
    │       └── textarea.tsx · tooltip.tsx
    ├── stores/
    │   ├── authStore.ts (+ test)   # accessToken, expiresAt, isLoggingOut
    │   └── uiStore.ts (+ test)
    ├── hooks/
    │   └── useInstruments.ts
    ├── lib/
    │   ├── query-client.ts (+ test)   # 5xx-only retry, gcTime 5min, refetchOnWindowFocus
    │   ├── utils.ts                   # cn() (clsx + tailwind-merge)
    │   ├── constants/
    │   │   ├── grid.ts · modules.ts · music.ts · notebook-colors.ts · index.ts
    │   ├── types/
    │   │   ├── auth.ts · chords.ts · common.ts · exports.ts · index.ts
    │   │   └── lessons.ts · modules.ts · notebooks.ts · styles.ts
    │   └── utils/
    │       └── user-display.ts (+ test)
    └── i18n/
        ├── index.ts            # i18next init (LanguageDetector, en/hu, fallbackLng en)
        ├── en.json
        └── hu.json
```

## Directory Purposes

- **`src/api/`** — One axios instance (`client.ts`) + one typed resource per file. No React. Tests co-located.
- **`src/routes/`** — React Router v7 declarative tree + guards. **Page components live in `src/features/*` — routes import them.**
- **`src/features/<name>/`** — Vertical slice. Subfolders: `components/`, `hooks/`, `schemas/` (Zod), `utils/`. Page components named `*Page.tsx`.
- **`src/components/layout/`** — App chrome (sidebar, user menu, nav config).
- **`src/components/common/`** — Cross-feature widgets, app-aware.
- **`src/components/ui/`** — shadcn primitives (kebab-case). Edit freely; do not relocate.
- **`src/stores/`** — Zustand stores (one file per concern + co-located test). **Client state only.**
- **`src/hooks/`** — Cross-feature hooks.
- **`src/lib/`** — Framework-agnostic helpers, type modules, constants.
- **`src/i18n/`** — i18next init + `en.json` / `hu.json`.

## Naming Conventions

| Kind                     | Style                              | Example                                |
|--------------------------|------------------------------------|----------------------------------------|
| React components         | `PascalCase.tsx`                   | `LoginPage.tsx`, `AppSidebar.tsx`      |
| Hooks                    | `useCamelCase.ts`                  | `useInstruments.ts`                    |
| Zustand stores           | `camelCaseStore.ts`                | `authStore.ts`, `uiStore.ts`           |
| API resources            | `lowercase.ts`                     | `notebooks.ts`, `auth.ts`              |
| Routes / layouts         | `kebab-case.tsx`                   | `protected-route.tsx`, `app-layout.tsx`|
| shadcn primitives        | `kebab-case.tsx` (shadcn default)  | `dropdown-menu.tsx`                    |
| Tests                    | `<subject>.test.ts(x)` co-located  | `client.test.ts`                       |
| Constants                | `kebab-case.ts`                    | `notebook-colors.ts`                   |
| Folders under `features/`| `lowercase` or `kebab-case`        | `auth`, `notebooks`, `styling`         |

## Path Aliases

- TS (`tsconfig.app.json`) — `@/* → ./src/*`
- Vite (`vite.config.ts`) — `@ → ./src`
- shadcn (`components.json`) — `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`

Always prefer `@/...` over relative `../../`.

## Where to Add Things — Cheat Sheet

| You want to add…                                  | Put it in…                                                            |
|---------------------------------------------------|-----------------------------------------------------------------------|
| New backend endpoint wrapper                      | `src/api/<resource>.ts` (+ `<resource>.test.ts`)                      |
| New URL / route                                   | New route in `src/routes/index.tsx` + page in `src/features/<f>/`     |
| New feature (whole vertical)                      | `src/features/<feature>/{components,hooks,schemas,utils}/`            |
| TanStack Query hook for an existing feature       | `src/features/<feature>/hooks/use<X>.ts`                              |
| Cross-feature widget                              | `src/components/common/<Widget>.tsx`                                  |
| New shadcn primitive                              | `pnpm dlx shadcn@latest add <name>` → lands in `src/components/ui/`   |
| Layout / guard                                    | `src/routes/<name>.tsx` (kebab-case)                                  |
| Cross-cutting client state                        | `src/stores/<concern>Store.ts`                                        |
| Reusable hook                                     | `src/hooks/use<X>.ts`                                                 |
| Non-React utility                                 | `src/lib/utils/<name>.ts` or `src/lib/<name>.ts`                      |
| Domain constants                                  | `src/lib/constants/<name>.ts`                                         |
| Shared types                                      | `src/lib/types/<domain>.ts`                                           |
| Zod schema for a form                             | `src/features/<feature>/schemas/<form>.ts`                            |
| Translation                                       | `src/i18n/en.json` + `src/i18n/hu.json` (mirror keys)                 |
| New `VITE_*` env var                              | `.env*`; consume via `import.meta.env.VITE_X`; document in README     |

## Special Directories

- **`public/`** — static assets, copied verbatim. Committed.
- **`dist/`** — Vite build output. Generated, gitignored.
- **`specs/NNN-*/`** — Speckit feature specs (plan, spec, tasks, contracts, checklists). Committed.
- **`.planning/`** — GSD planning artifacts (this codebase map). Committed per project convention.
- **`issues/`** — Hand-curated bug audits (currently `bug-audit-2026-04.md`).

