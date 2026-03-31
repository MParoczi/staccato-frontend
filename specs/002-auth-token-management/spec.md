# Feature Specification: Authentication & Token Management

**Feature Branch**: `002-auth-token-management`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Implement the complete authentication flow for Staccato: local registration, local login, Google OAuth login, silent token refresh, and logout."

## Clarifications

### Session 2026-03-30

- Q: Which adjacent auth features are explicitly out of scope? → A: Password reset, email verification, 2FA, and additional OAuth providers (e.g., Apple, GitHub) are all out of scope for this feature.
- Q: What level of accessibility compliance is expected for auth pages? → A: WCAG 2.1 AA compliance: keyboard navigation, screen reader support, sufficient contrast, focus management.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Local Login (Priority: P1)

A returning user navigates to the login page, enters their email and password, optionally checks "Remember me", and signs in. On success, they are redirected to their notebooks dashboard and can begin working immediately. If credentials are wrong, they see a clear error message and can retry.

**Why this priority**: Login is the primary entry point for the majority of users. Without login, no authenticated functionality is accessible. This is the most frequent auth interaction and the first impression for returning users.

**Independent Test**: Can be fully tested by navigating to /login, entering valid credentials, and verifying redirection to the notebooks dashboard. Invalid credentials can be tested by entering wrong email/password and verifying the error message appears.

**Acceptance Scenarios**:

1. **Given** a registered user on the login page, **When** they enter valid email and password and submit, **Then** they are authenticated and redirected to the notebooks dashboard.
2. **Given** a registered user on the login page, **When** they enter valid credentials with "Remember me" checked, **Then** they are authenticated and their session persists for an extended duration (30 days instead of 7 days).
3. **Given** a user on the login page, **When** they enter an invalid email or wrong password, **Then** they see the message "Invalid email or password" and remain on the login page.
4. **Given** a user on the login page, **When** they submit the form with an empty email or password, **Then** they see inline validation errors indicating which fields are required.
5. **Given** a user on the login page, **When** they enter an email in an invalid format, **Then** they see an inline validation error before the form is submitted.
6. **Given** a user who was redirected to /login from a protected page (e.g., /app/notebooks/123), **When** they successfully sign in, **Then** they are redirected back to the originally requested page instead of the default dashboard.

---

### User Story 2 - Local Registration (Priority: P1)

A new user navigates to the registration page, fills in their email, display name, password, and password confirmation. On success, they are automatically signed in and redirected to the notebooks dashboard without needing to log in separately.

**Why this priority**: Registration is equally critical as login. Without account creation, no user can access the platform. It is the first touchpoint for new users and sets the tone for the product experience.

**Independent Test**: Can be fully tested by navigating to /register, filling in valid details, and verifying automatic sign-in and redirection to the notebooks dashboard.

**Acceptance Scenarios**:

1. **Given** a new user on the registration page, **When** they fill in a valid email, display name, password, and matching password confirmation and submit, **Then** their account is created, they are automatically signed in, and redirected to the notebooks dashboard.
2. **Given** a user on the registration page, **When** they enter an email that is already registered, **Then** they see the message "Email already registered" and can correct their input.
3. **Given** a user on the registration page, **When** they enter a password that does not meet requirements (fewer than 8 characters, missing uppercase, lowercase, or digit), **Then** they see specific inline validation messages indicating what is missing.
4. **Given** a user on the registration page, **When** the password and confirm password fields do not match, **Then** they see an inline error indicating the passwords must match.
5. **Given** a user on the registration page, **When** they enter a display name shorter than 2 characters or longer than 100 characters, **Then** they see an inline validation error.

---

### User Story 3 - Silent Token Refresh & Session Persistence (Priority: P1)

A signed-in user reloads the page or returns after closing the browser. The system silently restores their session without requiring them to log in again (as long as their session has not expired). During the brief check, a loading indicator is shown so the user knows the app is working.

**Why this priority**: Without silent refresh, every page reload would log the user out, making the product unusable. This is a foundational behavior that underpins all authenticated experiences.

**Independent Test**: Can be tested by signing in, reloading the page, and verifying the user remains authenticated without seeing the login page. Can also be tested by waiting for the access token to expire and verifying the next action succeeds transparently.

**Acceptance Scenarios**:

1. **Given** a user who was previously signed in, **When** they reload the page, **Then** the system silently restores their session and they see their authenticated content (e.g., notebooks dashboard).
2. **Given** a user who was previously signed in, **When** they reload the page and a loading indicator appears, **Then** the indicator is dismissed once authentication status is determined (either restored or redirected).
3. **Given** a user whose access token has expired during active use, **When** they perform an action (e.g., load notebooks), **Then** the system silently refreshes the token and completes the action without interruption.
4. **Given** a user whose session has fully expired (refresh token expired), **When** they reload the page, **Then** they are redirected to the login page.

---

### User Story 4 - Google OAuth Sign-In (Priority: P2)

A user clicks "Sign in with Google" (available on both the login and registration pages). Google's sign-in flow opens, the user authenticates with their Google account, and they are signed into Staccato and redirected to the notebooks dashboard. If the user does not yet have a Staccato account, one is automatically created.

**Why this priority**: Google OAuth provides a frictionless onboarding path and is increasingly expected by users. However, the platform is fully functional with email/password alone, making this an important but secondary capability.

**Independent Test**: Can be tested by clicking "Sign in with Google" on either page, completing Google's authentication, and verifying successful sign-in and redirection. Account auto-creation can be tested by using a Google account that has no existing Staccato account.

**Acceptance Scenarios**:

1. **Given** a user on the login page, **When** they click "Sign in with Google" and successfully authenticate with Google, **Then** they are signed into Staccato and redirected to the notebooks dashboard.
2. **Given** a user on the registration page, **When** they click "Sign up with Google" and successfully authenticate with Google, **Then** a Staccato account is created, they are signed in, and redirected to the notebooks dashboard.
3. **Given** a user on the login or registration page, **When** they click the Google sign-in button but cancel or dismiss the Google popup, **Then** they remain on the current page with no error.
4. **Given** a user on the login or registration page, **When** Google authentication fails (e.g., invalid token), **Then** they see the message "Google authentication failed" and can retry.

---

### User Story 5 - Logout (Priority: P2)

A signed-in user clicks the logout action. Their session is ended on both the frontend and backend, and they are redirected to the login page.

**Why this priority**: Logout is essential for shared-device scenarios and user trust. However, it is a simple, low-risk flow that can be developed after the core sign-in paths are in place.

**Independent Test**: Can be tested by signing in, clicking logout, and verifying redirection to the login page. Subsequent attempts to access authenticated content should also redirect to login.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they click the logout action, **Then** their session is ended and they are redirected to the login page.
2. **Given** a user who has just logged out, **When** they attempt to navigate to a protected page directly, **Then** they are redirected to the login page.
3. **Given** a user who has just logged out, **When** they reload the page, **Then** silent refresh fails and they remain on the login page (session is fully terminated).

---

### User Story 6 - Rate Limit Handling (Priority: P3)

A user who submits too many authentication requests in rapid succession (e.g., repeated failed logins) sees a user-friendly message telling them to slow down and wait before retrying, rather than a confusing error.

**Why this priority**: Rate limiting is a backend-enforced safety measure. Graceful handling is important for user experience but does not block core functionality.

**Independent Test**: Can be tested by triggering rate limiting (e.g., submitting the login form rapidly) and verifying the "Too many attempts" message appears with the retry wait time.

**Acceptance Scenarios**:

1. **Given** a user on the login page, **When** they exceed the rate limit (10 requests per minute), **Then** they see a message "Too many attempts, try again in X seconds" where X is the remaining wait time.
2. **Given** a user who is rate-limited, **When** the wait period expires, **Then** they can submit the form again successfully.
3. **Given** a user on the registration page, **When** they exceed the rate limit, **Then** they see the same rate limit message.

---

### Edge Cases

- What happens when a user has multiple browser tabs open and logs out from one tab? The other tabs should redirect to login on the next server interaction (401 response triggers redirect).
- What happens when the backend is unreachable during login or registration? The user should see a connection error message rather than an empty or broken page.
- What happens if a user navigates directly to /login while already authenticated? They should be redirected to the notebooks dashboard.
- What happens if the Google OAuth popup is blocked by the browser? The `GoogleLogin` component from Google's Identity Services SDK handles popup management internally; no additional frontend handling is required.
- What happens when a user with a scheduled account deletion signs in? They should be allowed to sign in normally (this is handled by the profile/settings feature, not auth).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to sign in with a registered email address and password.
- **FR-002**: System MUST allow new users to create an account with email, display name, and password.
- **FR-003**: System MUST validate registration input: email (required, valid format, max 256 characters), display name (required, 2-100 characters), password (required, min 8 characters, must contain at least one uppercase letter, one lowercase letter, and one digit).
- **FR-004**: System MUST validate login input: email (required, valid format), password (required, min 8 characters).
- **FR-005**: Registration form MUST include a confirm password field that validates passwords match before submission.
- **FR-006**: System MUST allow users to sign in or register using their Google account.
- **FR-007**: Google sign-in MUST automatically create a Staccato account if one does not exist for the Google user.
- **FR-008**: Login form MUST include a "Remember me" option (unchecked by default) that controls session persistence duration (7 days standard, 30 days when enabled).
- **FR-009**: System MUST silently restore the user's session on page load or reload without requiring re-authentication, as long as the session has not expired.
- **FR-010**: System MUST transparently refresh the access token when it expires during active use, without interrupting the user's workflow.
- **FR-011**: System MUST redirect the user to the login page when session restoration or token refresh fails.
- **FR-012**: System MUST show a loading indicator while session restoration is in progress on page load.
- **FR-013**: System MUST allow signed-in users to log out, fully terminating their session on both the frontend and backend.
- **FR-014**: System MUST store the access token in memory only (never in persistent browser storage) to prevent exposure to cross-site scripting attacks.
- **FR-015**: System MUST display inline validation errors below form fields before submission for client-detectable issues (format, length, required fields).
- **FR-016**: System MUST display appropriate error messages for server-returned errors: "Invalid email or password" (invalid credentials), "Email already registered" (duplicate registration), "Google authentication failed" (OAuth failure), and a generic "Something went wrong" for unexpected server errors (500/502/503).
- **FR-017**: System MUST handle rate limiting gracefully by displaying "Too many attempts, try again in X seconds" using the server-provided retry delay. If the retry delay is unavailable, the system MUST fall back to a 60-second default.
- **FR-018**: System MUST redirect already-authenticated users away from login/register pages to the notebooks dashboard.
- **FR-019**: All user-facing text on authentication pages MUST be localized (English and Hungarian).
- **FR-020**: Authentication pages MUST present a premium, polished visual design with an earthy color palette (cream backgrounds, warm brown accents), generous whitespace, and smooth micro-animations (focus states, error animations, loading indicators).
- **FR-021**: Login and registration pages MUST include navigation links between each other (login links to register, register links to login).
- **FR-022**: Authentication pages MUST meet WCAG 2.1 AA compliance: all interactive elements must be keyboard-navigable, form fields must have associated labels accessible to screen readers, inline error messages must be announced to assistive technology, and color contrast ratios must meet the 4.5:1 minimum for text.
- **FR-023**: Authentication pages MUST provide visible focus indicators on all interactive elements and manage focus appropriately (e.g., moving focus to the first error field on validation failure, managing focus during loading states).
- **FR-024**: Login and registration forms MUST show a loading state on the submit button during API calls (disabled state with a loading indicator) to prevent double submission and provide feedback.
- **FR-025**: Password fields MUST include a show/hide visibility toggle so users can verify their input.
- **FR-026**: System MUST display a connection error message (e.g., "Unable to connect. Please check your connection.") when the backend is unreachable during authentication operations.
- **FR-027**: After re-authentication (login, register, or Google sign-in), the system MUST redirect the user to their originally requested URL if one was captured before the redirect to /login. If no prior URL exists, redirect to the notebooks dashboard.

### Out of Scope

- Password reset / "Forgot password?" flow
- Email verification after registration
- Two-factor authentication (2FA)
- Additional OAuth providers beyond Google (e.g., Apple, GitHub, Facebook)

### Key Entities

- **User Session**: Represents an authenticated user's active session, consisting of a short-lived access credential (in memory) and a long-lived session cookie (managed by the backend). The session has a configurable persistence duration controlled by the "Remember me" preference.
- **Authentication Credentials**: The set of information a user provides to identify themselves: email + password (local), or Google account identity (OAuth). Registration additionally requires a display name and password confirmation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the registration flow (from landing on the page to reaching the notebooks dashboard) in under 60 seconds.
- **SC-002**: Users can complete the login flow (from landing on the page to reaching the notebooks dashboard) in under 15 seconds.
- **SC-003**: 95% of page reloads for authenticated users restore the session without requiring re-login.
- **SC-004**: Token refresh during active use succeeds transparently, adding no more than 500ms latency to the user's action.
- **SC-005**: All form validation errors are displayed inline within 200 milliseconds of the triggering interaction (blur or submit).
- **SC-006**: Authentication pages render correctly and are fully functional across modern desktop and mobile browsers.
- **SC-007**: All user-facing strings are available in both English and Hungarian with no hardcoded text.
- **SC-008**: Rate-limited users see a clear, actionable message with the exact wait time remaining.
- **SC-009**: Google OAuth sign-in works for both new and existing users without requiring additional steps beyond Google authentication.
- **SC-010**: Authentication pages convey a premium, polished visual impression consistent with the application's earthy design language.
- **SC-011**: Authentication pages pass WCAG 2.1 AA automated checks (keyboard navigation, screen reader compatibility, color contrast ratios) with no critical violations.

## Assumptions

- Users access the application via modern web browsers (Chrome, Firefox, Safari, Edge) with cookies and JavaScript enabled.
- The backend authentication endpoints described in the feature description are implemented and operational.
- Google OAuth Client ID is configured as an environment variable and Google's Identity Services are available.
- The application already has routing infrastructure (protected routes, public routes) from the project setup phase.
- Email verification is not required for local registration (users can sign in immediately after registering).
- The backend handles password hashing; the frontend sends plaintext passwords over HTTPS.
- The backend localizes its error messages based on the Accept-Language header; the frontend sets this header appropriately.
- Session management across multiple tabs is handled at the network level (401 responses trigger re-authentication) rather than requiring cross-tab synchronization.
- The "earthy palette" design direction (cream, warm brown, subtle shadows) is established in the project's design system and can be applied via existing theming infrastructure.
- The backend enforces CSRF protection via SameSite=Strict cookie attributes; the frontend does not need additional CSRF mitigation.
- The Google sign-in button is conditionally rendered only when the VITE_GOOGLE_CLIENT_ID environment variable is configured. If absent, Google sign-in is unavailable but local authentication works normally.
