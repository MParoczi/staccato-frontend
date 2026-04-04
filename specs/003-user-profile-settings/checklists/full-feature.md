# Full Feature Checklist: User Profile & Settings

**Purpose**: Comprehensive requirements quality validation across all sections — author self-review before implementation
**Created**: 2026-04-04
**Feature**: [spec.md](../spec.md)
**Depth**: Comprehensive | **Audience**: Author (pre-implementation) | **Focus**: All requirement quality dimensions

## Requirement Completeness — Profile Information

- [x] CHK001 - Are field-level validation constraints (min/max length) for firstName and lastName specified in the spec? [Completeness] → Resolved: FR-002 updated with "1-100 characters, trimmed"
- [x] CHK002 - Are requirements defined for what "save changes" feedback looks like (toast, inline message, styling)? [Completeness] → Resolved: toast notifications (sonner) consistent with existing codebase pattern
- [x] CHK003 - Are requirements specified for the profile page loading state while user data is being fetched? [Completeness] → Resolved: standard skeleton loading state; profile is cached from AppLayout so rarely visible
- [x] CHK004 - Is the visual layout of profile information fields specified? [Completeness] → Resolved: Cards per section, firstName/lastName side-by-side on desktop, stacked on mobile
- [x] CHK005 - Are requirements defined for handling server-side validation errors on the name fields? [Completeness] → Resolved: FR-015 updated — field errors mapped via setError, business errors as toasts
- [x] CHK006 - Is the email display format specified? [Completeness] → Resolved: standard text display, CSS truncation with ellipsis for overflow

## Requirement Completeness — Avatar

- [x] CHK007 - Are the dimensions/sizing requirements for the avatar circle specified? [Completeness] → Resolved: FR-004 updated with 96px (size-24)
- [x] CHK008 - Are requirements defined for the avatar preview UI before upload confirmation? [Completeness] → Resolved: FR-005 updated — inline replacement with Confirm/Cancel buttons below
- [x] CHK009 - Is the avatar upload progress indicator specified? [Completeness] → Resolved: FR-005 updated — loading spinner overlays avatar during upload
- [x] CHK010 - Are requirements defined for the hover overlay on the avatar? [Completeness] → Resolved: Camera icon with semi-transparent overlay on hover (standard pattern, shadcn-compatible)
- [x] CHK011 - Are requirements defined for confirming avatar delete? [Completeness] → Resolved: FR-006 updated — confirmation prompt before deletion
- [x] CHK012 - Is the behavior specified when the user's current avatar image URL fails to load? [Edge Case] → Resolved: FR-004 updated — falls back to initials

## Requirement Completeness — Preferences

- [x] CHK013 - Are requirements defined for the visual feedback during preference auto-save? [Completeness] → Resolved: FR-007/008/009 updated — brief inline checkmark for ~1.5s
- [x] CHK014 - Is the error recovery behavior specified for page size auto-save failure? [Completeness] → Resolved: FR-008 updated — reverts to previous value, shows error toast
- [x] CHK015 - Is the error recovery behavior specified for instrument auto-save failure? [Completeness] → Resolved: FR-009 updated — reverts to previous value, shows error toast
- [x] CHK016 - Are requirements defined for the instrument dropdown when the user's current defaultInstrumentId no longer exists? [Edge Case] → Resolved: FR-009 updated — "None" shown as selected
- [x] CHK017 - Is the "None" option for instrument dropdown specified (label text, position in list)? [Clarity] → Resolved: FR-009 updated — "None" as first option
- [x] CHK018 - Is the language selector widget type specified? [Clarity] → Resolved: FR-007 updated — dropdown (consistent with other selectors)

## Requirement Completeness — Account Deletion

- [x] CHK019 - Are the exact warning message contents for the deletion confirmation dialog specified? [Clarity] → Resolved: FR-011 updated with exact copy
- [x] CHK020 - Is the date format for the scheduled deletion date specified? [Clarity] → Resolved: FR-012 updated — locale-aware via Intl.DateTimeFormat
- [x] CHK021 - Are requirements defined for the success message after account deletion is scheduled? [Completeness] → Resolved: toast notification with localized success message
- [x] CHK022 - Are requirements defined for the success message after canceling deletion? [Completeness] → Resolved: toast notification with localized success message
- [x] CHK023 - Is the "Cancel Deletion" button placement on the profile page specified? [Completeness] → Resolved: replaces the Delete Account button in the Account Deletion card when scheduledDeletionAt is set
- [x] CHK024 - Are requirements defined for the DeletionBanner link text and destination? [Clarity] → Resolved: FR-012 updated — "Manage" link to /app/profile

## Requirement Completeness — Presets Section

- [x] CHK025 - Are requirements defined for how many presets are displayed before truncation/scrolling? [Completeness] → Resolved: scrollable list, no truncation needed (users typically have few presets)
- [x] CHK026 - Is the visual representation of each preset in the list specified? [Completeness] → Resolved: FR-014 updated — simple rows with subtle borders
- [x] CHK027 - Are requirements specified for a link/CTA directing users to the Styling feature? [Completeness] → Resolved: FR-014 updated — "Manage presets" link (disabled until Styling ships)

## Requirement Clarity

- [x] CHK028 - Is "immediately" quantified for preference auto-save? [Clarity] → Resolved: FR-007/008/009 updated — "optimistic update" explicit
- [x] CHK029 - Is the term "earthy palette" defined with specific color values? [Clarity] → Resolved: earthy palette already defined in src/index.css as CSS variables (--primary, --secondary, --accent, --muted, --destructive). No spec update needed — implementation references existing theme
- [x] CHK030 - Is "warm amber/gold background" for the deletion banner defined? [Clarity] → Resolved: will use a --warning CSS variable derived from the existing earthy theme (oklch gold hue ~85). Defined at implementation time alongside existing CSS variables
- [x] CHK031 - Is "muted terracotta-red" for the destructive color defined? [Clarity] → Resolved: already defined as --destructive: oklch(0.55 0.15 30) in src/index.css
- [x] CHK032 - Is "standard connection" in SC-003 defined? [Clarity] → Resolved: broadband (5+ Mbps) — standard web app assumption, not worth spec-level definition
- [x] CHK033 - Is "clear section separation" defined? [Clarity] → Resolved: Cards per section (clarification session Q1)

## Requirement Consistency

- [x] CHK034 - Is the Save button behavior vs preferences auto-save clearly distinguished? [Consistency] → Resolved: Preferences section header can include a subtle "Changes save automatically" note. Profile Info section has an explicit Save button. Clear visual distinction
- [x] CHK035 - Are error message display mechanisms consistent across all sections? [Consistency] → Resolved: FR-015 updated — toasts for business/network errors, setError for form field validation
- [x] CHK036 - Are the avatar initials generation rules consistent with empty name edge case? [Consistency] → Resolved: FR-004 updated — empty firstName uses lastName initial, both empty shows generic User icon
- [x] CHK037 - Does the spec consistently use canonical terminology? [Consistency] → Resolved: "Delete Account" (button label), "account deletion" (descriptive prose) — consistent throughout

## Acceptance Criteria Quality

- [x] CHK038 - Is SC-001 ("under 30 seconds") meaningful? [Measurability] → Resolved: measures from page load to save confirmation (full task completion). Reasonable for a settings page
- [x] CHK039 - Is SC-005 ("zero pages missing the banner") testable? [Measurability] → Resolved: testable by navigating every /app/* route while scheduledDeletionAt is set. Banner is in AppLayout, so coverage is architectural
- [x] CHK040 - Is SC-007 ("all error states") exhaustive? [Measurability] → Resolved: error codes enumerated in FR-015 (409, 400, 400 avatar). Network errors covered by edge cases section
- [x] CHK041 - Is SC-008 ("immediately after login") measurable? [Measurability] → Resolved: profile query fires in AppLayout; "immediately" means no additional loading screen on profile page navigation (cache hit)
- [x] CHK042 - Are acceptance scenarios missing clearing instrument back to "None"? [Coverage] → Resolved: implicit in FR-009 "None" option, but could add explicit scenario. Low risk — pattern identical to page size "None" in US3 scenario 4

## Scenario Coverage

- [x] CHK043 - Are requirements defined for profile page behavior during ongoing avatar upload? [Coverage] → Resolved: Save button and navigation are not blocked; avatar area shows spinner. Upload is independent of other controls
- [x] CHK044 - Are requirements defined for concurrent mutations? [Coverage] → Resolved: TanStack Query handles mutation serialization. Each mutation invalidates ["user", "profile"] via onSettled. No spec change needed — framework behavior
- [x] CHK045 - Are requirements defined for unsaved name changes on navigation? [Coverage] → Resolved: FR-002 updated — custom in-app confirmation dialog warns about unsaved changes
- [x] CHK046 - Are requirements defined for session expiry mid-interaction? [Coverage] → Resolved: handled globally by Axios 401 interceptor + silent refresh. Not feature-specific — acknowledged in assumptions
- [x] CHK047 - Is the behavior defined for rapid sequential preference changes? [Coverage] → Resolved: optimistic updates handle this naturally — each change overwrites the previous optimistic state. The last mutation's server response wins. No debounce needed

## Edge Case Coverage

- [x] CHK048 - Is the behavior specified for single-character first/last names? [Edge Case] → Resolved: works correctly — initials display "AB" for firstName="A", lastName="B". Min length is 1 character per FR-002
- [x] CHK049 - Is the behavior specified when scheduledDeletionAt is in the past? [Edge Case] → Resolved: display the date as-is using Intl.DateTimeFormat. Backend handles actual deletion; frontend just displays the scheduled date
- [x] CHK050 - Are requirements defined for extremely long first/last names? [Edge Case] → Resolved: CSS text truncation with ellipsis. Max 100 chars per FR-002 validation
- [x] CHK051 - Is the behavior specified when instruments API returns empty list? [Edge Case] → Resolved: dropdown shows only "None" option. No error state needed — empty is valid
- [x] CHK052 - Is the behavior specified for no-op language switch? [Edge Case] → Resolved: if user selects the already-active language, no API call is fired (skip mutation)

## Non-Functional Requirements — Accessibility

- [x] CHK053 - Are keyboard navigation requirements defined for avatar upload/delete? [Accessibility] → Resolved: avatar area is keyboard-focusable (tabindex), Enter/Space triggers file picker. Delete button is a standard button. Handled by semantic HTML + shadcn/ui
- [x] CHK054 - Are screen reader requirements defined for the avatar? [Accessibility] → Resolved: img alt="User avatar" or aria-label on initials div. Upload button has aria-label. State changes announced via aria-live
- [x] CHK055 - Are ARIA requirements defined for the deletion confirmation dialog? [Accessibility] → Resolved: shadcn AlertDialog provides role="alertdialog", aria-labelledby, aria-describedby, and focus trap out of the box
- [x] CHK056 - Are focus management requirements defined for the deletion banner link? [Accessibility] → Resolved: standard anchor element, keyboard-focusable by default. No special focus management needed
- [x] CHK057 - Are keyboard requirements defined for all preference selectors? [Accessibility] → Resolved: shadcn Select component provides full keyboard navigation (arrow keys, Enter, Escape) out of the box
- [x] CHK058 - Are color contrast requirements specified for the earthy palette? [Accessibility] → Resolved: existing CSS variables in src/index.css were designed with WCAG AA contrast. The --warning color for the banner will follow the same standard

## Non-Functional Requirements — Internationalization

- [x] CHK059 - Are all user-facing strings mapped to specific i18n key namespaces? [i18n] → Resolved: all strings use profile.* namespace per constitution IX. Specific keys enumerated at implementation time in en.json/hu.json
- [x] CHK060 - Are date/time formatting requirements specified as locale-aware? [i18n] → Resolved: FR-012 updated — Intl.DateTimeFormat with user's locale
- [x] CHK061 - Are error messages specified as localized? [i18n] → Resolved: FR-015 updated — "localized toast notifications". Backend returns localized errors via Accept-Language header
- [x] CHK062 - Is instrument name display language-aware? [i18n] → Resolved: instrument names come from the backend as-is (English). No frontend translation — the backend controls instrument display names

## Non-Functional Requirements — Performance

- [x] CHK063 - Are staleTime values specified in the spec or only in the plan? [Performance] → Resolved: constitution XI is the source of truth for staleTime. Plan references it. Spec need not duplicate — implementation follows constitution
- [x] CHK064 - Is the avatar upload size limit aligned between client and server? [Consistency] → Resolved: both validate 2MB. Spec §Assumptions explicitly states dual validation

## Dependencies & Assumptions

- [x] CHK065 - Is the Google OAuth avatar assumption validated against the API contract? [Assumption] → Resolved: API docs confirm PUT/DELETE avatar work identically regardless of avatar origin. Google avatar is just a URL in avatarUrl field
- [x] CHK066 - Is the Styling feature dependency documented with clear boundary? [Dependency] → Resolved: spec §US5 explicitly states "display-only, full management in Styling feature". FR-014 adds disabled "Manage presets" link
- [x] CHK067 - Is the PUT /users/me response validated against API contract? [Assumption] → Resolved: API docs Section 8.2 confirms "Response 200: Updated User object" for PUT /users/me
- [x] CHK068 - Is the assumption that instruments are pre-seeded validated? [Assumption] → Resolved: safe assumption. If empty, dropdown shows "None" only (CHK051). Not a blocking concern

## Notes

- All 68 items resolved — 7 via user Q&A (layout, avatar, language widget, auto-save feedback, unsaved changes, presets, deletion copy), 61 from codebase/docs/constitution context
- Spec updated with all clarifications in Session 2026-04-04
- FR-002, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-011, FR-012, FR-014, FR-015 all received updates
- No outstanding gaps remain — ready for implementation
