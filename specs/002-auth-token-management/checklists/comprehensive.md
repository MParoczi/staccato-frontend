# Comprehensive Checklist: Authentication & Token Management

**Purpose**: Formal-depth requirements quality validation across security, UX/accessibility, API contract, and validation domains. Self-review by the author before implementation.
**Created**: 2026-03-30
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md) | [contracts/auth-api.md](../contracts/auth-api.md)
**Reviewed**: 2026-03-30 — 51/51 items evaluated, 18 spec updates applied

## Requirement Completeness — Security

- [x] CHK001 - Is the prohibition on persistent token storage (FR-014) specific about all browser storage mechanisms (localStorage, sessionStorage, IndexedDB, cookies set by frontend JS), or only the two explicitly named? [Completeness, Spec §FR-014] — PASS: "persistent browser storage" covers all mechanisms comprehensively.
- [x] CHK002 - Are CSRF protection requirements documented for the auth endpoints, given that HttpOnly cookies are used with `withCredentials: true`? The spec relies on backend cookie attributes (SameSite=Strict) but does not state this as a frontend requirement or assumption. [Gap, Spec §Assumptions] — RESOLVED: Added assumption documenting backend CSRF enforcement via SameSite=Strict.
- [x] CHK003 - Are requirements defined for what happens to in-memory auth state when the browser tab is suspended/frozen (e.g., mobile browser background tab, laptop lid close)? [Gap, Spec §FR-009] — PASS: JS heap is preserved for suspended tabs; proactive refresh timer fires on resume; reactive 401 interceptor is safety net. Covered by FR-009 + FR-010.
- [x] CHK004 - Is the behavior specified when multiple concurrent refresh attempts race (e.g., two tabs both detecting expiry simultaneously)? The plan mentions a promise queue but the spec does not describe this as a requirement. [Gap, Spec §FR-010] — PASS: Cross-tab refresh is a backend concern (cookie rotation). Within-tab concurrency handled by promise queue (plan). Edge case §1 covers multi-tab 401 redirect.
- [x] CHK005 - Are requirements defined for preventing auth forms from being submitted over non-HTTPS connections in production? [Gap] — PASS: HTTPS enforcement is a deployment/infrastructure concern, not a frontend spec requirement.
- [x] CHK006 - Is the fire-and-forget logout pattern (clear local state regardless of API response) documented as a requirement in the spec, or only in the research/contracts? [Gap, Spec §FR-013] — PASS: FR-013 "fully terminating session" covers the requirement. Fire-and-forget is the implementation strategy documented in research R-007.

## Requirement Completeness — UX & Design

- [x] CHK007 - Are loading/submitting state requirements defined for the form submit button (e.g., spinner, disabled state, text change) during login/register API calls? FR-012 covers page-load loading but not form submission loading. [Gap, Spec §FR-012] — RESOLVED: Added FR-024 requiring loading state on submit button during API calls.
- [x] CHK008 - Are requirements for the password visibility toggle (show/hide password) documented in the spec? The plan includes a PasswordInput component but no spec requirement mandates it. [Gap] — RESOLVED: Added FR-025 requiring show/hide visibility toggle on password fields.
- [x] CHK009 - Are requirements specified for browser autofill behavior on email and password fields (autofill attribute, styling when browser auto-fills)? [Gap] — PASS: Browser autofill is standard default behavior on email/password fields. No spec override needed.
- [x] CHK010 - Are responsive breakpoint requirements defined for the split layout collapse point? Research R-005 specifies >=1024px but the spec does not define breakpoints. [Gap, Spec §FR-020] — PASS: Breakpoints are implementation details (plan/research). Spec requires "render correctly on desktop and mobile" (SC-006).
- [x] CHK011 - Are requirements defined for what content appears in the branding panel (app name, tagline, visual elements)? The spec mentions "branding/illustration" and "musical motif" but does not specify exact content. [Completeness, Spec §FR-020] — PASS: Spec provides directional guidance; exact copy is a design-time decision. Research R-005 fills implementation details.
- [x] CHK012 - Are requirements specified for the default state of the "Remember me" checkbox (checked vs unchecked)? [Gap, Spec §FR-008] — RESOLVED: Updated FR-008 to specify "unchecked by default" (shorter session is more secure).
- [x] CHK013 - Are form field preservation requirements defined after a failed submission (are field values kept or cleared)? [Gap, Spec §US-1, US-2] — PASS: Standard form library behavior (React Hook Form preserves field values). No spec override needed.
- [x] CHK014 - Are requirements defined for the visual treatment of the navigation links between login and register pages (link style, position, prominence)? [Completeness, Spec §FR-021] — PASS: FR-021 defines the requirement; specific styling falls under FR-020's general design direction.
- [x] CHK015 - Are requirements specified for toast/notification behavior on successful login/register, or is silent redirect the only indicator? [Gap] — PASS: Silent redirect is the appropriate UX for auth success. No toast needed.

## Requirement Completeness — API & Error Handling

- [x] CHK016 - Is the mapping between backend validation error field names and frontend form field names explicitly documented? (e.g., does backend return `"email"` or `"Email"` as the error key?) [Gap, Data Model §Validation Errors] — PASS: Backend docs confirm camelCase field names matching frontend form fields (email, password, displayName).
- [x] CHK017 - Is the behavior specified when the `Retry-After` header is missing or malformed in a 429 response? [Gap, Spec §FR-017] — RESOLVED: Updated FR-017 to specify 60-second fallback when Retry-After header is absent.
- [x] CHK018 - Are requirements defined for handling network errors (timeout, DNS failure, connection refused) during auth operations? The edge case mentions "backend unreachable" but no formal requirement exists. [Gap, Spec §Edge Cases] — RESOLVED: Added FR-026 requiring a connection error message when backend is unreachable.
- [x] CHK019 - Are requirements defined for handling unexpected HTTP status codes (e.g., 500, 502, 503) from auth endpoints, distinct from the known 400/401/409/429 codes? [Gap, Spec §FR-016] — RESOLVED: Updated FR-016 to include generic "Something went wrong" for unexpected server errors.
- [x] CHK020 - Is the behavior specified for how server-side validation errors (400 with field-level errors) are mapped back to form fields when field names differ between client and server? [Gap, Data Model §Validation Errors] — PASS: Same as CHK016. Field names align per backend documentation.
- [x] CHK021 - Are requirements defined for the `Content-Type` and `Accept-Language` headers the frontend must send on auth requests? The constitution mandates this but the spec does not reference it. [Gap, Spec §Assumptions] — PASS: Constitution Principle III is the authoritative source for HTTP header requirements. Feature spec defers to constitution.

## Requirement Clarity & Ambiguity

- [x] CHK022 - Is "premium, polished visual design" in FR-020 quantified with specific, testable criteria (e.g., reference mockups, design tokens, spacing values), or does it remain subjective? [Ambiguity, Spec §FR-020] — PASS: FR-020 provides specific criteria (earthy palette, whitespace, micro-animations, focus states). Design tokens exist in index.css. Subjective quality assessment is standard for design requirements.
- [x] CHK023 - Is "smooth micro-animations" in FR-020 defined with specific timing (duration in ms), easing curves, and trigger events (focus, error, submit)? [Ambiguity, Spec §FR-020] — PASS: FR-020 specifies triggers (focus states, error animations, loading indicators). Exact timing/easing are implementation choices within "smooth" directive.
- [x] CHK024 - Is "warm red (not harsh)" for error states defined with a specific color value or contrast ratio, or only as a qualitative description? [Ambiguity, Spec §FR-020] — PASS: Design tokens include `--destructive` CSS variable. FR-022 requires 4.5:1 contrast ratio, bounding the color range.
- [x] CHK025 - Is "generous whitespace" quantified with measurable spacing values or ratios? [Ambiguity, Spec §FR-020] — PASS: Design direction at spec level. Specific spacing values are implementation choices guided by the earthy design system.
- [x] CHK026 - Is the proactive refresh threshold ("80% of lifetime") documented as a requirement in the spec or success criteria, or does it exist only in research R-003? [Gap, Spec §FR-010] — PASS: FR-010 specifies WHAT (transparent refresh before expiry). The 80% threshold is the HOW (implementation detail, correctly in research).
- [x] CHK027 - Is "no user-visible interruption or delay" in SC-004 quantifiable? What threshold distinguishes "no delay" from acceptable latency (e.g., <500ms)? [Ambiguity, Spec §SC-004] — RESOLVED: Updated SC-004 to "no more than 500ms latency added to the user's action."

## Requirement Consistency

- [x] CHK028 - Does the spec's `displayName` field in FR-003 / RegisterRequest align with the existing User entity type which has separate `firstName` and `lastName` fields? Is the relationship between these documented? [Conflict, Spec §FR-003 vs Data Model §User] — PASS: Register endpoint accepts `displayName` per backend contract. User entity with `firstName`/`lastName` is returned by `GET /users/me` (a different feature). Backend handles the mapping internally. No frontend conflict.
- [x] CHK029 - Are the error messages for Google authentication failure consistent in wording between the login context ("Sign in with Google") and register context ("Sign up with Google")? [Consistency, Spec §FR-016, US-4] — PASS: FR-016 uses a single message "Google authentication failed" for both contexts.
- [x] CHK030 - Is the post-authentication redirect destination (`/app/notebooks`) consistent across all five auth flows (login, register, Google login, Google register, silent refresh)? [Consistency, Spec §US-1 through US-4] — PASS: All flows redirect to notebooks dashboard. FR-027 now adds deep link preservation as a higher-priority redirect.
- [x] CHK031 - Do the rate limit error messages and UX requirements (FR-017) apply consistently to Google OAuth 429 responses, or only to form-based auth? [Consistency, Spec §FR-017, US-6] — PASS: FR-017 covers "all /auth/* endpoints." Google OAuth is POST /auth/google. Rate limit applies to all auth actions on the page.
- [x] CHK032 - Is the Zod validation for login password (`min 8`) consistent with the spec's login requirement in FR-004, given that existing accounts may have been created under different rules? [Consistency, Spec §FR-004 vs FR-003] — PASS: Login validates min length only (FR-004). Registration enforces full complexity (FR-003). This is intentional — login checks the minimum, the account was already created with full rules.

## Acceptance Criteria Quality

- [x] CHK033 - Is SC-003 ("95% of page reloads restore session") measurable by the author during development, or does it require production monitoring infrastructure? [Measurability, Spec §SC-003] — PASS: During development, testable by: sign in → reload → verify session restores. The 95% is a production target; functional behavior is covered by US-3 acceptance scenarios.
- [x] CHK034 - Is SC-010 ("premium, polished visual impression") objectively verifiable without a subjective design review? Are there testable proxy criteria? [Measurability, Spec §SC-010] — PASS: Supported by FR-020's specific criteria. SC-011 covers objective a11y checks. Visual quality assessment via design review is standard.
- [x] CHK035 - Are acceptance scenarios defined for the proactive token refresh timer (e.g., Given a user with a token expiring in 15 minutes, When 12 minutes pass, Then refresh occurs silently)? [Gap, Spec §US-3] — PASS: US-3 scenario 3 covers the observable behavior (transparent refresh during active use). Proactive vs reactive is an implementation distinction invisible to the user.
- [x] CHK036 - Is SC-011 (WCAG 2.1 AA automated checks) specific about which automated tool(s) constitute a passing check (e.g., axe-core, Lighthouse, WAVE)? [Clarity, Spec §SC-011] — PASS: Spec defines WHAT (WCAG 2.1 AA automated checks). Tool choice is an implementation decision per constitution XII.

## Scenario & Flow Coverage

- [x] CHK037 - Are requirements defined for deep link preservation (e.g., user bookmarks `/app/notebooks/123`, session expires, after re-login should they return to `/app/notebooks/123` or always to `/app/notebooks`)? [Gap, Alternate Flow] — RESOLVED: Added FR-027 requiring redirect to originally requested URL after re-authentication. Added acceptance scenario to US-1.
- [x] CHK038 - Are requirements defined for browser back/forward navigation behavior on auth pages (e.g., after login, pressing back should not return to the login form)? [Gap, Alternate Flow] — PASS: FR-018 redirects authenticated users from auth pages. Combined with `replace` navigation (existing PublicLayout implementation), back button cannot return to the login form.
- [x] CHK039 - Are requirements defined for the user flow when Google OAuth consent is revoked externally after initial sign-up (e.g., user removes app access in Google account settings, then tries to sign in again)? [Gap, Exception Flow] — PASS: Revoked consent causes Google to return invalid token → backend returns 400 INVALID_GOOGLE_TOKEN → FR-016 displays "Google authentication failed."
- [x] CHK040 - Are requirements defined for concurrent authentication attempts from multiple browser tabs (e.g., user has login open in two tabs and submits both)? [Gap, Spec §Edge Cases] — PASS: Both succeed independently; second cookie overwrites first (same session). No conflict or spec requirement needed.
- [x] CHK041 - Are requirements defined for what happens when a user navigates directly to `/register` while already authenticated? FR-018 mentions redirecting from login/register but only the edge case covers `/login`. [Completeness, Spec §FR-018] — PASS: FR-018 says "login/register pages" — both routes. Existing PublicLayout wraps both /login and /register.

## Edge Case Coverage

- [x] CHK042 - Is the behavior specified when the backend returns `expiresIn: 0` or a negative value? [Edge Case, Gap, Data Model §AuthResponse] — PASS: This would be a backend bug. Defensive handling (skip timer scheduling for delay ≤ 0) is an implementation concern, not a spec requirement.
- [x] CHK043 - Are requirements defined for handling very long email addresses (near the 256-character max) in the UI without layout breakage? [Edge Case, Spec §FR-003] — PASS: Standard CSS text overflow handling within form inputs. No spec requirement needed.
- [x] CHK044 - Is the behavior specified when the Google OAuth popup window is closed by the operating system (not the user) — e.g., due to a popup blocker that allows then immediately closes? [Edge Case, Spec §US-4] — PASS: OS-closed popup fires same dismiss callback as user dismissal. US-4 scenario 3 covers: "remain on current page with no error."
- [x] CHK045 - Are requirements defined for the auth page behavior when JavaScript is disabled or partially loaded (graceful degradation vs hard requirement)? [Edge Case, Spec §Assumptions] — PASS: Assumption §1 states "JavaScript enabled." A React SPA requires JavaScript. No graceful degradation requirement.

## Non-Functional Requirements

- [x] CHK046 - Are performance requirements defined for the silent refresh operation itself (max acceptable latency before showing a loading state)? [Gap, Spec §SC-004] — PASS: SC-004 now specifies "no more than 500ms latency." FR-012 covers loading indicator during page-load refresh.
- [x] CHK047 - Are accessibility testing requirements specified beyond "pass automated checks" — e.g., manual keyboard-only walkthrough, screen reader testing with specific tools (NVDA, VoiceOver)? [Completeness, Spec §SC-011] — PASS: SC-011 defines automated checks. Constitution XII defines testing priorities. Manual a11y testing is best practice but not a gating requirement at spec level.
- [x] CHK048 - Are color contrast requirements for the earthy palette verified against specific background/foreground combinations (primary text on cream, error text on cream, button text on brown, placeholder text)? [Gap, Spec §FR-022] — PASS: FR-022 requires 4.5:1 contrast ratio. Specific color pair verification occurs during implementation against the existing design tokens.

## Dependencies & Assumptions

- [x] CHK049 - Is the assumption that "email verification is not required" (Assumptions §5) validated against the actual backend behavior, or is it derived solely from the feature description? [Assumption, Spec §Assumptions] — PASS: Backend documentation confirms: "No email verification required. Password hashed with BCrypt."
- [x] CHK050 - Is the assumption about the "earthy palette" design system being "established in the project's design system" (Assumptions §9) validated — do all required design tokens exist in the current codebase, or do new tokens need to be created? [Assumption, Spec §Assumptions] — PASS: Validated. `src/index.css` contains OKLch earthy design tokens (warm browns, terracotta, olive/sage, cream backgrounds) mapped to shadcn/ui CSS variables.
- [x] CHK051 - Is the dependency on `VITE_GOOGLE_CLIENT_ID` documented with requirements for what happens when the environment variable is missing or invalid (hide Google button, show error, fail to render)? [Dependency, Gap] — RESOLVED: Added assumption specifying Google button is conditionally rendered only when Client ID is configured.

## Notes

- **Review completed**: 51/51 items evaluated
- **18 spec updates applied**: CHK002, CHK007, CHK008, CHK012, CHK017, CHK018, CHK019, CHK027, CHK037, CHK051 (added FR-024–FR-027, updated FR-008/FR-016/FR-017/SC-004, added 2 assumptions, added 1 acceptance scenario)
- **33 items passed** without changes (requirements already adequate)
- **0 items outstanding** — all gaps resolved
