# Feature Specification: App Navigation Sidebar

**Feature Branch**: `006-app-nav-sidebar`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Build the app-level navigation sidebar — a persistent vertical navigation panel on the left side of the application. This sidebar provides access to all top-level sections and houses the user menu with profile and logout."

## Clarifications

### Session 2026-04-06

- Q: When the user is inside an open notebook (`/app/notebooks/:notebookId/*`), should the "Notebooks" sidebar entry appear active? → A: Yes — prefix-match on `/app/notebooks` so "Notebooks" stays active on both the dashboard and any child route inside an open notebook.
- Q: Where does the pending-deletion banner sit horizontally relative to the sidebar? → A: Full viewport width — the banner spans the entire top of the viewport and the sidebar starts below it.
- Q: After this feature ships, should the existing `AppLayout` top header still exist? → A: No — the top header is removed entirely; the chrome is the sidebar plus the main content area (and the full-width deletion banner above both, when applicable).
- Q: What is the trigger surface that opens the user menu? → A: The entire user section row (avatar + name + padding) is one clickable trigger with a small trailing caret/chevron indicating it opens a menu.
- Q: What is the fallback rule for the user section's display name and initials when name data is partial, fully missing, or unavailable? → A: Deterministic cascade — (1) both names → "First Last" + initials of each; (2) one name → that name + its first letter; (3) no names but email known → email local-part + first letter of local-part; (4) profile still loading or failed → "Account" + generic person icon.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate between top-level sections (Priority: P1)

As a signed-in user, I can see a persistent vertical navigation panel on the left edge of the application that lets me jump between the primary sections of the product (Notebooks, Chord Library, Exports) from anywhere I am in the app. The panel makes it obvious which section I am currently viewing so I never feel lost.

**Why this priority**: Top-level navigation is the backbone of the authenticated experience. Without it, users cannot move between the three primary workflows of the product, which makes every other feature unreachable without manual URL entry. This is the minimum viable slice that delivers value.

**Independent Test**: Sign in, observe the sidebar on the left edge, click each of the three navigation entries in turn, and confirm the main content area changes to show the corresponding section while the clicked entry becomes visually highlighted as the active section.

**Acceptance Scenarios**:

1. **Given** a signed-in user viewing any authenticated screen, **When** the screen loads, **Then** a persistent vertical sidebar is visible on the far-left edge of the viewport containing the app wordmark, three navigation entries (Notebooks, Chord Library, Exports), and a user section at the bottom.
2. **Given** a signed-in user viewing the Notebooks section, **When** the user clicks the "Chord Library" navigation entry, **Then** the main content area switches to the Chord Library and the "Chord Library" entry becomes highlighted as the active section while "Notebooks" is no longer highlighted.
3. **Given** a signed-in user on any authenticated screen, **When** the user clicks the "Staccato" wordmark at the top of the sidebar, **Then** the application navigates to the Notebook Dashboard (the home screen) and "Notebooks" becomes the active entry.
4. **Given** a signed-in user on the Notebook Dashboard, **When** the user inspects the sidebar, **Then** the "Notebooks" entry is visibly marked as the active section.

---

### User Story 2 - Access profile and sign out from the user menu (Priority: P1)

As a signed-in user, I can see my own identity (avatar and name) at the bottom of the sidebar and open a menu from it that lets me reach my profile settings or sign out. I never need to hunt around the app to change my account settings or end my session.

**Why this priority**: Every authenticated app needs a clear way to reach account settings and to sign out. Today the app exposes logout as a header button; once the sidebar becomes the new home for navigation, this functionality must move with it or users will lose the ability to manage their session.

**Independent Test**: Sign in, locate the user section at the bottom of the sidebar, confirm it shows the user's avatar (or initials) and display name, click it to open the menu, click "Profile & Settings" to verify it navigates to the profile screen, then repeat and click "Log out" to verify the session ends.

**Acceptance Scenarios**:

1. **Given** a signed-in user whose profile includes a first name, last name, and avatar image, **When** any authenticated screen is rendered, **Then** the bottom of the sidebar displays that user's avatar image next to their display name.
2. **Given** a signed-in user whose profile does not have an avatar image, **When** any authenticated screen is rendered, **Then** the user section shows a fallback whose content depends on the FR-010 cascade tier currently in effect for that user — initials of first and last name (tier 1), the first letter of the only known name (tier 2), the first letter of the email local-part (tier 3), or a generic person icon next to the localized "Account" label (tier 4) — and the avatar slot and the display-name slot always render the same tier.
3. **Given** the user section is visible, **When** the user clicks the user section, **Then** a menu opens containing a "Profile & Settings" entry, a visual divider, and a "Log out" entry.
4. **Given** the user menu is open, **When** the user clicks "Profile & Settings", **Then** the application navigates to the profile screen and the menu closes.
5. **Given** the user menu is open, **When** the user clicks "Log out", **Then** the user's session ends and the application returns to the signed-out entry point, matching the behavior of the previous header logout control.

---

### User Story 3 - Sidebar stays visible while working inside a notebook (Priority: P2)

As a user who has opened a notebook, I can still see and use the app-level sidebar to jump back to the dashboard, switch sections, or access my user menu without first closing the notebook. The notebook's own chrome (its toolbar and its own sidebar) stay where they are and do not interfere with the app-level sidebar.

**Why this priority**: Without this, users inside a notebook would be trapped in the notebook view and would have to navigate back manually to reach other sections or sign out. This is essential for a cohesive experience but is listed as P2 because the notebook screen can still function if the sidebar is missing there; however, shipping without it would feel broken.

**Independent Test**: Sign in, open any notebook from the dashboard, and while viewing the notebook confirm the app sidebar is still visible on the far-left edge. Click "Exports" in the sidebar and verify navigation works. Re-open the notebook and confirm the notebook's own toolbar and its own sidebar are still present alongside the app sidebar.

**Acceptance Scenarios**:

1. **Given** a signed-in user who has opened a notebook, **When** the notebook screen is rendered, **Then** the app sidebar remains visible on the far-left edge of the viewport alongside the notebook's own toolbar and notebook-scoped sidebar.
2. **Given** a signed-in user viewing a notebook, **When** the user clicks "Notebooks" in the app sidebar, **Then** the application navigates to the Notebook Dashboard.
3. **Given** a signed-in user viewing a notebook, **When** the user opens the user menu from the app sidebar and clicks "Log out", **Then** the user is signed out from directly inside the notebook view.
4. **Given** a signed-in user viewing a notebook, **When** the user inspects the layout, **Then** the app sidebar occupies the far-left edge and the notebook's content area (its toolbar, canvas, and any notebook-scoped sidebars) fills the remaining horizontal space without overlapping the app sidebar.
5. **Given** a signed-in user viewing any screen inside an open notebook, **When** the user looks at the app sidebar, **Then** the "Notebooks" entry is visibly marked as the active entry (because the user is still within the Notebooks section).

---

### Edge Cases

- When the user's profile has exactly one of first name or last name (but not both), the user section displays that single name and uses its first letter as the avatar fallback (cascade tier 2 in FR-010).
- When the user's profile has neither a first name nor a last name but the email is known, the user section falls back to the email local-part and its first letter (cascade tier 3 in FR-010).
- When the user's profile has a non-null avatar URL but the avatar image resource fails to load at runtime (network error, 404, decode failure), the avatar slot displays the initials or icon dictated by the cascade tier currently in effect for the display name (per FR-009); the failed image load does NOT promote the cascade to tier 4 and does NOT change the displayed name.
- When the profile fetch is still loading on first paint, the user section shows the "Account" placeholder label with a generic person icon (cascade tier 4 in FR-010), so the control is never broken or empty.
- When the profile fetch fails, the sidebar still renders navigation entries so the user can still move between sections; the user section stays on the "Account" placeholder (cascade tier 4) and the user can still open the user menu and sign out.
- When a pending account-deletion banner is shown, it remains visible at the top of the viewport, spans the full viewport width, and is never moved inside the sidebar (per FR-016).
- When the user clicks the active navigation entry again (navigating to the section they are already on), the interaction is a harmless no-op.
- When the user opens the user menu and clicks outside of it, the menu closes without performing any action.
- When a translated nav label (e.g., a Hungarian label longer than its English counterpart) would exceed the available text width inside the fixed 240-pixel sidebar, the label is truncated with a single trailing ellipsis and the full untruncated label is exposed via a native title tooltip on hover (per FR-033).
- When a silent token-refresh request is in flight at the moment the user activates "Log out", the in-flight refresh is cancelled or its result discarded so that logout proceeds without waiting (per FR-013a).
- When the logout request to the backend fails (network error or 5xx), the local session state is still cleared, the user is still navigated to the signed-out entry point, and a non-blocking notification informs the user that the local session was ended even though the server-side session may persist (per FR-013b).
- When the user's operating system reports `prefers-reduced-motion: reduce`, hover tint transitions, active-state highlight swaps, and the user-menu open/close transitions all resolve instantly with no animated transition between states (per FR-031).
- When the user activates "Profile & Settings" but a route-level guard on the profile route redirects them elsewhere, the user menu closes normally and the sidebar shows no toast or error explaining the redirect (per FR-024).
- When the browser viewport is narrower than the supported desktop size, behavior is intentionally out of scope (see Assumptions) and no mobile/tablet-specific layout is promised.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a persistent vertical navigation sidebar anchored to the far-left edge of the viewport on every authenticated screen, including the Notebook Dashboard, Chord Library, Export History, User Profile, and any screen rendered inside an open notebook.
- **FR-002**: The sidebar MUST have a fixed horizontal width of exactly 240 pixels and MUST NOT be collapsible in this feature.
- **FR-003**: The sidebar MUST display the "Staccato" app wordmark at its top section, rendered with the project's existing brand display typography (font family, weight, and size MUST come from the design system's brand/heading tokens — no per-component literals), and using the `--sidebar-foreground` color token. Clicking the wordmark MUST navigate the user to the Notebook Dashboard (`/app/notebooks`).
- **FR-004**: The sidebar MUST present exactly three top-level navigation entries, in this order: "Notebooks" (leading to the Notebook Dashboard), "Chord Library" (leading to the Chord Library), and "Exports" (leading to the Export History).
- **FR-005**: Each navigation entry MUST display both an icon and a text label, and each entry MUST be individually clickable to navigate to its corresponding section.
- **FR-006**: The navigation entry corresponding to the section currently being viewed MUST be visually highlighted as the active entry, and that highlight MUST update automatically when the user navigates to a different section by any means (sidebar click, in-page link, browser back/forward, or direct URL). Active-state matching for a top-level entry MUST be a path-prefix match against the entry's destination path: an entry MUST be considered active when the current pathname is exactly the entry's destination path OR when the current pathname begins with the entry's destination path followed by a `/` character. As a result, the "Notebooks" entry (destination `/app/notebooks`) MUST remain active on the Notebook Dashboard (`/app/notebooks`), the new-notebook route (`/app/notebooks/new`), any open-notebook route (`/app/notebooks/:notebookId`), and any deeper child route under `/app/notebooks/` (such as `/app/notebooks/:notebookId/index` or `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`). Screens that do not fall under any top-level entry's prefix (e.g., the User Profile & Settings screen at `/app/profile`) MUST leave every top-level entry in the inactive state.
- **FR-007**: Navigation entries MUST show a distinct hover state to indicate they are interactive. The hover state MUST be visually distinguishable from the active state defined in FR-006: the active state MUST use a fully opaque `--sidebar-primary` background with `--sidebar-primary-foreground` text, while the hover state MUST use the `--sidebar-accent` background with `--sidebar-accent-foreground` text at a lower visual weight than the active state. An inactive entry under the cursor MUST never be confusable with the currently active entry.
- **FR-008**: The sidebar MUST display a user section at its bottom, below the navigation entries and separated from them by a clear visual divider.
- **FR-009**: The user section MUST display the signed-in user's avatar image when one is available. When no avatar image is available, it MUST display a deterministic textual or iconic fallback in place of the image, following the same cascade as FR-010 so that the avatar slot and the display name slot always agree on which tier of the cascade they are rendering. When the user's profile carries a non-null avatar URL but the image resource fails to load at runtime (network error, 404, decode failure, or any non-success response), the avatar slot MUST display the initials or icon dictated by the cascade tier currently in effect for the display name slot — i.e., the failure of the image fetch alone MUST NOT promote the cascade to tier 4 and MUST NOT change the displayed name. The cascade tier is determined solely by which user-profile fields are present (first name, last name, email) and whether the profile has resolved at all, not by whether the avatar image successfully loaded.
- **FR-010**: The user section MUST display a value in the "display name" slot and a value in the "avatar fallback" slot according to the following deterministic cascade, evaluated top-to-bottom and using the first rule that matches:
  1. **Both first and last name are present** → display "First Last" as the name; avatar fallback is the first letter of the first name followed by the first letter of the last name (two letters).
  2. **Exactly one of first or last name is present** → display that single name as the name; avatar fallback is the first letter of that name (one letter).
  3. **Neither first nor last name is present, but the user's email is known** → display the local-part of the email (the text before `@`) as the name; avatar fallback is the first letter of that local-part (one letter).
  4. **Profile is still loading, or the profile fetch has failed, or nothing about the user is known yet** → display the localized placeholder label whose translation key is "Account" (English: "Account"; Hungarian: "Fiók") as the name; avatar fallback is a generic person icon (not letters).
  The same cascade tier MUST drive both the display name and the avatar fallback in any given render, so they can never visually disagree. The tier-4 placeholder label MUST be a translatable string in the project's i18n catalog and MUST be present for every supported locale (currently EN and HU); it MUST NOT be a hardcoded English literal in the implementation.
- **FR-011**: The user section MUST be exposed as a single clickable trigger whose hit area covers the entire row (avatar + display name + surrounding padding), and that trigger MUST carry a small trailing caret/chevron affordance, positioned at the right edge of the row after the display name, indicating it opens a menu. Activating that trigger (by click, by pressing Enter while the trigger is keyboard-focused, or by pressing Space while the trigger is keyboard-focused) MUST open a menu that contains a "Profile & Settings" entry, a visual divider, and a "Log out" entry. The menu MUST open upward from the trigger (anchored to the top edge of the trigger row), so that the menu surface extends above the user section toward the navigation list and never extends below the bottom edge of the viewport. There MUST be exactly one such trigger in the user section (avatar and name MUST NOT be separately clickable targets that duplicate or diverge from this behavior).
- **FR-012**: Selecting "Profile & Settings" from the user menu MUST navigate the user to the User Profile & Settings screen.
- **FR-013**: Selecting "Log out" from the user menu MUST end the user's session with behavior equivalent to the existing header logout control (same session termination and post-logout destination). The logout flow MUST honor the user's intent immediately and MUST satisfy the following sub-requirements:
  - **FR-013a (refresh race)**: If a silent token-refresh request is in flight at the moment "Log out" is activated, the in-flight refresh MUST be cancelled (or its result discarded) so that logout proceeds without waiting for the refresh to complete. The user MUST NOT perceive any delay caused by the in-flight refresh.
  - **FR-013b (logout API failure)**: If the backend logout request fails for any reason (network error, 5xx, or any non-success status), the local session state MUST still be cleared, the user MUST still be navigated to the signed-out entry point, and the application MUST display a non-blocking notification informing the user that the local session was ended even though the server-side session may persist until it expires on its own.
  - **FR-013c (in-flight feedback)**: While the logout request is in flight, the "Log out" menu item MUST be disabled to prevent double-submission, and the user menu MAY remain open until the local session is cleared and navigation begins.
- **FR-014**: The sidebar MUST remain visible when the user is inside a notebook and MUST coexist with the notebook's own toolbar and notebook-scoped sidebar without overlapping them; the app sidebar occupies the far-left edge and the notebook's chrome fills the remaining space to its right.
- **FR-015**: The current top-of-page header (which today only contains a logout control) MUST be removed entirely. After this feature ships, the authenticated chrome consists of the sidebar on the left, the main content area on the right, and — when applicable — the full-width pending-deletion banner above both (per FR-016); no separate header strip remains.
- **FR-016**: The pending-deletion banner that warns users whose accounts are scheduled for deletion MUST continue to be visible on authenticated screens and MUST NOT be rendered inside the sidebar. When shown, the banner MUST span the full viewport width and sit above both the sidebar and the main content area (i.e., the sidebar begins immediately below the banner rather than starting at `y=0`), so the warning is visible regardless of which top-level section the user is currently in.
- **FR-017**: The sidebar MUST retrieve the signed-in user's first name, last name, and avatar URL for display purposes from the existing user-profile source, without introducing any new backend endpoint.
- **FR-018**: The user section MUST handle every profile-loading state deterministically as follows:
  - **First load (no cached profile data exists)**: The user section MUST display the cascade tier 4 placeholder (localized "Account" label + generic person icon) per FR-010. The placeholder MUST occupy exactly the same dimensions and screen position as the resolved user section so that no layout shift occurs when the profile resolves. The placeholder MUST NOT show a spinner or any motion-based loading indicator.
  - **Background refetch (cached profile data exists, refetch is in flight)**: The user section MUST continue to display the previously resolved cascade tier. It MUST NOT flicker to tier 4, and it MUST NOT show a spinner, just because a background refetch is in progress.
  - **Refetch resolves with a different cascade tier (promote or demote)**: The user section MUST re-render to the new tier on the next render cycle. This re-render MUST occur even if the user menu is currently open at that moment; the open menu's items ("Profile & Settings", "Log out") MUST NOT be affected by the trigger's tier change.
  - **Profile fetch fails and no cached data exists**: The sidebar MUST still render the wordmark, all three navigation entries, and the user section in its tier 4 placeholder state. The "Log out" control MUST remain reachable and functional in this state so that the user can always end their session.
- **FR-019**: The sidebar's visual treatment MUST be expressed entirely via the project's existing CSS design tokens, with no per-component color literals. The bindings MUST be:
  - Sidebar background → `--sidebar` token.
  - Default text and icon color → `--sidebar-foreground` token.
  - Active-entry highlight (per FR-006) → `--sidebar-primary` background with `--sidebar-primary-foreground` text/icon color.
  - Hover-state tint (per FR-007) → `--sidebar-accent` background with `--sidebar-accent-foreground` text/icon color, applied at a lower visual weight than the active-state binding so the two states are not confusable.
  - Divider between the navigation list and the user section → `--sidebar-border` token.
  - Keyboard focus ring on any focusable sidebar control → `--sidebar-ring` token.
  For the Zone 1 earthy aesthetic that this feature establishes, the `--sidebar` token MUST resolve to a dark earthy oklch value consistent with the notebook toolbar surface, with a target lightness of `oklch L ≤ 0.30` and a hue inside the warm-brown range (approximately `hue 50–70`). All sidebar token values MUST be defined once in `src/index.css` and consumed via Tailwind utility classes (`bg-sidebar`, `text-sidebar-foreground`, etc.); no sidebar component is allowed to override these tokens with inline values.

- **FR-020 (Vertical scroll behavior)**: The sidebar MUST occupy the full visible height of the viewport (`h-screen` equivalent) and MUST be sticky to the viewport's left edge. The sidebar MUST scroll independently of the main content area: when the main content is taller than the viewport and the user scrolls the main area, the sidebar MUST remain fixed in place with the wordmark pinned at its top and the user section pinned at its bottom. If the sidebar's own internal content ever exceeds the available vertical space (an unexpected condition with the current 3 nav entries), the navigation list region between the wordmark and the user section MUST scroll internally rather than push the user section out of view.
- **FR-021 (Horizontal overflow containment)**: The sidebar's fixed 240-pixel width MUST be preserved regardless of the main content area's intrinsic width. The main content area MUST be allowed to shrink and to scroll horizontally inside its own scroll container (it MUST establish its own minimum-content-width behavior, e.g., `min-w-0`) so that wide main-area content (such as a notebook canvas with a long timeline) MUST NOT push the sidebar off-screen, MUST NOT cause the viewport to scroll horizontally as a whole, and MUST NOT shrink the sidebar below 240 pixels.
- **FR-022 (Combined banner + notebook layout)**: When the pending-deletion banner (per FR-016) is shown AND the user is inside an open notebook simultaneously, the layout MUST stack vertically as: (1) the full-viewport-width banner at the top, (2) directly below the banner, the app sidebar on the left and the notebook's own chrome (toolbar, canvas, notebook-scoped sidebar) on the right, sharing the remaining viewport height. The banner MUST push both the app sidebar and the notebook chrome down by exactly the banner's rendered height; neither the sidebar nor the notebook chrome MUST overlap or be partially obscured by the banner.
- **FR-023 (Notebook sheet coexistence)**: When the notebook shell's slide-in sheet (e.g., the lesson list) is open AND the app sidebar is visible simultaneously, the app sidebar MUST own the far-left edge of the viewport and the notebook sheet MUST slide in from the left edge of the main content area (i.e., immediately to the right of the app sidebar), not from the viewport edge. The notebook sheet MUST NOT overlay, cover, or visually obscure the app sidebar. The app sidebar MUST remain fully interactive while the notebook sheet is open; the notebook sheet's focus trap (if any) MUST be scoped to the sheet itself and MUST NOT include the app sidebar.
- **FR-024 (Profile guard redirect)**: When the user activates "Profile & Settings" from the user menu and the destination route applies a route-level guard that redirects the user elsewhere (for example, a guard that redirects scheduled-for-deletion users), the user menu MUST close normally and the sidebar MUST treat the click as a successful navigation. The sidebar itself MUST NOT show any toast, error, or error state explaining the redirect — any explanation belongs in the destination route's UI, not in the sidebar.
- **FR-025 (Internal spacing)**: The sidebar's internal layout MUST use the project's design-system spacing tokens (no arbitrary pixel literals): the wordmark region MUST have consistent top/bottom padding from the sidebar edge; each navigation entry row MUST have consistent vertical padding and a fixed row height; consecutive navigation entry rows MUST be separated by a consistent vertical gap; the divider between the navigation list and the user section MUST be a 1-pixel rule using `--sidebar-border`; and the user section row MUST have consistent vertical padding from the sidebar's bottom edge. These spacing values MUST come from the same scale used elsewhere in the application chrome.
- **FR-026 (Tab order)**: When the user advances focus through the sidebar with the Tab key, focus MUST visit, in this order: the "Staccato" wordmark, the "Notebooks" navigation entry, the "Chord Library" navigation entry, the "Exports" navigation entry, the user-section trigger. Focus MUST then leave the sidebar and continue into the main content area on the next Tab press. Reverse-tab (Shift+Tab) MUST visit the same elements in the reverse order.
- **FR-027 (Active-entry assistive announcement)**: The currently active navigation entry MUST carry the `aria-current="page"` attribute (or equivalent assistive-tech-discoverable marker) so that the active state is announced to screen-reader users in addition to being shown visually. Inactive entries MUST NOT carry this attribute.
- **FR-028 (User-menu focus management)**: When the user-section trigger is activated, focus MUST move into the opened menu (to the first focusable menu item, "Profile & Settings"). While the menu is open, focus MUST be trapped inside the menu — Tab and Shift+Tab MUST cycle within the menu items. When the menu closes for any reason (item selection, Escape key, outside click), focus MUST return to the user-section trigger so the user can re-open the menu without needing to find it again.
- **FR-029 (Keyboard activation surfaces)**: Every interactive element in the sidebar (the wordmark link, each navigation entry, the user-section trigger, each user-menu item) MUST be activatable from the keyboard alone with no mouse required. Navigation entries and the wordmark MUST be activated with Enter; the user-section trigger MUST be activated with either Enter or Space (per FR-011); user-menu items MUST be activated with Enter; and Escape MUST close an open user menu and return focus to the trigger.
- **FR-030 (Color contrast)**: All sidebar text and icons MUST meet WCAG 2.1 Level AA color-contrast ratios against their background: 4.5:1 for normal-weight body text and 3:1 for large text (≥ 18pt regular or 14pt bold) and for non-text icons that convey meaning. The active-entry binding (`--sidebar-primary` background with `--sidebar-primary-foreground` text), the hover-state binding (`--sidebar-accent` background with `--sidebar-accent-foreground` text), and the default binding (`--sidebar` background with `--sidebar-foreground` text) MUST each independently satisfy these ratios.
- **FR-031 (Reduced motion)**: When the user's operating system reports `prefers-reduced-motion: reduce`, the sidebar MUST disable all decorative motion: hover tint transitions MUST resolve instantly (no fade), the active-state highlight MUST swap instantly when navigating, and the user menu's open and close transitions MUST resolve instantly. State changes MUST still be visible — only the animated transition between states MUST be removed.
- **FR-032 (i18n string enumeration and locale coverage)**: Every user-facing English string introduced or surfaced by this feature MUST be a translatable key in the project's i18n catalog and MUST have a translation in every supported locale (currently English and Hungarian). The complete enumeration of strings owned by this feature is:
  1. The "Staccato" wordmark (if branded as a translatable label rather than as a logo asset).
  2. The "Notebooks" nav entry label.
  3. The "Chord Library" nav entry label.
  4. The "Exports" nav entry label.
  5. The "Profile & Settings" user-menu item label.
  6. The "Log out" user-menu item label.
  7. The cascade tier 4 placeholder display name "Account" (per FR-010).
  8. The accessible name of the user-section trigger (e.g., "Open user menu") used by assistive tech, distinct from its visible display-name slot.
  9. The non-blocking notification text shown when the logout request fails (per FR-013b).
  10. The native title-tooltip text shown when a translated nav label is truncated (per FR-033) MUST be the same translation key as the visible label itself; no separate tooltip key is needed.
  Locale coverage MUST be enforced for both EN and HU before release; missing keys in either locale MUST be treated as a release blocker.
- **FR-033 (Translated label overflow)**: When the rendered width of a translated nav entry's label would exceed the available text width inside the fixed 240-pixel sidebar (after accounting for the entry's left icon, padding, and any trailing affordance), the label MUST be truncated with a single trailing ellipsis (`…`) and the full untruncated label MUST be exposed via the entry's native title tooltip on hover and via its accessible name to screen-reader users. Truncation MUST NOT shrink the label's font size, MUST NOT wrap the label across multiple lines, and MUST NOT change the entry's row height.

### Key Entities *(include if feature involves data)*

- **Signed-in User (display projection)**: The minimal view of the currently authenticated user needed by the sidebar for display purposes only — first name, last name, email, and avatar image reference. First name and last name drive the primary display-name and initials rendering (cascade tiers 1–2 in FR-010); email drives the fallback rendering when name fields are absent (cascade tier 3). All fields are sourced from the existing user-profile data; no new fields are introduced by this feature.
- **Navigation Entry**: A single item in the sidebar's navigation list, characterized by a label, an icon, a destination section, and an active/inactive state derived from the current screen.
- **User Menu**: The menu opened from the user section at the bottom of the sidebar, containing a "Profile & Settings" entry and a "Log out" entry separated by a divider.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any authenticated screen (including the Notebook Dashboard, the Chord Library, the Export History, the User Profile, or a screen inside an open notebook), a signed-in user can reach any other top-level section in a single click on the sidebar.
- **SC-002**: On every authenticated screen, the sidebar unambiguously indicates the current section. The complete enumeration of authenticated routes and their expected highlight state is:
  - `/app/notebooks` (Notebook Dashboard) → "Notebooks" entry highlighted as active.
  - `/app/notebooks/new` (new-notebook entry point) → "Notebooks" entry highlighted as active.
  - `/app/notebooks/:notebookId` (notebook cover) → "Notebooks" entry highlighted as active.
  - `/app/notebooks/:notebookId/index` (notebook index) → "Notebooks" entry highlighted as active.
  - `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId` (notebook lesson page) → "Notebooks" entry highlighted as active.
  - `/app/chords` (Chord Library) → "Chord Library" entry highlighted as active.
  - `/app/exports` (Export History) → "Exports" entry highlighted as active.
  - `/app/profile` (User Profile & Settings) → no top-level entry is highlighted (this route does not correspond to any top-level entry).
  - `/app/*` (Not Found) → no top-level entry is highlighted.
  This enumeration MUST hold at 100% — every authenticated route either highlights its corresponding entry per the rule above, or highlights no entry when listed as such. Routes whose pathname begins with `/app/notebooks/` are considered to correspond to the "Notebooks" entry, consistent with FR-006.
- **SC-003**: A signed-in user can reach the Profile & Settings screen and can sign out, starting from any authenticated screen, in at most two clicks (open the user menu, then pick the action).
- **SC-004**: When a user is working inside a notebook, the app sidebar stays visible and fully usable alongside the notebook's own chrome with zero overlap or clipping between the two. "Zero overlap or clipping" is verified by the following objective method: at the supported desktop viewport size, the bounding rectangle of the rendered app sidebar (`getBoundingClientRect()`) and the bounding rectangle of the notebook chrome's outermost container MUST be disjoint along the horizontal axis (the right edge of the sidebar's rectangle MUST be less than or equal to the left edge of the notebook chrome's rectangle), and the app sidebar's rectangle MUST be entirely inside the viewport rectangle (no negative `left`, no `right > viewport.width`).
- **SC-005**: After this feature ships, the separate top-of-page header logout control is no longer required for any authenticated workflow — users do not lose any capability, because every capability the header provided is reachable from the sidebar.

## Assumptions

- The authenticated application already exposes the three destination sections (Notebook Dashboard, Chord Library, Export History) and the User Profile & Settings screen, and each has a stable entry point — this feature reuses those entry points and does not introduce new ones.
- The signed-in user's first name, last name, and avatar reference are already available through the existing user-profile data source; no new backend contract is required for this feature.
- The session-termination behavior (what "log out" does after clicking) is already defined elsewhere in the application; this feature reuses that behavior unchanged.
- The feature targets desktop viewports only, consistent with the scope of the notebook shell feature; mobile and tablet layouts, a collapsible/mini sidebar, and a hamburger/drawer pattern are explicitly out of scope for this feature.
- Accessibility requirements specific to this feature are captured as numbered functional requirements (FR-026 through FR-031) — tab order, active-entry assistive announcement, user-menu focus management, keyboard activation, color contrast, and reduced-motion behavior — rather than deferred to a generic baseline. The project's existing baseline for interactive controls (focus rings, labeled icons via Lucide React) still applies, and the FRs above add the sidebar-specific obligations on top of that baseline.
- The pending account-deletion banner already exists as a site-wide banner component (`DeletionBanner`) and this feature does not redesign the banner itself. However, this feature DOES change the banner's placement in the document flow: it MUST now span the full viewport width above both the sidebar and the main content area (per FR-016 and FR-022), rather than sitting above only the main content area as it did before this feature. The DOM relocation of the existing banner is in scope for this feature; the banner's internal markup and copy are not.
- The "Staccato" wordmark copy and icon set for the three navigation entries are drawn from the existing design system; no new branding assets are introduced by this feature.
- Internationalization of sidebar labels ("Notebooks", "Chord Library", "Exports", "Profile & Settings", "Log out") uses the project's existing translation pipeline; no new translation infrastructure is introduced here.
