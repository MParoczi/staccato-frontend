# Milestones: Staccato

---

## v0.1 — Foundation

**Shipped:** 2026-05-16
**Phases:** 1 (Phase 1: Foundation)
**Plans:** 5
**Tasks:** 11

**Delivered:** Bootable React 19 + TypeScript SPA skeleton with Vite 8, Tailwind v4 CSS-first, shadcn radix-nova, Zustand authStore (no persist), Axios single-flight refresh, i18next v26 with 16 locale files, React Router ProtectedRoute, and Vitest test suite (19 tests).

**Commits:** 93d8b49 → d631ee9 (14 commits, 450 files, 102 399 insertions)
**Timeline:** 2026-05-15 → 2026-05-16 (2 days)

**Key accomplishments:**
1. Vite 8 + React 19 + TypeScript 5.9.3 scaffold with Tailwind v4 and shadcn radix-nova (17 components)
2. Zustand authStore (status discriminant, no persist) + Axios client with single-flight 401 refresh
3. i18next v26 http-backend + 8 namespaces + 16 translation files (EN strings + HU stubs)
4. createBrowserRouter + ProtectedRoute (spinner) + boot refresh before render
5. Vitest test suite: 19 tests covering authStore, env, ProtectedRoute, Axios interceptors, i18n, smoke

**Known deferred items at close:** 0

**Archive:** `.planning/milestones/v0.1-ROADMAP.md`

---

## v0.2 — Authentication

**Shipped:** 2026-05-16
**Phases:** 1 (Phase 2: Authentication)
**Plans:** 4
**Tests:** 25 (up from 19)

**Delivered:** Full auth flows — email/password login + registration, Google OAuth, silent session restore via HttpOnly refresh cookie, proactive token refresh 60s before expiry, logout with back-button guard, Sonner toast error handling. LoginPage and RegisterPage fully implemented (replacing stubs from v0.1).

**Commits:** b9d80f2 → f5dcae5 (6 commits, 30 files, 2821 insertions)
**Timeline:** 2026-05-16 (1 day)

**Key accomplishments:**
1. Auth API layer (login, register, loginWithGoogle, logout) using rawClient + proactive JWT refresh hook
2. LoginPage: email/password form + Google OAuth + Remember Me + blur validation + Sonner toast errors
3. RegisterPage: displayName/email/password form + Google OAuth + blur validation (≥8 char password, ≤50 char displayName)
4. useProactiveRefresh hook: JWT exp decode → schedules refresh at exp−60s → cancels on unmount
5. Logout: clearAuth() + navigate('/login', { replace: true }) — back button blocked
6. Test suite: 25/25 passing (added useProactiveRefresh unit tests + redirect integration tests)

**Known deferred items at close:** 2
- Backend httpOnly cookie not invalidated on logout (requires backend PR)
- /gsd:secure-phase 2 not run (auth security review deferred)

**Archive:** `.planning/milestones/v0.2-ROADMAP.md`

---

## v0.3 — User Profile & Account

**Shipped:** 2026-05-16
**Phases:** 1 (Phase 3: User Profile & Account)
**Plans:** 4

**Delivered:** Persistent AppLayout + Navbar on all `/app/*` routes with avatar dropdown. ProfilePage at `/app/profile` covering full profile edit (name, language, page size, default instrument), avatar upload (JPG/PNG/WebP ≤ 2 MB) with initials fallback, account deletion with 30-day grace period dialog and banner, and cancellation flow.

**Commits:** cd9f394 → 6180072 (4 commits, 27 files, 3412 insertions, 24 deletions)
**Timeline:** 2026-05-16 (1 day)

**Key accomplishments:**
1. AppLayout + Navbar: persistent sticky header wrapping all `/app/*` routes; avatar dropdown (My Profile / Sign out)
2. ProfilePage: full USER-01–04 coverage — name/lang/pageSize/instrument form, avatar upload, deletion dialog + banner
3. profileApi.ts: 6 API functions (getMe, updateMe, uploadAvatar, requestDeletion, cancelDeletion, getInstruments)
4. UserProfile type reconciliation: `defaultInstrumentId: string | null`, `scheduledDeletionAt: string | null`
5. authStore.updateUser action added for profile mutations to sync in-memory user state

**UAT:** 13/13 passed (0 issues)

**Known deferred items at close:** 2
- Hungarian profile strings are `__HU_TODO__` stubs (25 keys) — full HU translation deferred to Phase 12
- No unit tests for ProfilePage/profileApi — integration via UAT only; unit coverage deferred

**Archive:** `.planning/milestones/v0.3-ROADMAP.md`

---

## v0.4 — Notebook Management

**Shipped:** 2026-05-17
**Phases:** 1 (Phase 4: Notebook Management)
**Plans:** 4
**Tests:** 26 (up from 25)

**Delivered:** Full notebook CRUD — create with cover color, instrument, page size, and style preset; dashboard with responsive grid, skeleton loading, and empty state; notebook book view with full-bleed cover page (luminance contrast), empty index page, and tab navigation; Navbar breadcrumb on notebook routes; `DeleteNotebookDialog` with irreversible confirmation; `PageErrorBoundary` class component wrapping all 4 page routes.

**Commits:** 812acd6 → c093bf1 (23 commits, 35 files, 3691 insertions, 62 deletions)
**Timeline:** 2026-05-17 (1 day)

**Key accomplishments:**
1. Notebook types, constants (`COVER_COLORS`, `NOTEBOOK_STYLE_PRESETS`, `NOTEBOOK_PAGE_SIZES` as-const) and `notebooksApi` 5-function CRUD module
2. `NotebooksPage` dashboard with responsive grid, skeleton loading, empty state — TanStack Query throughout
3. `NotebookFormDialog` dual create/edit mode with color picker, style preset thumbnails, zod + react-hook-form validation
4. Notebook book view: full-bleed cover page (luminance contrast), empty index page, tab navigation shell
5. Navbar breadcrumb for `/app/notebooks/:id` routes via `useMatch` with 5-min stale-time optimization
6. `DeleteNotebookDialog` with irreversible confirmation + `PageErrorBoundary` class component on all 4 page routes

**Known deferred items at close:** 2
- T-09 offline mutation toast not reproducible via DevTools (accepted gap — 4xx errors do toast correctly)
- Hungarian notebook strings are `__HU_TODO__` stubs — deferred to Phase 12

**Archive:** `.planning/milestones/v0.4-ROADMAP.md`

---

## v0.5 — Lessons & Pages

**Shipped:** 2026-05-17
**Phases:** 1 (Phase 5: Lessons & Pages)
**Plans:** 4
**Tests:** 26 (unchanged — Phase 5 covered by UAT; no new unit tests added)

**Delivered:** Lesson CRUD within a notebook (create with auto-navigate, rename with immediate cache update, delete with irreversible confirmation). Multi-page lesson navigation using URL search params (?page=N) with previous/next controls, global page number display, and a dotted-grid CSS canvas placeholder. Soft 10-page warning toast. Delete page blocked on last page. 3-level Navbar breadcrumb on lesson routes. 4 bugs found and fixed during UAT.

**Commits:** 033f8f3 → aafb584 (20 commits, 22 files, 1552 insertions, 19 deletions)
**Timeline:** 2026-05-17 (1 day)

**Key accomplishments:**
1. lessonsApi.ts + lessonPagesApi.ts: full CRUD API layer following the notebooksApi.ts feature-scoped pattern
2. LessonsPage: lesson list with dashed first-slot create button, skeleton loading, empty state, row action dropdown (Open / Rename / Delete)
3. Three CRUD dialogs: CreateLessonDialog (zod form, auto-navigate on create), RenameLessonDialog (pre-filled form), DeleteLessonDialog (destructive confirmation)
4. LessonPage shell: URL-based page navigation (?page=N), top controls bar with global page number, prev/next buttons, add/delete page actions, 10-page Sonner warning
5. DeletePageDialog: last-page guard (button disabled at pageCount === 1), adjacent-page navigation on delete
6. Navbar 3-level breadcrumb on lesson routes; LessonsPage as tab child of NotebookPage, LessonPage as full-screen sibling

**Known deferred items at close:** 2
- Hungarian lesson strings are `__HU_TODO__` stubs (all values) — deferred to Phase 12
- Canvas content area is CSS-only dotted-grid placeholder — content modules deferred to Phase 6+

**Archive:** `.planning/milestones/v0.5-ROADMAP.md`

---
