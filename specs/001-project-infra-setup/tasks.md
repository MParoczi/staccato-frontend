# Tasks: Project Infrastructure Setup

**Input**: Design documents from `/specs/001-project-infra-setup/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing. All 6 user stories plus setup, foundational, and polish phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Install all dependencies, configure build tooling, establish the project skeleton before any feature-level wiring.

- [x] T001 Install core dependencies: `pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools react-router axios react-hook-form zod react-i18next i18next i18next-browser-languagedetector @microsoft/signalr @react-oauth/google`
- [x] T002 Install Tailwind CSS v4 and Vite plugin: `pnpm add tailwindcss @tailwindcss/vite` and add tailwindcss plugin to `vite.config.ts`
- [x] T003 Configure path alias `@/` → `src/` in `tsconfig.app.json` (paths + baseUrl) and `vite.config.ts` (resolve.alias)
- [x] T004 Initialize shadcn/ui: run `pnpm dlx shadcn@latest init` with style=default, baseColor=stone, cssVariables=yes — creates `components.json`, `src/lib/utils.ts`, and initial CSS variables in `src/index.css`
- [x] T005 Install all 19 shadcn/ui components: `pnpm dlx shadcn@latest add button card dialog dropdown-menu form input label popover select sheet tabs toast tooltip command separator badge checkbox table scroll-area`
- [x] T006 Create `.env.example` at project root with `VITE_API_BASE_URL=http://localhost:5000` and `VITE_GOOGLE_CLIENT_ID=your-google-client-id`
- [x] T007 Create folder structure skeleton: `src/api/`, `src/components/layout/`, `src/components/common/`, `src/features/`, `src/hooks/`, `src/stores/`, `src/lib/types/`, `src/lib/constants/`, `src/i18n/`, `src/routes/` — add `.gitkeep` to empty directories

**Checkpoint**: All dependencies installed, build tool configured, folder structure in place. `pnpm run dev` starts without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented — Zustand stores and query client are needed by routes, Axios, and i18n.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create auth store in `src/stores/authStore.ts` — Zustand store with `accessToken: string | null`, `setAccessToken(token: string)`, `clearAuth()`. In-memory only, no persistence middleware.
- [x] T009 [P] Create UI store in `src/stores/uiStore.ts` — Zustand store with `sidebarOpen: boolean (default true)`, `selectedModuleId: string | null`, `zoom: number (default 1, clamped 0.25–3.0)`, `theme: 'light' | 'dark' | 'system' (default 'system')` with setters. Theme preference persisted to localStorage.
- [x] T010 [P] Create TanStack Query client in `src/lib/query-client.ts` — `new QueryClient` with defaults: `staleTime: 0`, `gcTime: 300_000`, `retry: (count, error) => error.response?.status === 401 ? false : count < 3`, `refetchOnWindowFocus: true`.

**Checkpoint**: Stores and query client ready. All user stories can now reference these.

---

## Phase 3: User Story 1 — Developer Starts Feature Work on a Configured Codebase (Priority: P1) MVP

**Goal**: The dev server starts, all imports resolve, folder conventions work, and the app renders a root page.

**Independent Test**: Run `pnpm run dev`, confirm no errors. Import a type from `@/lib/types`, confirm TypeScript resolves it. Import the Axios instance from `@/api/client`, confirm it's configured.

### Implementation

- [x] T011 [US1] Write the earthy design system theme in `src/index.css` — replace shadcn default CSS variables with custom earthy oklch values in `:root` (light: primary=warm brown, secondary=olive/sage, accent=muted gold, muted=warm gray, background=cream, card/popover=warm white, destructive=muted terracotta-red, border/input/ring=warm tones) and `.dark` (deeper warmer earthy tones). Add notebook canvas variables: `--notebook-paper`, `--notebook-dot`, `--notebook-selection`, `--notebook-hover`. Wire all via `@theme inline`. Verify WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text).
- [x] T012 [P] [US1] Create raw Axios instance in `src/api/raw-client.ts` — bare instance with `baseURL: import.meta.env.VITE_API_BASE_URL`, `withCredentials: true`, no interceptors. Add startup validation: throw descriptive error if `VITE_API_BASE_URL` is not set.
- [x] T013 [P] [US1] Create main Axios instance in `src/api/client.ts` — instance with `baseURL` from env, `withCredentials: true`, `timeout: 30000`, `Content-Type: application/json`. Add request interceptor: inject `Authorization: Bearer {token}` from auth store (if token present) + `Accept-Language` from i18next current language. Add response interceptor: on 401 → use shared promise dedup (`isRefreshing` flag + `refreshPromise` variable) → call `POST /auth/refresh` via raw-client → on success: `setAccessToken`, retry original request → on failure: `clearAuth`, `window.location.href = '/login'`. Ensure refresh call via raw-client never triggers the 401 interceptor (structural loop prevention).
- [x] T014 [US1] Create auth API module stub in `src/api/auth.ts` — export typed async functions: `login(email, password)`, `register(...)`, `refreshToken()` (calls raw-client), `logout()`, `googleLogin(credential)`. Function bodies call the appropriate Axios instance. Use types from `@/lib/types`.
- [x] T015 [P] [US1] Create API module stubs for all domains — `src/api/notebooks.ts`, `src/api/lessons.ts`, `src/api/modules.ts`, `src/api/chords.ts`, `src/api/instruments.ts`, `src/api/exports.ts`, `src/api/presets.ts`, `src/api/users.ts`. Each exports typed async function signatures matching the backend API contract. Import types from `@/lib/types`. Function bodies use the main Axios client.
- [x] T016 [US1] Update `src/main.tsx` — wrap the app with `QueryClientProvider` (from query-client.ts), initialize i18n (import `@/i18n`), render `<App />` inside `<React.StrictMode>`.
- [x] T017 [US1] Update `src/App.tsx` — render `<RouterProvider>` with the router from `@/routes`. Import and render `<Toaster />` from shadcn toast.
- [x] T018 [US1] Verify: run `pnpm run dev` — app starts, no TypeScript errors, no console errors. Run `pnpm dlx tsc --noEmit` — all types compile.

**Checkpoint**: Dev server runs. All imports resolve. Axios configured. Types compile. This is the MVP — a developer can start building features.

---

## Phase 4: User Story 2 — Developer Navigates the Route Structure (Priority: P1)

**Goal**: All route paths resolve, ProtectedRoute redirects unauthenticated users, public routes redirect authenticated users, deep-link URLs are preserved.

**Independent Test**: Navigate to each route path and confirm correct placeholder/redirect behavior.

### Implementation

- [x] T019 [US2] Create placeholder page components in `src/routes/placeholders.tsx` — minimal functional components for each route: `LoginPage`, `RegisterPage`, `NotebooksDashboard`, `NewNotebook`, `NotebookView`, `NotebookIndex`, `PageEditor`, `ProfilePage`, `ExportsPage`, `ChordsPage`. Each renders a `<div>` with the route name as text.
- [x] T020 [US2] Create not-found page in `src/routes/not-found.tsx` — minimal page with "Page not found" message and a link back to `/app/notebooks`.
- [x] T021 [US2] Create ProtectedRoute guard in `src/routes/protected-route.tsx` — check `useAuthStore().accessToken`: if present → render `<Outlet />`; if null → save current URL (for post-login redirect) → show loading spinner → call `silentRefresh()` from `api/auth.ts` (reuses shared-promise dedup from api/client.ts) → on success: re-render children → on failure: redirect to `/login` with intended URL in state. Never flash the login page.
- [x] T022 [US2] Create root redirect in `src/routes/root-redirect.tsx` — check auth store: if token → `<Navigate to="/app/notebooks" />`, else → `<Navigate to="/login" />`.
- [x] T023 [P] [US2] Create public layout in `src/routes/public-layout.tsx` — check auth store: if token → redirect to `/app/notebooks`; else → render `<Outlet />`. This handles FR-014a.
- [x] T024 [P] [US2] Create app layout in `src/routes/app-layout.tsx` — render `<Outlet />` wrapped in a minimal shell div (sidebar slot + main content area). No actual UI — just the layout wrapper for future features.
- [x] T025 [US2] Create router configuration in `src/routes/index.tsx` — `createBrowserRouter` with: `/` → root-redirect; `/login` and `/register` → public-layout wrapping placeholders; `/app` → ProtectedRoute wrapping app-layout with children: `/app/notebooks`, `/app/notebooks/new`, `/app/notebooks/:notebookId`, `/app/notebooks/:notebookId/index`, `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`, `/app/profile`, `/app/exports`, `/app/chords`; catch-all `*` under `/app` → not-found page.
- [x] T026 [US2] Verify: navigate to all routes manually — `/` redirects based on auth, `/login` renders placeholder, `/app/notebooks` redirects to login when no token, `/app/nonexistent` shows not-found page.

**Checkpoint**: All routes resolve correctly. Auth-gating works. Deep-link URLs preserved.

---

## Phase 5: User Story 3 — Developer Uses the Design System Theme (Priority: P1)

**Goal**: shadcn/ui primitives render in earthy tones. Background is cream, not white. Destructive variant uses muted terracotta-red.

**Independent Test**: Render a Button and Card — confirm earthy colors, not zinc/slate defaults.

### Implementation

- [ ] T027 [US3] Verify and refine the earthy theme CSS variables in `src/index.css` — render shadcn Button (default, secondary, destructive, outline, ghost variants), Card, Badge, Dialog, and Toast components in a temporary test page. Visually confirm: primary=warm brown, secondary=olive, accent=gold, background=cream (#FAF8F5 range), destructive=muted terracotta-red. Adjust oklch values until all variants look cohesive and professional. Verify dark mode toggle works (add/remove `.dark` class on `<html>`).
- [ ] T028 [US3] Validate WCAG AA contrast ratios — check primary-foreground on primary, destructive-foreground on destructive, foreground on background, muted-foreground on muted for both light and dark modes. All must meet 4.5:1 for normal text, 3:1 for large text. Adjust values if any fail.
- [ ] T029 [US3] Remove any temporary test page created during verification. Ensure `src/index.css` is clean and contains only the final theme variables.

**Checkpoint**: All shadcn/ui components render in earthy tones. WCAG AA compliant. Dark mode works.

---

## Phase 6: User Story 4 — Developer Configures Server Communication (Priority: P2)

**Goal**: Axios instance has all four behaviors: base URL, auth header, language header, 401 refresh interceptor.

**Independent Test**: Inspect Axios instance config and interceptor registrations.

### Implementation

- [ ] T030 [US4] Verify Axios interceptor chain in `src/api/client.ts` — confirm request interceptor injects both headers, response interceptor catches 401, refresh via raw-client works, shared promise dedup prevents concurrent refreshes, failed refresh clears auth and redirects. (Implementation was done in T013; this task is verification + any fixes.)
- [ ] T031 [US4] Verify auth API module in `src/api/auth.ts` — confirm `refreshToken()` uses raw-client (not main client), typed responses match backend DTOs. (Implementation was done in T014; this task is verification.)

**Checkpoint**: All four Axios behaviors verified. No infinite refresh loops possible.

---

## Phase 7: User Story 5 — Developer Uses Internationalization (Priority: P2)

**Goal**: i18n initialized with en/hu, browser language detection works, translation keys resolve.

**Independent Test**: Call `t('common.save')` — get "Save" in English, "Mentés" in Hungarian.

### Implementation

- [ ] T032 [US5] Create i18n configuration in `src/i18n/index.ts` — initialize i18next with: `fallbackLng: 'en'`, `interpolation: { escapeValue: false }`, `keySeparator: '.'`, browser language detection (i18next-browser-languagedetector), eager-loaded resources from en.json and hu.json. Export the initialized i18next instance.
- [ ] T033 [P] [US5] Create English translation skeleton in `src/i18n/en.json` — namespace structure with sample keys: `common` (save, cancel, delete, loading, error, success, notFound, goBack), `auth` (login.title, login.email, login.password, login.submit, register.title), `notebooks` (dashboard.title, create.title), `editor` (blocks.addBlock), `chords` (library.title, search.placeholder), `exports` (history.title), `profile` (settings.title).
- [ ] T034 [P] [US5] Create Hungarian translation skeleton in `src/i18n/hu.json` — same structure as en.json with Hungarian translations for all sample keys: `common` (Mentés, Mégse, Törlés, Betöltés..., Hiba, Sikeres, Az oldal nem található, Visszalépés), `auth` (Bejelentkezés, E-mail cím, Jelszó, Bejelentkezés gomb, Regisztráció), etc.
- [ ] T035 [US5] Verify: import `useTranslation` in a component, call `t('common.save')` — returns "Save". Change i18next language to 'hu' — returns "Mentés".

**Checkpoint**: i18n works for both languages. Browser detection falls back to English for unsupported languages.

---

## Phase 8: User Story 6 — Developer References Backend Data Structures (Priority: P2)

**Goal**: All TypeScript types, enums, and constants compile and match the backend documentation.

**Independent Test**: Import `ModuleType` — get autocomplete for all 12 values. Construct a `NotebookDetail` missing fields — TypeScript error.

### Implementation

- [ ] T036 [P] [US6] Create shared enums in `src/lib/types/common.ts` — define `ModuleType` (12 values), `BuildingBlockType` (10 values), `BorderStyle` (4 values), `FontFamily` (3 values), `PageSize` (5 values), `InstrumentKey` (7 values), `Language` (2 values) as TypeScript union types matching backend docs exactly.
- [ ] T037 [P] [US6] Create auth types in `src/lib/types/auth.ts` — define `User` interface matching backend: id, email, firstName, lastName, language, defaultPageSize, defaultInstrumentId, avatarUrl, scheduledDeletionAt (all with correct nullability).
- [ ] T038 [P] [US6] Create notebook types in `src/lib/types/notebooks.ts` — define `NotebookSummary`, `NotebookDetail`, `NotebookModuleStyle`, `NotebookIndex`, `NotebookIndexEntry` interfaces matching backend docs field-for-field.
- [ ] T039 [P] [US6] Create lesson types in `src/lib/types/lessons.ts` — define `LessonSummary`, `LessonDetail`, `LessonPage` interfaces.
- [ ] T040 [P] [US6] Create module types in `src/lib/types/modules.ts` — define `Module` interface with `content: BuildingBlock[]`. Define `BuildingBlock` as base interface with `type: BuildingBlockType` (full discriminated union deferred to editor feature).
- [ ] T041 [P] [US6] Create chord types in `src/lib/types/chords.ts` — define `Instrument`, `ChordSummary`, `ChordDetail`, `ChordPosition`, `ChordBarre`, `ChordString` interfaces. Ensure `ChordString.state` uses literal union `'open' | 'fretted' | 'muted'`.
- [ ] T042 [P] [US6] Create export types in `src/lib/types/exports.ts` — define `PdfExport` interface with `status` as literal union `'Pending' | 'Processing' | 'Ready' | 'Failed'`.
- [ ] T043 [P] [US6] Create style types in `src/lib/types/styles.ts` — define `SystemStylePreset`, `UserSavedPreset`, `StyleEntry` interfaces.
- [ ] T044 [US6] Create barrel re-export in `src/lib/types/index.ts` — re-export all types and enums from all domain files so consumers can use `import { NotebookSummary, ModuleType } from '@/lib/types'`.
- [ ] T045 [P] [US6] Create grid constants in `src/lib/constants/grid.ts` — define `PAGE_SIZE_DIMENSIONS: Record<PageSize, { width: number; height: number }>` with values: A4=42x59, A5=29x42, A6=21x29, B5=35x50, B6=25x35.
- [ ] T046 [P] [US6] Create module constants in `src/lib/constants/modules.ts` — define `MODULE_MIN_SIZES: Record<ModuleType, { minWidth: number; minHeight: number }>` with all 12 values from backend docs. Define `MODULE_ALLOWED_BLOCKS: Record<ModuleType, BuildingBlockType[]>` with all 12 mappings (Breadcrumb=empty array, FreeText=all types).
- [ ] T047 [P] [US6] Create music constants in `src/lib/constants/music.ts` — define `CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const`.
- [ ] T048 [US6] Create barrel re-export in `src/lib/constants/index.ts` — re-export all constants from grid.ts, modules.ts, music.ts.
- [ ] T049 [US6] Verify: run `pnpm dlx tsc --noEmit` — all types compile. Import `ModuleType` — autocomplete shows 12 values. Construct invalid `NotebookDetail` — TypeScript error fires.

**Checkpoint**: All 20+ types, 7 enums, and 4 constant tables compile and match backend docs.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup.

- [ ] T050 Delete `src/App.css` (empty, unused — styles are in index.css)
- [ ] T051 Run full build: `pnpm run build` — confirm zero TypeScript errors, zero warnings
- [ ] T052 Run linter: `pnpm run lint` — fix any lint errors introduced by new files
- [ ] T053 Verify quickstart.md workflow: fresh clone → `pnpm install` → `cp .env.example .env` → `pnpm run dev` → app starts and renders root page

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — can start after stores/query-client ready
- **Phase 4 (US2)**: Depends on Phase 3 (needs Axios client, main.tsx, App.tsx from US1)
- **Phase 5 (US3)**: Depends on Phase 3 T011 (needs CSS variables from theme task)
- **Phase 6 (US4)**: Depends on Phase 3 T013 (verification of Axios built in US1)
- **Phase 7 (US5)**: Depends on Phase 2 only (i18n is independent of routes/theme)
- **Phase 8 (US6)**: Depends on Phase 1 only (types have no runtime dependencies)
- **Phase 9 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Foundational → starts after Phase 2. OTHER STORIES DEPEND ON THIS.
- **US2 (P1)**: Depends on US1 (needs main.tsx/App.tsx wiring + Axios client)
- **US3 (P1)**: Partially depends on US1 T011 (theme CSS), but verification is independent
- **US4 (P2)**: Depends on US1 (Axios client verification)
- **US5 (P2)**: Independent of US1 — can run in PARALLEL after Phase 2
- **US6 (P2)**: Independent — can run in PARALLEL even after Phase 1 only (types are pure TS)

### Parallel Opportunities

```
Phase 1 (sequential — pnpm adds + shadcn init)
  ↓
Phase 2: T008 ──┬── T009 [P] ── T010 [P]
                 ↓
Phase 3 (US1): T011 theme ──┬── T012 [P] raw-client
                             ├── T013 [P] main client  ← depends on T012
                             ├── T015 [P] API stubs
                             ↓
               T014 auth API ── T016 main.tsx ── T017 App.tsx ── T018 verify
                                    ↓
Phase 4 (US2): parallel ─────── Phase 5 (US3): T027-T029
Phase 7 (US5): parallel ─────── Phase 8 (US6): T036-T048 (massive parallelism)
                                    ↓
Phase 6 (US4): T030-T031 (verification only)
  ↓
Phase 9 (Polish): T050-T053
```

---

## Parallel Example: User Story 6 (Types & Constants)

```
# All type files can be written simultaneously (different files, no dependencies):
T036 [P] src/lib/types/common.ts     (enums)
T037 [P] src/lib/types/auth.ts       (User)
T038 [P] src/lib/types/notebooks.ts  (Notebook types)
T039 [P] src/lib/types/lessons.ts    (Lesson types)
T040 [P] src/lib/types/modules.ts    (Module type)
T041 [P] src/lib/types/chords.ts     (Chord types)
T042 [P] src/lib/types/exports.ts    (PdfExport)
T043 [P] src/lib/types/styles.ts     (Style types)

# Then barrel + constants (also parallel):
T044     src/lib/types/index.ts       (depends on T036-T043)
T045 [P] src/lib/constants/grid.ts
T046 [P] src/lib/constants/modules.ts
T047 [P] src/lib/constants/music.ts
T048     src/lib/constants/index.ts   (depends on T045-T047)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install deps, configure tooling)
2. Complete Phase 2: Foundational (stores, query client)
3. Complete Phase 3: User Story 1 (theme, Axios, entry points)
4. **STOP and VALIDATE**: `pnpm run dev` starts, types compile, Axios configured
5. This is the minimum needed for a developer to start feature work

### Incremental Delivery

1. Setup + Foundational → Project skeleton ready
2. US1 → Dev server runs, all wiring in place (MVP!)
3. US2 → Routes resolve, auth gating works
4. US3 → Theme verified and WCAG compliant
5. US5 + US6 → i18n + types (can run in parallel)
6. US4 → Axios verification (quick pass)
7. Polish → Build passes, lint clean

### Parallel Opportunities Summary

- **Phase 2**: T008, T009, T010 are independent (3 parallel tasks)
- **Phase 3**: T012, T013, T015 can start in parallel (3 parallel tasks)
- **US5 + US6**: Can run entirely in parallel after Phase 2 (13+ parallel tasks in US6)
- **US2 + US3**: Can run in parallel after US1 completes

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- No test tasks generated (not requested in spec)
- Commit after each phase or logical group of tasks
- Total tasks: 53
