# Release-Gate Requirements Quality Checklist: App Navigation Sidebar

**Purpose**: Unit-test the English of `spec.md` — stress-test the requirements themselves for completeness, clarity, consistency, measurability, and coverage across UX, layout, accessibility, and i18n before shipping.
**Created**: 2026-04-06
**Feature**: [spec.md](../spec.md)
**Focus areas**: UX & visual, Layout & coexistence, Accessibility, Internationalization (all combined)
**Depth**: Release gate (rigorous)
**Audience**: PR reviewer and release approver — items should be resolvable against the spec text alone, without reading any implementation.

**How to read this checklist**: Every item is a question about whether the SPEC (not the code) says the right thing. A checked item means the spec answers the question unambiguously. An unchecked item means the spec needs to be updated before shipping.

---

## UX & Visual Requirement Quality

- [x] CHK001 - Is the sidebar's horizontal width specified as a single concrete value rather than a range, so two implementers could not pick different widths and both be compliant? [Clarity, Spec §FR-002]
- [x] CHK002 - Is the "dark earthy" sidebar background specified with measurable criteria (named design token, specific hue, or contrast requirement) rather than subjective adjectives? [Clarity/Measurability, Spec §FR-019]
- [x] CHK003 - Are the active-entry highlight and the hover-state tint specified in a way that makes them visually distinguishable (e.g., different values, not both just "warm brown")? [Clarity/Consistency, Spec §FR-006, §FR-007, §FR-019]
- [x] CHK004 - Are the adjectives "muted label text", "slightly lighter text", and "subtle warm-brown tint" quantified or bound to specific design tokens? [Ambiguity/Measurability, Spec §FR-019]
- [x] CHK005 - Are the sidebar's internal spacing requirements (top/bottom padding, gap between nav items, divider thickness and color) specified at the requirements layer? [Completeness, Gap]
- [x] CHK006 - Is the visual treatment of the "Staccato" wordmark specified (typographic weight, size, color role, or a reference to a design-system token) beyond merely stating it is "displayed at the top"? [Clarity, Spec §FR-003]
- [x] CHK007 - Is the position of the caret/chevron affordance relative to the user-section row specified (leading, trailing, inline with name)? [Clarity, Spec §FR-011]
- [x] CHK008 - Is the menu's opening direction relative to the user-section trigger (upward from bottom, downward, auto-flip) specified as a requirement rather than left implicit? [Completeness, Spec §FR-011]

## Layout Architecture & Coexistence Requirement Quality

- [x] CHK009 - Is the full-viewport-width behavior of the pending-deletion banner stated in the functional requirement text of FR-016, or does it only live in the clarifications session and risk being lost in future spec reads? [Traceability/Completeness, Spec §FR-016]
- [x] CHK010 - Are the "no overlap" and "no clipping" guarantees between the app sidebar and the notebook shell's own chrome specified as measurable/testable properties rather than a subjective "coexist cleanly" descriptor? [Measurability, Spec §FR-014, §SC-004]
- [x] CHK011 - Is the sidebar's required behavior specified when the main content area has content wider than the viewport (horizontal scroll containment)? [Edge Case/Gap]
- [x] CHK012 - Is the sidebar's required vertical scroll behavior specified when the main content is taller than the viewport (does the sidebar scroll with main content, stay fixed, or scroll independently)? [Completeness, Gap]
- [x] CHK013 - Is the combined layout behavior specified for the case when the deletion banner is shown AND the user is inside an open notebook (does the banner push both the sidebar and the notebook's own chrome down, and by how much)? [Coverage, Gap]
- [x] CHK014 - Is the interaction specified for when the notebook shell's slide-in sheet and the app sidebar are visible simultaneously (who owns the far-left edge, stacking order, whether focus is trapped)? [Coverage/Gap]

## Accessibility Requirement Quality

- [x] CHK015 - Are the keyboard interaction requirements for the sidebar specified concretely in the spec, or only deferred to "the project's standard baseline" in the Assumptions section? [Clarity/Traceability, Spec §Assumptions]
- [x] CHK016 - Is the expected tab order through the sidebar (wordmark → each nav entry → user-menu trigger) explicitly specified in the functional requirements? [Completeness, Gap]
- [x] CHK017 - Is a non-visual cue for the active nav entry (e.g., an "aria-current" style requirement) specified, so the active state is discoverable by users who cannot see the color highlight? [Coverage/Gap]
- [x] CHK018 - Are focus-management requirements for the user menu specified (focus moves into the menu on open, focus returns to the trigger on close, focus is trapped while the menu is open)? [Completeness, Spec §Assumptions]
- [x] CHK019 - Is the minimum color-contrast ratio between sidebar text/icons and the dark earthy background specified (e.g., WCAG AA 4.5:1 for body text)? [Measurability, Gap]
- [x] CHK020 - Are the sidebar's requirements under OS-level reduced-motion settings specified (e.g., no animated hover transitions, instant active-state swap)? [Edge Case, Gap]

## Internationalization Requirement Quality

- [x] CHK021 - Are all user-facing strings in the sidebar explicitly enumerated as i18n obligations in the functional requirements (wordmark, nav labels, user-menu items, accessible trigger name, fallback label), rather than only implied by the general i18n assumption? [Completeness/Traceability, Spec §FR-003, §FR-004, §FR-011, §FR-012, §FR-013, §Assumptions]
- [x] CHK022 - Is the cascade tier 4 placeholder label ("Account") specified as a localizable string rather than as a hardcoded English word in the requirements? [Clarity, Spec §FR-010]
- [x] CHK023 - Is the required behavior specified when a translated nav label exceeds the fixed sidebar width (e.g., truncation with tooltip, wrap, ellipsis)? [Edge Case, Gap]
- [x] CHK024 - Is translation coverage for both EN and HU explicitly required for every sidebar string in the functional requirements (not merely as an architectural assumption)? [Completeness/Traceability, Gap]

## Requirement Completeness (cross-cutting)

- [x] CHK025 - Is the sidebar's required behavior specified when the user-profile query is in a background refetching state (cache is populated but stale, a refetch is in flight) — i.e., does it freeze the current tier, flicker to tier 4, or something else? [Coverage, Spec §FR-018]
- [x] CHK026 - Are requirements defined for the user menu's behavior while a silent token refresh is in flight (e.g., does "Log out" queue behind the refresh, cancel it, or race with it)? [Coverage, Gap]
- [x] CHK027 - Is the required behavior specified when the logout API call itself fails (network error, 500, etc.) — e.g., does the session still clear locally, does an error toast appear, does the menu stay open? [Exception Flow, Spec §FR-013]
- [x] CHK028 - Is the behavior specified for the case where the user menu is already open AND a profile refetch resolves and promotes/demotes the cascade tier (does the open menu re-render the trigger text/avatar live)? [Edge Case, Gap]

## Requirement Clarity (ambiguity detection)

- [x] CHK029 - Can "professional, slim, unobtrusive" be objectively measured, or should it be replaced by concrete constraints? [Ambiguity/Measurability, Spec §FR-019]
- [x] CHK030 - Is "non-disruptive placeholder" quantified (e.g., same dimensions as the final user section, no layout shift on resolve, no spinner)? [Ambiguity, Spec §FR-018]
- [x] CHK031 - Is the phrase "a screen inside an open notebook" unambiguous — specifically, does it include `/app/notebooks/new` (a non-detail route) and does it include child routes that may exist under a notebook but do not require a loaded notebook? [Ambiguity, Spec §FR-001, §FR-006]

## Requirement Consistency (cross-section alignment)

- [x] CHK032 - Is the active-entry rule consistent between FR-006 (prefix match so "Notebooks" is active inside an open notebook) and SC-002 (which permits "no entry highlighted" for screens that don't correspond to a top-level entry)? Specifically, do the two sections agree that a route under `/app/notebooks/:notebookId` counts as a top-level entry screen, not a "no-entry" screen? [Consistency, Spec §FR-006, §SC-002]
- [x] CHK033 - Do FR-009 and FR-010 agree on which tier of the cascade drives the avatar slot when a remote avatar URL is present but its image fails to load at runtime (i.e., does the fallback slot render the tier-1/2/3 initials, or does the failure promote the cascade to tier 4)? [Consistency/Gap, Spec §FR-009, §FR-010]
- [x] CHK034 - Does the acceptance scenario in User Story 2 ("the user section shows a fallback made of the user's initials derived from first name and last name") remain consistent with the new FR-010 4-tier cascade, which can also render email local-part or a generic icon? [Consistency, Spec §US2 AS2, §FR-010]

## Acceptance Criteria Quality (measurability)

- [x] CHK035 - Is SC-002 ("100% of authenticated screens highlight the correct corresponding sidebar entry") paired with an enumerated list of every authenticated screen and its expected highlight state, so "100%" is objectively verifiable? [Measurability, Spec §SC-002]
- [x] CHK036 - Is SC-004 ("zero overlap or clipping" between app sidebar and notebook chrome) paired with a test methodology (e.g., bounding-box comparison, viewport screenshot diff) so it can be objectively verified? [Measurability, Spec §SC-004]
- [x] CHK037 - Is SC-006 ("9 out of 10 testers identify the correct entry on first attempt") paired with a recruitment criterion, task script, and "first attempt" definition, so the usability study is reproducible? [Measurability, Spec §SC-006]

## Scenario Coverage (primary / alternate / exception / recovery)

- [x] CHK038 - Are requirements defined for opening the user menu via the keyboard (Enter/Space while the trigger is focused) in addition to the mouse-click primary flow? [Alternate Flow/Gap]
- [x] CHK039 - Are exception-flow requirements defined for when navigation from the user menu to "Profile & Settings" is blocked by a route-level guard (e.g., the profile route cannot load because the user has been scheduled for deletion and is redirected)? [Exception Flow, Gap]

## Edge Case Coverage

- [x] CHK040 - Do the existing Edge Cases in the spec cover cascade tier 2 (exactly one of first/last name present) in addition to the tier-3 (email-only) and tier-4 (loading/failed) cases that are already listed? [Coverage, Spec §Edge Cases, §FR-010]

## Non-Functional Requirements

- [x] CHK041 - Are accessibility requirements captured as numbered functional requirements (with testable criteria) rather than only as a single line in the Assumptions section? [Coverage/Traceability, Spec §Assumptions]

## Dependencies & Assumptions

- [x] CHK042 - Is the assumption that "the pending account-deletion banner already exists as a site-wide banner component" still consistent with the new requirement that the banner must span the full viewport width above the sidebar, given that the banner's placement is actually changing? [Assumption/Consistency, Spec §Assumptions, §FR-016]

---

## Notes

- **Total items**: 42. All items are phrased as questions about the spec text — none test implementation behavior. An unchecked item means the spec needs text changes before shipping.
- **Traceability coverage**: 40 / 42 items carry an explicit `[Spec §…]`, `[Gap]`, `[Ambiguity]`, `[Conflict]`, or `[Assumption]` reference (~95%, exceeding the 80% minimum).
- **Scenario classes touched**: Primary (CHK017, CHK035), Alternate (CHK038), Exception (CHK027, CHK039), Recovery (CHK026), Edge/Boundary (CHK011–CHK014, CHK020, CHK023, CHK025, CHK028, CHK040), Non-Functional (CHK019, CHK041).
- **Clarification-session cross-check**: The 2026-04-06 clarification session resolved 5 prior ambiguities. CHK009, CHK031, CHK032, CHK033, and CHK042 audit whether those resolutions are fully reflected in the functional-requirement text and are not stranded inside the Clarifications section alone.
- **How to act on failing items**: Update the spec text (not the plan or the code) to resolve the flagged gap/ambiguity/conflict, then re-check. If an item is intentionally out of scope, annotate it in the spec's Assumptions or Edge Cases sections so future readers do not re-raise the same concern.

## Resolution log (2026-04-08)

All 42 items were resolved in a single spec-update pass on 2026-04-08, after an interactive Q&A session covering 11 user-input decisions. Mapping from CHK items to the spec changes that resolved them:

| CHK | Resolved by |
|---|---|
| CHK001 | FR-002 — width changed from "220–240 pixel range" to "exactly 240 pixels". |
| CHK002, CHK004, CHK029 | FR-019 — replaced subjective adjectives ("dark earthy", "muted", "subtle", "professional", "unobtrusive") with explicit `--sidebar*` token bindings and an oklch lightness/hue target. |
| CHK003 | FR-007 — active and hover states now bound to distinct token pairs (`--sidebar-primary` vs `--sidebar-accent`) with an explicit non-confusability requirement. |
| CHK005 | FR-025 — internal spacing requirements added (wordmark padding, row height, gap, divider, user-section padding) bound to design-system spacing tokens. |
| CHK006 | FR-003 — wordmark typography now references brand/heading tokens and `--sidebar-foreground` color. |
| CHK007 | FR-011 — caret position now explicitly stated as "right edge of the row after the display name". |
| CHK008 | FR-011 — menu opening direction now explicitly "open upward from the trigger". |
| CHK009 | FR-016 already states "MUST span the full viewport width" in the FR text itself; verified during this pass. |
| CHK010 | SC-004 — added objective bounding-rectangle test methodology (`getBoundingClientRect()` disjointness). |
| CHK011 | FR-021 — horizontal overflow containment requirement added (sidebar never shrinks below 240px, main area scrolls inside its own container). |
| CHK012 | FR-020 — sidebar vertical scroll requirement added (sticky to viewport, independent of main content scroll). |
| CHK013 | FR-022 — combined banner + notebook layout requirement added (banner pushes both down by exactly its rendered height). |
| CHK014 | FR-023 — notebook sheet coexistence requirement added (sheet slides from main content edge, not viewport edge; no focus trap on sidebar). |
| CHK015, CHK041 | FR-026 through FR-031 — accessibility expectations elevated from Assumptions baseline to numbered, testable functional requirements; Assumptions section updated to reference them. |
| CHK016 | FR-026 — explicit tab order: wordmark → 3 nav entries → user trigger → main content. |
| CHK017 | FR-027 — `aria-current="page"` (or equivalent) required on the active entry. |
| CHK018 | FR-028 — focus management for the user menu (focus moves in on open, trapped, returns to trigger on close). |
| CHK019 | FR-030 — WCAG 2.1 Level AA contrast (4.5:1 / 3:1) required for all three sidebar bindings. |
| CHK020 | FR-031 — `prefers-reduced-motion` handling: hover, active swap, and menu transitions all resolve instantly. |
| CHK021 | FR-032 — i18n strings explicitly enumerated (10 strings owned by this feature). |
| CHK022 | FR-010 + FR-032 — tier-4 "Account" placeholder explicitly required to be a translatable string with EN/HU values. |
| CHK023 | FR-033 — translated label overflow: truncate with single trailing ellipsis, full label exposed via title tooltip and accessible name. |
| CHK024 | FR-032 — EN+HU coverage explicitly required for every enumerated string; missing keys treated as a release blocker. |
| CHK025, CHK028 | FR-018 — refetch behavior fully specified: keep previous tier during background refetch, re-render to new tier on next render even if menu is open. |
| CHK026 | FR-013a — silent token-refresh race resolved by cancelling the in-flight refresh on logout. |
| CHK027 | FR-013b — logout API failure clears local session, navigates, and shows non-blocking notification. |
| CHK030 | FR-018 — placeholder quantified (same dimensions, no layout shift, no spinner). |
| CHK031 | FR-006 — prefix scope made fully explicit, including `/app/notebooks/new` and all `:notebookId/*` child routes. |
| CHK032 | SC-002 enumeration explicitly aligned with FR-006: routes under `/app/notebooks/` correspond to the "Notebooks" entry. |
| CHK033 | FR-009 — avatar image load failure does NOT promote the cascade; the avatar slot displays the current tier's initials/icon. |
| CHK034 | US2 AS2 — rewritten to reflect the 4-tier cascade rather than only first/last initials. |
| CHK035 | SC-002 — every authenticated route enumerated with its expected highlight state. |
| CHK036 | SC-004 — bounding-rectangle test methodology added (see CHK010). |
| CHK037 | SC-006 — dropped entirely; it was unverifiable and not planned to be measured. |
| CHK038 | FR-011 + FR-029 — Enter/Space activation on the user trigger and Enter on nav entries explicitly required. |
| CHK039 | FR-024 — guarded profile-route redirect: menu closes normally, no toast or sidebar error. |
| CHK040 | Edge Cases — tier-2 case (exactly one of first/last name) added; image-load-failure case added; label-overflow, refresh-race, logout-failure, reduced-motion, and profile-redirect cases also added. |
| CHK042 | Assumptions — banner assumption updated to acknowledge the DOM relocation as in scope for this feature. |

**Q&A decisions captured (2026-04-08 session)**: Q1 stay at tier 1-3 initials on image load failure; Q2 keep last value with live re-render; Q3 clear local + navigate + toast on logout failure; Q4 cancel in-flight refresh; Q5 truncate + tooltip; Q6 sticky sidebar with independent scroll; Q7 plain prefix match including `/app/notebooks/new`; Q8 elevate accessibility to numbered FRs; Q9 drop SC-006; Q10 WCAG AA + disable transitions under reduced motion; Q11 menu closes, no special UI on profile-route redirect.
