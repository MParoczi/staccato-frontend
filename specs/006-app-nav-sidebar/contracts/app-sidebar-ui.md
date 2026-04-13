# UI Contract: `AppSidebar` and `UserMenu`

**Feature**: 006-app-nav-sidebar
**Date**: 2026-04-06

This feature does **not** introduce any backend contracts — no new endpoints, no new request/response shapes, no new DTOs. The "contracts" for this feature are the public props/children contracts of the two new components and the shape of the new i18n namespace, both of which are internal to the frontend.

## 1. `AppSidebar` component contract

### Import path

```ts
import { AppSidebar } from '@/components/layout/AppSidebar';
```

### Public props

```ts
// AppSidebar takes no props.
export function AppSidebar(): JSX.Element;
```

### Children

None. `AppSidebar` is a self-contained chrome component. It does NOT accept `children` and it does NOT render an `<Outlet />`. The `<Outlet />` stays in `AppLayout`'s `<main>`.

### Behavioral contract

| # | Guarantee | Spec source |
|---|---|---|
| AS-1 | Renders exactly one `<nav>` landmark element containing the 3 nav entries from `NAV_ITEMS`. | FR-001, FR-004 |
| AS-2 | Renders a clickable "Staccato" wordmark element at the top that navigates to `/app/notebooks` when clicked. | FR-003 |
| AS-3 | Renders exactly one `UserMenu` at the bottom. | FR-008, FR-011 |
| AS-4 | Reads the current user via `useCurrentUser()`. Does not pass the raw query result to children — passes only the resolved `UserDisplayProjection` and an `onLogout` callback. | FR-017 |
| AS-5 | Applies `bg-sidebar text-sidebar-foreground` Tailwind classes for its root container and `border-sidebar-border` on the divider between the navigation list and the user section; does not hardcode hex/oklch colors anywhere. | FR-019 |
| AS-6 | Root container has a fixed width of exactly `240px` (Tailwind `w-60`) AND `shrink-0` so it cannot be compressed by a wider `<main>` peer. | FR-002, FR-021 |
| AS-7 | The active nav entry is determined by `NavLink`'s default (prefix) matching — not by any custom `useLocation` logic. The match is "exact pathname OR pathname begins with `<destination>/`" so that all routes under `/app/notebooks/` (including `/app/notebooks/new`, `/app/notebooks/:id`, and any deeper child route) keep "Notebooks" active. | FR-006 |
| AS-8 | The active nav entry has `aria-current="page"` (provided automatically by `NavLink` when `isActive`). Inactive entries have no `aria-current`. | FR-027 |
| AS-9 | Hover state and active state are bound to distinct token pairs and visually distinguishable: active uses `bg-sidebar-primary text-sidebar-primary-foreground` (fully opaque); hover uses `bg-sidebar-accent text-sidebar-accent-foreground` at a lower visual weight than the active binding. An inactive entry under the cursor MUST never be confusable with the currently active entry. | FR-007, FR-019 |
| AS-10 | The root container is sticky to the viewport: `h-screen sticky top-0 flex flex-col`. The wordmark and the user section are flex children with fixed sizes; the navigation list region between them carries `min-h-0 overflow-y-auto` so it scrolls internally if it ever exceeds available height. The sidebar scrolls independently of `<main>`: scrolling main content does NOT scroll the sidebar. | FR-020 |
| AS-11 | The peer `<main>` element (in `AppLayout`) carries `min-w-0` so that wide notebook canvases shrink/scroll inside their own container instead of pushing the sidebar off-screen. (This guarantee is owned by `AppLayout`, see Layout contract LC-7, but is restated here because FR-021 binds the sidebar's width preservation to it.) | FR-021 |
| AS-12 | Each `<NavLink>` row uses Tailwind `truncate` on its label `<span>` and sets `title={fullLabel}` on the link element, so translated labels longer than the available width are truncated with a single trailing ellipsis and exposed via the native title tooltip on hover. The label's accessible name (the `<span>` text content) is the full untruncated label. Truncation MUST NOT shrink font size, wrap to multiple lines, or change the row height. | FR-033 |
| AS-13 | Any class that uses `transition-*` MUST also use `motion-reduce:transition-none` so that hover tint transitions and active-state highlight swaps resolve instantly under `prefers-reduced-motion: reduce`. | FR-031 |

### Accessibility

| # | Guarantee | Spec source |
|---|---|---|
| AS-A1 | The root element wraps its nav list in a `<nav>` with `aria-label` set to the i18n-resolved `app.sidebar.nav.label` (e.g., "Primary navigation"). | FR-001, FR-032 |
| AS-A2 | Each nav entry is a single focusable link with both the icon and the text label inside the same link — the icon is `aria-hidden="true"` because the text label is the accessible name. | FR-005 |
| AS-A3 | Tab order: wordmark → "Notebooks" → "Chord Library" → "Exports" → user-menu trigger. The next Tab press leaves the sidebar and enters `<main>`. Reverse-tab visits the same elements in reverse order. No `tabIndex` overrides are used; the order is achieved by JSX source order alone. | FR-026 |
| AS-A4 | Focus ring is visible on all focusable elements using the theme's `--sidebar-ring` token via Tailwind `focus-visible:ring-sidebar-ring`. | FR-019 |
| AS-A5 | Color contrast for every text/background and icon/background pair MUST satisfy WCAG 2.1 Level AA: 4.5:1 for normal-weight body text, 3:1 for large text and meaningful icons. The three bindings (default, hover, active) MUST each independently satisfy these ratios. Verified during implementation by checking the chosen `--sidebar*` oklch values with a contrast checker. | FR-030 |
| AS-A6 | All sidebar interactive elements MUST be activatable from the keyboard alone: nav links and the wordmark on Enter; the user-menu trigger on Enter or Space; user-menu items on Enter; Escape closes the open menu and returns focus to the trigger. | FR-029 |

## 2. `UserMenu` component contract

### Import path

```ts
import { UserMenu } from '@/components/layout/UserMenu';
```

### Public props

```ts
export interface UserMenuProps {
  /** Pre-computed display projection from computeUserDisplayProjection(). */
  projection: UserDisplayProjection;
  /** Raw avatar URL (nullable) — passed through to <AvatarImage src>. */
  avatarUrl: string | null;
  /** Called when the user picks "Log out" from the menu. */
  onLogout: () => void;
}

export function UserMenu(props: UserMenuProps): JSX.Element;
```

### Behavioral contract

| # | Guarantee | Spec source |
|---|---|---|
| UM-1 | Renders a single Radix `DropdownMenu` with one `DropdownMenuTrigger`. | FR-011 |
| UM-2 | The trigger's click target covers the entire row: avatar + display name + trailing caret + horizontal padding. The trigger is ONE `<button>` semantically — avatar and name MUST NOT be separately clickable. | FR-011 |
| UM-3 | The trigger's `aria-label` resolves to the i18n key `app.sidebar.userMenu.openLabel`. | FR-032 |
| UM-4 | The trigger shows a trailing `ChevronsUpDown` Lucide icon at the right edge of the row, after the display name, as a visual affordance that a menu will open. | FR-011 |
| UM-5 | Inside the row, the trigger renders `<Avatar>` on the left. If `avatarUrl` is non-null, `<AvatarImage src={avatarUrl} />` is rendered and Radix's image-load fallback kicks in on error. The `<AvatarFallback>` always renders `projection.avatarFallback` — either the initials string (tiers 1–3) or a `<UserCircle>` Lucide icon (tier 4). A failed `<img>` load at runtime MUST display the same initials/icon dictated by the current cascade tier — it MUST NOT promote the projection to tier 4. | FR-009, FR-010 |
| UM-6 | The display name to the right of the avatar is `projection.displayName`, truncated with `truncate` if it exceeds the available width inside the row. The full untruncated display name is exposed via `title={projection.displayName}` on the trigger. | FR-011, FR-033 |
| UM-7 | The `DropdownMenuContent` opens with `side="top" align="start"` so the menu flips upward from the trigger (anchored at the top edge of the trigger row), extending toward the navigation list above and never below the bottom edge of the viewport. | FR-011 |
| UM-8 | The content contains exactly two actionable items separated by one `DropdownMenuSeparator`: <br>1. "Profile & Settings" (`DropdownMenuItem`) — leading `User` icon, navigates to `/app/profile` via `useNavigate()`. The sidebar MUST NOT show any toast or error if the destination route's guard redirects elsewhere; the menu closes normally. <br>2. "Log out" (`DropdownMenuItem`) — leading `LogOut` icon, calls the locally-defined `handleLogout()`. | FR-012, FR-024 |
| UM-9 | Clicking outside the open menu closes it without performing any action (Radix default). | FR-011 |
| UM-10 | Pressing `Escape` while the menu is open closes it and returns focus to the trigger (Radix default). | FR-028, FR-029 |
| UM-11 | `handleLogout` MUST be implemented as a local async function that: (a) returns early if `useAuthStore.getState().isLoggingOut` is already true; (b) calls `useAuthStore.getState().startLogout()`; (c) `await logout()` inside a try block; (d) on catch, displays a non-blocking toast with the i18n key `app.sidebar.userMenu.logoutLocalOnly`; (e) inside `finally`, calls `useAuthStore.getState().clearAuth()` and `navigate('/login', { replace: true })`. The local clear and the navigation MUST happen even if the API call fails. | FR-013, FR-013b, FR-013c |
| UM-12 | The "Log out" `DropdownMenuItem` MUST be disabled (Radix `disabled` prop) while `useAuthStore(state => state.isLoggingOut)` is `true`, to prevent double-submission. | FR-013c |
| UM-13 | Silent token-refresh interceptor short-circuit: while `isLoggingOut` is true, the Axios refresh interceptor in `src/api/client.ts` MUST NOT issue a new refresh request. The implementation MUST verify and (if missing) add this guard to the interceptor. The cancellation is the realization of FR-013a. | FR-013a |
| UM-14 | The `UserDisplayProjection` passed to `UserMenu` MUST be computed at the call site (`AppSidebar`) using `isLoading: isPending && !user` and `isError: isError && !user`, so background refetches with cached data do not flicker the trigger to tier 4 and refetch failures with cached data preserve the previous tier. | FR-018 |
| UM-15 | When the cached user resolves to a different cascade tier (promote or demote) while the menu is currently open, the trigger row MUST re-render in place. The open menu's items (`Profile & Settings`, `Log out`) MUST NOT be unmounted, MUST NOT lose focus, and MUST NOT visually flicker — only the trigger's avatar and display-name slot reflect the new tier. | FR-018 |

### Accessibility

| # | Guarantee |
|---|---|
| UM-A1 | The trigger is a `<button type="button">` (Radix ensures this). |
| UM-A2 | The trigger exposes `aria-haspopup="menu"` and `aria-expanded` managed by Radix. |
| UM-A3 | Menu items have visible focus ring on keyboard navigation; arrow keys move between items (Radix default). |
| UM-A4 | Icons inside menu items are `aria-hidden="true"` — the menu item's text label is the accessible name. |

## 3. `computeUserDisplayProjection` function contract

### Import path

```ts
import { computeUserDisplayProjection } from '@/lib/utils/user-display';
import type { UserDisplayProjection } from '@/lib/utils/user-display';
```

### Signature

```ts
export function computeUserDisplayProjection(input: {
  user: User | null | undefined;
  isLoading: boolean;
  isError: boolean;
  fallbackLabel: string;
}): UserDisplayProjection;
```

### Behavioral contract (verified by `user-display.test.ts`)

| # | Input | Output |
|---|---|---|
| UD-1 | `isLoading: true`, any user | `{ tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' }` |
| UD-2 | `isError: true`, any user | `{ tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' }` |
| UD-3 | `user: null`, both flags false | `{ tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' }` |
| UD-4 | `user: undefined`, both flags false | `{ tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' }` |
| UD-5 | `firstName: "Ada"`, `lastName: "Lovelace"`, `email: "ada@x.y"` | `{ tier: 1, displayName: "Ada Lovelace", avatarFallback: "AL" }` |
| UD-6 | `firstName: "Ada"`, `lastName: ""`, `email: "ada@x.y"` | `{ tier: 2, displayName: "Ada", avatarFallback: "A" }` |
| UD-7 | `firstName: ""`, `lastName: "Lovelace"`, `email: "ada@x.y"` | `{ tier: 2, displayName: "Lovelace", avatarFallback: "L" }` |
| UD-8 | `firstName: "  "` (only whitespace), `lastName: "Lovelace"`, `email: "ada@x.y"` | `{ tier: 2, displayName: "Lovelace", avatarFallback: "L" }` (whitespace counts as empty) |
| UD-9 | `firstName: ""`, `lastName: ""`, `email: "ada.lovelace@example.com"` | `{ tier: 3, displayName: "ada.lovelace", avatarFallback: "A" }` (note: initial is uppercased) |
| UD-10 | `firstName: ""`, `lastName: ""`, `email: ""` | `{ tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' }` |
| UD-11 | `firstName: ""`, `lastName: ""`, `email: "no-at-sign"` (malformed) | `{ tier: 4, displayName: fallbackLabel, avatarFallback: 'icon' }` (defensive: no `@` → fall through) |
| UD-12 | `firstName: "ada"`, `lastName: "lovelace"` (lowercase) | `{ tier: 1, displayName: "ada lovelace", avatarFallback: "AL" }` (displayName preserves case; initials always uppercased) |
| UD-13 | Both loading AND error are `true` | Tier 4 (loading takes precedence but result is identical) |

## 4. i18n contract — new keys under `app.sidebar.*`

### Required keys (both `en.json` and `hu.json`)

```jsonc
{
  "app": {
    "sidebar": {
      "brand": "Staccato",
      "nav": {
        "label": "Primary navigation",
        "notebooks": "Notebooks",
        "chords": "Chord Library",
        "exports": "Exports"
      },
      "userMenu": {
        "openLabel": "Open user menu",
        "profile": "Profile & Settings",
        "logout": "Log out",
        "fallbackName": "Account",
        "logoutLocalOnly": "Signed out locally; the server may still hold a session until it expires."
      }
    }
  }
}
```

### Hungarian translations

| Key | EN | HU |
|---|---|---|
| `app.sidebar.brand` | Staccato | Staccato |
| `app.sidebar.nav.label` | Primary navigation | Főnavigáció |
| `app.sidebar.nav.notebooks` | Notebooks | Jegyzetfüzetek |
| `app.sidebar.nav.chords` | Chord Library | Akkordkönyvtár |
| `app.sidebar.nav.exports` | Exports | Exportálások |
| `app.sidebar.userMenu.openLabel` | Open user menu | Felhasználói menü megnyitása |
| `app.sidebar.userMenu.profile` | Profile & Settings | Profil és beállítások |
| `app.sidebar.userMenu.logout` | Log out | Kijelentkezés |
| `app.sidebar.userMenu.fallbackName` | Account | Fiók |
| `app.sidebar.userMenu.logoutLocalOnly` | Signed out locally; the server may still hold a session until it expires. | Helyi kijelentkezés sikeres; a kiszolgáló még a lejáratig őrizheti a munkamenetet. |

### Constraint

Per constitution principle IX and FR-032, all user-facing strings MUST come from these keys. No hardcoded English in `AppSidebar.tsx` or `UserMenu.tsx`. Both EN and HU MUST contain every key listed above before merge — a missing key in either locale is a release blocker.

## 5. Layout contract — how `AppLayout` consumes `AppSidebar`

### Before (current)

```tsx
<div className="flex min-h-screen flex-col">
  <header>{/* logout button */}</header>
  <DeletionBanner />
  <div className="flex flex-1">
    <aside>{/* empty */}</aside>
    <main className="flex flex-1 flex-col"><Outlet /></main>
  </div>
</div>
```

### After (this feature)

```tsx
<div className="flex min-h-screen flex-col">
  <DeletionBanner />
  <div className="flex min-h-0 flex-1">
    <AppSidebar />
    <main className="flex min-w-0 flex-1 flex-col"><Outlet /></main>
  </div>
</div>
```

### Contract guarantees

| # | Guarantee | Spec source |
|---|---|---|
| LC-1 | `<DeletionBanner />` is the FIRST child of the outermost column, so it spans the full viewport width above both sidebar and main content. When the banner is shown AND the user is inside an open notebook, the banner pushes both the app sidebar and the notebook chrome down by exactly its rendered height — the notebook chrome MUST start immediately below the banner, not at `y=0`. | FR-016, FR-022 |
| LC-2 | The `<header>` element is REMOVED. No empty `<header>` placeholder remains. After this feature, the authenticated chrome is exactly: `<DeletionBanner />` (when applicable) above the row of `<AppSidebar />` + `<main>`. | FR-015 |
| LC-3 | The `handleLogout` function is REMOVED from `app-layout.tsx`. Its logic (startLogout + logout() + clearAuth + navigate, now extended per UM-11/UM-12 with try/catch/finally and double-submit guarding) is relocated into `UserMenu.tsx`. | FR-013 |
| LC-4 | The `useCurrentUser()` call in `AppLayout` is REMOVED if it has no remaining consumer there (the banner component already calls it itself, and the sidebar calls it itself). If `AppLayout` still uses it for any other purpose after this feature, the call may stay. | FR-017 |
| LC-5 | The `<aside>` slot from the previous layout is REPLACED by `<AppSidebar />`. No empty `<aside>` or placeholder comment remains. | FR-001 |
| LC-6 | The inner flex row has `min-h-0` so that `<main>` content scrolling works correctly inside the `min-h-screen` outer column. | FR-020 |
| LC-7 | `<main>` has `min-w-0` so that wide content (notebook canvas at max zoom) cannot push the sidebar off-screen. The app sidebar's `shrink-0` (per AS-6) plus `<main>`'s `min-w-0` together guarantee FR-021's horizontal containment. | FR-021 |
| LC-8 | The `NotebookLayout` component (rendered inside `<main>` when the user opens a notebook) is unchanged by this feature. Its slide-in lesson sheet continues to mount inside `NotebookLayout`'s own DOM subtree, so the sheet's left edge naturally aligns with the left edge of `<main>` (i.e., immediately right of the app sidebar) and the sheet's Radix focus trap remains scoped to its own subtree, not affecting the app sidebar. The implementation MUST NOT portal the sheet to `document.body`. | FR-023 |
| LC-9 | The `<DeletionBanner />` MUST NOT be portaled to `document.body`. It MUST remain a direct child of the outermost column so that the document flow pushes the sidebar + main row down by the banner's height. | FR-016, FR-022 |

---

This is the complete contract surface for this feature. Any change to these shapes or guarantees requires a spec amendment.
