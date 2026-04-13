# Quickstart: App Navigation Sidebar

**Feature**: 006-app-nav-sidebar
**Audience**: A developer picking up implementation or a reviewer validating the slice end-to-end.

## What this feature delivers (in one sentence)

A persistent dark-earthy navigation sidebar on the far left of every authenticated screen, with the Staccato wordmark, three top-level nav entries (Notebooks / Chord Library / Exports), and a bottom user menu (profile & logout) — replacing the current header's logout button and coexisting with the notebook shell.

## Prerequisites

- Branch `006-app-nav-sidebar` checked out.
- Backend running locally (default base URL from `VITE_API_BASE_URL`) with a user you can sign in as, so `GET /users/me` returns real data.
- `pnpm install` has been run at least once on this branch. (Use **pnpm only** — not npm/yarn.)

## Local dev commands

```bash
pnpm dev        # Vite dev server
pnpm test       # Vitest unit + component tests
pnpm run lint   # ESLint
```

## How to verify the feature end-to-end

These steps correspond to the acceptance scenarios in `spec.md`. They are hand-verification steps; automated coverage is in `AppSidebar.test.tsx` and `user-display.test.ts`.

### Story 1 — Top-level navigation (P1)

1. Sign in as any user. Land on `/app/notebooks`.
2. Observe a dark-earthy sidebar on the far-left edge of the viewport:
   - Top: "Staccato" wordmark.
   - Middle: three nav entries — "Notebooks" (BookOpen), "Chord Library" (Music), "Exports" (Download).
   - Bottom: user section with avatar + display name + trailing chevron.
3. Confirm "Notebooks" is highlighted (active state: warm-brown background, lighter cream text).
4. Click "Chord Library". Main area switches to the Chord Library page. "Chord Library" becomes the highlighted entry; "Notebooks" returns to inactive.
5. Click "Exports". Main area switches. "Exports" is highlighted.
6. Click the "Staccato" wordmark. URL changes to `/app/notebooks`, "Notebooks" becomes highlighted again.
7. Hover each non-active entry. Confirm a subtle warm-brown tint appears on hover and disappears on mouse out.

### Story 2 — User menu (P1)

1. At the bottom of the sidebar, locate the user section.
2. If your account has an `avatarUrl` set and the image loads, confirm the avatar image renders.
3. If your account has NO avatar OR the image fails to load, confirm the fallback renders (initials for tiers 1–3, or a generic person icon for tier 4).
4. Confirm the display name to the right of the avatar matches the cascade tier:
   - Both first and last name set → "First Last"
   - Only one name set → that name
   - No names but email is known → email local-part (before `@`)
   - Loading or failure → the localized "Account" label
5. Click anywhere on the user section row (the entire row — avatar, name, or caret — should trigger the menu). A dropdown opens upward from the bottom of the sidebar.
6. Confirm the dropdown contains, in order:
   - "Profile & Settings" (with a User icon)
   - A divider
   - "Log out" (with a LogOut icon)
7. Click "Profile & Settings". The app navigates to `/app/profile` and the menu closes. No top-level nav entry should be highlighted on `/app/profile` (profile is not a top-level entry).
8. Open the user menu again. Click "Log out". The session ends, you are returned to `/login`. Re-authenticate to continue.

### Story 3 — Coexistence with the notebook shell (P2)

1. Sign in, land on `/app/notebooks`.
2. Click any notebook card to open it. You are now at `/app/notebooks/:notebookId` (or a deeper route).
3. Confirm BOTH of the following are visible simultaneously:
   - The app sidebar on the far-left edge (unchanged — it did not unmount).
   - The notebook's own toolbar (breadcrumb, zoom controls, page indicator) at the top of the main area.
4. Confirm the "Notebooks" entry in the app sidebar is STILL highlighted as active (prefix match — clarification Q1 Option A).
5. Click the notebook's own sidebar toggle (the one that opens the lesson list Sheet from Feature 5). The notebook's lesson-list sheet slides in from the left but does NOT cover the app sidebar — the two are fully independent.
6. Close the lesson sheet. Click "Exports" in the app sidebar. You navigate to `/app/exports` — i.e., the app sidebar is fully usable even from inside a notebook.
7. Navigate back into the same notebook. Open the user menu. Click "Log out". Confirm you are logged out directly from inside the notebook view.

### Deletion banner verification

1. Use a test user whose `scheduledDeletionAt` is set to a future date (or trigger deletion via the profile screen and come back).
2. Reload. Confirm the pending-deletion banner spans the **full width** of the viewport, sitting ABOVE both the sidebar and the main content area. The sidebar begins immediately below the banner — not at `y=0`.
3. Navigate between sections with the sidebar. Confirm the banner remains in place and its width does not change.
4. Confirm the banner is NEVER rendered inside the sidebar.

### Header removal verification

1. On any authenticated screen, confirm there is NO top-of-page header strip. The sidebar and the main content area (plus the deletion banner, when applicable) constitute the entire authenticated chrome.
2. Confirm the previous header's logout button is gone — logout is only reachable via the user menu now.

### Sidebar scroll behavior (FR-020, FR-021)

1. Open `/app/notebooks` and ensure you have enough notebook cards to make the page taller than the viewport (or shrink the browser height).
2. Scroll the main content area down. Confirm that the sidebar stays fixed in place: the wordmark at the top, the user section at the bottom, and the nav entries in between — none of them scroll with the main content.
3. Open any notebook and zoom the canvas to its maximum width so that the canvas exceeds the available horizontal space.
4. Confirm:
   - The sidebar's width does NOT shrink below 240 pixels.
   - The viewport does NOT develop a horizontal scrollbar at the document level.
   - The notebook canvas develops its own internal horizontal scroll inside `<main>` and the sidebar stays fully visible at the left edge.

### Banner + notebook combined layout (FR-022)

1. Use a test user whose `scheduledDeletionAt` is set to a future date so the deletion banner is shown.
2. Open any notebook (`/app/notebooks/:notebookId`).
3. Confirm the layout is, top-to-bottom: (1) the deletion banner spanning the full viewport width, (2) below the banner, the app sidebar on the left and the notebook chrome (toolbar + canvas + notebook-scoped sidebar) on the right.
4. Confirm the notebook toolbar starts immediately below the banner — NOT at `y=0` and NOT overlapping the banner.
5. Confirm the app sidebar's wordmark also starts immediately below the banner, at the same vertical offset as the notebook toolbar.

### Notebook sheet coexistence (FR-023)

1. Inside an open notebook, click the notebook's own sidebar toggle to open the lesson-list sheet from Feature 5.
2. Confirm the sheet slides in from the LEFT edge of the main content area (i.e., immediately to the right of the app sidebar) — NOT from the viewport's left edge.
3. Confirm the app sidebar remains fully visible while the sheet is open. The sheet does NOT cover, overlay, or partially obscure the app sidebar.
4. While the sheet is open, click "Exports" in the app sidebar. Confirm navigation works (the sheet's focus trap, if any, is scoped to the sheet itself and does not block clicks on the app sidebar).
5. Close the sheet. Confirm the app sidebar is unchanged.

### Translated label overflow (FR-033)

1. Switch the UI language to Hungarian (use the language toggle on the profile screen, or temporarily edit the user's `language` field in the database).
2. Reload. The nav labels are now Hungarian: "Jegyzetfüzetek", "Akkordkönyvtár", "Exportálások".
3. Confirm:
   - Each label fits inside the 240-pixel sidebar (it does at the standard padding/font size).
   - If you artificially shrink the available label width (e.g., by editing the row's icon size in DevTools), the label is truncated with a single trailing ellipsis (`…`) — NOT wrapped to two lines, NOT shrunk in font size.
   - Hovering the truncated label shows the full untruncated text in a native browser tooltip.
4. Switch back to English.

### Reduced motion (FR-031)

1. Enable `prefers-reduced-motion: reduce` at the OS level (macOS: System Settings → Accessibility → Display → Reduce Motion; Windows: Settings → Accessibility → Visual Effects → Animation Effects off; or use Chrome DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion`).
2. Reload the app. Hover a non-active nav entry. Confirm the warm-brown tint appears INSTANTLY with no fade transition.
3. Click a different nav entry. Confirm the active-state highlight swaps INSTANTLY with no transition.
4. Open the user menu. Confirm the menu appears INSTANTLY with no slide/fade animation.
5. Close the menu. Confirm it disappears INSTANTLY.
6. Disable the reduced-motion setting and confirm transitions return.

### Logout failure path (FR-013b, FR-013c)

1. Open the app. Stop the backend server (or use DevTools → Network → "Offline").
2. Open the user menu and click "Log out".
3. Confirm:
   - The "Log out" menu item is briefly disabled while the (failed) request is in flight.
   - You are still navigated to `/login` even though the API call failed.
   - A non-blocking toast appears explaining that the local session was ended even though the server may still hold a session.
4. Restart the backend (or re-enable the network) and sign back in.

### Refetch tier stability (FR-018) — code review item

This behavior is hard to reproduce manually because it requires triggering a profile refetch at a specific moment. Verify by code review:

1. Open `src/components/layout/AppSidebar.tsx` and confirm the call site computes `isLoading = isPending && !user` and `isError = isError && !user` (NOT just the raw `isPending`/`isError` flags from `useCurrentUser()`).
2. Confirm `AppSidebar.test.tsx` has a regression test that mocks `useCurrentUser` to return cached data with `isFetching: true` and asserts the trigger displays the cached cascade tier (NOT tier 4).
3. Confirm a second regression test mocks a tier change while a `DropdownMenu` is open and asserts the menu remains open with the new trigger contents.

### Profile guard redirect (FR-024) — code review item

This behavior is by design invisible from the sidebar. Verify by code review:

1. Open `src/components/layout/UserMenu.tsx` and confirm there is NO post-navigation listener, NO toast emission, and NO error state on the "Profile & Settings" path. The item simply calls `navigate('/app/profile')` and Radix closes the menu.
2. Confirm there is no `useEffect` watching `useLocation()` inside the sidebar subtree.

## How to verify accessibility manually

These steps map to FR-026 through FR-031.

1. **Tab order (FR-026)**: Tab through the sidebar from the address bar. Expected tab order: wordmark → "Notebooks" → "Chord Library" → "Exports" → user menu trigger → first focusable element of `<main>`. Every focusable element MUST show a visible focus ring using the `--sidebar-ring` token color. Reverse-tab (Shift+Tab) MUST visit the same elements in reverse.
2. **Keyboard activation (FR-029)**: With the user menu trigger focused, press Enter. The menu opens. Close it. Focus the trigger again, press Space. The menu opens again.
3. **Menu focus management (FR-028)**: With the menu open, confirm focus has moved into the menu (the first menu item, "Profile & Settings", is focused). Use arrow keys (or Tab) to move between "Profile & Settings" and "Log out". Press Enter to activate one.
4. **Escape returns focus (FR-028)**: Re-open the user menu. Press Escape. The menu closes and focus returns to the trigger row.
5. **`aria-current` (FR-027)**: Use a screen reader (VoiceOver / NVDA / Narrator) to verify:
   - The sidebar announces itself as a navigation landmark with the label "Primary navigation" (or its localized equivalent).
   - Each nav link announces its label (text) — not "image" or "graphic".
   - The currently active nav link is announced as "current page" (the screen reader cue for `aria-current="page"`).
   - The user menu trigger announces its accessible name ("Open user menu" or its localized equivalent).
6. **Color contrast (FR-030)**: Use a contrast checker (Chrome DevTools → Inspect → Accessibility → Contrast, or a tool like WebAIM's contrast checker) to verify each foreground/background pair meets WCAG AA:
   - `--sidebar-foreground` on `--sidebar` background: ≥ 4.5:1 for body text.
   - `--sidebar-primary-foreground` on `--sidebar-primary` background (active state): ≥ 4.5:1 for body text.
   - `--sidebar-accent-foreground` on `--sidebar-accent` background (hover state): ≥ 4.5:1 for body text.
   - Lucide icons (treated as large meaningful graphics): ≥ 3:1 contrast against their background.
7. **Reduced motion (FR-031)**: See the dedicated "Reduced motion" section above.

## Test commands for automated coverage

```bash
pnpm test src/lib/utils/user-display.test.ts                   # Unit tests for the cascade (13 tiers/cases)
pnpm test src/components/layout/AppSidebar.test.tsx             # Component tests for the sidebar
```

Expected outcomes:

- `user-display.test.ts` — 13 assertions covering every branch of the cascade (loading, error, null user, both names, one name, no names + email, no names + malformed email, no names + no email, lowercase names, whitespace-only names, loading precedence over error).
- `AppSidebar.test.tsx` — tests for: active-state highlighting on each route (including a nested `/app/notebooks/abc` route), rendering of all four cascade tiers via mocked `useCurrentUser`, opening the user menu and invoking logout.

## Rollback

If anything blocks merging, `git checkout main -- src/routes/app-layout.tsx src/index.css src/i18n/en.json src/i18n/hu.json` restores the pre-feature state. Newly added files (`src/components/layout/*`, `src/lib/utils/user-display.ts*`, `src/components/ui/avatar.tsx`) can simply be deleted. No migrations, no backend changes, nothing to undo on the server.
