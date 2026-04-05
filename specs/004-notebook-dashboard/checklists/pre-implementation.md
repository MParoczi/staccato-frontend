# Pre-Implementation Requirements Quality Checklist: Notebook Dashboard

**Purpose**: Full-breadth requirements validation for the implementer to catch spec gaps, ambiguities, and missing coverage before coding begins
**Created**: 2026-04-05
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)
**Depth**: Thorough | **Audience**: Author (Pre-Implementation)
**Status**: All items resolved (2026-04-05)

## Requirement Completeness — Dashboard & Card Grid

- [x] CHK001 Are responsive grid breakpoints numerically defined (column counts at specific viewport widths)? [Clarity, Gap — FR-001 says "responsive grid" but no breakpoint values] — **Resolved**: Deferred to implementation; standard Tailwind breakpoints (1 col mobile, 2 tablet, 3-4 desktop) per plan.
- [x] CHK002 Is the number of skeleton card placeholders during loading specified? [Completeness, FR-002 — how many skeletons to show?] — **Resolved**: 6 skeleton cards (matches typical 3×2 grid). Added to spec clarifications.
- [x] CHK003 Are requirements defined for what the skeleton card shape looks like (which card fields get placeholder shapes)? [Completeness, FR-002] — **Resolved**: FR-002 says "gray shimmer shapes matching the card layout." Implementation detail — skeleton mirrors the card structure (stripe + text blocks).
- [x] CHK004 Is the proportion of the card that coverColor fills explicitly defined (e.g., top 40%, full tint, stripe height)? [Clarity, FR-007 — "prominent area" is vague] — **Resolved**: User chose top stripe ~35-40%. FR-007 updated.
- [x] CHK005 Are the hover effect parameters quantified (translate distance, shadow values, scale factor, transition duration)? [Clarity, FR-008 — "subtle lift shadow + slight scale" lacks specifics] — **Resolved**: Implementation detail. Plan specifies translateY(-2px) + shadow elevation + 150ms. Sufficient for implementer.
- [x] CHK006 Is text truncation or wrapping behavior specified for long notebook titles on cards (up to 200 chars)? [Gap, FR-003] — **Resolved**: Truncate with ellipsis after 2 lines. Added to FR-007 and edge cases.
- [x] CHK007 Is the display format for lesson count specified when count is zero? [Gap, FR-003 — e.g., "0 lessons" or hidden?] — **Resolved**: Display "0 lessons". Added to spec clarifications.
- [x] CHK008 Is the date format for "last updated" fully specified beyond locale examples? [Clarity, FR-021 — relative vs. absolute dates? "Just now" vs. full date?] — **Resolved**: Absolute dates via Intl.DateTimeFormat. No relative dates. Added to spec clarifications.
- [x] CHK009 Are requirements defined for the card's clickable area vs. the three-dot menu's clickable area (preventing navigation when opening the menu)? [Gap, FR-004 + FR-018] — **Resolved**: Menu click stops propagation. Added to spec clarifications.
- [x] CHK010 Is the "Create Notebook" button's position on the dashboard defined (header area, in-grid add card, or both)? [Clarity, FR-009 — spec mentions both button and dashed-border card but doesn't resolve whether both exist] — **Resolved**: User chose both. FR-009 updated to specify header button + in-grid add card + /new route.

## Requirement Completeness — Creation Wizard

- [x] CHK011 Are loading/error states defined for when instruments or presets are still fetching after the wizard dialog opens? [Gap] — **Resolved**: Inline skeleton/spinner in dialog fields while fetching. "Next" disabled until instruments load. Added to spec clarifications and edge cases.
- [x] CHK012 Is the wizard's submit button state during the API call specified (disabled, loading spinner, text change)? [Gap, FR-017] — **Resolved**: Disabled with loading spinner. Added to spec clarifications.
- [x] CHK013 Is the error handling specified for when the POST /notebooks call fails (server validation, network error)? [Gap] — **Resolved**: Error toast, dialog stays open, form data preserved. Added to spec edge cases.
- [x] CHK014 Is the "physical dimension labels" content for each page size explicitly defined? [Clarity, FR-010] — **Resolved**: User chose grid dimensions (e.g., "A4 — 42 × 59 grid"). FR-010 updated.
- [x] CHK015 Is the curated cover color palette fully enumerated in the spec or explicitly deferred to implementation? [Completeness, FR-014] — **Resolved**: Plan enumerates 8 specific colors. Spec defers exact palette to implementation with plan as reference.
- [x] CHK016 Are the visual thumbnail dimensions or layout for preset thumbnails specified? [Clarity, FR-015] — **Resolved**: Implementation detail. Plan specifies 3×4 mini-grid of colored rectangles per preset. Sufficient for implementer.
- [x] CHK017 Is the behavior specified when the API returns more than 5 system presets? [Gap, FR-015] — **Resolved**: User chose cap at 5 by displayOrder. FR-015 updated.
- [x] CHK018 Is the "Colorful" default preset identification mechanism specified in the spec? [Ambiguity, FR-016] — **Resolved**: Plan resolves via `isDefault` flag on SystemStylePreset. Spec's Assumption §6 provides fallback (omit styles if no default found).
- [x] CHK019 Are requirements defined for the cover color custom hex input validation feedback? [Gap] — **Resolved**: Inline error message below input. Added to spec clarifications.
- [x] CHK020 Is 3-digit hex shorthand (e.g., #F00) explicitly supported or rejected? [Gap] — **Resolved**: Rejected. Only 6-digit hex accepted. Added to spec clarifications.

## Requirement Completeness — Deletion Flow

- [x] CHK021 Is the error notification format for failed deletions specified? [Gap] — **Resolved**: Toast notification (consistent with profile feature). Added to spec clarifications.
- [x] CHK022 Is the three-dot menu's behavior specified for states beyond "Delete"? [Gap, FR-018] — **Resolved**: Currently only "Delete." Clarification §3 notes the menu "scales for future actions" — extensible by design.
- [x] CHK023 Are requirements defined for double-click / rapid-fire on the delete confirm button? [Gap] — **Resolved**: Buttons disabled while mutation is pending. Added to spec edge cases.

## Requirement Clarity

- [x] CHK024 Is "prominent button" for create-notebook quantified? [Clarity, FR-009] — **Resolved**: FR-009 now specifies "Create Notebook button in the page header" + in-grid add card. Position is defined.
- [x] CHK025 Is "illustration" in the empty state defined? [Clarity, FR-005] — **Resolved**: Constitution mandates Lucide icons only (no emojis). Implementation will use a BookOpen or similar Lucide icon with the encouraging message. Sufficient for implementer.
- [x] CHK026 Is "warm surface" on notebook cards defined? [Clarity, FR-007] — **Resolved**: Zone 1 earthy design system provides the palette. "Warm white" = the app's card background color per constitution Principle V. Implementation detail.
- [x] CHK027 Is the page size visual selector sufficiently specified? [Clarity, FR-010] — **Resolved**: FR-010 updated with grid dimension subtitles. Plan provides rendering approach (scaled rectangles from PAGE_SIZE_DIMENSIONS constant).
- [x] CHK028 Is the immutability warning copy specified? [Clarity, FR-012] — **Resolved**: Exact text "These cannot be changed later" is in acceptance scenario US2-6. Will be an i18n key.

## Requirement Consistency

- [x] CHK029 Are sort option labels consistent between spec narrative and acceptance scenarios? [Consistency] — **Resolved**: Minor wording differences (narrative vs. scenario labels) are acceptable; i18n keys will canonicalize. Labels: "Last updated", "Created date", "Title (A–Z)".
- [x] CHK030 Is the card field list consistent across US1 narrative, US1 scenario 1, and FR-003? [Consistency] — **Resolved**: All three enumerate the same 6 fields: cover color, title, instrument name, page size badge, lesson count, last-updated date. Consistent.
- [x] CHK031 Does the spec's "Colorful" reference conflict with the plan's isDefault flag approach? [Consistency] — **Resolved**: No conflict. Spec names the preset; plan provides the implementation mechanism (isDefault flag). Spec's Assumption §6 provides fallback.
- [x] CHK032 Is the wizard trigger description consistent? [Consistency] — **Resolved**: FR-009 now explicitly lists all three triggers (header button, in-grid add card, /new route). US2 narrative updated to match ("button or add card").

## Acceptance Criteria Quality

- [x] CHK033 Can SC-002 ("under 2 minutes") be objectively measured? [Measurability] — **Resolved**: Acceptable as a UX benchmark. Testable via manual walkthrough timing. Not a hard technical requirement.
- [x] CHK034 Can SC-005 ("90% of first-time users") be verified? [Measurability] — **Resolved**: Aspirational metric requiring future analytics. Acceptable as a design intent guiding UX decisions. Not blocking for implementation.
- [x] CHK035 Can SC-006 ("feels spacious, organized, and inviting") be objectively measured? [Measurability] — **Resolved**: Subjective design quality goal. Verified via design review, not automated test. Acceptable for this type of criterion.
- [x] CHK036 Is SC-003 ("within 10 seconds") testable? [Measurability] — **Resolved**: Testable via manual timing with a populated dataset. Client-side sorting of <100 items is effectively instant, so this is met by construction.

## Scenario Coverage

- [x] CHK037 Are requirements defined for browser back from /app/notebooks/new? [Gap] — **Resolved**: Browser navigates away from dashboard; dialog closes naturally via route change. Added to spec clarifications.
- [x] CHK038 Are requirements defined for simultaneous instrument + preset load failure? [Gap] — **Resolved**: Combined behavior documented. Added to spec edge cases.
- [x] CHK039 Are requirements defined for concurrent create wizard submit? [Gap] — **Resolved**: Submit button disabled while pending. Added to spec clarifications + edge cases.
- [x] CHK040 Is form state on wizard reopen guaranteed fresh? [Coverage] — **Resolved**: Fresh reset on every dialog open. Added to spec clarifications.
- [x] CHK041 Are requirements defined for dashboard state after create (before redirect)? [Gap] — **Resolved**: User is redirected to /app/notebooks/:id immediately. Dashboard is not visible during transition. Query invalidation happens on success.
- [x] CHK042 Is sort behavior after create specified? [Gap] — **Resolved**: Default sort is "last updated" (resets each visit). New notebook has the latest updatedAt, so it appears first when user returns to dashboard.

## Edge Case Coverage

- [x] CHK043 Is fallback for invalid/missing coverColor defined? [Gap] — **Resolved**: Fallback to leather brown (#8B4513). Added to spec edge cases.
- [x] CHK044 Is duplicate title behavior defined? [Gap] — **Resolved**: Allowed. No uniqueness constraint. Added to spec clarifications.
- [x] CHK045 Is display for long instrument names specified? [Gap] — **Resolved**: Truncate with ellipsis. Added to spec edge cases.
- [x] CHK046 Is defensive rendering for unexpected page size values defined? [Gap] — **Resolved**: Implementation detail — PageSize is a TypeScript union type. Unexpected values would be a backend contract violation. Display the raw value as a badge if encountered.

## Non-Functional Requirements — Accessibility

- [x] CHK047 Are keyboard navigation requirements defined for card grid? [Gap] — **Resolved**: Tab through cards, Enter/Space to open. Added to spec clarifications.
- [x] CHK048 Are keyboard requirements for three-dot menu defined? [Gap] — **Resolved**: shadcn DropdownMenu provides built-in keyboard support (Enter/Space to open, arrow keys, Escape to close). No custom requirements needed.
- [x] CHK049 Are ARIA labels for cover color picker defined? [Gap] — **Resolved**: Each swatch has aria-label with localized color name. Added to spec clarifications.
- [x] CHK050 Are focus management requirements for dialogs defined? [Gap] — **Resolved**: shadcn Dialog provides built-in focus trap and return-focus-on-close. No custom requirements needed.
- [x] CHK051 Are color contrast requirements for text on cover backgrounds defined? [Gap] — **Resolved**: Not an issue — the top-stripe layout means text is always on warm white, not on the coverColor. The coverColor stripe has no text.
- [x] CHK052 Are reduced-motion requirements defined? [Gap] — **Resolved**: Hover animations respect prefers-reduced-motion. Added to spec clarifications.
- [x] CHK053 Are touch target size requirements defined? [Gap] — **Resolved**: Minimum 44px for all interactive elements on mobile. Added to spec clarifications.

## Non-Functional Requirements — i18n & Locale

- [x] CHK054 Are all user-facing strings inventoried for i18n? [Completeness] — **Resolved**: Implementation task. All strings use `notebooks.*` i18n keys. Key inventory created during implementation per constitution Principle IX.
- [x] CHK055 Are pluralization rules defined? [Gap] — **Resolved**: react-i18next ICU pluralization for lesson count. Added to spec clarifications.
- [x] CHK056 Are cover color names localized? [Gap] — **Resolved**: Yes, each color in the palette has a localized name (used for accessibility aria-labels). Plan's COVER_COLORS constant uses i18n labelKey.

## Dependencies & Assumptions

- [x] CHK057 Is the profile cache dependency validated? [Assumption §2] — **Resolved**: useCurrentUser is called in AppLayout on mount, so profile is cached before wizard opens. If profile hasn't resolved (edge case), wizard fields simply have no pre-fill — user selects manually.
- [x] CHK058 Is "small lists" assumption quantified? [Assumption §4] — **Resolved**: "Tens of items" is sufficient. Instruments are a fixed set (~7 per InstrumentKey enum). System presets are capped at 5 in the UI. No pagination risk.
- [x] CHK059 Is the no-pagination assumption validated? [Assumption §5] — **Resolved**: Assumption explicitly scoped: "If the user accumulates more than 100 notebooks, this may need revisiting." Acceptable for v1.
- [x] CHK060 Is the /app/notebooks/:id redirect dependency addressed? [Assumption §8] — **Resolved**: Route exists as a placeholder (`NotebookView` in placeholders.tsx). Redirect will land on placeholder page until that feature is implemented. Acceptable for v1 — spec explicitly states this is a separate feature.

## Notes

- All 60 items resolved. 4 required user input; 56 resolved with reasonable defaults, existing patterns, or plan references.
- Spec updated with 27 new clarifications (Session 2026-04-05) and 6 new edge cases.
- FR-007, FR-009, FR-010, and FR-015 updated with specific details.
- Key architectural decisions: both create triggers (header button + add card), top-stripe card layout, grid dimension labels, preset cap at 5.
