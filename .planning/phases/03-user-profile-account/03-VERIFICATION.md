---
phase: 3
phase_name: User Profile & Account
milestone: v0.3
status: passed
verified_at: 2026-05-16
commits: 2c904b4–382246b
---

# Phase 3 Verification — User Profile & Account

## Goal

Persistent AppLayout with navbar; users can manage their profile, upload an avatar, and exercise the 30-day account deletion grace period.

## Requirements Addressed

- **USER-01** — Avatar upload (JPG/PNG/WebP ≤ 2 MB) with immediate navbar reflection ✓
- **USER-02** — Profile edit: firstName, lastName, language, defaultPageSize, defaultInstrumentId ✓
- **USER-03** — Language change updates UI locale immediately ✓
- **USER-04** — Account deletion request + 30-day grace period; cancel deletion ✓
- **NAV-01** — Persistent AppLayout + Navbar on all /app/* routes ✓

## Success Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Navbar renders with avatar (image or initials fallback); dropdown shows "My Profile" and "Sign out" | ✓ Pass |
| 2 | User can view and update profile; updated values persist after page reload; language change updates locale immediately | ✓ Pass |
| 3 | User can upload custom avatar (JPG/PNG/WebP ≤ 2 MB) and see it in navbar; local users see initials | ✓ Pass |
| 4 | User can request account deletion; deletion-pending warning banner appears with scheduled date | ✓ Pass |
| 5 | User can cancel scheduled account deletion; banner disappears and success toast confirms | ✓ Pass |

## UAT Results

**13/13 tests passed** — see `03-UAT.md`

| Test | Result |
|------|--------|
| 1. Navbar visible on app pages (avatar initials) | ✓ Pass |
| 2. Avatar dropdown opens | ✓ Pass |
| 3. My Profile navigation | ✓ Pass |
| 4. Sign out | ✓ Pass |
| 5. Profile page loads | ✓ Pass |
| 6. Avatar upload with loading spinner | ✓ Pass |
| 7. Avatar 2 MB size limit | ✓ Pass |
| 8. Profile form save (firstName, lastName) | ✓ Pass |
| 9. Language preference save | ✓ Pass |
| 10. Default page size preference save | ✓ Pass |
| 11. Default instrument preference save | ✓ Pass |
| 12. Account deletion dialog | ✓ Pass |
| 13. Scheduled deletion banner + cancel | ✓ Pass |

## Key Files Delivered

| File | Description |
|------|-------------|
| `src/components/AppLayout.tsx` | Persistent layout wrapper for /app/* |
| `src/components/Navbar.tsx` | Sticky header with avatar dropdown |
| `src/pages/ProfilePage.tsx` | Full profile edit page (USER-01–04) |
| `src/features/profile/api/profileApi.ts` | Profile API layer (getMe, updateMe, uploadAvatar, requestDeletion, cancelDeletion, getInstruments) |
| `src/types/index.ts` | UserProfile shape reconciled with backend UserResponse |
| `src/stores/authStore.ts` | Added updateUser action |
| `src/router.tsx` | AppLayout nested layout + /app/profile route |

## Constraint Compliance

- No `enum` — `as const` / `z.enum` used throughout ✓
- `import type` for all type-only imports ✓
- No `window.location.href` — React Router navigation only ✓
- No `dangerouslySetInnerHTML` ✓
- Auth token in Zustand memory only — no localStorage/sessionStorage ✓
- Single Axios instance (`src/api/client.ts`) — no ad-hoc `axios.create` ✓
- Lucide React icons only ✓
- No cross-feature sibling imports ✓
- `pnpm tsc --noEmit` exits 0 ✓

## Shipped

Branching strategy: `none` — committed directly to `main` (commits 2c904b4–382246b).
