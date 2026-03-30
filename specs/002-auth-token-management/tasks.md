# Tasks: Authentication & Token Management

**Input**: Design documents from `/specs/002-auth-token-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.md
**Tests**: Included — constitution XII mandates tests for Zod schemas, Zustand stores, and API modules.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US1–US6)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Fix Existing Infrastructure)

**Purpose**: Correct the 6 API contract mismatches documented in research R-001 and update the auth store to support token expiry tracking.

- [ ] T001 Add auth request/response types in `src/lib/types/auth.ts` — add `AuthResponse { accessToken: string; expiresIn: number }`, `LoginRequest { email: string; password: string; rememberMe: boolean }`, `RegisterRequest { email: string; displayName: string; password: string }`, `GoogleAuthRequest { idToken: string }`, `ValidationErrorResponse { errors: Record<string, string[]> }`, `BusinessErrorResponse { code: string; message: string; details?: Record<string, unknown> }`. Keep existing `User` interface unchanged.
- [ ] T002 [P] Update Zustand auth store in `src/stores/authStore.ts` — add `expiresAt: number | null` to state, replace `setAccessToken` with `setAuth(token: string, expiresIn: number)` that computes `expiresAt = Date.now() + expiresIn * 1000` and sets both `accessToken` and `expiresAt`. Update `clearAuth` to also reset `expiresAt` to `null`. Import new types from `src/lib/types/auth.ts`.
- [ ] T003 [P] Fix auth API module in `src/api/auth.ts` — update `login()` to accept `LoginRequest` (add `rememberMe` field), update `register()` to accept `RegisterRequest` (change from firstName/lastName/language to `displayName` only), update return types from `AuthResponse { accessToken, user }` to `AuthResponse { accessToken, expiresIn }`, change `logout()` from `apiClient.post` to `rawClient.delete('/auth/logout')` returning `Promise<void>`, update `googleLogin()` to send `{ idToken }` instead of `{ credential }`, update `refreshToken()` return type to include `expiresIn`.
- [ ] T004 Update silentRefresh in `src/api/client.ts` — change response type to `{ accessToken: string; expiresIn: number }`, extract both `accessToken` and `expiresIn` from response, call `useAuthStore.getState().setAuth(accessToken, expiresIn)` instead of `setAccessToken(newToken)`.

**Checkpoint**: API layer, types, and store now match the backend contract. All existing functionality preserved.

---

## Phase 2: Foundational (Shared Components & i18n)

**Purpose**: Build shared infrastructure needed by multiple user stories. MUST complete before any user story phase.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 [P] Expand English auth translations in `src/i18n/en.json` — add all keys under `auth.login.*` and `auth.register.*` per the i18n key structure in data-model.md: titles, subtitles, field labels, button text, navigation links, all error message keys (emailRequired, emailInvalid, passwordMin, invalidCredentials, googleFailed, rateLimited with `{{seconds}}` interpolation, networkError, emailTaken, passwordUppercase, passwordLowercase, passwordDigit, passwordsMismatch, displayNameMin, displayNameMax, emailMax, confirmPasswordRequired, genericError for 5xx). Also add `auth.common.or` for the OAuth separator.
- [ ] T006 [P] Expand Hungarian auth translations in `src/i18n/hu.json` — add Hungarian equivalents for all keys added in T005, maintaining the same key structure under `auth.login.*` and `auth.register.*`.
- [ ] T007 [P] Create AuthLayout component in `src/features/auth/components/AuthLayout.tsx` — shared wrapper for login/register pages. Desktop (>=1024px): two-column split layout, left 40% branding panel (cream/earthy background, app name "Staccato" as heading, tagline, decorative Lucide Music/Music2 icons as visual accents), right 60% form area with centered card. Mobile (<1024px): single column with centered card, minimal branding header above. Use `cn()` for conditional classes. Accept `children` prop for form content. All text via `useTranslation`. WCAG: semantic HTML, proper heading hierarchy.
- [ ] T008 [P] Create PasswordInput component in `src/features/auth/components/PasswordInput.tsx` — extend shadcn/ui Input component. Add show/hide visibility toggle button (Lucide `Eye`/`EyeOff` icons) positioned inside the input field on the right. Toggle switches input type between `password` and `text`. Toggle button has `aria-label` ("Show password"/"Hide password"), `type="button"` to prevent form submission. Forward all standard input props via `React.forwardRef`. Compatible with React Hook Form's `register()`.
- [ ] T009 Wrap app with GoogleOAuthProvider in `src/App.tsx` — import `GoogleOAuthProvider` from `@react-oauth/google`. Conditionally wrap `RouterProvider` with `GoogleOAuthProvider` only when `import.meta.env.VITE_GOOGLE_CLIENT_ID` is defined and non-empty. If not configured, render without the provider (Google sign-in buttons will be hidden). Pass `clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}`.

**Checkpoint**: Foundation ready — shared layout, password input, translations, and Google provider in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Local Login (Priority: P1) MVP

**Goal**: A returning user can sign in with email and password, see validation errors for invalid input, and be redirected to the notebooks dashboard (or their originally requested page).

**Independent Test**: Navigate to /login, enter valid credentials → verify redirect to /app/notebooks. Enter invalid credentials → verify "Invalid email or password" error. Submit empty form → verify inline validation errors. Navigate to a protected page while logged out → verify redirect back after login.

### Tests for User Story 1

- [ ] T010 [P] [US1] Unit test for login Zod schema in `src/features/auth/schemas/login-schema.test.ts` — test cases: valid input passes, missing email fails, invalid email format fails, empty password shows "required" error (not "min 8"), password shorter than 8 chars fails with "min 8" error, rememberMe defaults to false when omitted, rememberMe accepts true/false.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create login Zod schema in `src/features/auth/schemas/login-schema.ts` — `z.object({ email: z.string().min(1, i18n key).email(i18n key), password: z.string().min(1, i18n key).min(8, i18n key), rememberMe: z.boolean().default(false) })`. The `.min(1)` check on password ensures empty fields show "Password is required" instead of the "min 8" message. Export schema and inferred type `LoginFormData`.
- [ ] T012 [US1] Create LoginForm component in `src/features/auth/components/LoginForm.tsx` — use `useForm` with `zodResolver(loginSchema)`. Fields: email (shadcn Input), password (PasswordInput from T008), rememberMe (shadcn Checkbox). Submit button with loading state: disabled + Lucide `Loader2` spinner during API call (FR-024). On submit: call `login()` API, on success call `useAuthStore.getState().setAuth(accessToken, expiresIn)`, redirect to `location.state?.from || '/app/notebooks'` using `useNavigate` (FR-027). Error handling: 401 → set form-level error "Invalid email or password" (i18n), 5xx → "Something went wrong" (i18n), network error → "Unable to connect" (i18n). Inline validation: `aria-describedby` linking each field to its error `<p>`, `aria-invalid` on error fields, focus first error field on validation failure (FR-023). All labels via `useTranslation('translation', { keyPrefix: 'auth.login' })`.
- [ ] T013 [US1] Create LoginPage component in `src/features/auth/LoginPage.tsx` — render `AuthLayout` wrapping `LoginForm`. Below form: navigation text "Don't have an account?" with React Router `Link` to `/register` (FR-021). All text localized.
- [ ] T014 [US1] Update router and remove placeholder in `src/routes/index.tsx` and `src/routes/placeholders.tsx` — import `LoginPage` from `@/features/auth/LoginPage`, replace `LoginPage` placeholder in the router's public routes. Remove `LoginPage` export from placeholders.tsx.

**Checkpoint**: Login flow is fully functional and independently testable. This is the MVP.

---

## Phase 4: User Story 2 — Local Registration (Priority: P1)

**Goal**: A new user can create an account with email, display name, and password, see detailed validation errors, and be automatically signed in.

**Independent Test**: Navigate to /register, fill in valid details → verify auto-sign-in and redirect. Enter duplicate email → verify "Email already registered" error. Enter weak password → verify specific inline errors for missing uppercase/lowercase/digit.

### Tests for User Story 2

- [ ] T015 [P] [US2] Unit test for register Zod schema in `src/features/auth/schemas/register-schema.test.ts` — test cases: valid input passes, missing email fails, invalid email fails, email over 256 chars fails, displayName under 2 chars fails, displayName over 100 chars fails, password under 8 chars fails, password without uppercase fails, password without lowercase fails, password without digit fails, mismatched passwords fail, matching passwords pass.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Create register Zod schema in `src/features/auth/schemas/register-schema.ts` — `z.object({ email, displayName, password, confirmPassword })` with `.refine()` for password match. Email: required, valid, max 256. DisplayName: min 2, max 100. Password: min 8 + `/[A-Z]/` + `/[a-z]/` + `/\d/`. ConfirmPassword: required. All error messages as i18n keys. Export schema and inferred type `RegisterFormData`.
- [ ] T017 [US2] Create RegisterForm component in `src/features/auth/components/RegisterForm.tsx` — use `useForm` with `zodResolver(registerSchema)`. Fields: email (Input), displayName (Input), password (PasswordInput), confirmPassword (PasswordInput). Submit button with loading state (FR-024). On submit: call `register()` API with `{ email, displayName, password }` (exclude confirmPassword), on success call `setAuth`, redirect to `/app/notebooks`. Error handling: 409 → set email field error "Email already registered", 400 with validation errors → map to form fields via `setError`, 5xx → generic error, network error → connection error. Same accessibility patterns as LoginForm (aria-describedby, aria-invalid, focus management). All labels via `useTranslation`.
- [ ] T018 [US2] Create RegisterPage component in `src/features/auth/RegisterPage.tsx` — render `AuthLayout` wrapping `RegisterForm`. Below form: "Already have an account?" with Link to `/login` (FR-021). All text localized.
- [ ] T019 [US2] Update router and remove placeholder in `src/routes/index.tsx` and `src/routes/placeholders.tsx` — import `RegisterPage` from `@/features/auth/RegisterPage`, replace placeholder in router's public routes. Remove `RegisterPage` export from placeholders.tsx.

**Checkpoint**: Both login and registration are fully functional. Users can create accounts and sign in.

---

## Phase 5: User Story 3 — Silent Token Refresh & Session Persistence (Priority: P1)

**Goal**: Authenticated users stay signed in across page reloads. Token refresh happens proactively before expiry and reactively on 401. Loading spinner shown during session check.

**Independent Test**: Sign in → reload page → verify session restored without login redirect. Wait for proactive refresh timer → verify new token is silently obtained. Clear the access token manually → verify next API call triggers reactive refresh.

### Tests for User Story 3

- [ ] T020 [P] [US3] Unit test for auth store in `src/stores/authStore.test.ts` — test cases: initial state has null accessToken and null expiresAt, setAuth stores token and computes correct expiresAt (Date.now() + expiresIn * 1000), clearAuth resets both to null, setAuth overwrites previous values.

### Implementation for User Story 3

- [ ] T021 [P] [US3] Create useProactiveRefresh hook in `src/features/auth/hooks/useProactiveRefresh.ts` — read `expiresAt` from `useAuthStore`. In a `useEffect` keyed on `expiresAt`: if `expiresAt` is null, do nothing; compute `delay = (expiresAt - Date.now()) * 0.8`; if delay <= 0, return (expired); schedule `setTimeout(() => silentRefresh(), delay)`; return cleanup that clears the timeout. Import `silentRefresh` from `@/api/client`.
- [ ] T022 [US3] Update ProtectedRoute in `src/routes/protected-route.tsx` — replace the text "Loading..." with a proper full-screen centered spinner using Lucide `Loader2` icon with `animate-spin` class (FR-012). Ensure three states are clearly handled: `refreshing` (spinner), `idle` with token (Outlet), `failed` (Navigate to /login with `state={{ from: location }}`). Maintain existing logic structure.
- [ ] T023 [US3] Integrate useProactiveRefresh in `src/routes/app-layout.tsx` — call `useProactiveRefresh()` at the top level of the AppLayout component so the timer runs for all authenticated routes. The hook handles its own cleanup.

**Checkpoint**: Full session persistence works. Page reloads restore session. Proactive refresh prevents 401s during normal use.

---

## Phase 6: User Story 4 — Google OAuth Sign-In (Priority: P2)

**Goal**: Users can sign in or register with their Google account via a popup flow. One button handles both login and auto-registration.

**Independent Test**: Click "Sign in with Google" on login page → complete Google auth → verify sign-in and redirect. Click on register page → verify same flow. Cancel popup → verify no error. Use invalid token scenario → verify "Google authentication failed" error.

### Implementation for User Story 4

- [ ] T024 [P] [US4] Create GoogleSignInButton component in `src/features/auth/components/GoogleSignInButton.tsx` — render the `GoogleLogin` component from `@react-oauth/google` with props: `theme="outline"`, `size="large"`, `shape="rectangular"`, `width` matching parent container, `text` controlled by a `variant` prop (`'login'` → `"signin_with"`, `'register'` → `"signup_with"`). `onSuccess` receives `CredentialResponse`; extract `credentialResponse.credential` (JWT ID token), call `googleLogin(credential)` from `@/api/auth`, on API success call `setAuth` and invoke `onSuccess` callback prop. `onError` callback: display "Google authentication failed" (i18n) via a state variable shown as an inline error message. Conditionally render nothing if `import.meta.env.VITE_GOOGLE_CLIENT_ID` is not set — this check is safe as the first line (early `return null`) since `GoogleLogin` is a rendered component, not a hook call. Wrap in a styled container div for earthy-themed spacing. Include a visual separator (horizontal rule with localized "or" text) above the Google button.
- [ ] T025 [US4] Integrate GoogleSignInButton in LoginForm in `src/features/auth/components/LoginForm.tsx` — render `GoogleSignInButton` below the submit button with `variant="login"` and `onSuccess` handler that redirects to `location.state?.from || '/app/notebooks'`. The separator ("or" divider) is rendered internally by GoogleSignInButton.
- [ ] T026 [US4] Integrate GoogleSignInButton in RegisterForm in `src/features/auth/components/RegisterForm.tsx` — render `GoogleSignInButton` below the submit button with `variant="register"` and `onSuccess` handler that redirects to `/app/notebooks`. The separator is rendered internally by GoogleSignInButton.

**Checkpoint**: Google OAuth works on both login and register pages. Auto-creates accounts for new Google users.

---

## Phase 7: User Story 5 — Logout (Priority: P2)

**Goal**: Signed-in users can log out, fully terminating their session on frontend and backend.

**Independent Test**: Sign in → click logout → verify redirect to /login. Try navigating to /app/notebooks → verify redirect to /login. Reload → verify session is gone.

### Implementation for User Story 5

- [ ] T027 [US5] Add logout functionality to AppLayout in `src/routes/app-layout.tsx` — add a minimal top header bar with a logout button (Lucide `LogOut` icon + "Sign out" text, localized). On click: call `rawClient.delete('/auth/logout')` fire-and-forget (don't await — clear state regardless), call `useAuthStore.getState().clearAuth()`, navigate to `/login` using `useNavigate()`. Import `rawClient` from `@/api/raw-client`. Style the header with earthy theme (subtle bottom border, warm background).

**Checkpoint**: Full auth lifecycle works — login, register, session persistence, and logout.

---

## Phase 8: User Story 6 — Rate Limit Handling (Priority: P3)

**Goal**: Users who exceed the rate limit (10 req/min) see a countdown message and cannot resubmit until the window resets.

**Independent Test**: Rapidly submit the login form 10+ times → verify "Too many attempts, try again in X seconds" appears with countdown. Wait for countdown → verify form is submittable again.

### Implementation for User Story 6

- [ ] T028 [P] [US6] Create useRateLimitError hook in `src/features/auth/hooks/useRateLimitError.ts` — exports `{ isLimited, secondsRemaining, handleError }`. `handleError(error: AxiosError)`: checks if `error.response?.status === 429`, parses `Retry-After` header as integer (fallback to 60 if missing/NaN per FR-017), sets `isLimited = true` and starts a `setInterval` countdown decrementing `secondsRemaining` every second. When countdown hits 0: clears interval, sets `isLimited = false`. Cleanup on unmount. Returns boolean for non-429 errors (so caller knows to handle differently).
- [ ] T029 [US6] Integrate rate limit handling in LoginForm in `src/features/auth/components/LoginForm.tsx` — import and call `useRateLimitError()`. In the submit error handler: pass error to `handleError()` first; if it returns false (not 429), handle as existing error logic. When `isLimited` is true: show rate limit message above/below form using i18n key `auth.login.errors.rateLimited` with `{{ seconds: secondsRemaining }}` interpolation, disable submit button and Google sign-in button. Use `aria-live="polite"` for the rate limit message.
- [ ] T030 [US6] Integrate rate limit handling in RegisterForm in `src/features/auth/components/RegisterForm.tsx` — same pattern as T029: import `useRateLimitError`, pass errors, show countdown message using `auth.register.errors.rateLimited`, disable buttons when limited.

**Checkpoint**: All 6 user stories are complete. Full auth feature is functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verify quality across all stories, accessibility compliance, and end-to-end flows.

- [ ] T031 [P] Verify WCAG 2.1 AA compliance across all auth pages — run axe-core audit (via browser extension or vitest-axe in tests) on login and register pages. Check: all form fields have associated labels, error messages have `aria-describedby` links, `aria-live` regions work for dynamic errors/rate limit messages, color contrast ratios meet 4.5:1 for all earthy palette text/background combinations, keyboard tab order is logical, focus indicators are visible on all interactive elements, focus moves to first error on validation failure. Fix any violations found.
- [ ] T032 [P] End-to-end flow verification — manually test all acceptance scenarios from spec.md: login (valid, invalid, empty, email format), register (valid, duplicate email, weak password, mismatch, displayName bounds), Google OAuth (success, cancel, failure), page reload session restore, proactive refresh, logout (redirect, blocked access after), rate limiting (countdown, re-enable), deep link preservation (protected page → login → redirect back), authenticated user on /login → redirect to dashboard. Verify both English and Hungarian translations render correctly.
- [ ] T033 Run quickstart.md validation — follow `specs/002-auth-token-management/quickstart.md` instructions on a clean checkout: verify `pnpm install` succeeds, `pnpm dev` starts, `.env` variables are documented, Google OAuth setup instructions are accurate, test commands work.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
  - T001 first, then T002 and T003 in parallel, then T004
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
  - T005, T006, T007, T008 all in parallel; T009 after T005/T006 (needs translations but can be done in parallel if provider setup doesn't need translations)
- **Phases 3–8 (User Stories)**: All depend on Phase 2 completion
  - P1 stories (US1, US2, US3) can proceed in priority order or in parallel
  - P2 stories (US4, US5) can start after Phase 2 but US4 modifies files from US1/US2
  - P3 story (US6) modifies files from US1/US2
- **Phase 9 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Login)**: Phase 2 only — no other story dependencies. **MVP.**
- **US2 (Registration)**: Phase 2 only — independent of US1 (shares AuthLayout from Phase 2, not from US1)
- **US3 (Refresh)**: Phase 2 only — independent of US1/US2 (works with existing ProtectedRoute/interceptor)
- **US4 (Google OAuth)**: Depends on US1 and US2 being complete (adds GoogleSignInButton to LoginForm and RegisterForm)
- **US5 (Logout)**: Phase 2 only — modifies AppLayout (no dependency on auth pages)
- **US6 (Rate Limit)**: Depends on US1 and US2 being complete (adds rate limit handling to LoginForm and RegisterForm)

### Within Each User Story

- Schema + tests can run in parallel (different files)
- Form component depends on schema
- Page component depends on form component
- Router update depends on page component

### Parallel Opportunities

**Phase 1**: T002 and T003 in parallel after T001
**Phase 2**: T005, T006, T007, T008, T009 all in parallel
**Phase 3 (US1)**: T010 and T011 in parallel, then T012 → T013 → T014
**Phase 4 (US2)**: T015 and T016 in parallel, then T017 → T018 → T019
**Phase 5 (US3)**: T020 and T021 in parallel, T022 in parallel with T020/T021, then T023
**Phase 6 (US4)**: T024 first, then T025 and T026 in parallel
**Phase 8 (US6)**: T028 first, then T029 and T030 in parallel
**Phase 9**: T031, T032, T033 all in parallel

---

## Parallel Example: User Story 1 (Login)

```
# First batch — schema + test in parallel:
T010: Create login Zod schema in src/features/auth/schemas/login-schema.ts
T011: Unit test for login schema in src/features/auth/schemas/login-schema.test.ts

# Second batch — sequential:
T012: Create LoginForm in src/features/auth/components/LoginForm.tsx
T013: Create LoginPage in src/features/auth/LoginPage.tsx
T014: Update router in src/routes/index.tsx
```

## Parallel Example: Foundational Phase

```
# All five tasks in parallel (different files):
T005: Expand en.json translations
T006: Expand hu.json translations
T007: Create AuthLayout component
T008: Create PasswordInput component
T009: Wrap App with GoogleOAuthProvider
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: User Story 1 — Login (5 tasks)
4. **STOP and VALIDATE**: Test login flow independently
5. Deploy/demo if ready — users can sign in

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US1 (Login) → Test → **MVP deployed**
3. Add US2 (Registration) → Test → Users can create accounts
4. Add US3 (Refresh) → Test → Sessions persist across reloads
5. Add US4 (Google OAuth) → Test → Frictionless sign-in option
6. Add US5 (Logout) → Test → Full session lifecycle
7. Add US6 (Rate Limit) → Test → Graceful error handling
8. Polish → WCAG audit, E2E verification

### Recommended Sequential Order

For a single developer, the optimal order is:
**Setup → Foundational → US1 → US2 → US3 → US5 → US4 → US6 → Polish**

Note: US5 (Logout) is moved before US4 (Google OAuth) because logout is simpler and completes the core auth lifecycle before adding OAuth complexity. US4 and US6 both modify LoginForm/RegisterForm, so doing them last avoids merge conflicts.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same batch
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Phase 2
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Auth API functions in `src/api/auth.ts` are fixed once in Phase 1 — all stories use the corrected versions
- The constitution requires tests for Zod schemas and Zustand stores (XII) — test tasks are included accordingly
