# Concerns, Risks & Tech Debt

**Analysis Date:** 2026-04-28

> Severity legend: **HIGH** = ship-blocker / security / data-loss · **MED** = correctness / UX · **LOW** = polish / hygiene.
> "Audit ref" cites `issues/bug-audit-2026-04.md` issue numbers where applicable.

## Security

### S1. Refresh-token hard redirect (audit Issue 3) — **RESOLVED, verify**
- Audit said `silentRefresh` did `window.location.href = '/login'`.
- Current `src/api/client.ts` lines 51–58: only `clearAuth()` + reject. **No `window.location` mutation.**
- **Action:** Confirm with `grep -rn "window.location" src/` and close audit issue.

### S2. Single-flight refresh — **OK**
- `src/api/client.ts` lines 35–61 share a single `refreshPromise` across concurrent 401s. **No race.**

### S3. Token storage — **OK (verify)**
- `src/stores/authStore.ts` has no `persist` middleware. Token is memory-only.
- **Action:** `grep -rn "localStorage\|sessionStorage" src/` to confirm only `i18next` writes locale (browser language detector). If anything writes a token, escalate to HIGH.

### S4. `dangerouslySetInnerHTML` — **MED, verify**
- **Action:** `grep -rn "dangerouslySetInnerHTML" src/`. If present, replace with `<Trans>` from `react-i18next` or sanitize via DOMPurify.

### S5. Google OAuth posture — **MED, verify**
- `src/App.tsx` mounts `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>` only when env is set.
- **Verify:** PKCE / state validation in `src/features/auth/` callback handling; redirect URIs allowlisted in Google Console.

### S6. Env-var leakage — **LOW**
- Vite exposes only `VITE_*` keys. Confirmed consumers: `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`. Do not prefix any secret with `VITE_`.

### S7. SignalR auth — **N/A yet**
- `@microsoft/signalr` declared but not wired. When implementing, use `accessTokenFactory` rather than `?access_token=…` query string.

## Correctness Bugs (from `issues/bug-audit-2026-04.md`)

> Several were either fixed since the audit or remain open. Status verified against current source where possible.

| # | Title | Severity | Status (2026-04-28) | File |
|---|-------|----------|---------------------|------|
| 1 | Lesson page prev/next + keyboard nav broken (URL uses index instead of `pageId`) | **HIGH** | **Open — verify** | `src/features/notebooks/utils/page-sequence.ts` |
| 2 | Delete-page double toast | LOW | **Open — verify** | `src/features/notebooks/components/DeletePageButton.tsx` |
| 3 | `silentRefresh` hard redirect | MED | **Looks resolved** in `src/api/client.ts` (no `window.location`) | `src/api/client.ts` |
| 4 | `useProactiveRefresh` swallows unhandled rejection | LOW | **Open — verify** | `src/features/auth/hooks/useProactiveRefresh.ts` |
| 5 | `ProtectedRoute` unreachable fallback | LOW | **Open — verify** | `src/routes/protected-route.tsx` |
| 6 | Dead `refreshToken` export in `api/auth.ts` | trivial | **Open — verify** | `src/api/auth.ts` |
| 7 | `useLanguageSwitch` wipes name when cache cold | MED | **Open — verify** | `src/features/profile/hooks/useLanguageSwitch.ts` |
| 8 | `CreateNotebookDialog` doesn't close on success; defaults don't hydrate | LOW | **Open — verify** | `src/features/notebooks/components/CreateNotebookDialog.tsx` |
| 9 | `IndexPage` hardcodes footer page number `1` | LOW | **Open — verify** | `src/features/notebooks/components/IndexPage.tsx` |
| 10 | `NotebookCard` keyboard activation fires twice with dropdown | LOW | **Open — verify** | `src/features/notebooks/components/NotebookCard.tsx` |
| 11 | Arrow-key nav hijacks keys inside dialogs | LOW | **Open — verify** | `src/features/notebooks/hooks/useKeyboardNavigation.ts` |
| 12 | Global query retry retries 4xx | LOW | **Looks resolved** — `src/lib/query-client.ts` retries only on 5xx + network | `src/lib/query-client.ts` |
| 13 | `NotebookLayout` resets zoom on every mount; CSS `zoom` not cross-browser | LOW | **Open — verify** | `src/routes/notebook-layout.tsx` |
| 14 | `StyleEditorDrawer` close-reset against stale styles | LOW | **Open — verify** | `src/features/styling/components/StyleEditorDrawer.tsx` |
| 15 | `UserMenu` avatar lacks `alt` | trivial | **Open — verify** | `src/components/layout/UserMenu.tsx` |

**Action:** Run `bug-fixing` agent against the audit, marking S1/S2/S12 closed, then triage the rest.

## Performance

### P1. No route-level code splitting — **MED**
- `src/routes/index.tsx` imports all page components eagerly. Initial JS bundle ships every page including profile, exports, chords stubs, notebook layout.
- **Action:** Convert `LoginPage`, `RegisterPage`, `NotebookLayout` children to `React.lazy()` + `<Suspense>`. Verify with `vite build --report` (add `rollup-plugin-visualizer`).

### P2. Heavy dependencies in main bundle — **MED**
- `@microsoft/signalr` (~150 kB gz) — currently zero call sites. **Action:** wrap in dynamic import once wired.
- `lucide-react` — already supports per-icon imports; verify no `import * as Icons from 'lucide-react'`.
- `cmdk`, `radix-ui` — keep for now; tree-shake friendly.

### P3. Zustand selector hygiene — **LOW**
- **Action:** `grep -rn "useAuthStore()" src/ | grep -v "(s)"` — flag any whole-store subscriptions.

### P4. Query staleness — **LOW**
- `staleTime: 0` means every mount refetches. Acceptable default; tighten per-query when hot routes (notebook list, lesson pages) show network spam.

### P5. CSS `zoom` non-portable (audit Issue 13) — **MED**
- See bug audit. Switch to `transform: scale(...)` for cross-browser consistency.

### P6. Grid/canvas drag perf (spec 008) — **MED, prospective**
- Drag-and-drop with `@dnd-kit/core` and a module grid is render-hot. Plan for `React.memo` on tile components, stable callback refs, and possibly external/ref-driven drag state.

## Type-Safety Smells

### T1. `as any` / `@ts-ignore` — **MED, verify**
- **Action:** `grep -rEn "as any|as unknown|@ts-ignore|@ts-expect-error" src/` and triage. `verbatimModuleSyntax` + strict mode discourage casts; expect a low count.

### T2. Axios error narrowing — **LOW**
- `src/api/client.ts` line 65 uses `error: AxiosError`, but downstream `catch` blocks should use `isAxiosError(e)` rather than blind casts. Helper opportunity in `src/lib/utils/`.

### T3. SignalR event payloads (future) — **MED**
- When wiring SignalR, define a typed event map and a `hub.on<K extends keyof Events>(...)` wrapper to avoid `any`-typed payloads.

## Accessibility

### A1. ESLint a11y plugin missing — **MED**
- `eslint.config.js` does not include `eslint-plugin-jsx-a11y`. **Action:** add and address violations (icon-only buttons, role/keyboard handlers).

### A2. Custom click targets — **MED, verify**
- **Action:** `grep -rn "onClick" src/components/common src/features | grep -vE "<button|<Button|<a "`. Each hit needs a `<button>` or keyboard handler.

### A3. Avatar alt (audit Issue 15) — **LOW**
- `src/components/layout/UserMenu.tsx` empty `alt`. Use `displayName`.

### A4. Modal arrow-key hijack (audit Issue 11) — **LOW**
- `useKeyboardNavigation` listens globally; should bail when `[role="dialog"], [role="alertdialog"]` is open.

### A5. Canvas keyboard placement (spec 008) — **MED**
- Drag/drop UIs ship mouse-only by default. Provide an arrow-key + Enter placement alternative for WCAG 2.1.1 compliance.

## Speckit Drift

### D1. Active spec **008-grid-canvas-module-placement** — **MED**
- Owns `src/features/styling/` and `src/lib/constants/grid.ts` + `modules.ts`. **Action:** diff `specs/008-…/tasks.md` checklist against actual files; re-run `/gsd-progress` to surface unticked items.

### D2. Realtime not yet implemented — **LOW**
- `@microsoft/signalr` declared in dependencies but no source references. Specs 005–008 may assume realtime. Verify scope.

### D3. Older specs (001–007) — **LOW**
- May be partially superseded. Mark each completed spec with `Status: implemented` in its `spec.md` header.

## Dependency Risks

### R1. Bleeding-edge majors — **MED**
- `react@19.2`, `react-router@7.13`, `vite@8`, `tailwindcss@4`, `vitest@4`, `i18next@26`, `eslint@9`. Ecosystem plugins occasionally lag.
- **Action:** `pnpm outdated`; run `pnpm install --frozen-lockfile` in CI; pin resolutions for any peer-dep noise.

### R2. `@microsoft/signalr` types — **LOW**
- Wrap behind a typed facade in `src/lib/signalr.ts` so a future swap is local.

### R3. `radix-ui` unified package — **LOW**
- Recently consolidated; verify shadcn re-add commands target the new import path.

### R4. `msw@2` setup — **LOW**
- Installed but no handlers defined. **Action:** create `src/mocks/{handlers.ts,server.ts}` and import `server.listen()` from `src/test-setup.ts` once integration tests need it.

## Operational Gaps

### O1. No coverage reporter — **LOW**
- Add `@vitest/coverage-v8`; gate CI at a starter threshold.

### O2. No error-tracking SDK — **LOW**
- No Sentry/Datadog wired. Acceptable for this stage; revisit before production.

### O3. No Prettier — **LOW**
- Formatting drifts on long-running branches. Either commit to ESLint-only, or add Prettier with the typescript-eslint integration.

### O4. No route `errorElement` — **LOW**
- `src/routes/index.tsx` has no `errorElement` on any route. Consider a top-level `errorElement` for unhandled router errors.

---

**Quick triage order:**
1. Close audit Issues 3 + 12 (already remediated; verify and tick).
2. Fix audit Issue 1 (HIGH — broken page navigation in lessons).
3. Fix audit Issues 4, 5, 7 (auth correctness).
4. Fix audit Issues 2, 8, 9, 10, 11 (UX / a11y).
5. Polish: audit Issues 6, 13, 14, 15 + adopt `eslint-plugin-jsx-a11y` + add coverage reporter.
6. Then resume spec 008.

