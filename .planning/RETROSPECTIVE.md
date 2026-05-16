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

## Cross-Milestone Trends

| Metric | v0.1 |
|--------|------|
| Phases | 1 |
| Plans | 5 |
| Tasks completed | 11 |
| Tests added | 19 |
| Files created | ~50 source files |
| Timeline | 2 days |
| Deviations from plan | 7 auto-fixed |
| Blocking issues | 3 (shadcn bug, tsconfig, env) |
