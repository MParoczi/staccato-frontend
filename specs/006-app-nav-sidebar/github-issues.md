# GitHub Issues — 006-app-nav-sidebar

Copy each block below into a new GitHub issue at `https://github.com/MParoczi/staccato-frontend/issues/new`.

- **Repository**: `MParoczi/staccato-frontend`
- **Base branch for PRs**: `006-app-nav-sidebar`
- **Specification**: `specs/006-app-nav-sidebar/`
- **Phase 1 (Setup)** is already implemented (T001–T004 marked `[x]` in `tasks.md`) and is intentionally omitted below.

Each issue is scoped to one phase so the `speckit-implementation.agent.md` agent can pick it up, implement every task in that phase, and open a single PR targeting `006-app-nav-sidebar`.

Suggested labels (create them first if they do not exist): `speckit`, `feature/006-app-nav-sidebar`, `phase:N` (one per phase).

---

## Issue 1 — Phase 2: Foundational (NAV_ITEMS + user-display cascade + unit tests)

**Title**

```
[006-app-nav-sidebar] Phase 2: Foundational — NAV_ITEMS constant and user-display cascade utility
```

**Labels**: `speckit`, `feature/006-app-nav-sidebar`, `phase:2`

**Body**

```markdown
## Phase

**Specification**: `specs/006-app-nav-sidebar/`
**Base branch (branch off this and target it with the PR)**: `006-app-nav-sidebar`
**Phase**: 2 — Foundational (Blocking Prerequisites)

> Blocking prerequisites. No user-story work can begin until this phase is complete. Phase 1 (Setup — T001–T004) is already merged into the base branch.

## Tasks to implement

Implement every task in this list in the order shown. `[P]` marks tasks that can be done in parallel (different files, no dependencies).

- [ ] **T005** Create `NAV_ITEMS` constant in `src/components/layout/nav-items.ts` — readonly array of 3 items: `{ labelKey: 'notebooks', icon: BookOpen, path: '/app/notebooks' }`, `{ labelKey: 'chords', icon: Music, path: '/app/chords' }`, `{ labelKey: 'exports', icon: Download, path: '/app/exports' }` with `NavItem` interface and `as const` assertion (per `data-model.md` §3).
- [ ] **T006** Create `computeUserDisplayProjection()` pure function and `UserDisplayProjection` discriminated union type in `src/lib/utils/user-display.ts` — implements the FR-010 4-tier cascade (per `data-model.md` §2 and contract §3); accepts `{ user, isLoading, isError, fallbackLabel }`, returns `{ tier, displayName, avatarFallback }`; handles whitespace-only names as empty, malformed email (no `@`) falls to tier 4, initials always uppercased.
- [ ] **T007** Create unit tests for the cascade in `src/lib/utils/user-display.test.ts` — 13 test cases matching UD-1 through UD-13 in the contracts (isLoading, isError, null user, undefined user, both names, firstName only, lastName only, whitespace name, email fallback, empty email, malformed email, lowercase names, loading+error precedence); 100% branch coverage.

## Dependencies

- Phase 1 (Setup) is already merged.
- T005 and T006 are independent (different files) and can be done in parallel.
- T007 depends on T006 (test file imports from source file).

## Checkpoint / Acceptance criteria

- `NAV_ITEMS` exports a `readonly` tuple typed with `NavItem`, 3 entries in the order notebooks → chords → exports.
- `computeUserDisplayProjection` implements the full 4-tier cascade with correct whitespace handling, initials uppercasing, and malformed-email handling.
- `user-display.test.ts` contains UD-1 through UD-13 and passes with 100% branch coverage.
- `pnpm run lint` passes.
- `pnpm test` passes (including all 13 new cases).
- In `tasks.md`, T005, T006, T007 are marked `[x]` in the same commit as the implementation.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md`:
- Read `.specify/memory/constitution.md`, `CLAUDE.md`, and the full `specs/006-app-nav-sidebar/` directory before writing code.
- Branch name: `006-app-nav-sidebar/phase-2-foundational`.
- One commit covering all tasks; PR targets `006-app-nav-sidebar`.
```

---

## Issue 2 — Phase 3: US1 (AppSidebar component + AppLayout restructure)

**Title**

```
[006-app-nav-sidebar] Phase 3: US1 — AppSidebar component and AppLayout restructure
```

**Labels**: `speckit`, `feature/006-app-nav-sidebar`, `phase:3`, `user-story:US1`

**Body**

```markdown
## Phase

**Specification**: `specs/006-app-nav-sidebar/`
**Base branch (branch off this and target it with the PR)**: `006-app-nav-sidebar`
**Phase**: 3 — User Story 1: Navigate between top-level sections (Priority: P1) — MVP

**Goal**: Render the persistent sidebar with wordmark and 3 nav entries; active-state highlighting via `NavLink` prefix match; restructure `AppLayout` to remove header and hoist the deletion banner.

**Independent test**: Sign in → sidebar visible on left with "Staccato" wordmark + 3 entries → click each entry → main content changes + active highlight follows → click wordmark → returns to `/app/notebooks`.

## Tasks to implement

- [ ] **T008 [US1]** Create `AppSidebar` component in `src/components/layout/AppSidebar.tsx` — renders `<aside>` with fixed `w-60 shrink-0 h-screen sticky top-0` root; `<nav aria-label={t('app.sidebar.nav.label')}>` landmark; wordmark `<Link to="/app/notebooks">` with brand typography and `text-sidebar-foreground`; maps `NAV_ITEMS` to `<NavLink>` entries using default prefix matching (`end` is `false` by default — no explicit prop needed); each entry has Lucide icon (`aria-hidden="true"`) + `<span className="truncate">` label + `title={fullLabel}` tooltip; active state: `bg-sidebar-primary text-sidebar-primary-foreground` + `aria-current="page"` (NavLink default); hover state: `bg-sidebar-accent text-sidebar-accent-foreground`; all `transition-*` classes paired with `motion-reduce:transition-none`; nav list section uses `min-h-0 overflow-y-auto` for internal scroll; divider between nav and user section uses `border-sidebar-border`; focus rings use `focus-visible:ring-sidebar-ring`; tab order from JSX source order: wordmark → 3 entries → user trigger (per AS-1 through AS-13, AS-A1 through AS-A6).
- [ ] **T009 [US1]** Restructure `AppLayout` in `src/routes/app-layout.tsx` — remove `<header>` and `handleLogout` function entirely; remove unused imports (`LogOut`, `Button`, `useTranslation` for auth keyPrefix, `logout`, `useAuthStore`); hoist `<DeletionBanner />` as FIRST child of the outer `flex flex-col` div; add `<AppSidebar />` as first child of the inner flex row; inner row gets `min-h-0`; `<main>` gets `min-w-0`; remove the empty `<aside>` comment; keep `useProactiveRefresh()` call; remove `useCurrentUser()` call — DeletionBanner and AppSidebar both call it directly (TanStack Query deduplicates by query key); remove `useNavigate` import — no remaining usage after `handleLogout` is deleted (per LC-1 through LC-9).

## Dependencies

- Phase 2 is merged (T005 `NAV_ITEMS`, T003/T004 i18n keys available).
- T008 must land before T009 — T009 imports and mounts the component from T008.
- The bottom user-section area stays empty / a placeholder at the end of this phase; US2 fills it.

## Checkpoint / Acceptance criteria

- Sidebar is visible on every `/app/*` route, with wordmark + 3 nav entries.
- Active-state highlighting via default prefix match: clicking any entry updates `aria-current="page"` and applies `bg-sidebar-primary text-sidebar-primary-foreground`.
- `<header>` is gone; `<DeletionBanner />` spans the full width above the sidebar + main row.
- No regressions: existing layouts (notebook, profile, chord library, exports, 404) still render their main content.
- `pnpm run lint` and `pnpm test` pass.
- T008, T009 marked `[x]` in `tasks.md` in the implementation commit.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md`:
- Branch name: `006-app-nav-sidebar/phase-3-us1-navigation`.
- One commit; PR targets `006-app-nav-sidebar`.
```

---

## Issue 3 — Phase 4: US2 (UserMenu + sidebar wiring with cascade + logout)

**Title**

```
[006-app-nav-sidebar] Phase 4: US2 — UserMenu component with cascade and logout handling
```

**Labels**: `speckit`, `feature/006-app-nav-sidebar`, `phase:4`, `user-story:US2`

**Body**

```markdown
## Phase

**Specification**: `specs/006-app-nav-sidebar/`
**Base branch (branch off this and target it with the PR)**: `006-app-nav-sidebar`
**Phase**: 4 — User Story 2: Access profile and sign out from user menu (Priority: P1)

**Goal**: Add the user section at the bottom of the sidebar with avatar, display name (4-tier cascade), and a DropdownMenu containing "Profile & Settings" and "Log out" with full edge-case handling.

**Independent test**: Sign in → user section shows avatar/initials + display name at sidebar bottom → click row → menu opens upward with "Profile & Settings" and "Log out" → click "Profile & Settings" → navigates to `/app/profile` → reopen menu → click "Log out" → session ends, redirected to `/login`.

## Tasks to implement

- [ ] **T010 [US2]** Create `UserMenu` component in `src/components/layout/UserMenu.tsx` — accepts `UserMenuProps { projection, avatarUrl, onLogout }`; renders Radix `DropdownMenu` with single `DropdownMenuTrigger` as full-row `<button>` (avatar + name + `ChevronsUpDown` icon); `aria-label={t('app.sidebar.userMenu.openLabel')}`; `DropdownMenuContent side="top" align="start"`; "Profile & Settings" item with `User` icon → `navigate('/app/profile')` (no toast/error on guard redirect per FR-024); `DropdownMenuSeparator`; "Log out" item with `LogOut` icon → calls `onLogout()`; "Log out" item `disabled` when `useAuthStore(s => s.isLoggingOut)` (per UM-12); Avatar shows `<AvatarImage src={avatarUrl}>` when non-null + `<AvatarFallback>` with initials (tiers 1–3) or `<UserCircle>` icon (tier 4); display name truncated with `truncate` + `title` tooltip; all icons `aria-hidden="true"`; labels from i18n keys (per UM-1 through UM-15, UM-A1 through UM-A4).
- [ ] **T011 [US2]** Wire `UserMenu` into `AppSidebar` — call `useCurrentUser()` in `AppSidebar`; derive `isLoading = isPending && !user` and `isErrorWithoutData = isError && !user` (per FR-018 refetch stability); call `computeUserDisplayProjection({ user, isLoading, isError: isErrorWithoutData, fallbackLabel: t('app.sidebar.userMenu.fallbackName') })`; implement `handleLogout` as async function per UM-11 (double-submit guard via `isLoggingOut`, `startLogout()`, try `await logout()`, catch → toast `t('app.sidebar.userMenu.logoutLocalOnly')`, finally → `clearAuth()` + `navigate('/login', { replace: true })`); pass `projection`, `avatarUrl: user?.avatarUrl ?? null`, and `handleLogout` to `<UserMenu />`.

## Dependencies

- Phase 2 merged (T006 cascade util, T001 Avatar primitive).
- Phase 3 merged (T008 `AppSidebar` exists — T011 wires into it).
- T010 before T011 — T011 mounts `<UserMenu />`.

## Checkpoint / Acceptance criteria

- User section shows correct cascade tier 1/2/3/4 for mocked states.
- Avatar renders image when `user.avatarUrl` is non-null; otherwise initials (tiers 1–3) or `UserCircle` (tier 4).
- Display-name tooltip (`title`) shows full name; text truncates with ellipsis.
- Clicking row opens menu upward with "Profile & Settings" and "Log out".
- Profile item navigates to `/app/profile`.
- Logout success path: `logout()` → `clearAuth()` → navigate `/login` replace.
- Logout API failure: `clearAuth()` still runs, navigate still fires, toast shows `logoutLocalOnly` key.
- Double-submit guard: re-click while `isLoggingOut === true` is a no-op and the menu item is visibly disabled.
- FR-018 refetch stability: background refetches with cached user do NOT flicker to tier 4.
- `pnpm run lint` and `pnpm test` pass.
- T010, T011 marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md`:
- Branch name: `006-app-nav-sidebar/phase-4-us2-user-menu`.
- One commit; PR targets `006-app-nav-sidebar`.
```

---

## Issue 4 — Phase 5: US3 (Notebook coexistence verification)

**Title**

```
[006-app-nav-sidebar] Phase 5: US3 — Verify sidebar coexistence with NotebookLayout
```

**Labels**: `speckit`, `feature/006-app-nav-sidebar`, `phase:5`, `user-story:US3`

**Body**

```markdown
## Phase

**Specification**: `specs/006-app-nav-sidebar/`
**Base branch (branch off this and target it with the PR)**: `006-app-nav-sidebar`
**Phase**: 5 — User Story 3: Sidebar stays visible while working inside a notebook (Priority: P2)

**Goal**: Verify coexistence with `NotebookLayout` — the app sidebar stays visible, the notebook sheet doesn't overlay the sidebar, the banner stacks correctly when both are present.

**Independent test**: Sign in → open notebook → app sidebar still on far-left → "Notebooks" stays active → open notebook's lesson sheet → sheet slides from left of `<main>` not viewport → close sheet → click "Exports" in sidebar → navigates away from notebook.

## Tasks to implement

- [ ] **T012a [US3]** Read `src/routes/notebook-layout.tsx` and verify: (1) the lesson sheet is NOT portaled to `document.body` — it mounts inside `NotebookLayout`'s own DOM subtree (LC-8); (2) the Radix Sheet component's `modal` / focus-trap scope is bounded to the sheet subtree, not the viewport, so it cannot intercept sidebar clicks (FR-023). Record findings in the PR description — no code output if everything is already correct.
- [ ] **T012b [US3]** (Conditional — skip if T012a finds no issues) Fix any portaling or focus-trap violation discovered in T012a inside `src/routes/notebook-layout.tsx`. Specific changes depend on T012a findings.

## Dependencies

- Phase 3 merged (sidebar must exist to verify coexistence).
- T012b is conditional on T012a findings — may be a no-op.

## Checkpoint / Acceptance criteria

- App sidebar remains visible and interactive when a notebook lesson sheet is open.
- Notebook sheet does not portal to `document.body` nor expand its focus trap to cover the viewport (FR-023).
- "Notebooks" nav entry remains active while inside `/app/notebooks/:id/...`.
- Clicking any sidebar entry while the sheet is open navigates away from the notebook.
- PR description records findings from T012a (even if no code change).
- `pnpm run lint` and `pnpm test` pass.
- T012a (and T012b if triggered) marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md`:
- Branch name: `006-app-nav-sidebar/phase-5-us3-notebook-coexistence`.
- One commit; PR targets `006-app-nav-sidebar`.
- If T012b is not triggered, the commit may consist only of marking T012a/T012b `[x]` and (optionally) a short note in `tasks.md` — keep the PR description explicit about that outcome.
```

---

## Issue 5 — Phase 6: Component tests (AppSidebar.test.tsx)

**Title**

```
[006-app-nav-sidebar] Phase 6: AppSidebar component tests (active state, cascade, refetch, logout, a11y)
```

**Labels**: `speckit`, `feature/006-app-nav-sidebar`, `phase:6`, `tests`

**Body**

```markdown
## Phase

**Specification**: `specs/006-app-nav-sidebar/`
**Base branch (branch off this and target it with the PR)**: `006-app-nav-sidebar`
**Phase**: 6 — Tests

**Purpose**: Component tests for the sidebar covering active state, cascade tiers, refetch stability, logout paths, and accessibility.

## Tasks to implement

- [ ] **T013 [US1] [US2]** Create component tests in `src/components/layout/AppSidebar.test.tsx` covering:
  - (a) Active-state highlighting on each SC-002 route: `/app/notebooks` → Notebooks active; `/app/notebooks/abc` → Notebooks active; `/app/notebooks/abc/lessons/def/pages/ghi` → Notebooks active; `/app/chords` → Chord Library active; `/app/exports` → Exports active; `/app/profile` → none active; `/app/unknown` → none active.
  - (b) All four cascade tiers via mocked `useCurrentUser` (tier 1: both names; tier 2: one name; tier 3: email only; tier 4: loading/error with no cached data).
  - (c) FR-018 refetch stability: mock `useCurrentUser` returning cached user + `isFetching: true` → trigger displays cached tier, NOT tier 4.
  - (d) FR-018 open-menu re-render: mock tier change while DropdownMenu is open → menu stays open, trigger re-renders.
  - (e) Logout success path: click "Log out" → `logout()` called → `clearAuth()` called → navigate to `/login`.
  - (f) FR-013b logout-API-failure path: mock `logout()` to reject → `clearAuth()` still called → navigate to `/login` → toast shown with `logoutLocalOnly` message.
  - (g) FR-013c double-submit guard: set `isLoggingOut: true` → click "Log out" → `handleLogout` returns early.
  - (h) `aria-current="page"` present on active link, absent on inactive links (FR-027).
  - (i) FR-023 bounding-rectangle regression: render `AppSidebar` alongside a mocked notebook-sheet open state; assert the sidebar element's layout dimensions (`offsetWidth`, `offsetLeft`) are unchanged before and after the sheet opens — the sheet MUST NOT shift or obscure the sidebar (per SC-004, `plan.md` Principle XII check).

## Dependencies

- Phase 4 merged (all component code must exist).
- Phase 5 merged (T012a findings inform the FR-023 regression setup).

## Checkpoint / Acceptance criteria

- `AppSidebar.test.tsx` covers all 9 groups above.
- All tests pass under `pnpm test`.
- No snapshot files added (component tests use RTL queries per constitution).
- Tests mock `useCurrentUser`, `logout`, `useAuthStore`, and `useNavigate` — no real network calls.
- `pnpm run lint` passes.
- T013 marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md`:
- Branch name: `006-app-nav-sidebar/phase-6-tests`.
- One commit; PR targets `006-app-nav-sidebar`.
```

---

## Issue 6 — Phase 7: Polish & cross-cutting concerns

**Title**

```
[006-app-nav-sidebar] Phase 7: Polish — contrast, reduced motion, truncation, full quickstart verification
```

**Labels**: `speckit`, `feature/006-app-nav-sidebar`, `phase:7`, `polish`

**Body**

```markdown
## Phase

**Specification**: `specs/006-app-nav-sidebar/`
**Base branch (branch off this and target it with the PR)**: `006-app-nav-sidebar`
**Phase**: 7 — Polish & Cross-Cutting Concerns

**Purpose**: Final verification of edge cases, accessibility, and contrast that span multiple stories.

## Tasks to implement

- [ ] **T014 [P]** Verify WCAG AA color contrast for all `--sidebar*` token pairs using a contrast checker (DevTools or WebAIM): `--sidebar-foreground` on `--sidebar` ≥ 4.5:1; `--sidebar-primary-foreground` on `--sidebar-primary` ≥ 4.5:1; `--sidebar-accent-foreground` on `--sidebar-accent` ≥ 4.5:1; Lucide icons ≥ 3:1 against their backgrounds (FR-030). Adjust token values in `src/index.css` if any pair fails.
- [ ] **T015 [P]** Verify `prefers-reduced-motion` behavior (FR-031): enable reduced motion in OS/DevTools → hover transitions instant, active-state swap instant, menu open/close instant. Confirm all `transition-*` classes are paired with `motion-reduce:transition-none` in `AppSidebar.tsx` and `UserMenu.tsx`.
- [ ] **T016 [P]** Verify translated label truncation (FR-033): switch language to Hungarian → confirm "Jegyzetfüzetek", "Akkordkönyvtár", "Exportálások" fit or truncate with ellipsis → hover shows full label in native tooltip → labels don't wrap or shrink font size.
- [ ] **T017 [P]** Verify refresh interceptor guard (FR-013a): confirm `silentRefresh()` in `src/api/client.ts:39` already returns `Promise.reject` when `isLoggingOut === true`. Already present — no code change needed, just verify.
- [ ] **T018** Run `pnpm test` and `pnpm run lint` to confirm all tests pass and no lint errors.
- [ ] **T019** Run `specs/006-app-nav-sidebar/quickstart.md` end-to-end verification (all sections: Story 1, Story 2, Story 3, deletion banner, header removal, sidebar scroll, banner+notebook, notebook sheet, label overflow, reduced motion, logout failure, accessibility).

## Dependencies

- Phase 6 merged (all implementation + tests must be present).
- T014/T015/T016/T017 can run in parallel.
- T018 before T019 — quickstart only runs after lint + tests are green.

## Checkpoint / Acceptance criteria

- All WCAG AA contrast pairs verified; any adjusted token values are committed.
- `motion-reduce:transition-none` present on every `transition-*` class in `AppSidebar.tsx` and `UserMenu.tsx`, verified under reduced motion.
- Hungarian labels truncate cleanly with working `title` tooltip.
- Refresh interceptor guard confirmed present at `src/api/client.ts:39`.
- `pnpm run lint` and `pnpm test` pass.
- Full `quickstart.md` checklist executed; PR description lists any deviations.
- T014–T019 marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`
- [ ] `quickstart.md` end-to-end verification documented in the PR body

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md`:
- Branch name: `006-app-nav-sidebar/phase-7-polish`.
- One commit; PR targets `006-app-nav-sidebar`.
- If T014 requires token adjustments in `src/index.css`, include them in the same commit and note them in the PR description.
```

---

## How to create these on GitHub

1. Open `https://github.com/MParoczi/staccato-frontend/issues/new` in the browser.
2. For each issue above, copy the **Title** into the title field and the **Body** (the fenced `markdown` block contents, excluding the ` ```markdown ` / ` ``` ` fences) into the description.
3. Apply the listed labels (create them once if missing).
4. Assign the issue to the implementation agent / yourself as appropriate.
5. Create issues in phase order (2 → 7). The agent will open PRs in the same order; each one targets `006-app-nav-sidebar` and depends on the previous phase being merged.
