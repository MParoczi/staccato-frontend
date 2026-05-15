---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts (inline vitest config) |
| **Quick run command** | `pnpm vitest run` |
| **Full suite command** | `pnpm vitest run && pnpm tsc --noEmit && pnpm lint` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run`
- **After every plan wave:** Run `pnpm vitest run && pnpm tsc --noEmit && pnpm lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | Infrastructure | — | N/A | build | `pnpm build` | ✅ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | Infrastructure | — | No token in localStorage/sessionStorage | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | Infrastructure | — | ProtectedRoute never redirects while status=loading | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | Infrastructure | — | i18n Accept-Language header on every request | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | Infrastructure | — | N/A | build | `pnpm tsc --noEmit` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/setup.ts` — vitest setup with @testing-library/react
- [ ] `src/test/authStore.test.ts` — stubs for token-not-in-storage invariant
- [ ] `src/test/protectedRoute.test.ts` — stubs for boot-state spinner behavior
- [ ] `src/test/axiosInterceptors.test.ts` — stubs for Accept-Language header
- [ ] Install: `vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Page reload clears accessToken from memory | Infrastructure (D-04) | Requires browser page reload; not testable in unit env | Open app, log in, check Zustand devtools for token, reload page, verify token is null |
| `/` redirects to `/login` when unauthenticated | Infrastructure (D-06) | Requires browser navigation | Open app in incognito, navigate to `/`, verify redirect to `/login` |
| Walking Skeleton boots and calls POST /auth/refresh | Infrastructure | Requires running backend | Start dev server, open app, check Network tab for POST /auth/refresh call |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
