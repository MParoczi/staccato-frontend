---
status: testing
phase: 02-authentication
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:01:00Z
startup_note: "@hookform/resolvers 5.2.2 imported zod/v4/core at module level; incompatible with installed zod 3.24.4. Downgraded resolver to 3.10.0. Server now starts clean."
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

## Current Test

[testing complete]

## Tests

### 1. Login Page Layout
expected: Navigate to /login. You see a centered card with the "Staccato" heading at the top, a Google Sign-In button, a horizontal "or" divider (two lines flanking the word "or"), then email and password inputs, a "Remember Me" checkbox, and a submit button. The page background shows a subtle dotted pattern (not a solid color).
result: pass

### 2. Register Page Layout
expected: Navigate to /register. You see a centered card with the "Staccato" heading, a Google Sign-In button, an "or" divider, then Display Name, Email, and Password input fields, and a submit button. Background shows the same dotted pattern.
result: pass

### 3. Navigation Links Between Pages
expected: On the login page, click the link to register — you navigate to /register. On the register page, click the link to log in — you navigate to /login. Both use React Router (no full page reload).
result: pass

### 4. Login Form — Blur Validation
expected: On the login page, click into the email field then immediately click elsewhere without typing. An error message appears under the email field. Enter "notanemail" and tab out — a validation error appears. Errors show only after leaving the field (onBlur), not while typing.
result: pass

### 5. Register Form — Blur Validation
expected: On the register page, enter a password shorter than 8 characters and tab out — a "minimum 8 characters" error appears. Enter a display name longer than 50 characters and tab out — a "maximum 50 characters" error appears. Errors appear on blur, not while typing.
result: pass

### 6. Remember Me Checkbox
expected: On the login page, a "Remember Me" checkbox is visible. It can be checked and unchecked. It is included in the form's data (visible in the UI as a labeled checkbox).
result: pass

### 7. Already-Authenticated Redirect
expected: When you are already logged in (authenticated state in the app) and try to navigate to /login or /register, you are automatically redirected away — to the notebooks page or dashboard. You cannot reach the login/register forms while authenticated.
result: pass

### 8. Login Error Toast
expected: On the login page, enter an email and password that don't match any account, then submit. A toast notification appears (a pop-up notification, not an inline form error) with an error message about invalid credentials. The form stays on the page.
result: pass

### 9. Register Error — Email Taken Toast
expected: On the register page, try to register with an email address already in use, then submit. A toast notification appears saying the email is already taken. The form stays on the page.
result: pass

### 10. Logout
expected: While logged in and on the notebooks page, a logout button is visible. Clicking it clears your session and redirects you to the login page. You cannot navigate back to the notebooks page without logging in again.
result: issue
reported: "On pressing the Sign out button it redirects me to the /login page. However I can go back to the app/notebooks page without logging in again"
severity: major

## Summary

total: 10
passed: 9
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "After logout, navigating to /app/notebooks redirects to /login — auth state is fully cleared"
  status: failed
  reason: "User reported: On pressing the Sign out button it redirects me to the /login page. However I can go back to the app/notebooks page without logging in again"
  severity: major
  test: 10
  root_cause: "POST /auth/logout does not invalidate the httpOnly refresh token cookie server-side. On full page reload, main.tsx fires /auth/refresh with the still-valid cookie, backend returns a new token, setAuth() is called and the user is silently re-authenticated. Secondary: handleLogout has no explicit navigate() call — relies on ProtectedRoute detecting unauthenticated state, which only holds within the SPA session."
  artifacts:
    - path: "src/pages/NotebooksPage.tsx"
      issue: "handleLogout has no explicit navigate('/login') after clearAuth()"
    - path: "src/main.tsx"
      issue: "/auth/refresh call re-authenticates user on every page load if cookie is still valid"
  missing:
    - "Backend: POST /auth/logout must clear the httpOnly refresh token cookie"
    - "Frontend: add navigate('/login') explicitly in handleLogout after clearAuth()"
  debug_session: ""
