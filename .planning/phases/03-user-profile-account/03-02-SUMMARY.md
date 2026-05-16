# Phase 03 — Plan 02 SUMMARY: NAV-01 AppLayout + Navbar

## Objective

Deliver NAV-01: create the persistent AppLayout + Navbar and wire them into the router as a nested layout wrapping all /app/* routes.

## What Was Done

### Task 1 — Locale strings (en + hu)
- Added `"navbar"` object to `public/locales/en/common.json` with `myProfile` and `signOut` keys
- Added matching `"navbar"` stub object to `public/locales/hu/common.json` with `__HU_TODO__` values
- All existing keys preserved in both files

### Task 2 — Navbar component
- Created `src/components/Navbar.tsx`
- Sticky header (`h-14`, `z-50`, `border-b`, `bg-background`) with app name on the left and avatar dropdown on the right
- Avatar uses `size="default"` prop (confirmed supported by the actual avatar.tsx)
- Dropdown menu shows "My Profile" (navigates to `/app/profile`) and "Sign out" (calls `logout()` API, clears auth, navigates to `/login`)
- Uses `useAuthStore` for user state and `clearAuth`; uses `useNavigate` from react-router (no `window.location`)
- `getInitials` helper handles first+last name or displayName fallback
- All icons from Lucide React (`LogOut`, `User`)

### Task 3 — AppLayout component
- Created `src/components/AppLayout.tsx`
- Renders `<Navbar />` at top, then `<Outlet />` inside a `<main>` that fills remaining height

### Task 4 — Router update
- Updated `src/router.tsx` to nest `<AppLayout />` as a pathless layout route inside the `ProtectedRoute` children
- `ProtectedRoute` remains unchanged and continues to guard the `/app` subtree
- All existing routes preserved

## Files Modified

| File | Action |
|------|--------|
| `public/locales/en/common.json` | Added `navbar.myProfile` and `navbar.signOut` |
| `public/locales/hu/common.json` | Added `navbar.myProfile` and `navbar.signOut` stubs |
| `src/components/Navbar.tsx` | Created (new file) |
| `src/components/AppLayout.tsx` | Created (new file) |
| `src/router.tsx` | Added `AppLayout` import + pathless nested layout route |

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm tsc --noEmit` | Exit 0 — zero errors |
| `Navbar.tsx` exists | True |
| `AppLayout.tsx` exists | True |
| `AppLayout` appears 2× in router.tsx | True (import line + JSX element) |
| `navbar.myProfile` in en/common.json | True |
| `window.location` in Navbar.tsx | No match (constraint satisfied) |

## Issues / Adaptations

- The plan instructed to verify with `grep "navbar.myProfile" public/locales/en/common.json` — this grep pattern uses dot notation which doesn't appear literally in JSON (it uses `"myProfile"` as a nested key). Verified instead via Node.js `require()` which confirmed `j.navbar.myProfile === "My Profile"`.
- No other issues. All constraints from CLAUDE.md satisfied: TypeScript strict mode, Lucide icons only, React Router navigation, no `window.location`, no `dangerouslySetInnerHTML`, Tailwind v4 CSS-first classes only.
