# Implementation Plan: App Navigation Sidebar

**Branch**: `006-app-nav-sidebar` | **Date**: 2026-04-06 (initial) / 2026-04-08 (release-gate update) | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-app-nav-sidebar/spec.md`

## Summary

Fill the existing empty `<aside>` slot inside `AppLayout` with a real, persistent app-level navigation sidebar. The sidebar anchors to the far-left edge of the viewport on every authenticated screen, exposes a clickable "Staccato" wordmark and three top-level nav entries (Notebooks, Chord Library, Exports) with active-state highlighting (prefix match, so "Notebooks" stays active while inside an open notebook), and anchors a user section at the bottom that opens a shadcn/ui `DropdownMenu` containing "Profile & Settings" and "Log out". The feature also removes the existing `AppLayout` header entirely (its only current occupant is a logout button, which moves into the user menu) and hoists the `DeletionBanner` to full viewport width above the sidebar + main-content row, so the banner is visible regardless of which section the user is in. No new backend endpoints or new API calls are introduced — the sidebar reuses the existing `useCurrentUser()` TanStack Query hook already called in `AppLayout` for the `DeletionBanner`.

In addition to the navigation chrome, the spec covers a release-gate set of edge cases, accessibility obligations, and stress behaviors captured in FR-020 through FR-033: sticky vertical scroll independent of the main content area (FR-020), horizontal overflow containment so wide notebook canvases cannot push the sidebar off-screen (FR-021), correct stacking when the deletion banner and an open notebook are both present (FR-022), peaceful coexistence with the notebook lesson sheet (FR-023), no sidebar-side UI for guarded profile redirects (FR-024), spacing/padding bound to design-system tokens (FR-025), explicit tab order and `aria-current` and focus management for the user menu (FR-026 through FR-029), WCAG 2.1 Level AA contrast (FR-030), `prefers-reduced-motion` handling (FR-031), full i18n string enumeration with EN+HU coverage (FR-032), and `truncate`+title-tooltip handling for long translated nav labels (FR-033). The logout flow itself is hardened with a refresh-race short-circuit (FR-013a), local clear + non-blocking toast on API failure (FR-013b), and double-submit guarding (FR-013c). All of these are achievable with framework defaults (NavLink, Radix DropdownMenu/Avatar, Tailwind `motion-reduce:` variants, native `title` attribute, the existing Zustand `authStore`) plus a possible one-line guard in the Axios refresh interceptor — no new dependencies and no new files beyond the four already planned (`AppSidebar`, `UserMenu`, `NAV_ITEMS`, `user-display`) plus the shadcn `avatar.tsx` primitive.

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS v4, shadcn/ui (via unified `radix-ui` package), TanStack Query v5, React Router v7, Axios, react-i18next, Lucide React
**Storage**: N/A (frontend-only; user display projection comes from the existing `['user', 'profile']` TanStack Query cache; no new client state)
**Testing**: Vitest + React Testing Library + MSW
**Target Platform**: Modern browsers (Chrome/Firefox/Safari/Edge latest 2), desktop viewports only for this feature
**Project Type**: Web application (SPA)
**Performance Goals**: Sidebar renders on initial paint with no layout shift when the `useCurrentUser()` query resolves (FR-018 placeholder MUST occupy the same dimensions as the resolved user section); active-state highlight updates within one paint frame of navigation; under `prefers-reduced-motion: reduce`, all hover/active/menu-open transitions resolve instantly with zero animation duration (FR-031).
**Constraints**: Must coexist with `NotebookLayout` (Feature 5) without overlap (FR-014, FR-023, verified by bounding-rectangle disjointness per SC-004); must not introduce new backend endpoints; all strings localized (en/hu) for the 10 enumerated keys in FR-032; desktop-only (no mobile/tablet/collapsible scope); sidebar width fixed at exactly 240px (FR-002) with `shrink-0` so wider main content cannot compress it (FR-021); WCAG 2.1 Level AA color contrast for all text/icon-on-background pairs (FR-030); pending-deletion banner MUST remain in document flow (NOT portaled) so it pushes both the sidebar and the notebook chrome down by exactly its rendered height (FR-016, FR-022); the notebook lesson sheet from Feature 5 MUST remain mounted inside `NotebookLayout` (NOT portaled to body) so its left edge aligns with the left edge of `<main>` and its focus trap stays scoped to itself (FR-023).
**Scale/Scope**: One layout component (`AppSidebar`), one small child component (`UserMenu`), one pure utility (`computeUserDisplayProjection`), one constant module (`NAV_ITEMS`), edits to `app-layout.tsx` (remove header, restructure layout flex, hoist deletion banner), token-value updates in `src/index.css` (no new token names), i18n key additions to `en.json`/`hu.json` (10 keys per FR-032), a new shadcn/ui `avatar.tsx` primitive, and possibly a guard added to the existing Axios refresh interceptor in `src/api/client.ts` (FR-013a) if it does not already short-circuit on `isLoggingOut`. Zero new hooks, zero new Zustand stores, zero new routes, zero new API endpoints, zero new dependencies.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Folder Structure & Module Boundaries | PASS | `AppSidebar.tsx` is a cross-feature layout component and lives in `src/components/layout/` (per user input and principle I's intent for shared layout components). `UserMenu.tsx` is a tightly coupled child of `AppSidebar` and lives in the same `layout/` folder. No cross-feature imports — sidebar consumes `useCurrentUser()` from `src/features/profile/hooks/` (allowed: `src/features/*` is where that hook lives today, and the sidebar does not live in a different feature folder — it lives in `src/components/layout/`). The header-removal edit is in `src/routes/app-layout.tsx`. |
| II. State Management — Zustand for Client, TanStack Query for Server | PASS | User data: reuses existing `useCurrentUser()` TanStack Query hook (query key `['user', 'profile']`, already registered). No Zustand additions. `DropdownMenu` open/closed state is Radix-local, not global. |
| III. API Integration Discipline | PASS | No new API calls. The logout action reuses the existing `logout()` function from `src/api/auth.ts` already called from `AppLayout`. No direct Axios calls. |
| IV. Component Architecture | PASS | `AppSidebar` is a container (reads `useCurrentUser()` + uses `useNavigate()` for logout). `UserMenu` is a presentational child receiving the resolved user display projection via props (plus a `onLogout` callback). Both are function components with hooks. Both stay under the 250-line limit (est. <150 lines each). |
| V. Design System — Two Visual Zones | PASS | Sidebar is Zone 1 (app shell). Uses the existing `--sidebar*` CSS variable family already defined in `src/index.css`. Those tokens are adjusted for this feature from a light cream to a darker earthy brown to match FR-019's explicit oklch target (lightness ≤ 0.30, hue 50–70). FR-019 binds every sidebar surface to a named token (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`) with no per-component literals. FR-025 binds spacing to design-system spacing tokens. No changes to Zone 2 (notebook canvas). |
| VI. No Emojis — Icons Only | PASS | All visual indicators use Lucide React icons: `BookOpen` (Notebooks), `Music` (Chord Library), `Download` (Exports), `User` (profile menu item), `LogOut` (logout menu item), `ChevronsUpDown` (user menu trigger affordance), `UserCircle` (generic fallback when profile fails/loads). |
| VII. Form Handling & Validation | N/A | No forms in this feature. |
| VIII. Routing & Navigation | PASS | Uses React Router v7's `NavLink` component with the default non-`end` match (prefix match), so `"/app/notebooks"` stays active for any `/app/notebooks/:notebookId/*` descendant route. Wordmark and user menu items use React Router's `Link` or `useNavigate()`. The existing nested routing structure (`AppLayout > Outlet > NotebookLayout > Outlet`) is unchanged — the coexistence requirement from FR-014 is satisfied by the layout structure itself, not by route changes. |
| IX. Internationalization | PASS | All user-facing strings localized via `react-i18next` per FR-032's enumerated 10 keys: `brand`, `nav.label`, `nav.notebooks`, `nav.chords`, `nav.exports`, `userMenu.openLabel`, `userMenu.profile`, `userMenu.logout`, `userMenu.fallbackName`, `userMenu.logoutLocalOnly`. New keys live under the `app.sidebar.*` namespace (does not collide with the existing `notebooks.shell.sidebar.*` and `notebooks.shell.nav.*` which are scoped to the notebook shell). Both `en.json` and `hu.json` MUST contain every key before merge. |
| X. Type Safety | PASS | Reuses the existing `User` interface in `src/lib/types/auth.ts` (which already has `firstName`, `lastName`, `email`, `avatarUrl`). A new small helper type `UserDisplayProjection` (output of the cascade helper in `src/lib/utils/user-display.ts`) is added with a discriminated union `{ tier: 1 \| 2 \| 3 \| 4; displayName: string; avatarFallback: string \| 'icon' }`. No `any`. |
| XI. Performance Patterns | PASS | Sidebar is not inside the grid-canvas hot path. No React.memo needed. Active-state highlighting is handled by `NavLink`'s built-in isActive prop, which only re-renders links whose active state actually changed (React Router internals). User profile query already has `staleTime: 30_000` from the existing hook (constitution XI conformant). |
| XII. Testing | PASS | Unit tests: `user-display.test.ts` (100% branch coverage on the 4-tier cascade — 13 cases per contract UD-1..UD-13). Component tests: `AppSidebar.test.tsx` covers (a) active-state highlighting on each enumerated SC-002 route including a deeper `/app/notebooks/:id/lessons/:lessonId/pages/:pageId` route, (b) all four cascade tiers via mocked `useCurrentUser`, (c) opening the user menu and calling logout on "Log out" click, (d) the FR-018 refetch-stability rule (cached data → background refetch → trigger does NOT flicker to tier 4), (e) the FR-018 open-menu re-render rule (tier change while menu is open does NOT close the menu), (f) the FR-013b logout-API-failure path (clear local + navigate + toast), (g) the FR-013c double-submit guard, (h) `aria-current="page"` on the active link (FR-027). The notebook-sheet coexistence guarantee (FR-023) is verified by an additional regression test in `notebook-layout.test.tsx` (or `AppSidebar.test.tsx`) asserting that opening the lesson sheet does not change the bounding rectangle of the app sidebar. Tests colocated with source files. |

All gates pass. No violations. Nothing to record in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-app-nav-sidebar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI contract — no backend contracts)
│   └── app-sidebar-ui.md
├── checklists/
│   └── requirements.md  # From /speckit.specify
└── tasks.md             # Phase 2 output (via /speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── auth.ts                          # Existing — logout() reused, unchanged
│   └── client.ts                        # MODIFY (conditional) — verify the refresh interceptor short-circuits when authStore.isLoggingOut is true; add the guard if missing (FR-013a)
├── components/
│   ├── common/
│   │   └── DeletionBanner.tsx           # Existing — unchanged structurally; verified it still renders correctly when hoisted to the outer column (FR-016, FR-022)
│   ├── layout/                          # NEW directory
│   │   ├── AppSidebar.tsx               # NEW — the persistent sidebar (container component)
│   │   ├── AppSidebar.test.tsx          # NEW — component tests (active state, cascade tiers, refetch stability, logout failure path, double-submit guard, aria-current)
│   │   ├── UserMenu.tsx                 # NEW — user section + DropdownMenu; owns handleLogout with refresh-race + failure-path handling
│   │   └── nav-items.ts                 # NEW — constant array [{ key, icon, path }] for the 3 nav items; exports `NAV_ITEMS` constant (UPPER_SNAKE_CASE) and `NavItem` interface
│   └── ui/
│       ├── avatar.tsx                   # NEW — shadcn/ui avatar primitive (imports from 'radix-ui')
│       └── dropdown-menu.tsx            # Existing — reused
├── features/
│   └── profile/
│       └── hooks/
│           └── useCurrentUser.ts        # Existing — reused as-is
├── lib/
│   ├── types/
│   │   └── auth.ts                      # Existing — User interface is sufficient (firstName, lastName, email, avatarUrl already present)
│   └── utils/
│       ├── user-display.ts              # NEW — pure function implementing FR-010 4-tier cascade
│       └── user-display.test.ts         # NEW — unit tests, 100% branch coverage (13 cases per UD-1..UD-13)
├── routes/
│   ├── app-layout.tsx                   # MODIFY — remove header; restructure root flex to [DeletionBanner][sidebar ∣ main]; mount AppSidebar in the aside slot; ensure inner row has min-h-0 and main has min-w-0 (FR-020, FR-021)
│   └── notebook-layout.tsx              # VERIFY — confirm the lesson sheet still mounts inside this subtree (NOT portaled) so FR-023 holds; no edits expected
├── i18n/
│   ├── en.json                          # MODIFY — add the 10 app.sidebar.* keys per FR-032
│   └── hu.json                          # MODIFY — add the 10 app.sidebar.* keys per FR-032
└── index.css                             # MODIFY — update --sidebar* CSS variable values to the dark earthy palette (FR-019 oklch target: L ≤ 0.30, hue 50–70); contrast each foreground/background pair against WCAG AA before merge (FR-030)
```

**Structure Decision**: Single-project SPA layout per the constitution's `src/` tree. The new `src/components/layout/` directory is created specifically for cross-feature layout components (shell-level chrome that is not feature-specific), which is the correct home per principle I. `AppSidebar` and `UserMenu` live there because they are shell components shared across every authenticated route, not components belonging to any one feature. The sidebar does NOT live in `src/features/*` because it is not feature-specific. It does NOT live in `src/routes/` because `src/routes/` is reserved for route definitions, layout *pages*, and route guards, and the sidebar is a *component* consumed by `app-layout.tsx`, not a route itself.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 0 (research.md) and Phase 1 (data-model.md, contracts/, quickstart.md) artifacts were written, and re-evaluated again on 2026-04-08 after the spec was extended with FR-020 through FR-033 in response to the release-gate checklist.*

All twelve principles still PASS with the same reasoning as the initial check. Nothing in the Phase 0/1 output, and nothing in the FR-020..FR-033 extension, introduced a new violation. In particular:

- **Principle I**: The new `src/components/layout/` directory is confirmed as the correct home for shell chrome that is not feature-specific. `AppSidebar` imports `useCurrentUser` from `src/features/profile/hooks/` — this is allowed because the import rule bans cross-feature imports *between feature folders*, not imports *from* a non-feature folder into a feature's hooks. The profile feature *exposes* the hook as a shared read (it is effectively the single reader of the user profile query), and `DeletionBanner` (in `src/components/common/`) already does exactly the same import today.
- **Principle II**: Confirmed zero new Zustand state. The new logout edge cases (FR-013a/b/c) are implemented by *consuming* the existing `authStore.isLoggingOut` flag inside `UserMenu` and the existing refresh interceptor — no new fields, no new actions, no new stores.
- **Principle III**: FR-013b's logout-API-failure path uses `try/catch/finally` around the existing `logout()` API call — no new endpoint, no direct Axios calls in components, no behavior outside the existing API client layer. The optional `src/api/client.ts` interceptor guard for FR-013a is a one-line addition to existing infrastructure, not a new module.
- **Principle V**: The sidebar CSS token override in `src/index.css` stays within the existing `--sidebar*` variable family. No new token names are introduced, so the Zone 1 design system remains coherent. FR-019's explicit token bindings and FR-025's spacing-token requirements reinforce, not weaken, this principle.
- **Principle VIII**: The nested routing structure is unchanged — this feature touches `AppLayout`'s JSX but not `src/routes/index.tsx`. The coexistence with `NotebookLayout` (FR-014, FR-023) is satisfied entirely by document flow and Radix focus-trap scoping, requiring no route changes.
- **Principle IX**: FR-032's enumerated 10 i18n keys are added to both EN and HU. The new `userMenu.logoutLocalOnly` toast key is the only string surface added by FR-013b; everything else is pre-enumerated by the original spec.
- **Principle X**: No new types beyond `UserDisplayProjection` (already in data-model.md) and `NavItem` (already in data-model.md). The refetch-stability guards are derived from `useCurrentUser()`'s existing `isPending`/`isFetching`/`isError` flags — no new union types needed.
- **Principle XI**: The reduced-motion handling (FR-031) is implemented via Tailwind's `motion-reduce:` variant, which is build-time CSS — zero runtime cost. The refetch stability rule is one boolean expression at the call site, not a new memoization layer or `React.memo`.
- **Principle XII**: Test targets expanded to cover the new behavioral guarantees (refetch stability, logout-failure path, double-submit guard, `aria-current`, sidebar/notebook-sheet bounding-rectangle disjointness). All still satisfy the colocated unit/component test pattern; no E2E or visual-regression tests are added.

No re-design was triggered by the FR-020..FR-033 extension. The plan artifacts are internally consistent with the latest spec (2026-04-08), with the 2026-04-06 clarification session decisions, with the 2026-04-08 release-gate Q&A decisions, and with constitution v1.0.0.

## Complexity Tracking

> No constitution violations. Nothing to justify.
