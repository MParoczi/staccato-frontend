# Phase 0 Research: App Navigation Sidebar

**Feature**: 006-app-nav-sidebar
**Date**: 2026-04-06

The Technical Context in `plan.md` has no `NEEDS CLARIFICATION` markers — the user input to `/speckit.plan` supplied the architectural decisions, and the clarification session already resolved the remaining ambiguities in `spec.md`. This document therefore records the key implementation decisions that shape Phase 1 artifacts and downstream tasks, along with the alternatives considered.

## 1. Layout: how to mount the sidebar in `AppLayout` and how to position the deletion banner

**Decision**: Rewrite the root JSX of `app-layout.tsx` into a single column whose first child is the `<DeletionBanner />` (full-viewport-width) and whose second child is a horizontal flex row containing `<AppSidebar />` on the left and the `<main><Outlet /></main>` filling the remaining width.

Concretely:

```tsx
return (
  <div className="flex min-h-screen flex-col">
    <DeletionBanner />
    <div className="flex flex-1 min-h-0">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  </div>
);
```

**Rationale**:
- Spec clarification Q2 (full-width deletion banner) requires the banner to sit above BOTH the sidebar and the main content area. Making the banner the first child of the outer column guarantees that.
- Spec clarification Q3 (header removal) requires the header to be removed entirely. The existing `<header>` element and its logout button are deleted outright.
- `min-h-0` on the inner flex row is required so that a long `<main>` content area scrolls correctly instead of breaking out of the viewport — necessary because of the `min-h-screen flex-col` ancestor (this is a known React+Tailwind trap worth documenting).
- `min-w-0` on `<main>` prevents a wide notebook canvas from pushing the sidebar off-screen.
- The existing route nesting `AppLayout > NotebookLayout > ...` is unchanged; the `<Outlet />` in `<main>` renders either a flat page (dashboard, profile, chords, exports) or the `NotebookLayout`, which then renders its own toolbar/sheet/canvas in its own internal column. Zero route structure changes — the coexistence requirement is satisfied purely by nesting.

**Alternatives considered**:
- *Placing `<DeletionBanner />` inside `<main>`* — rejected because the banner would only span the main-content column and not sit above the sidebar, violating the clarification Q2 decision (Option A).
- *Using CSS `grid` instead of nested flexboxes* — considered but rejected because the rest of the codebase (including `NotebookLayout`, `NotebookToolbar`) uses flex, and grid here would add non-trivial cognitive load for no benefit on a 2-child horizontal layout.
- *Keeping the header stripe empty instead of deleting it* — rejected per clarification Q3 (Option A).

## 2. Active-state highlighting: `NavLink` vs. manual `useLocation` matching

**Decision**: Use React Router v7's `NavLink` component with the default non-`end` match (i.e., omit `end` or set `end={false}`) so that a `NavLink to="/app/notebooks"` remains active on `/app/notebooks`, `/app/notebooks/new`, AND any `/app/notebooks/:notebookId/*` descendant. Provide a `className` callback that consumes `isActive` and returns the earthy active/inactive Tailwind classes.

**Rationale**:
- Spec clarification Q1 (Option A) specifies prefix match. React Router's `NavLink` with the default matching strategy gives us prefix match out of the box — no custom logic needed.
- `NavLink` also handles the "update automatically on back/forward/direct URL" portion of FR-006 by subscribing to the router's location state.
- The `NavLink` `className` callback signature `({ isActive }) => string` is the idiomatic way to swap classes without wrapping a child render prop, and it plays well with `cn()`.
- Zero new files: no `useIsActive` hook, no custom path-match utility.

**Alternatives considered**:
- *Manual `useLocation().pathname.startsWith(path)`* — rejected because it re-implements what `NavLink` gives us for free, and is prone to subtle bugs (e.g., `"/app/notebooks"` would incorrectly match a hypothetical future `"/app/notebooks-archive"` without a trailing-slash check).
- *`NavLink` with `end={true}`* — rejected because it would make the entry active ONLY on `/app/notebooks` itself and drop inactive the moment a notebook opens — directly contradicting clarification Q1.
- *Implementing active state as a Zustand-stored "activeSection" enum updated from route-level `useEffect`* — rejected as over-engineering; route location is already the source of truth.

## 3. Avatar: use shadcn/ui Avatar vs. reuse the existing custom avatar `<img>` in `AvatarUpload`

**Decision**: Add a new shadcn/ui `src/components/ui/avatar.tsx` primitive (`Avatar`, `AvatarImage`, `AvatarFallback`) wrapping `radix-ui`'s `Avatar` module. Use it in `UserMenu`.

**Rationale**:
- The project uses the unified `radix-ui` package (not per-package installs), confirmed in `package.json` (`"radix-ui": "^1.4.3"`) and in `src/components/ui/dropdown-menu.tsx` which imports via `import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"`. The `Avatar` module is exported from that same package — no new dependency is required.
- Radix's `Avatar` handles the image-loading lifecycle correctly: it only renders the `<AvatarImage>` when the image loads successfully, otherwise it renders the `<AvatarFallback>`. This is exactly the FR-009 behavior ("avatar image when available; fallback when not").
- The existing `src/features/profile/components/AvatarUpload.tsx` does its own `<img onError>` handling for the profile page use case. That code is feature-specific (upload/crop flow) and should not be dragged into a layout component. Creating the shadcn primitive is the cleaner separation.
- The shadcn `avatar.tsx` file is ~35 lines of boilerplate — trivial to add.

**Alternatives considered**:
- *Reuse `AvatarUpload`* — rejected because `AvatarUpload` is interactive (upload button, preview, error states) and carries profile-feature concerns.
- *Hand-roll a `<img onError={() => setFailed(true)}>` inside `UserMenu`* — rejected; Radix's primitive is ~20 lines of imports and gives us battle-tested fallback behavior.
- *Install the standalone `@radix-ui/react-avatar` package* — rejected; the project uses the unified `radix-ui` entry point and adding a second dependency would violate consistency.

## 4. Display-name and initials fallback: where the cascade lives

**Decision**: Implement FR-010's 4-tier cascade as a single pure function `computeUserDisplayProjection(user: User | null | undefined, isLoading: boolean, isError: boolean)` in `src/lib/utils/user-display.ts`, returning a discriminated-union `UserDisplayProjection` object. `UserMenu` calls it once per render and hands the result to `Avatar`/name slots.

**Rationale**:
- Pure functions are trivially unit-testable and the constitution requires "100% branch coverage" for pure utility logic (principle XII).
- Keeping the cascade outside the component means the component body remains <100 lines and the test for the cascade is tiny, fast, and doesn't require rendering anything.
- Accepting both `isLoading` and `isError` as explicit flags (rather than re-deriving from `user == null`) keeps the cascade deterministic: "still loading" vs. "never known" vs. "successfully known to be empty" are distinguishable, which matches the spec's cascade tier 4 (profile still loading OR fetch failed).
- Returning a discriminated union `{ tier: 1|2|3|4, displayName: string, avatarFallback: string | 'icon' }` lets the caller drive both the name slot and the avatar fallback slot from the same object in a single render — satisfying the FR-010 invariant "same cascade tier MUST drive both the display name and the avatar fallback in any given render."

**Alternatives considered**:
- *Two separate functions (`computeDisplayName`, `computeInitials`)* — rejected because they could theoretically disagree (e.g., one reads `firstName` and the other reads `email` if called with different inputs), which the spec forbids.
- *Inlining the cascade inside `UserMenu`* — rejected because it would make the component harder to test and would violate the constitution's preference for pure utility logic in `src/lib/utils/`.
- *Adding a custom hook `useUserDisplay()`* — rejected as unnecessary indirection; the cascade has no side effects and no dependency on React.

## 5. Logout behavior: lift the existing `handleLogout` into `UserMenu` vs. pass it down as a prop

**Decision**: Keep `handleLogout` defined in a shared place that `UserMenu` can invoke. The cleanest option is to **move the handler inline into `UserMenu`** (which imports `useAuthStore`, `logout`, and `useNavigate` directly) and **remove it from `AppLayout`** entirely, because after header removal `AppLayout` no longer needs it. This matches user-input bullet #6.

**Rationale**:
- After header removal, `AppLayout` has no other use for `handleLogout`. Keeping it in `AppLayout` and drilling it down as a prop to `AppSidebar` → `UserMenu` would leave dead code at the top level.
- `UserMenu` is the only place in the app (after this feature) that initiates logout, so owning the handler there minimizes coupling.
- The handler is ~8 lines and does not warrant a dedicated hook (`useLogout()`) for a single call site.

**Alternatives considered**:
- *Extract `useLogout()` hook* — rejected as premature abstraction; there is only one caller. If logout becomes reachable from a second place (e.g., a keyboard shortcut), a hook can be extracted then.
- *Drill `onLogout` from `AppLayout` to `UserMenu`* — rejected because `AppLayout` does not otherwise need the handler, and drilling it through `AppSidebar` adds a prop chain for no benefit.
- *Invoke `logout()` directly from `UserMenu` without touching `useAuthStore`* — rejected because the existing flow in `app-layout.tsx` calls `startLogout()` + `clearAuth()` around the API call, and `useAuthStore.isLoggingOut` may be consumed elsewhere (e.g., `ProtectedRoute`). Behavior must be preserved per FR-013.

## 6. Sidebar design tokens: override vs. add

**Decision**: Override the values of the existing `--sidebar*` CSS custom properties in `src/index.css` to a darker earthy palette. Do NOT introduce new CSS variable names.

Concretely, the existing values in `:root` (light mode) will change from cream to a deep walnut/espresso tone:

```css
/* Before (current) */
--sidebar: oklch(0.95 0.01 75);
--sidebar-foreground: oklch(0.20 0.02 55);
--sidebar-accent: oklch(0.92 0.03 85);
--sidebar-accent-foreground: oklch(0.30 0.05 70);
--sidebar-border: oklch(0.88 0.015 75);

/* After (target — values are illustrative; exact oklch to be fine-tuned during implementation) */
--sidebar: oklch(0.22 0.025 55);            /* deep walnut brown */
--sidebar-foreground: oklch(0.90 0.012 75); /* cream/off-white */
--sidebar-accent: oklch(0.38 0.08 55);      /* warm-brown active highlight */
--sidebar-accent-foreground: oklch(0.98 0.005 75); /* lighter cream, on-active text */
--sidebar-border: oklch(0.30 0.03 55);      /* slightly lighter walnut for separator */
```

**Rationale**:
- The sidebar tokens already exist (`src/index.css` lines 87–94), so Tailwind utility classes `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `text-sidebar-accent-foreground`, `border-sidebar-border` are already wired up in the `@theme inline` block (`src/index.css` lines 15–22).
- Overriding values rather than adding new names keeps the Zone 1 design system coherent — other app-shell components could, in theory, also be re-themed later without renaming anything.
- The existing values are light/cream because they were set before there was any actual sidebar. Updating them now is a legitimate design-system evolution, not a workaround.
- Dark-mode values in `.dark` (lines 109+) will also be reviewed to ensure contrast holds. (This feature does not introduce dark mode, but the tokens exist there; we simply pick sensible values for consistency.)

**Alternatives considered**:
- *Use inline arbitrary color classes (`bg-[oklch(0.22_0.025_55)]`)* — rejected because it bypasses the design-system variable layer and violates principle V's spirit of "Tailwind theme MUST define the earthy palette as CSS variables."
- *Add new variable names (`--app-sidebar-bg`)* — rejected as unnecessary duplication; the semantic slot (`--sidebar`) already exists.
- *Match the notebook toolbar exactly (`bg-muted/40`)* — rejected because the spec explicitly asks for a DARK earthy tone that is distinct from the toolbar's muted cream; "same family" means the same warm-brown *hue family*, not the same value.

## 7. i18n key namespace: `nav.*` vs. `app.sidebar.*`

**Decision**: Add new keys under a new top-level `app` namespace, specifically `app.sidebar.*`:

```jsonc
{
  "app": {
    "sidebar": {
      "brand": "Staccato",
      "nav": {
        "notebooks": "Notebooks",
        "chords": "Chord Library",
        "exports": "Exports"
      },
      "userMenu": {
        "openLabel": "Open user menu",
        "profile": "Profile & Settings",
        "logout": "Log out",
        "fallbackName": "Account"
      }
    }
  }
}
```

**Rationale**:
- A top-level `nav.*` namespace is already partially used inside `notebooks.shell.nav.*` (for previous/next page arrows) and using a bare `nav.*` at the top level would be confusingly close to that. A dedicated `app.sidebar.*` namespace is unambiguous and matches the constitution's guidance ("namespaced by feature").
- The `brand` key isolates the "Staccato" wordmark string in i18n, so if the product is ever renamed or translated, only one key changes. (The spec allows "Staccato" as copy, but i18n is the point of abstraction.)
- `fallbackName: "Account"` is the cascade tier 4 label, centralized as an i18n key so it can be translated.
- `openLabel: "Open user menu"` is the accessible name for the user-menu trigger (screen readers).

**Alternatives considered**:
- *Reuse `notebooks.shell.nav.*`* — rejected; those keys are scoped to the notebook's own sidebar/toolbar and mixing them would conflate two different sidebars.
- *Put keys under `common.*`* — rejected; `common.*` is for truly generic strings (Save, Cancel, Loading), not for sidebar-specific labels.
- *Inline English strings and skip i18n* — rejected, violates constitution principle IX.

## 8. Which Lucide icons to use

**Decision**:
- `BookOpen` — Notebooks nav entry (matches the notebook metaphor already used elsewhere in the codebase, e.g., `NotebookToolbar.tsx`)
- `Music` — Chord Library nav entry
- `Download` — Exports nav entry (matches `NotebookToolbar.tsx`'s existing Download icon for exports)
- `ChevronsUpDown` — the trailing caret/chevron on the user-menu trigger (per clarification Q4; `ChevronsUpDown` signals "this opens a menu that can flip up or down" which matches the bottom-of-sidebar placement)
- `UserCircle` — generic person icon for cascade tier 4 (FR-010 #4: "a generic person icon")
- `User` — Profile & Settings menu item leading icon
- `LogOut` — Log out menu item leading icon (already imported in `app-layout.tsx` today; stays imported, but in `UserMenu.tsx` instead)

**Rationale**: All are Lucide React icons (bundled with shadcn/ui). No emojis. Choices align with icons already used in sibling features for visual consistency.

**Alternatives considered**: `Disc3`/`Music2`/`Guitar` for Chord Library — rejected; `Music` is the most neutral and recognizable. `FileDown`/`FolderDown` for Exports — rejected; `Download` matches the toolbar precedent.

## 9. Sidebar scroll behavior — vertical sticky, horizontal containment

**Decision**: The `AppSidebar` root element uses `h-screen sticky top-0 w-60 shrink-0 flex flex-col` so that it occupies the full viewport height, sticks to the top of its scroll context, and refuses to shrink below 240 pixels. Inside the column, the wordmark and the user section are flex children with fixed sizes; the navigation list is the only flex-growing child and carries `min-h-0 overflow-y-auto` so that if it ever exceeds the available height (a defensive case for the current 3 entries) it scrolls internally rather than pushing the user section out of view. The `<main>` peer of the sidebar carries `min-w-0` (already in section 1) which lets wide notebook canvases scroll inside their own container without pushing the sidebar off-screen.

**Rationale**:
- FR-020 requires the sidebar to be sticky to the viewport, the wordmark pinned at top, and the user section pinned at bottom. A `flex flex-col` column with three children (`wordmark` / `nav grow` / `user section`) gives that for free.
- FR-021 requires the sidebar's 240-pixel width to survive arbitrary horizontal overflow in the main area. Tailwind's `shrink-0` is the canonical way to opt a flex child out of shrinking; combined with `min-w-0` on `<main>`, the main area becomes the only horizontally compressible peer, which is the desired behavior for the notebook canvas.
- `sticky top-0` rather than `fixed` keeps the sidebar in normal document flow so the deletion banner above it (per FR-022) can push it down by exactly the banner's rendered height — `fixed` would require manual top-offset arithmetic to match the banner height.
- An explicit `min-h-0` on the navigation list region is needed because flex children default to `min-h-auto`, which would prevent `overflow-y-auto` from kicking in inside a flex column.

**Alternatives considered**:
- *`fixed left-0 top-0`* — rejected because `fixed` removes the sidebar from flow and would require recomputing its `top` whenever the deletion banner mounts/unmounts. `sticky` defers this to the layout engine.
- *Manually `position: absolute` inside a relatively-positioned ancestor* — rejected as more brittle than `sticky` for the same outcome.
- *Leaving `<main>` without `min-w-0`* — rejected; without `min-w-0`, a wide notebook canvas WOULD push the sidebar off-screen, directly violating FR-021. `min-w-0` is already in section 1's snippet for this reason.

## 10. Combined banner + notebook layout and notebook sheet coexistence

**Decision**: No additional code is required to satisfy FR-022 and FR-023 beyond the layout chosen in section 1, because the existing `AppLayout > NotebookLayout > NotebookSheet` nesting already produces the correct behavior:

- **Banner + notebook combined**: The `<DeletionBanner />` is the first child of `AppLayout`'s outermost flex column, so the inner row (`<AppSidebar />` + `<main>`) is pushed down by exactly the banner's rendered height. Inside `<main>`, when the user is in a notebook, `NotebookLayout` mounts and renders its toolbar and canvas. Both the app sidebar and the notebook chrome therefore start immediately below the banner — the requirement is satisfied by document flow alone.
- **Notebook sheet coexistence**: The notebook's slide-in lesson sheet (Feature 5) is mounted *inside* `NotebookLayout`, which is inside `<main>`, which is the right peer of `<AppSidebar />`. The sheet's left edge therefore aligns with the left edge of `<main>` (i.e., immediately right of the app sidebar), not with the viewport edge. The sheet's Radix focus trap is scoped to its own DOM subtree and does not affect the app sidebar, which remains keyboard-reachable and clickable while the sheet is open.

**Rationale**:
- The two requirements (FR-022, FR-023) read as if they need explicit code, but they are satisfied by *not breaking* the existing nesting. Documenting this here prevents an implementer from over-engineering a solution (e.g., wrapping the sheet in a portal targeted at `body`, which would re-introduce the bug).
- A regression test for FR-023 (in `AppSidebar.test.tsx` or a notebook layout test) should assert that opening the lesson sheet does not change the bounding rectangle of the app sidebar.

**Alternatives considered**:
- *Portaling the deletion banner to `document.body`* — rejected; a portal would float the banner above content but would NOT push the sidebar down, violating FR-022's "pushes both down by exactly the banner's rendered height".
- *Portaling the notebook sheet to `document.body`* — rejected; a portal would re-introduce the risk of the sheet sliding from the viewport edge and overlapping the app sidebar, directly violating FR-023.

## 11. Logout edge cases — refresh race, API failure, in-flight feedback

**Decision**: The `handleLogout` implementation that lives inside `UserMenu` (per section 5) is rewritten as follows to satisfy FR-013a, FR-013b, and FR-013c:

```ts
const handleLogout = async () => {
  if (isLoggingOut) return;                           // FR-013c — guard against double-submit
  useAuthStore.getState().startLogout();              // sets isLoggingOut: true; refresh interceptor reads this and aborts
  try {
    await logout();                                   // POST /auth/logout
  } catch (err) {
    toast.error(t('app.sidebar.userMenu.logoutLocalOnly'));  // FR-013b
  } finally {
    useAuthStore.getState().clearAuth();              // always clear local state
    navigate('/login', { replace: true });            // always navigate
  }
};
```

To satisfy **FR-013a (refresh race)**, the existing Axios refresh interceptor (already in `src/api/client.ts`) MUST short-circuit when `useAuthStore.getState().isLoggingOut` is `true` — i.e., it MUST NOT issue a new refresh request and MUST NOT replay queued requests once `startLogout()` has been called. If the interceptor does not already do this, this feature MUST add that guard. (Verification: read `src/api/client.ts` during implementation; add the guard if missing.)

**Rationale**:
- The `try/catch/finally` structure honors the user's intent (FR-013b): the local session is cleared and the user is redirected even if the server-side `POST /auth/logout` fails.
- Reading `isLoggingOut` from the store at the top of the handler (FR-013c) prevents double-submission if the menu somehow remains interactive between clicks.
- Co-locating the refresh guard inside the existing refresh interceptor (rather than adding a new abort signal in `UserMenu`) keeps the cancellation logic close to the request that needs cancelling, and avoids passing AbortControllers through the auth store.
- The toast key `app.sidebar.userMenu.logoutLocalOnly` is added to the i18n catalog (per FR-032 enumeration item #9).

**Alternatives considered**:
- *Awaiting an `AbortController` passed into the refresh call* — rejected; the refresh is fired by an interceptor, not a direct call, so there is no `AbortController` to pass. The store flag is the cleanest cross-cutting signal.
- *Showing a blocking modal on logout failure* — rejected; FR-013b requires a *non-blocking* notification.
- *Skipping `clearAuth()` on failure* — rejected; this would leave the user in a broken authenticated state with the menu open, which is the worst of all options.

## 12. Refetch tier stability and open-menu re-render

**Decision**: The user section reads from `useCurrentUser()` and computes the `UserDisplayProjection` from `data` plus the `isLoading` and `isError` flags. To satisfy FR-018's "do NOT flicker to tier 4 just because a background refetch is in progress" rule, the cascade input MUST treat "cached data exists, refetch in flight" as a tier 1–3 state, not tier 4. Concretely:

```ts
const { data: user, isPending, isError, isFetching } = useCurrentUser();

// FR-018: only treat as "loading" when there is no cached data at all.
const isLoading = isPending && !user;
// FR-018: only treat as "error" when there is no cached data at all.
const isErrorWithoutData = isError && !user;

const projection = computeUserDisplayProjection({
  user,
  isLoading,
  isError: isErrorWithoutData,
  fallbackLabel: t('app.sidebar.userMenu.fallbackName'),
});
```

The Radix `DropdownMenu`'s open state lives inside its own component subtree, so a tier change in `projection` causes `UserMenu` to re-render the trigger row (avatar + name + chevron) without unmounting `DropdownMenu.Root` — the open menu's items (`Profile & Settings`, `Log out`) do not flicker. This satisfies FR-018's "re-render to the new tier on the next render cycle, even if the user menu is currently open at that moment" rule.

**Rationale**:
- TanStack Query exposes `isPending` (no cached data ever) separately from `isFetching` (a request is in flight). Conflating the two would cause exactly the flicker FR-018 forbids. Reading `isPending && !user` is the canonical guard.
- Radix `DropdownMenu`'s open/close lifecycle is decoupled from its trigger's child contents — re-rendering the trigger does not close the menu. This is a property of the Radix component, verified by the docs and by the existing `dropdown-menu.tsx` wrapper in `src/components/ui/`.

**Alternatives considered**:
- *Using `placeholderData: keepPreviousData`* — already implicitly true at the cache level for refetches; the explicit `!user` guard above is what protects the *render* from showing tier 4. Both belt-and-braces.
- *Freezing `projection` in a `useRef` while the menu is open* — rejected; FR-018 explicitly requires the trigger to update *even when the menu is open*. Freezing would violate that.

## 13. Translated label overflow — truncate + tooltip

**Decision**: Each `<NavLink>` row uses Tailwind `truncate` on its label `<span>` and sets a native `title={fullLabel}` attribute on the link. The full label is also already the link's accessible name (the `<span>` contains the text), so no `aria-label` override is needed.

```tsx
<NavLink to={item.path} title={t(`app.sidebar.nav.${item.labelKey}`)}>
  {({ isActive }) => (
    <>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{t(`app.sidebar.nav.${item.labelKey}`)}</span>
    </>
  )}
</NavLink>
```

**Rationale**:
- `truncate` (= `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`) is the lightest-weight way to satisfy FR-033 — no JS measurement, no `ResizeObserver`, no font-size shrinking.
- The native `title` attribute is the simplest tooltip that works for keyboard and mouse users (browsers expose it on hover and on focus). It does not require a custom `Tooltip` component or extra dependencies.
- Because the visible label and the title attribute resolve from the same i18n key, there is no risk of them disagreeing — and per FR-032 item #10 they share a single key.

**Alternatives considered**:
- *Using shadcn/ui `Tooltip` (Radix Tooltip primitive)* — rejected as overkill for nav labels. The native `title` attribute is sufficient and zero-cost.
- *Measuring text with `ResizeObserver` and shrinking the font* — rejected; FR-033 forbids font-size shrinking and forbids row-height changes, and dynamic measurement adds complexity for no user benefit.
- *Wrapping labels to two lines* — rejected per FR-033's explicit prohibition.

## 14. Accessibility implementation mapping (FR-026 through FR-031)

**Decision**: Each new accessibility FR maps to a specific implementation choice as follows. None of these requires a new dependency; all are properties of `NavLink`, Radix `DropdownMenu`, or Tailwind classes already in use.

| FR | Implementation |
|---|---|
| FR-026 (tab order) | Source order in JSX: wordmark `<Link>` → 3 `<NavLink>`s in `NAV_ITEMS` order → `<UserMenu>` trigger. No `tabIndex` overrides. |
| FR-027 (aria-current) | `<NavLink>` automatically applies `aria-current="page"` to the active link. No code needed. |
| FR-028 (focus management for menu) | Radix `DropdownMenu.Trigger` and `DropdownMenu.Content` handle focus-in on open, focus trap while open, focus return to trigger on close. No code needed. |
| FR-029 (keyboard activation) | `<Link>` and `<NavLink>` are `<a>` elements activated by Enter natively. Radix `DropdownMenu.Trigger` is a `<button>` that activates on Enter or Space natively. Escape inside the menu is Radix default. |
| FR-030 (WCAG AA contrast) | Token values in `src/index.css` (per section 6) MUST be picked so each foreground/background pair meets 4.5:1 (text) and 3:1 (icons). Verified during implementation with a color-contrast checker against the chosen oklch values. |
| FR-031 (reduced motion) | Tailwind utility `motion-reduce:transition-none` applied to any class that uses `transition-*`. Radix `DropdownMenu` already respects `prefers-reduced-motion` for its open/close animation. |

**Rationale**:
- Listing the FR-to-implementation mapping in research keeps the implementer from re-deriving it when writing each component. It also makes review faster: a reviewer can grep the diff for each row of this table.
- Picking framework-default behaviors (Radix focus management, NavLink aria-current) over hand-rolled equivalents reduces test surface and risk.

**Alternatives considered**:
- *Custom focus-management hook* — rejected; Radix already handles all of FR-028.
- *JS-based reduced-motion detection (`useMediaQuery`)* — rejected; Tailwind's `motion-reduce:` variant generates the equivalent CSS at build time without any JS.

## 15. Profile guard redirect — no special UI

**Decision**: The "Profile & Settings" `DropdownMenuItem` calls `navigate('/app/profile')` (or renders an internal `<Link>`) and then closes the menu via Radix's default item-select behavior. The sidebar does not subscribe to any post-navigation guard outcome, does not display any toast, and does not render any sidebar-side error state if the profile route's guard redirects the user elsewhere. Whatever the destination route does is invisible to the sidebar.

**Rationale**:
- FR-024 explicitly requires the sidebar to NOT show any explanation. The destination route owns its own messaging.
- Subscribing to navigation outcomes from inside a sidebar component would require coupling to the router's history or to a separate event bus, which is unwarranted for a behavior the sidebar must NOT react to.

**Alternatives considered**:
- *Listening to `useLocation()` and showing a toast if the new pathname is not `/app/profile`* — rejected; this would create false positives (e.g., the user clicks Profile, then immediately navigates elsewhere via the sidebar) and violates FR-024's "MUST NOT show any toast or error".
- *Checking `useCurrentUser().data.scheduledDeletionAt` before navigating* — rejected; this leaks profile-feature concerns (deletion lifecycle) into the sidebar. The sidebar should not know about deletion-state guards on the profile route.

---

No open unknowns remain. Phase 1 can proceed.
