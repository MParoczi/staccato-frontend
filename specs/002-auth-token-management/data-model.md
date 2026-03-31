# Data Model: Authentication & Token Management

**Branch**: `002-auth-token-management` | **Date**: 2026-03-30

## API Request/Response Types

### AuthResponse (shared by login, register, google, refresh)

```typescript
interface AuthResponse {
  accessToken: string;   // JWT, HS256, 15-minute lifetime
  expiresIn: number;     // Seconds until expiry (900)
}
```

Returned by: `POST /auth/login` (200), `POST /auth/register` (201), `POST /auth/google` (200), `POST /auth/refresh` (200).

All responses also set/rotate the `staccato_refresh` HttpOnly cookie (not accessible to frontend).

### LoginRequest

```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;   // false → 7d cookie, true → 30d cookie
}
```

### RegisterRequest

```typescript
interface RegisterRequest {
  email: string;
  displayName: string;   // 2–100 chars
  password: string;      // min 8, uppercase + lowercase + digit
}
```

### GoogleAuthRequest

```typescript
interface GoogleAuthRequest {
  idToken: string;       // Google Identity Services credential
}
```

### Refresh / Logout

- `POST /auth/refresh`: No request body. Browser sends `staccato_refresh` cookie automatically.
- `DELETE /auth/logout`: No request body. Browser sends cookie. Returns 204 (no body).

## Error Response Types

### Validation Errors (400)

Field-level errors from FluentValidation. Localized via `Accept-Language` header.

```typescript
interface ValidationErrorResponse {
  errors: Record<string, string[]>;
  // e.g. { "email": ["The email field is required.", "Invalid email format."] }
}
```

### Business Rule Errors

```typescript
interface BusinessErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

Auth-specific error codes:

| HTTP Status | Code | Trigger |
|-------------|------|---------|
| 401 | (no code) | Invalid credentials on login |
| 409 | `EMAIL_ALREADY_REGISTERED` | Email already registered |
| 400 | `INVALID_GOOGLE_TOKEN` | Google ID token validation failed |
| 401 | (no code) | Refresh token expired/invalid |
| 429 | (no code) | Rate limit exceeded (10 req/min/IP) |

### Rate Limit Response (429)

No JSON body. Relevant header:

```
Retry-After: <seconds>
```

## Client State (Zustand Auth Store)

```typescript
interface AuthState {
  accessToken: string | null;
  expiresAt: number | null;       // Date.now() + expiresIn * 1000
  setAuth: (token: string, expiresIn: number) => void;
  clearAuth: () => void;
}
```

State transitions:

```
Initial load:   { accessToken: null, expiresAt: null }
                    │
                    ▼
Silent refresh: POST /auth/refresh
                    │
            ┌───────┴───────┐
            ▼               ▼
         Success         Failure (401)
  { token, expiresAt }  → redirect to /login
                    │
                    ▼
Active session: { accessToken: "eyJ...", expiresAt: 1743350400000 }
                    │
            ┌───────┴───────┐
            ▼               ▼
      Proactive refresh   Logout
      (at 80% lifetime)   DELETE /auth/logout
            │               │
            ▼               ▼
      { new token,     { null, null }
        new expiresAt } → redirect to /login
```

## Zod Validation Schemas

### Login Schema

```typescript
const loginSchema = z.object({
  email: z.string()
    .min(1, "auth.login.errors.emailRequired")
    .email("auth.login.errors.emailInvalid"),
  password: z.string()
    .min(1, "auth.login.errors.passwordRequired")
    .min(8, "auth.login.errors.passwordMin"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

### Register Schema

```typescript
const registerSchema = z.object({
  email: z.string()
    .min(1, "auth.register.errors.emailRequired")
    .email("auth.register.errors.emailInvalid")
    .max(256, "auth.register.errors.emailMax"),
  displayName: z.string()
    .min(2, "auth.register.errors.displayNameMin")
    .max(100, "auth.register.errors.displayNameMax"),
  password: z.string()
    .min(8, "auth.register.errors.passwordMin")
    .regex(/[A-Z]/, "auth.register.errors.passwordUppercase")
    .regex(/[a-z]/, "auth.register.errors.passwordLowercase")
    .regex(/\d/, "auth.register.errors.passwordDigit"),
  confirmPassword: z.string()
    .min(1, "auth.register.errors.confirmPasswordRequired"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "auth.register.errors.passwordsMismatch",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;
```

Note: Validation error message keys are i18n translation keys. The Zod validation runs client-side. Server-side validation errors (400 with `errors` object) are mapped back to form fields via React Hook Form's `setError`.

## Entity Relationships

```
User (backend-managed)
  ├── has one AccessToken (frontend memory, 15 min)
  ├── has one RefreshToken (HttpOnly cookie, 7d or 30d)
  └── identified by: email (local) or Google account (OAuth)

AuthResponse
  └── accessToken + expiresIn → stored in AuthState via setAuth()

LoginRequest → POST /auth/login → AuthResponse
RegisterRequest → POST /auth/register → AuthResponse
GoogleAuthRequest → POST /auth/google → AuthResponse
(cookie) → POST /auth/refresh → AuthResponse
(cookie) → DELETE /auth/logout → 204
```

## i18n Key Structure

```
auth.
  login.
    title              "Sign in to Staccato"
    subtitle           "Welcome back"
    email              "Email address"
    password           "Password"
    rememberMe         "Remember me"
    submit             "Sign in"
    noAccount          "Don't have an account?"
    registerLink       "Create one"
    googleButton       "Sign in with Google"
    errors.
      emailRequired    "Email is required"
      emailInvalid     "Enter a valid email address"
      passwordMin      "Password must be at least 8 characters"
      invalidCredentials "Invalid email or password"
      googleFailed     "Google authentication failed"
      rateLimited      "Too many attempts, try again in {{seconds}} seconds"
      networkError     "Unable to connect. Please check your connection."
      passwordRequired "Password is required"
      genericError     "Something went wrong. Please try again."
  register.
    title              "Create your account"
    subtitle           "Start your musical journey"
    email              "Email address"
    displayName        "Display name"
    password           "Password"
    confirmPassword    "Confirm password"
    submit             "Create account"
    hasAccount         "Already have an account?"
    loginLink          "Sign in"
    googleButton       "Sign up with Google"
    errors.
      emailRequired    "Email is required"
      emailInvalid     "Enter a valid email address"
      emailMax         "Email must be 256 characters or fewer"
      displayNameMin   "Display name must be at least 2 characters"
      displayNameMax   "Display name must be 100 characters or fewer"
      passwordMin      "Password must be at least 8 characters"
      passwordUppercase "Must contain at least one uppercase letter"
      passwordLowercase "Must contain at least one lowercase letter"
      passwordDigit    "Must contain at least one number"
      confirmPasswordRequired "Please confirm your password"
      passwordsMismatch "Passwords do not match"
      emailTaken       "Email already registered"
      googleFailed     "Google authentication failed"
      rateLimited      "Too many attempts, try again in {{seconds}} seconds"
      networkError     "Unable to connect. Please check your connection."
      genericError     "Something went wrong. Please try again."
  common.
    or                 "or"
```
