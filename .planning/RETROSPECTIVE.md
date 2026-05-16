# Retrospective: Staccato

---

## Milestone: v0.1 — Foundation

**Shipped:** 2026-05-16
**Phases:** 1 | **Plans:** 5 | **Tasks:** 11

### What Was Built

1. Vite 8 + React 19 + TypeScript 5.9.3 scaffold with Tailwind v4 CSS-first and shadcn radix-nova (17 UI components)
2. Zustand authStore (no persist, status discriminant) + Axios client with single-flight 401 refresh + rawClient for /auth/refresh
3. i18next v26 http-backend with 8 namespaces and 16 translation files (EN strings + HU __HU_TODO__ stubs)
4. createBrowserRouter + ProtectedRoute (Loader2 spinner) + boot refresh before render
5. Vitest test suite: 19 tests covering authStore, env, ProtectedRoute, Axios interceptors, i18n, smoke

### What Worked

- **Plan granularity:** 5 focused plans with clear wave structure made each task straightforward. No plan had ambiguous scope.
- **Parallel waves:** Plan 02 (authStore) and Plan 03 (i18n) were independent and could have run in parallel — the wave structure enabled this.
- **Self-check lists in plans:** Explicit verification commands (pnpm tsc --noEmit, pnpm build) after every wave caught issues immediately.
- **UAT as final gate:** The UAT.md served as a clean verification artifact even without a formal VERIFICATION.md — all 5 success criteria were clear and testable.
- **TypeScript strict from the start:** erasableSyntaxOnly + verbatimModuleSyntax caught issues at scaffold time rather than later.

### What Was Inefficient

- **pnpm create vite --overwrite** deleted all untracked files in the repo (including .planning/ and .claude/). Had to restore from git. The plan should have warned about this; `git restore` was the fix but recovery took extra time.
- **shadcn latest version bug:** Wasted time discovering shadcn@latest had a workspace config error; had to fall back to @4.6.0. A pinned version in the research phase would have prevented this.
- **VALIDATION.md was never updated to nyquist_compliant: true** — it stayed as a draft. The Nyquist audit (gsd:validate-phase) was not run; UAT served instead. This is tech debt in the process.
- **No branching strategy:** Working directly on main means no PR record for the phase. Fine for a solo project, but makes the ship step a manual STATE.md update rather than a PR.

### Patterns Established

- **vitest.config.ts separate from vite.config.ts** — @tailwindcss/vite is incompatible with jsdom; the separation is now the project standard
- **tsconfig.app.json excludes test files** — prevents tsc build from type-checking test-only patterns
- **i18n tests use createInstance()** — avoids re-initialization warnings and http-backend side effects in unit tests
- **Boot refresh via rawClient before ReactDOM.render** — prevents login flash; authStore.status = 'loading' as initial state
- **module-level refreshPromise** — single-flight pattern for concurrent 401s; established as the canonical pattern

### Key Lessons

1. **Always pin scaffolding tools:** `pnpm create vite` and `shadcn@latest` can surprise you. Pin versions in research.
2. **Back up untracked files before scaffold commands.** The .claude/ tooling was not in git — it was lost and had to be recreated from context. Add non-.gitignored tooling to git before running overwrite commands.
3. **UAT can substitute for VERIFICATION.md** if all success criteria are explicit and checked. The formal /gsd:verify-work step adds value for complex phases but was overkill for a foundation scaffold.
4. **Inline test isolation:** Unit tests for i18n, stores, and clients must mock or isolate side effects. The createInstance() pattern and vi.mock() are the tools.

### Cost Observations

- Model mix: ~100% Sonnet (no Opus or Haiku used)
- Sessions: 1 full session (Phase 1, all 5 plans + UAT)
- Notable: Fast execution — all 5 plans + UAT in ~2 hours of elapsed time; no blocking research needed

---

---

## Milestone: v0.2 — Authentication

**Shipped:** 2026-05-16
**Phases:** 1 (Phase 2) | **Plans:** 4

### What Was Built

1. Auth API layer: login, register, loginWithGoogle, logout — all via rawClient; proactive JWT refresh hook decodes exp, schedules refresh at exp−60s, cancels on unmount
2. LoginPage: email/password + Google OAuth button + "or" separator + Remember Me checkbox + blur-triggered validation + Sonner toast server errors + authenticated redirect
3. RegisterPage: displayName/email/password + Google OAuth + blur validation (password ≥8 chars, displayName ≤50 chars) + Sonner toasts + authenticated redirect
4. GoogleOAuthProvider wrapped at app root in main.tsx with VITE_GOOGLE_CLIENT_ID
5. Test suite: 25 tests — 5 new for useProactiveRefresh, 4 updated redirect tests (real component mocks), 16 carried from v0.1

### What Worked

- **Parallel wave execution:** Plans 02 (LoginPage) and 03 (RegisterPage) ran in parallel — independent files, no conflicts.
- **must_haves in PLAN frontmatter:** Explicit truths + artifacts + key_links made verification mechanical — grep patterns confirmed wiring without manual inspection.
- **onBlur validation mode:** Choosing `mode: 'onBlur'` upfront avoided the "validates while typing" UX trap and was testable in UAT immediately.
- **Sonner toast for all server errors:** Centralizing error UX to toast.error (not inline form errors) made the error pattern consistent and easy to UAT (one visual check vs. DOM assertion).
- **ResizeObserver polyfill pattern:** Adding it once in test-setup.ts fixes all Radix-dependent component tests — established as the project pattern.

### What Was Inefficient

- **UAT-then-fix loop on logout:** The logout issue (test 10) required a second pass — fix commit after UAT revealed the missing navigate() call. Could have been caught during verify-phase if the verifier had been triggered by execute-phase.
- **@hookform/resolvers version mismatch:** Discovered at runtime (startup note in UAT.md). A dependency compatibility check during plan-phase research would have caught this.
- **verify-work doesn't generate VERIFICATION.md:** Had to spawn gsd-verifier separately after UAT completion — the workflow boundary between verify-work (UAT) and verify-phase (VERIFICATION.md) wasn't obvious upfront.
- **ship flow blocked by branching_strategy: none:** Needed a manual "mark as shipped on main" path since all work was on main. Fine for solo, but worth setting up a branching strategy before Phase 3.

### Patterns Established

- **useMemo + t for Zod schemas:** Zod schemas with i18n messages are wrapped in `useMemo` with `t` as a dependency — schemas rebuild on language change without creating a new schema on every render
- **Navigate redirect placed after all hook calls:** React Rules of Hooks — conditional returns (redirect) placed after all hook calls regardless of whether the hook result is used before the redirect
- **toast.error in GoogleLogin.onError:** The onError callback on GoogleLogin must also toast — it covers silent SDK failures that onSuccess never fires for
- **rawClient for all auth/* calls:** `/auth/refresh` and `/auth/logout` use rawClient to avoid the response interceptor's refresh loop; production pattern established

### Key Lessons

1. **Run verify-phase during execute-phase, not after.** The verifier produces VERIFICATION.md which ship requires — currently it's only triggered by execute-phase, not verify-work. Run /gsd:validate-phase or equivalent during execution to avoid the gap.
2. **Check dependency compatibility in research phase.** @hookform/resolvers and zod have tight version coupling. Pin resolver version explicitly in PLAN frontmatter rather than discovering at runtime.
3. **UAT is the right gate, not just the last step.** Test 10 (logout) revealed a real regression. The UAT-to-fix loop is working as intended — the gap was the navigate() call, not the pattern.
4. **For solo projects on main, the "ship" step is a STATE.md update.** Accept this and document it clearly; don't fight the workflow by retroactively creating branches.

### Cost Observations

- Model mix: ~100% Sonnet 4.6 (no Opus or Haiku used)
- Sessions: 1 full session (Phase 2, all 4 plans + UAT + ship + milestone close)
- Notable: UAT found 1 major issue; fix was 3-line change; total rework cost was minimal

---

## Milestone: v0.3 — User Profile & Account

**Shipped:** 2026-05-16
**Phases:** 1 (Phase 3) | **Plans:** 4

### What Was Built

1. `UserProfile` type reconciliation — `defaultInstrumentId: string | null`, `scheduledDeletionAt: string | null`; `authStore.updateUser` action added
2. AppLayout + Navbar: persistent sticky header wrapping all `/app/*` routes; avatar button with initials fallback; dropdown ("My Profile" / "Sign out")
3. profileApi.ts: 6 async functions using shared Axios instance — getMe, updateMe, uploadAvatar, requestDeletion, cancelDeletion, getInstruments
4. ProfilePage: full USER-01–04 — react-hook-form + Zod; avatar click-to-upload with loading spinner; language/pageSize/instrument selects; account deletion dialog + 30-day banner + cancellation

### What Worked

- **Type-first planning:** PLAN-01 reconciling the type before the API layer (PLAN-03) and UI (PLAN-04) prevented cascading type errors downstream. Zero TypeScript errors across all 4 plans.
- **Explicit UAT as the verification gate:** 13 specific tests with expected behavior descriptions caught real issues (405 errors, 404 on deletion, initials not rendering) before ship.
- **Feature-scoped API module pattern:** `features/profile/api/profileApi.ts` is clean, isolated, and easy to test — reinforces the cross-feature import constraint.
- **authStore.updateUser as the single source of truth:** Profile mutations update the store; the navbar avatar re-renders automatically via Zustand subscription. No TanStack Query invalidation needed for user state.
- **Locale expansion strategy (25 keys):** Expanding EN + HU stubs in PLAN-03 before the UI (PLAN-04) meant zero missing-key errors during implementation.

### What Was Inefficient

- **UAT-then-fix loop (x5 issues):** The initial execute-phase produced 405s on all PATCH/POST endpoints and a 404 on deletion. A fix commit (382246b) was required after UAT. Root cause: profileApi.ts methods and URLs didn't match the spec. Earlier spec consultation during planning would have prevented this.
- **Avatar initials bug:** The `getInitials` helper in Navbar.tsx showed `?` instead of initials — a minor logic issue that should have been caught in PLAN-02's verification step with a more thorough grep pattern.
- **No unit tests for ProfilePage/profileApi:** The profile feature relies entirely on UAT for coverage. PLAN-04 had no `pnpm test` verification step — only TypeScript checking. This is tech debt.
- **Open question Q1/Q2 answered at implementation time:** The avatar endpoint method and instruments endpoint shape were unclear in planning; they were discovered at implementation (and then caused 405 issues). Spec lookups during plan-phase research would eliminate this.

### Patterns Established

- **Feature-scoped API module:** `src/features/{feature}/api/{feature}Api.ts` — all calls use shared `client`; interfaces co-located in the same file
- **authStore.updateUser for profile mutations:** All profile PATCH/POST responses call `updateUser(returned UserResponse)` to sync in-memory state
- **react-hook-form `values` prop for server-driven defaults:** `useForm({ values: serverData })` re-populates form when query data loads — no manual `reset()` needed
- **Custom avatar size via className:** shadcn `Avatar` only accepts `"default"/"sm"/"lg"` as size prop; use `className="size-N"` for custom dimensions

### Key Lessons

1. **Consult the spec during plan-phase, not just during execution.** The 405 errors were caused by endpoint mismatches that the spec documented — a 10-minute spec read during research would have prevented a fix commit.
2. **Add a `pnpm test` verification step to every plan that touches behavior.** TypeScript clean ≠ behavior correct. PLAN-04's verification only ran `tsc --noEmit`; a component smoke test would have caught the initials bug.
3. **UAT found 7 issues across 13 tests — ~54% issue rate is high for an executed phase.** This reflects an execution-heavy milestone with insufficient spec-grounding at plan time. Target <2 UAT issues per phase.
4. **The AppLayout pattern is foundational.** Every future phase (4–12) will render inside AppLayout. Getting it right here (sticky, z-indexed, Outlet-based) prevents rework.

### Cost Observations

- Model mix: ~100% Sonnet 4.6
- Sessions: 1 full session (Phase 3, all 4 plans + UAT + fix + verify + ship + milestone close)
- Notable: Fix commit required after UAT (7 issues); iteration cost was low but avoidable with better spec lookup at plan time

---

## Cross-Milestone Trends

| Metric | v0.1 | v0.2 | v0.3 |
|--------|------|------|------|
| Phases | 1 | 1 | 1 |
| Plans | 5 | 4 | 4 |
| Tests added | 19 | +6 (25 total) | 0 (25 still) |
| Files created | ~50 source | ~10 source | ~15 source |
| Timeline | 2 days | 1 day | 1 day |
| UAT issues found | — | 1 | 7 |
| Fix commits required | 3 | 1 | 1 |
| Blocking issues | 3 | 1 | 0 (only spec mismatches) |
| HU stubs deferred | 16 keys | 22 keys | +25 keys (now ~63 total) |
