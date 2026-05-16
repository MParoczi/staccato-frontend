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
