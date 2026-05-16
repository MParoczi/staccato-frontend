---
phase: 01-foundation
plan: 02
subsystem: auth-infra
tags: [zustand, axios, auth-store, http-client, interceptors, single-flight-refresh]
requires: [01-01]
provides: [auth-store, axios-client, axios-raw-client]
affects: [all-future-plans, auth-boot-sequence, api-calls]
tech-stack:
  added: []
  patterns:
    - Zustand v5 curried create<T>()() with status discriminant (no persist)
    - Axios single-instance pattern with request/response interceptors
    - Module-level refreshPromise for single-flight 401 token refresh
    - rawClient (no interceptors) for /auth/refresh to break circular loop
key-files:
  created:
    - src/stores/authStore.ts
    - src/api/rawClient.ts
    - src/api/client.ts
  modified: []
key-decisions:
  - "authStore starts with status: 'loading' (not 'unauthenticated') to prevent flash before boot refresh"
  - "refreshPromise is module-level (not inside error handler) so concurrent 401s share one Promise"
  - "rawClient has zero interceptors — using client for /auth/refresh would cause circular 401 loop"
  - "useAuthStore.getState() used in interceptors (not hook) — interceptors run outside React components"
  - "client.ts error handler casts error to typed shape to satisfy TypeScript strict mode without any"
requirements-completed: []
duration: 10 min
completed: 2026-05-15
---

# Phase 1 Plan 02: Zustand authStore + Axios client/rawClient Summary

Zustand v5 authStore with loading/authenticated/unauthenticated status discriminant (no persist middleware, initial status 'loading'), plus two Axios instances: rawClient (bare, withCredentials, no interceptors) and client (Bearer token + Accept-Language request interceptor, single-flight 401 refresh via module-level Promise with clearAuth on failure).

## Duration

- **Started:** 2026-05-15
- **Completed:** 2026-05-15
- **Duration:** ~10 min
- **Tasks completed:** 2/2
- **Files created:** 3

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Create Zustand authStore with status discriminant (no persist) | COMPLETE | d8cb279 |
| 2 | Create rawClient.ts and client.ts with request/response interceptors | COMPLETE | d8cb279 |

## Verification Results

1. `pnpm tsc --noEmit` — PASS (zero TypeScript errors)
2. `grep "persist" src/stores/authStore.ts` — PASS (no matches)
3. `grep "localStorage\|sessionStorage" src/stores/authStore.ts` — PASS (no matches)
4. `grep "refreshPromise" src/api/client.ts` — PASS (module-level let at line 22)
5. `grep "useAuthStore.getState()" src/api/client.ts` — PASS (3 matches: request interceptor + setAuth + clearAuth)
6. `grep "rawClient" src/api/client.ts` — PASS (import and post call; NOT client.post for refresh)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all three files are complete implementations, not stubs.

## Threat Flags

No new threat surface beyond the plan's documented threat model. All T-01-0* mitigations implemented:
- T-01-06: accessToken in Zustand memory only; no persist; cleared by clearAuth() on refresh failure
- T-01-07: module-level refreshPromise ensures one POST /auth/refresh per burst (single-flight)
- T-01-08: rawClient (no interceptors) used for /auth/refresh; breaks circular 401 loop

## Self-Check: PASSED

- src/stores/authStore.ts: FOUND
- src/api/rawClient.ts: FOUND
- src/api/client.ts: FOUND
- Commit d8cb279: FOUND (git log confirms)
- pnpm tsc --noEmit: PASS
