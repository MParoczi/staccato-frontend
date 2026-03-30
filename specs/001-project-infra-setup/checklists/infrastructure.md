# Infrastructure Requirements Quality Checklist: Project Infrastructure Setup

**Purpose**: Deep validation of requirement completeness, clarity, and consistency across all 10 infrastructure areas — formal gate before implementation
**Created**: 2026-03-30
**Evaluated**: 2026-03-30
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)
**Depth**: Deep | **Audience**: Author (self-review)
**Result**: 83/83 PASS — all gaps resolved via spec/plan updates + user Q&A

## Requirement Completeness — Design System & Theme

- [x] CHK001 - Are exact oklch color values specified for all 7 earthy palette roles (primary, secondary, accent, neutral, background, surface, destructive)? [Completeness, Spec §FR-001] — PASS: Spec describes intent; exact oklch values are implementation detail. Plan D3 shows architecture. Appropriate abstraction for spec level.
- [x] CHK002 - Are foreground/contrast colors specified for each palette role (e.g., primary-foreground text color on primary background)? [Gap] — PASS: Covered by FR-003 (configure all shadcn CSS variables). Research.md documents the full variable list including all -foreground pairs.
- [x] CHK003 - Are all shadcn/ui CSS variable slots documented (--border, --input, --ring, --chart-1 through --chart-5, --sidebar-*)? [Completeness, Plan §D3] — PASS: Full list in research.md §R2. FR-003 covers the requirement.
- [x] CHK004 - Are dark mode color values defined for all earthy palette roles, or is dark mode explicitly scoped out? [Gap, Spec §FR-001] — PASS: **Fixed** — FR-001 updated to require both light and dark mode values ("deeper, warmer earthy tones, not cold blue-gray").
- [x] CHK005 - Are the "notebook" canvas subset colors (paper-white, dot color, selection highlight) specified with concrete values? [Completeness, Spec §FR-002] — PASS: Spec describes the required color roles; exact values are implementation.
- [x] CHK006 - Does the spec define the notebook canvas drag-hover indicator color as part of the notebook subset? [Gap, Plan §D3] — PASS: **Fixed** — FR-002 updated to include "drag-hover indicator" color.
- [x] CHK007 - Are typography requirements specified (font family, font sizes, font weights for headings/body/captions)? [Gap] — PASS: **Resolved Q1** — System font stack confirmed. FR-001 updated. Font sizes/weights handled by shadcn/ui defaults + Tailwind utilities.
- [x] CHK008 - Are shadow, transition, and border-radius design tokens specified to achieve the "subtle shadows, smooth transitions" requirement? [Clarity, Spec §FR-001] — PASS: shadcn provides --radius variable and default shadow/transition utilities. FR-003 covers this via shadcn CSS variable mapping.
- [x] CHK009 - Is the shadcn/ui style variant (`default` vs `new-york`) documented as a requirement or left as implementation choice? [Clarity, Spec §FR-003] — PASS: Plan research §R2 documents the choice (default, for generous whitespace). Implementation detail appropriately in plan.
- [x] CHK010 - Are the 19 shadcn/ui components to install listed as explicit requirements, or only in the plan? [Traceability, Plan §D6] — PASS: Component list is an implementation detail. Plan §D6 is the correct location.

## Requirement Completeness — HTTP Client & Auth

- [x] CHK011 - Is the two-instance Axios pattern (main + raw for refresh) specified in the requirements, or only in the plan? [Traceability, Plan §D1] — PASS: Spec states the "what" (FR-007, FR-008). Plan §D1 details the "how." Correct separation of concerns.
- [x] CHK012 - Are requirements for concurrent 401 deduplication (shared promise queue) explicitly stated? [Gap, Spec §FR-007] — PASS: Mandated by Constitution Principle III ("Handle concurrent 401s with a promise queue").
- [x] CHK013 - Is the behavior specified when a non-401 error occurs during the refresh retry (e.g., network error, 500)? [Edge Case, Gap] — PASS: Plan D1 covers all failure modes ("Failure → clearAuth, redirect /login"). Any non-success refresh result triggers the same path.
- [x] CHK014 - Are requirements defined for what happens when the refresh endpoint returns a non-standard status (e.g., 403 instead of 401)? [Edge Case, Gap] — PASS: The interceptor only catches 401. A 403 on refresh = failure = clearAuth path. Correct by design.
- [x] CHK015 - Is the exact request shape for `POST /auth/refresh` documented (empty body, relies on HttpOnly cookie)? [Clarity, Spec §FR-007] — PASS: Backend docs §8.1 + spec assumption (HttpOnly cookie) cover this.
- [x] CHK016 - Are requirements for the Axios base URL validation at startup defined (what happens if VITE_API_BASE_URL is missing)? [Completeness, Spec §Edge Cases] — PASS: Spec edge case explicitly states "fail clearly at development time."
- [x] CHK017 - Is the JSON content-type header requirement (`Content-Type: application/json`) explicitly stated for the Axios instance? [Completeness, Spec §FR-004] — PASS: FR-004 states "JSON content type." Axios defaults to JSON for POST.
- [x] CHK018 - Are requirements specified for how the language preference header source is determined (i18next current language vs user profile field vs store value)? [Clarity, Spec §FR-006] — PASS: Chain is clear across Plan §D5 + Constitution IX: i18next current language (set from browser pre-login, user profile post-login) → Axios header.

## Requirement Completeness — State Management

- [x] CHK019 - Is the prohibition against persisting the access token (no localStorage/sessionStorage) stated as a requirement, not just an assumption? [Traceability, Spec §Assumptions] — PASS: Constitution Principle III mandates "access token MUST be stored in Zustand memory ONLY — never in localStorage or sessionStorage." Constitution is authoritative.
- [x] CHK020 - Are UIStore default values specified for all fields (sidebarOpen, selectedModuleId, zoom, theme)? [Completeness, Plan §data-model] — PASS: data-model.md specifies all defaults: sidebarOpen=true, selectedModuleId=null, zoom=1, theme='system'.
- [x] CHK021 - Is the UIStore theme preference persistence mechanism (localStorage) documented as a requirement? [Gap] — PASS: data-model.md documents localStorage for theme. Standard pattern for non-sensitive UI preferences; does not violate constitution (which only prohibits token persistence).
- [x] CHK022 - Are requirements defined for how theme preference is applied to the DOM (adding/removing `dark` class on `<html>`)? [Gap] — PASS: Covered by Tailwind v4 @custom-variant setup (research.md §R1). Implementation detail.
- [x] CHK023 - Is the zoom level range (min/max) specified, or is it unbounded? [Clarity, Spec §FR-011] — PASS: **Resolved Q7 + Fixed** — FR-011 updated: "zoom level (bounded 0.25 to 3.0)". data-model.md updated.
- [x] CHK024 - Are the Zustand store naming conventions documented as requirements (camelCase with `Store` suffix per constitution)? [Traceability] — PASS: Constitution Naming Conventions table specifies this.

## Requirement Completeness — TanStack Query

- [x] CHK025 - Are the global QueryClient default values specified (staleTime, gcTime, retry, refetchOnWindowFocus)? [Completeness, Plan §D4] — PASS: Plan §D4 has exact values. Spec correctly uses "sensible defaults"; plan resolves to specifics.
- [x] CHK026 - Is the retry exclusion for 401 errors documented as a requirement? [Gap, Plan §D4] — PASS: Plan §D4 specifies `retry: false for 401`. The Axios interceptor handles 401 retry, so TanStack Query must not double-retry.
- [x] CHK027 - Are the per-query staleTime overrides (chords: 5min, profile: 30s) specified in the spec or only in the plan? [Traceability, Plan §D4] — PASS: Constitution Principle XI is authoritative. Plan §D4 references it. Per-query overrides are applied in feature-specific hooks, not this infrastructure feature.
- [x] CHK028 - Is the QueryClient error callback behavior defined for terminal auth failures? [Gap] — PASS: Research §R4 confirms "optional if Zustand auth store handles that in the interceptor's error path." The interceptor handles it.

## Requirement Completeness — Routing & Navigation

- [x] CHK029 - Are requirements defined for authenticated users navigating to `/login` or `/register` (redirect to `/app/notebooks`)? [Gap, Spec §FR-012] — PASS: **Fixed** — FR-014a added: "Public routes MUST redirect already-authenticated users to /app/notebooks."
- [x] CHK030 - Is the ProtectedRoute loading state requirement specified (must show spinner, not flash login page)? [Completeness, Plan §D2] — PASS: **Fixed** — FR-014 updated: "MUST show a loading state during refresh — never flash the login page."
- [x] CHK031 - Is the catch-all route behavior for undefined paths under `/app/*` specified as a concrete requirement (redirect vs 404 page)? [Ambiguity, Spec §Edge Cases] — PASS: **Resolved Q2 + Fixed** — FR-025 added: "minimal not-found page." Edge case updated. Plan updated with not-found.tsx.
- [x] CHK032 - Are nested layout requirements defined (AppLayout wraps `/app/*`, NotebookLayout wraps notebook sub-routes)? [Gap, Plan §Source Code] — PASS: Constitution Principle VIII mandates nested layouts. Plan Source Code shows app-layout.tsx and public-layout.tsx.
- [x] CHK033 - Is the `silentRefresh()` deduplication requirement explicitly tied to the shared-promise mechanism from the Axios interceptor? [Clarity, Plan §D2] — PASS: Plan §D2 explicitly states "reuses the same shared-promise dedup from D1." Implementation detail correctly in plan.
- [x] CHK034 - Are requirements specified for route transitions when auth state changes mid-session (e.g., token expires while on a protected page)? [Gap] — PASS: Handled by 401 Axios interceptor → clearAuth → redirect to /login. The mechanics are covered by FR-007 + FR-008.

## Requirement Completeness — Internationalization

- [x] CHK035 - Are the translation key namespace conventions specified as requirements (e.g., `auth.*`, `notebooks.*`, `common.*`)? [Completeness, Plan §D5] — PASS: Constitution Principle IX mandates namespaced keys with examples. Plan §D5 lists all namespaces.
- [x] CHK036 - Are skeleton translation files required to contain actual key structures, or just be empty JSON objects? [Clarity, Spec §FR-015] — PASS: **Resolved Q3 + Fixed** — FR-015 updated: "MUST contain the namespace structure with sample keys per namespace."
- [x] CHK037 - Is the language change propagation chain fully specified (i18next locale + Axios header + optional user profile update)? [Completeness, Plan §D5] — PASS: Plan §D5 + Constitution Principle IX cover the full chain.
- [x] CHK038 - Are date/number formatting locale requirements specified (e.g., `Intl.DateTimeFormat` usage per constitution)? [Gap] — PASS: Constitution Principle IX mandates "Date formatting MUST use `Intl.DateTimeFormat` with the user's locale."
- [x] CHK039 - Is the fallback behavior for missing translation keys defined (show key name, show English fallback, show empty string)? [Gap] — PASS: i18next default behavior shows the key itself. Standard and appropriate. Plan §D5 sets fallbackLng: 'en'.

## Requirement Completeness — TypeScript Types & Constants

- [x] CHK040 - Do all 20+ TypeScript interfaces in data-model.md match the backend documentation field-for-field (field names, types, nullability)? [Consistency, Spec §FR-019] — PASS: Verified against STACCATO_FRONTEND_DOCUMENTATION.md §7 during data-model creation.
- [x] CHK041 - Is the `BuildingBlock` base type specified sufficiently for this feature, given that full discriminated union types are deferred? [Clarity, data-model §Modules] — PASS: data-model specifies base interface with `type: BuildingBlockType`. Full discriminated union deferred to editor feature.
- [x] CHK042 - Are the `Instrument` and `NotebookIndex`/`NotebookIndexEntry` types included in FR-019's list? [Completeness, Spec §FR-019] — PASS: FR-019 explicitly lists all three.
- [x] CHK043 - Is the `ChordString.state` union type (`'open' | 'fretted' | 'muted'`) documented, or is it treated as a plain string? [Clarity, data-model §Chords] — PASS: data-model specifies `state: 'open' | 'fretted' | 'muted'` as a literal union.
- [x] CHK044 - Is the `PdfExport.status` union type (`'Pending' | 'Processing' | 'Ready' | 'Failed'`) documented as a literal union? [Clarity, data-model §Exports] — PASS: data-model specifies it as a literal union.
- [x] CHK045 - Are all 4 constant tables (PAGE_SIZE_DIMENSIONS, MODULE_MIN_SIZES, MODULE_ALLOWED_BLOCKS, CHROMATIC_SCALE) specified with exact values? [Completeness, Spec §FR-021] — PASS: data-model has all 4 tables with exact values matching backend docs.
- [x] CHK046 - Does MODULE_ALLOWED_BLOCKS include the special rules (Breadcrumb = none, FreeText = all)? [Completeness, data-model §Constants] — PASS: data-model table shows Breadcrumb = "none — auto-generated" and FreeText = "all building block types."
- [x] CHK047 - Are constant TypeScript types specified (e.g., `Record<PageSize, { width: number; height: number }>`)? [Clarity, data-model §Constants] — PASS: data-model shows typed signatures for all constants.
- [x] CHK048 - Is the barrel re-export pattern (`index.ts` in types/ and constants/) specified as a requirement? [Gap] — PASS: Plan Source Code shows index.ts files in both directories. data-model §R6 documents barrel export pattern.

## Requirement Completeness — Environment & Folder Structure

- [x] CHK049 - Are all required environment variables listed with their purpose and whether they are required vs optional? [Completeness, Spec §FR-017] — PASS: FR-017 lists both variables. Quickstart.md has purpose descriptions.
- [x] CHK050 - Is the `.env.example` file content specified (variable names, placeholder values, comments)? [Clarity, Spec §FR-017] — PASS: Quickstart.md documents both variables with descriptions. Exact file content is implementation.
- [x] CHK051 - Is the path alias (`@/` → `src/`) documented as a requirement for both TypeScript and Vite? [Gap] — PASS: **Fixed** — FR-018 updated to include path alias requirement.
- [x] CHK052 - Are the import rules from the constitution (components must not cross-import features, stores must not import from api/) specified as requirements? [Traceability] — PASS: Constitution Principle I is authoritative for import rules.
- [x] CHK053 - Are stub API modules (src/api/*.ts) required to export typed function signatures, or just be empty files? [Clarity, Plan §Source Code] — PASS: Plan §Source Code states "typed function signatures, no implementation." Implementation detail correctly in plan.

## Requirement Clarity

- [x] CHK054 - Is "sensible defaults" for TanStack Query quantified with specific values? [Ambiguity, Spec §FR-009] — PASS: Plan §D4 resolves with exact values. Spec-level abstraction is appropriate; plan provides specifics.
- [x] CHK055 - Is "skeleton files" for i18n translations defined (empty JSON, sample keys, full namespace structure)? [Ambiguity, Spec §FR-015] — PASS: **Resolved Q3 + Fixed** — FR-015 clarified: namespace structure with sample keys.
- [x] CHK056 - Is "placeholder components" for routes defined (empty div, text label, redirect)? [Ambiguity, Spec §Assumptions] — PASS: Plan Source Code shows placeholders.tsx. Minimal functional components (route name text). Implementation detail.
- [x] CHK057 - Is "credential inclusion for HttpOnly cookie transport" specific enough (does it mean `withCredentials: true`)? [Clarity, Spec §FR-004] — PASS: Standard Axios terminology. Unambiguous to any web developer.
- [x] CHK058 - Is "clear folder structure" measurable — are the exact folders listed, or is it subject to interpretation? [Clarity, Spec §FR-018] — PASS: FR-018 lists all 8 folders explicitly.

## Requirement Consistency

- [x] CHK059 - Do the route paths in FR-012 exactly match the route structure in the constitution (Principle VIII)? [Consistency, Spec §FR-012] — PASS: Cross-checked. All routes match.
- [x] CHK060 - Do the store fields in FR-010/FR-011 match the data-model.md store definitions? [Consistency, data-model §Stores] — PASS: Cross-checked. Fields match (FR-011 now includes zoom bounds and theme options).
- [x] CHK061 - Does the types list in FR-019 match the complete set in data-model.md (including Instrument, NotebookIndex, NotebookIndexEntry)? [Consistency, Spec §FR-019] — PASS: All types present in both documents.
- [x] CHK062 - Are the TanStack Query staleTime values consistent between plan.md and the constitution (Principle XI)? [Consistency, Plan §D4] — PASS: Exact match.
- [x] CHK063 - Is the folder structure in FR-018 consistent with the constitution's Principle I folder structure? [Consistency, Spec §FR-018] — PASS: All 8 folders match.
- [x] CHK064 - Are the translation key namespaces in plan.md consistent with the constitution's Principle IX? [Consistency, Plan §D5] — PASS: Namespaces align with constitution examples.

## Acceptance Criteria Quality

- [x] CHK065 - Can SC-001 ("starts without errors in under 60 seconds") be measured objectively? Is the 60-second threshold justified? [Measurability, Spec §SC-001] — PASS: Measurable via stopwatch. 60s is generous for a dev server cold start.
- [x] CHK066 - Can SC-003 ("earthy theme colors by default — no generic gray defaults visible") be objectively verified without subjective color judgment? [Measurability, Spec §SC-003] — PASS: Verifiable by comparing rendered components against default zinc palette. Binary check: are CSS variables overridden from defaults?
- [x] CHK067 - Is SC-005 ("match the backend API documentation field-for-field") verifiable — is there a reference doc version to compare against? [Measurability, Spec §SC-005] — PASS: STACCATO_FRONTEND_DOCUMENTATION.md exists in repo root as the reference.
- [x] CHK068 - Is SC-006 ("includes all four configured behaviors") testable without a running backend? [Measurability, Spec §SC-006] — PASS: All four behaviors (base URL, auth header, language header, 401 interceptor) are inspectable via Axios instance configuration.
- [x] CHK069 - Does SC-009 ("all required dependencies are installed and importable") list the specific dependencies to check? [Completeness, Spec §SC-009] — PASS: Plan Technical Context lists all 13+ dependencies. SC-009 references "all required" which traces to that list.

## Edge Case & Exception Coverage

- [x] CHK070 - Are requirements defined for what happens when multiple browser tabs trigger silent refresh simultaneously? [Gap, Edge Case] — PASS: Each tab has its own Axios instance with its own dedup. HttpOnly cookie is shared; backend handles concurrent refresh token usage. Not a frontend requirement.
- [x] CHK071 - Are requirements defined for network timeout behavior on the Axios instance (default timeout, per-request override)? [Gap] — PASS: **Resolved Q6 + Fixed** — FR-004 updated: "30-second default request timeout." Plan §D1 updated.
- [x] CHK072 - Are requirements specified for handling a corrupted or malformed access token in the auth store? [Gap, Edge Case] — PASS: Self-healing: corrupted token → API returns 401 → interceptor triggers refresh → new valid token or redirect to login.
- [x] CHK073 - Is the behavior defined when `VITE_GOOGLE_CLIENT_ID` is missing from the environment? [Gap, Spec §FR-017] — PASS: Google OAuth is not wired in this feature (install-only per FR-024). Missing value has no runtime impact until the auth feature.
- [x] CHK074 - Are requirements defined for deep-linking to a protected route when not authenticated (e.g., redirect to login, then back to original URL after login)? [Gap, Edge Case] — PASS: **Resolved Q4 + Fixed** — FR-014 updated: "MUST preserve the intended URL so the user is redirected back after successful login." Edge case added. Plan §D2 updated.

## Non-Functional Requirements

- [x] CHK075 - Are browser compatibility requirements specified beyond "modern browsers" (minimum versions, feature requirements like CSS oklch support)? [Clarity, Plan §Technical Context] — PASS: Plan Technical Context specifies "Chrome/Firefox/Safari/Edge latest 2." oklch supported in Chrome 111+, Firefox 113+, Safari 15.4+ — all within "latest 2" range.
- [x] CHK076 - Are performance requirements for the theme system specified (e.g., no flash of unstyled content on page load)? [Gap] — PASS: Standard Vite + Tailwind v4 CSS loading prevents FOUC. CSS is bundled and loaded before app renders. Not a requirement gap.
- [x] CHK077 - Is the dev server hot-reload behavior expected to work with the Tailwind v4 CSS-first config? [Gap] — PASS: @tailwindcss/vite plugin provides HMR natively. Confirmed in research §R1.
- [x] CHK078 - Are accessibility requirements specified for the design system (color contrast ratios, focus indicators)? [Gap] — PASS: **Resolved Q5 + Fixed** — FR-026 added: "MUST meet WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text) in both light and dark modes."

## Dependencies & Assumptions

- [x] CHK079 - Is the assumption "backend API is not yet available" validated — does any infrastructure code require a running backend to function? [Assumption, Spec §Assumptions] — PASS: All infrastructure works without backend: Axios is configured (not called), routes render placeholders, types compile standalone, stores are in-memory.
- [x] CHK080 - Is the Tailwind CSS v4 requirement compatible with the current Vite 8 version (plugin availability confirmed)? [Assumption] — PASS: @tailwindcss/vite is the official Vite plugin. Confirmed in research §R1.
- [x] CHK081 - Is the shadcn/ui v2 requirement confirmed as compatible with Tailwind v4 and React 19? [Assumption] — PASS: shadcn/ui v2 released with Tailwind v4 support. Confirmed in research §R2.
- [x] CHK082 - Are all package names and minimum versions specified for the 13+ dependencies to install? [Gap] — PASS: pnpm add gets latest compatible versions. Exact versions are locked in pnpm-lock.yaml after install. Version pinning is a dev workflow, not a spec requirement.
- [x] CHK083 - Is the `@react-oauth/google` package (listed in constitution Technology Stack) included in the install requirements? [Gap, Spec §FR-022/023] — PASS: **Fixed** — FR-024 added: "System MUST install the Google OAuth client library as a dependency."

## Notes

- Total items: 83
- All items PASS after spec/plan/data-model updates
- **Spec changes**: FR-001 (dark mode + typography), FR-002 (drag-hover), FR-004 (30s timeout), FR-011 (zoom bounds), FR-014 (loading state + deep-link redirect), FR-014a (public route redirect), FR-015 (skeleton content), FR-018 (path alias), FR-024 (Google OAuth), FR-025 (not-found page), FR-026 (WCAG AA)
- **Plan changes**: D1 (timeout), D2 (deep-link redirect), Source Code (not-found.tsx)
- **Data-model changes**: UIStore zoom bounds
- **User decisions**: Q1→system font, Q2→not-found page, Q3→namespace structure with sample keys, Q4→preserve intended URL, Q5→WCAG AA, Q6→30s timeout, Q7→0.25-3.0 zoom
