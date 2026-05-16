# Phase 3: User Profile & Account - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 3-user-profile-account
**Areas discussed:** AppLayout architecture, Data fetching strategy, Instrument options source, Profile page visual layout

---

## AppLayout Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Nested router layout | ProtectedRoute stays pure auth guard; AppLayout is a second nesting level in router tree (ProtectedRoute > AppLayout > pages) | ✓ |
| Merge into ProtectedRoute | ProtectedRoute renders AppLayout directly, embedding navbar + content area | |

**User's choice:** Nested router layout
**Notes:** ProtectedRoute has single responsibility (auth guard). AppLayout has single responsibility (layout). Future phases add pages inside AppLayout's children without touching ProtectedRoute.

---

**Navbar contents**

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + avatar only | Staccato logo left, avatar button right. Breadcrumbs/sidebar added by later phases. | ✓ |
| Logo + notebook title placeholder + avatar | Reserve center slot for Phase 4 notebook title. | |
| Full nav with sidebar toggle | Logo, hamburger, avatar. Adds Phase 3 scope. | |

**User's choice:** Logo + avatar only
**Notes:** Keep navbar minimal at Phase 3. Future phases extend Navbar.tsx without touching AppLayout.

---

**Navbar component location**

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone src/components/Navbar.tsx | Separate file for independent extensibility in future phases | ✓ |
| Colocated in AppLayout.tsx | Simpler now, extract later | |

**User's choice:** Standalone Navbar.tsx

---

## Data Fetching Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Introduce TanStack Query in Phase 3 | useQuery + useMutation; QueryClient already wired | ✓ |
| Manual fetch in Phase 3, TQ in Phase 4 | useEffect + useState; defer TQ to Phase 4 | |

**User's choice:** Introduce TanStack Query in Phase 3
**Notes:** PROJECT.md key decision "TanStack Query for all server state — Pending Phase 4+" is now pulled forward. Phase 3 establishes the TQ pattern for all subsequent phases.

---

**authStore update strategy**

| Option | Description | Selected |
|--------|-------------|----------|
| Add updateUser(user) action to authStore | New action updates user without changing token | ✓ |
| Re-use setAuth with current token | Couples user update to token knowledge | |

**User's choice:** Add updateUser(user: UserProfile) action

---

**Avatar upload mutation pattern**

| Option | Description | Selected |
|--------|-------------|----------|
| useMutation for avatar upload | Consistent with all other mutations | ✓ |
| Local state for avatar upload | Direct client.post() in event handler | |

**User's choice:** useMutation for avatar upload

---

## Instrument Options Source

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch from GET /instruments endpoint | Dynamic; future-proof | ✓ |
| Skip defaultInstrumentId for now | Omit field from Phase 3 form entirely | |
| Hardcoded with known Guid | Fragile; breaks across environments | |

**User's choice:** Fetch from GET /instruments
**Notes:** Backend Guids are database-generated IDs — cannot hardcode reliably.

---

**Instruments error handling**

| Option | Description | Selected |
|--------|-------------|----------|
| Show disabled select with loading/error state | Rest of form remains saveable; instrument excluded from PATCH if null | ✓ |
| Hide the field entirely on error | Field disappears on query failure | |

**User's choice:** Disabled select with loading/error state

---

## Profile Page Visual Layout

**Avatar placement**

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar header above the form | Large avatar, clickable to upload, "Change photo" label | ✓ |
| Avatar as inline form row | Labeled row inside the form alongside other fields | |

**User's choice:** Avatar header above the form
**Notes:** User confirmed from the layout preview (avatar → personal info → preferences → save → danger zone).

---

**Form structure**

| Option | Description | Selected |
|--------|-------------|----------|
| Sectioned with dividers | Personal Information, Preferences, then Save button, then Danger Zone | ✓ |
| Flat single form | All fields top-to-bottom, one Save button | |

**User's choice:** Sectioned with dividers

---

**Danger Zone styling**

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle destructive styling | Heading in destructive color, description text, outline button | ✓ |
| Red-bordered card | Card with red border wrapping heading + description + button | |

**User's choice:** Subtle destructive styling (not a red card)

---

## Claude's Discretion

- `UserProfile.defaultInstrument: string` → `defaultInstrumentId: string | null` type reconciliation — Claude handles the migration and callsite updates
- Specific Navbar height, padding, and logo treatment — Claude chooses consistent with existing shadcn radix-nova aesthetic
- Avatar hover state ("Change photo" overlay vs. label below) — Claude chooses clean implementation
- Form field order within sections — Claude follows the layout mockup confirmed by user

## Deferred Ideas

- Sidebar navigation (Phase 4+)
- Breadcrumbs in Navbar (Phase 4+)
- Notification bell (future consideration)
- Password change (not in Phase 3 spec)
- Email change (not in Phase 3 spec)
