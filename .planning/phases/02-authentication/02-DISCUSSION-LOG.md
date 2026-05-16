# Phase 2: Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 2-Authentication
**Areas discussed:** Auth page layout, Form validation & errors, Google OAuth placement, Proactive refresh hook

---

## Auth page layout

### Overall page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card | Single card centered on screen with a subtle background. Matches shadcn radix-nova aesthetic. | ✓ |
| Split-screen | Left branding/illustration, right form. Needs an illustration asset. | |
| Full-page form | Form fills most of viewport, no card container. | |

**User's choice:** Centered card

---

### Logo / header treatment

| Option | Description | Selected |
|--------|-------------|----------|
| App name as text header | "Staccato" as a styled heading above the card title. No image asset needed. | ✓ |
| Logo image + app name | Requires a logo SVG/PNG asset. | |
| No logo — form starts immediately | Just the i18n page title. | |

**User's choice:** App name as text header

---

### Background behind the card

| Option | Description | Selected |
|--------|-------------|----------|
| Plain --background color | The shadcn background token, no extra styling. | |
| Subtle dotted-paper texture | Very faint dot pattern behind the card. Reinforces notebook identity. | ✓ |
| Gradient or decorative background | Soft gradient or branded color wash. | |

**User's choice:** Subtle dotted-paper texture
**Notes:** CSS-only implementation (radial-gradient). Not the canvas grid logic from Phase 6.

---

### Component structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two independent page components | LoginPage.tsx and RegisterPage.tsx stay separate. | ✓ |
| Shared AuthPage with a mode prop | One component, mode prop switches the form. | |
| You decide | Leave to planner. | |

**User's choice:** Two independent page components

---

## Form validation & errors

### When validation triggers

| Option | Description | Selected |
|--------|-------------|----------|
| On submit only | Validate all fields on submit. react-hook-form mode: 'onSubmit'. | |
| On blur (field-by-field) | Validate each field when the user leaves it. mode: 'onBlur'. | ✓ |
| Real-time as user types | Validate on every keystroke. mode: 'onChange'. | |

**User's choice:** On blur (field-by-field)

---

### Server error display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline below the relevant field | Uses setError() — consistent with client-side validation. | |
| Sonner toast notification | Non-blocking popup at bottom of screen. Sonner already installed. | ✓ |
| Form-level error banner above the submit button | Red alert box above the button. | |

**User's choice:** Sonner toast notification

---

### Validation library

| Option | Description | Selected |
|--------|-------------|----------|
| Zod | Already used in Phase 1 (src/env.ts). Consistent with project. | ✓ |
| react-hook-form native validation | Built-in validate functions, no extra library. | |

**User's choice:** Zod

---

### Password validation rules (Register)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum 8 characters only | Simple rule. Backend validates too. | ✓ |
| 8+ chars with complexity | Uppercase, number, symbol required. Needs strength meter. | |
| You decide / match backend rules | Defer to backend spec. | |

**User's choice:** Minimum 8 characters only

---

## Google OAuth placement

### Placement on the page

| Option | Description | Selected |
|--------|-------------|----------|
| Google button above the form with 'or' separator | Faster option first. Matches GitHub, Linear, Notion pattern. | ✓ |
| Google button below the form with 'or' separator | Email-first flow. | |
| Google button only on login, not register | Conflicts with AUTH-03 (Google can create accounts too). | |

**User's choice:** Google button above the form with 'or' separator

---

### @react-oauth/google component

| Option | Description | Selected |
|--------|-------------|----------|
| GoogleLogin component | Google's styled button, handles credential flow internally. | ✓ |
| useGoogleLogin hook + custom button | Full styling control, button matches shadcn design. | |
| Google One Tap | Popup over the page. More aggressive UX. | |

**User's choice:** GoogleLogin component

---

### GoogleOAuthProvider placement

| Option | Description | Selected |
|--------|-------------|----------|
| In main.tsx, wrapping the whole app | Alongside QueryClientProvider. VITE_GOOGLE_CLIENT_ID env var. | ✓ |
| In the auth feature, wrapping only auth pages | Narrower scope, more complexity. | |
| You decide | Leave to planner. | |

**User's choice:** In main.tsx, wrapping the whole app

---

## Proactive refresh hook

### Refresh scheduling strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Parse JWT expiry + schedule at expiry − 60s | Decode with atob, read exp claim, setTimeout. Dynamically accurate. | ✓ |
| Fixed interval (e.g. every 4 minutes) | setInterval, simpler but slightly wasteful. | |
| You decide | Leave to planner. | |

**User's choice:** Parse JWT expiry + schedule at expiry − 60s

---

### Mount location

| Option | Description | Selected |
|--------|-------------|----------|
| Inside ProtectedRoute | Only runs when authenticated. Natural lifecycle. | ✓ |
| In App root / main.tsx | Always mounted, needs status check inside. | |
| In a top-level AuthProvider wrapper | Adds abstraction for no real benefit here. | |

**User's choice:** Inside ProtectedRoute

---

### Store update on successful refresh

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — call setAuth(user, newToken) | Store always has current token. Consistent with boot refresh. | ✓ |
| Yes, but only update accessToken | Needs a new setToken() action. | |
| You decide | Leave to planner. | |

**User's choice:** Yes — call setAuth(user, newToken)

---

## Claude's Discretion

- Internal layout of `src/features/auth/` (components, hooks, types subdirectories)
- Whether auth API calls use TanStack Query mutations or plain async functions
- Exact API request/response shapes (researcher confirms from backend spec)
- `displayName` max length on Register (researcher confirms from backend spec)
- ERR-03 retry behavior for auth mutations (QueryClient handles queries; mutations may need their own retry)
- ERR-04 coverage verification (already implemented in client.ts; planner confirms)
- I18N-03 key additions (auth namespace already has core strings; planner adds missing validation messages)

## Deferred Ideas

None — discussion stayed within phase scope.
