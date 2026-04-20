# Tasks: App Navigation Sidebar

**Input**: Design documents from `/specs/006-app-nav-sidebar/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests ARE included — the spec and contracts explicitly require `user-display.test.ts` (13 cases) and `AppSidebar.test.tsx` (active state, cascade tiers, refetch stability, logout paths, aria-current).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — new primitives, CSS tokens, and i18n keys that all stories depend on.

- [x] T001 [P] Add shadcn/ui Avatar primitive at `src/components/ui/avatar.tsx` (AvatarRoot, AvatarImage, AvatarFallback wrappers over `radix-ui` Avatar — follow the pattern of existing shadcn primitives in `src/components/ui/`)
- [x] T002 [P] Update `--sidebar*` CSS variable values in `src/index.css` to the dark earthy oklch palette (`:root` light mode: `--sidebar` background L ≤ 0.30 hue 50–70; adjust `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` for both light and dark themes — color-contrast compliance is verified separately in T014)
- [x] T003 [P] Add the 10 `app.sidebar.*` i18n keys to `src/i18n/en.json` per FR-032 and the contracts i18n table (brand, nav.label, nav.notebooks, nav.chords, nav.exports, userMenu.openLabel, userMenu.profile, userMenu.logout, userMenu.fallbackName, userMenu.logoutLocalOnly)
- [x] T004 [P] Add the 10 `app.sidebar.*` i18n keys to `src/i18n/hu.json` with Hungarian translations per the contracts i18n table

**Checkpoint**: Primitives, tokens, and i18n keys are ready. No visible UI change yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure utility and constant that ALL user stories depend on. Must be complete before any component work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Create `NAV_ITEMS` constant in `src/components/layout/nav-items.ts` — readonly array of 3 items: `{ labelKey: 'notebooks', icon: BookOpen, path: '/app/notebooks' }`, `{ labelKey: 'chords', icon: Music, path: '/app/chords' }`, `{ labelKey: 'exports', icon: Download, path: '/app/exports' }` with `NavItem` interface and `as const` assertion (per data-model.md §3)
- [x] T006 Create `computeUserDisplayProjection()` pure function and `UserDisplayProjection` discriminated union type in `src/lib/utils/user-display.ts` — implements the FR-010 4-tier cascade (per data-model.md §2 and contract §3); accepts `{ user, isLoading, isError, fallbackLabel }`, returns `{ tier, displayName, avatarFallback }`; handles whitespace-only names as empty, malformed email (no `@`) falls to tier 4, initials always uppercased
- [x] T007 Create unit tests for the cascade in `src/lib/utils/user-display.test.ts` — 13 test cases matching UD-1 through UD-13 in the contracts (isLoading, isError, null user, undefined user, both names, firstName only, lastName only, whitespace name, email fallback, empty email, malformed email, lowercase names, loading+error precedence); 100% branch coverage

**Checkpoint**: Foundation ready — `NAV_ITEMS` and `computeUserDisplayProjection` are tested and available for component consumption.

---

## Phase 3: User Story 1 — Navigate between top-level sections (Priority: P1) 🎯 MVP

**Goal**: Render the persistent sidebar with wordmark and 3 nav entries; active-state highlighting via `NavLink` prefix match; restructure `AppLayout` to remove header and hoist banner.

**Independent Test**: Sign in → sidebar visible on left with "Staccato" wordmark + 3 entries → click each entry → main content changes + active highlight follows → click wordmark → returns to `/app/notebooks`.

### Implementation for User Story 1

- [x] T008 [US1] Create `AppSidebar` component in `src/components/layout/AppSidebar.tsx` — renders `<aside>` with fixed `w-60 shrink-0 h-screen sticky top-0` root; `<nav aria-label={t('app.sidebar.nav.label')}>` landmark; wordmark `<Link to="/app/notebooks">` with brand typography and `text-sidebar-foreground`; maps `NAV_ITEMS` to `<NavLink>` entries using default prefix matching (`end` is `false` by default — no explicit prop needed); each entry has Lucide icon (`aria-hidden="true"`) + `<span className="truncate">` label + `title={fullLabel}` tooltip; active state: `bg-sidebar-primary text-sidebar-primary-foreground` + `aria-current="page"` (NavLink default); hover state: `bg-sidebar-accent text-sidebar-accent-foreground`; all `transition-*` classes paired with `motion-reduce:transition-none`; nav list section uses `min-h-0 overflow-y-auto` for internal scroll; divider between nav and user section uses `border-sidebar-border`; focus rings use `focus-visible:ring-sidebar-ring`; tab order from JSX source order: wordmark → 3 entries → user trigger (per AS-1 through AS-13, AS-A1 through AS-A6)
- [x] T009 [US1] Restructure `AppLayout` in `src/routes/app-layout.tsx` — remove `<header>` and `handleLogout` function entirely; remove unused imports (`LogOut`, `Button`, `useTranslation` for auth keyPrefix, `logout`, `useAuthStore`); hoist `<DeletionBanner />` as FIRST child of the outer `flex flex-col` div; add `<AppSidebar />` as first child of the inner flex row; inner row gets `min-h-0`; `<main>` gets `min-w-0`; remove the empty `<aside>` comment; keep `useProactiveRefresh()` call; remove `useCurrentUser()` call — DeletionBanner and AppSidebar both call it directly (TanStack Query deduplicates by query key); remove `useNavigate` import — no remaining usage after `handleLogout` is deleted (per LC-1 through LC-9)

**Checkpoint**: Sidebar renders with working navigation and active-state highlighting. User section is not yet implemented — the bottom area is empty or shows a placeholder. The header is gone; the deletion banner spans full width.

---

## Phase 4: User Story 2 — Access profile and sign out from user menu (Priority: P1)

**Goal**: Add the user section at the bottom of the sidebar with avatar, display name (4-tier cascade), and a DropdownMenu containing "Profile & Settings" and "Log out" with full edge-case handling.

**Independent Test**: Sign in → user section shows avatar/initials + display name at sidebar bottom → click row → menu opens upward with "Profile & Settings" and "Log out" → click "Profile & Settings" → navigates to `/app/profile` → reopen menu → click "Log out" → session ends, redirected to `/login`.

### Implementation for User Story 2

- [x] T010 [US2] Create `UserMenu` component in `src/components/layout/UserMenu.tsx` — accepts `UserMenuProps { projection, avatarUrl, onLogout }`; renders Radix `DropdownMenu` with single `DropdownMenuTrigger` as full-row `<button>` (avatar + name + `ChevronsUpDown` icon); `aria-label={t('app.sidebar.userMenu.openLabel')}`; `DropdownMenuContent side="top" align="start"`; "Profile & Settings" item with `User` icon → `navigate('/app/profile')` (no toast/error on guard redirect per FR-024); `DropdownMenuSeparator`; "Log out" item with `LogOut` icon → calls `onLogout()`; "Log out" item `disabled` when `useAuthStore(s => s.isLoggingOut)` (per UM-12); Avatar shows `<AvatarImage src={avatarUrl}>` when non-null + `<AvatarFallback>` with initials (tiers 1–3) or `<UserCircle>` icon (tier 4); display name truncated with `truncate` + `title` tooltip; all icons `aria-hidden="true"`; labels from i18n keys (per UM-1 through UM-15, UM-A1 through UM-A4)
- [x] T011 [US2] Wire `UserMenu` into `AppSidebar` — call `useCurrentUser()` in `AppSidebar`; derive `isLoading = isPending && !user` and `isErrorWithoutData = isError && !user` (per FR-018 refetch stability); call `computeUserDisplayProjection({ user, isLoading, isError: isErrorWithoutData, fallbackLabel: t('app.sidebar.userMenu.fallbackName') })`; implement `handleLogout` as async function per UM-11 (double-submit guard via `isLoggingOut`, `startLogout()`, try `await logout()`, catch → toast `t('app.sidebar.userMenu.logoutLocalOnly')`, finally → `clearAuth()` + `navigate('/login', { replace: true })`); pass `projection`, `avatarUrl: user?.avatarUrl ?? null`, and `handleLogout` to `<UserMenu />`

**Checkpoint**: User section fully functional with all 4 cascade tiers, avatar fallbacks, logout with edge-case handling (API failure toast, double-submit guard), and profile navigation. Refetch stability verified (background refetches don't flicker to tier 4).

---

## Phase 5: User Story 3 — Sidebar stays visible while working inside a notebook (Priority: P2)

**Goal**: Verify coexistence with `NotebookLayout` — the app sidebar stays visible, the notebook sheet doesn't overlay the sidebar, the banner stacks correctly when both are present.

**Independent Test**: Sign in → open notebook → app sidebar still on far-left → "Notebooks" stays active → open notebook's lesson sheet → sheet slides from left of `<main>` not viewport → close sheet → click "Exports" in sidebar → navigates away from notebook.

### Implementation for User Story 3

- [x] T012a [US3] Read `src/routes/notebook-layout.tsx` and verify: (1) the lesson sheet is NOT portaled to `document.body` — it mounts inside `NotebookLayout`'s own DOM subtree (LC-8); (2) the Radix Sheet component's `modal` / focus-trap scope is bounded to the sheet subtree, not the viewport, so it cannot intercept sidebar clicks (FR-023). Record findings — no code output if everything is already correct.
- [x] T012b [US3] (Conditional — skip if T012a finds no issues) Fix any portaling or focus-trap violation discovered in T012a inside `src/routes/notebook-layout.tsx`. Specific changes depend on T012a findings.

**Checkpoint**: All 3 user stories are functional. The sidebar coexists with every layout variant (dashboard, notebook, profile, chord library, exports, 404).

---

## Phase 6: Tests

**Purpose**: Component tests for the sidebar covering active state, cascade tiers, refetch stability, logout paths, and accessibility.

- [ ] T013 [US1] [US2] Create component tests in `src/components/layout/AppSidebar.test.tsx` covering:
  - (a) Active-state highlighting on each SC-002 route: `/app/notebooks` → Notebooks active; `/app/notebooks/abc` → Notebooks active; `/app/notebooks/abc/lessons/def/pages/ghi` → Notebooks active; `/app/chords` → Chord Library active; `/app/exports` → Exports active; `/app/profile` → none active; `/app/unknown` → none active
  - (b) All four cascade tiers via mocked `useCurrentUser` (tier 1: both names; tier 2: one name; tier 3: email only; tier 4: loading/error with no cached data)
  - (c) FR-018 refetch stability: mock `useCurrentUser` returning cached user + `isFetching: true` → trigger displays cached tier, NOT tier 4
  - (d) FR-018 open-menu re-render: mock tier change while DropdownMenu is open → menu stays open, trigger re-renders
  - (e) Logout success path: click "Log out" → `logout()` called → `clearAuth()` called → navigate to `/login`
  - (f) FR-013b logout-API-failure path: mock `logout()` to reject → `clearAuth()` still called → navigate to `/login` → toast shown with `logoutLocalOnly` message
  - (g) FR-013c double-submit guard: set `isLoggingOut: true` → click "Log out" → `handleLogout` returns early
  - (h) `aria-current="page"` present on active link, absent on inactive links (FR-027)
  - (i) FR-023 bounding-rectangle regression: render `AppSidebar` alongside a mocked notebook-sheet open state; assert the sidebar element's layout dimensions (`offsetWidth`, `offsetLeft`) are unchanged before and after the sheet opens — the sheet MUST NOT shift or obscure the sidebar (per SC-004, plan.md Principle XII check)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification of edge cases, accessibility, and contrast that span multiple stories.

- [ ] T014 [P] Verify WCAG AA color contrast for all `--sidebar*` token pairs using a contrast checker (DevTools or WebAIM): `--sidebar-foreground` on `--sidebar` ≥ 4.5:1; `--sidebar-primary-foreground` on `--sidebar-primary` ≥ 4.5:1; `--sidebar-accent-foreground` on `--sidebar-accent` ≥ 4.5:1; Lucide icons ≥ 3:1 against their backgrounds (FR-030). Adjust token values in `src/index.css` if any pair fails.
- [ ] T015 [P] Verify `prefers-reduced-motion` behavior (FR-031): enable reduced motion in OS/DevTools → hover transitions instant, active-state swap instant, menu open/close instant. Confirm all `transition-*` classes are paired with `motion-reduce:transition-none` in `AppSidebar.tsx` and `UserMenu.tsx`.
- [ ] T016 [P] Verify translated label truncation (FR-033): switch language to Hungarian → confirm "Jegyzetfüzetek", "Akkordkönyvtár", "Exportálások" fit or truncate with ellipsis → hover shows full label in native tooltip → labels don't wrap or shrink font size.
- [ ] T017 [P] Verify refresh interceptor guard (FR-013a): confirm `silentRefresh()` in `src/api/client.ts:39` already returns `Promise.reject` when `isLoggingOut === true`. Already present — no code change needed, just verify.
- [ ] T018 Run `pnpm test` and `pnpm run lint` to confirm all tests pass and no lint errors.
- [ ] T019 Run quickstart.md end-to-end verification (all sections: Story 1, Story 2, Story 3, deletion banner, header removal, sidebar scroll, banner+notebook, notebook sheet, label overflow, reduced motion, logout failure, accessibility).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. All 4 tasks are parallel.
- **Foundational (Phase 2)**: Depends on Phase 1 completion (T001 for avatar type, T003/T004 for i18n keys). T005, T006, T007 are independent of each other but T007 depends on T006.
- **US1 (Phase 3)**: Depends on Phase 2 (T005 for `NAV_ITEMS`, T003/T004 for i18n keys). T008 and T009 are sequential (T008 creates the component, T009 wires it into AppLayout).
- **US2 (Phase 4)**: Depends on Phase 2 (T006 for `computeUserDisplayProjection`, T001 for Avatar) and Phase 3 (T008 for `AppSidebar` to wire into). T010 then T011 are sequential.
- **US3 (Phase 5)**: Depends on Phase 3 (sidebar must exist to verify coexistence). T012a is pure read/verification; T012b is a conditional fix that depends on T012a findings (may be a no-op).
- **Tests (Phase 6)**: Depends on Phase 4 (all component code must be implemented). T013 is a single task.
- **Polish (Phase 7)**: Depends on Phase 6. All tasks except T018/T019 are parallel. T019 depends on T018 passing.

### Within Each User Story

- Models/utils before components
- Components before wiring into layout
- Core implementation before integration

### Parallel Opportunities

```text
Phase 1: T001 ∥ T002 ∥ T003 ∥ T004   (4 parallel tasks — different files)
Phase 2: T005 ∥ T006                   (2 parallel tasks — different files)
         T007 waits for T006            (test file depends on source file)
Phase 3: T008 → T009                   (sequential — T009 imports T008's output)
Phase 4: T010 → T011                   (sequential — T011 wires T010 into T008)
Phase 5: T012a → T012b                 (T012b conditional on T012a findings)
Phase 6: T013                          (single test file)
Phase 7: T014 ∥ T015 ∥ T016 ∥ T017   (4 parallel verification tasks)
         T018 → T019                   (lint/test must pass before quickstart)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (tokens, i18n, avatar primitive)
2. Complete Phase 2: Foundational (NAV_ITEMS + cascade util + unit tests)
3. Complete Phase 3: US1 (sidebar with nav entries + AppLayout restructure)
4. Complete Phase 4: US2 (user menu with cascade + logout)
5. **STOP and VALIDATE**: Sidebar navigates between sections, user can reach profile and log out
6. Run tests (Phase 6)

### Full Delivery

7. Complete Phase 5: US3 (verify notebook coexistence)
8. Complete Phase 7: Polish (contrast, motion, truncation, full quickstart verification)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- The refresh interceptor guard (FR-013a) is already implemented in `src/api/client.ts:39` — T017 is verification only
- The `src/components/layout/` directory exists (has `.gitkeep`) — no need to create it
- No new routes are added — sidebar consumes existing routes via `NavLink`
- No new Zustand stores — sidebar reads `authStore.isLoggingOut` only
- No new API calls — sidebar reuses `useCurrentUser()` and `logout()`
- Total: 20 tasks (4 setup + 3 foundational + 2 US1 + 2 US2 + 2 US3 + 1 tests + 6 polish); T012b is conditional and may be a no-op
