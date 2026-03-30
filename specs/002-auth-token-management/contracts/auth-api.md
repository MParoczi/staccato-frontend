# API Contract: Authentication Endpoints

**Branch**: `002-auth-token-management` | **Date**: 2026-03-30
**Source**: STACCATO_FRONTEND_DOCUMENTATION.md Section 8.1

This document defines the exact API contract the frontend consumes. All endpoints are under the base URL from `VITE_API_BASE_URL`.

## Common Behavior

- **Rate limiting**: All `/auth/*` endpoints — 10 requests per minute per IP. Returns HTTP 429 with `Retry-After` header (seconds).
- **Credentials**: All requests use `withCredentials: true` to send/receive the `staccato_refresh` HttpOnly cookie.
- **Localization**: Frontend sends `Accept-Language: en|hu` header. Backend localizes validation error messages accordingly.

---

## POST /auth/register

Create a new local account.

**Request**:
```json
{
  "email": "user@example.com",
  "displayName": "John Doe",
  "password": "SecurePassword123!"
}
```

**Validation** (server-enforced, mirrored client-side):
- `email`: required, valid email format, max 256 chars
- `displayName`: required, 2–100 chars
- `password`: required, min 8 chars, must contain uppercase + lowercase + digit

**Response 201**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```
+ Sets `staccato_refresh` HttpOnly cookie.

**Error 400** (validation):
```json
{
  "errors": {
    "email": ["The email field is required."],
    "password": ["Password must be at least 8 characters."]
  }
}
```

**Error 409** (duplicate email):
```json
{
  "code": "EMAIL_ALREADY_REGISTERED",
  "message": "Email already registered"
}
```

**Error 429**: No body. Header: `Retry-After: <seconds>`.

---

## POST /auth/login

Authenticate with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": false
}
```

**Response 200**:
```json
{
  "accessToken": "...",
  "expiresIn": 900
}
```
+ Sets `staccato_refresh` HttpOnly cookie (7d default, 30d if `rememberMe: true`).

**Error 401**: Invalid credentials. No structured body — use generic "Invalid email or password" message.

**Error 429**: No body. Header: `Retry-After: <seconds>`.

---

## POST /auth/google

Authenticate with a Google ID token. Auto-creates account if not exists.

**Request**:
```json
{
  "idToken": "google-id-token-from-frontend"
}
```

**Response 200**:
```json
{
  "accessToken": "...",
  "expiresIn": 900
}
```
+ Sets `staccato_refresh` HttpOnly cookie.

**Error 400**:
```json
{
  "code": "INVALID_GOOGLE_TOKEN",
  "message": "Google authentication failed"
}
```

**Error 429**: No body. Header: `Retry-After: <seconds>`.

---

## POST /auth/refresh

Silent token refresh. No request body — browser sends `staccato_refresh` cookie automatically.

**Response 200**:
```json
{
  "accessToken": "...",
  "expiresIn": 900
}
```
+ Rotates `staccato_refresh` cookie (new token, same expiry policy).

**Error 401**: Refresh token missing, invalid, or expired. Frontend must redirect to `/login`.

---

## DELETE /auth/logout

End the session. No request body — browser sends `staccato_refresh` cookie.

**Response 204**: No body. Cookie cleared.

Frontend behavior: Clear auth store, redirect to `/login`. Fire-and-forget — clear local state regardless of API response.

---

## JWT Access Token Claims

The access token (JWT, HS256) contains:

| Claim | Type | Description |
|-------|------|-------------|
| `userId` | string (UUID) | User's unique identifier |
| `email` | string | User's email address |
| `displayName` | string | User's display name |

The frontend does not need to decode the JWT. It is stored opaquely and sent as `Authorization: Bearer <token>`.
