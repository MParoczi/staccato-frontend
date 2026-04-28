# Staccato Frontend — PROJECT.md

*Last updated: 2026-04-28 after initialization*

## What This Is

**Staccato** is a digital, dotted-paper notebook application for musicians. It lets users build, organize, and study musical notebooks composed of **lessons → pages → modules**, where modules are styled, grid-placed atomic content units (chord charts, text, tables, musical notation, progressions, tablature, etc.) on a 2D canvas. Notebooks export to PDF for offline practice.

**Stack:** React 19 + TypeScript 5.9 (strict) SPA, Vite 8, Tailwind v4 + shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form + Zod, react-i18next (en/hu), `@dnd-kit/core`, `@microsoft/signalr` (PDF export progress), `@react-oauth/google`. Backend: ASP.NET Core 10 WebAPI (separate repo).

**Repo scope:** Frontend only. Backend lives elsewhere and may have its own pace.

## Core Value

> Build & study musical notebooks — structured, beautiful, "mine to organize."

The ONE thing Staccato must do better than alternatives is give a musician a personal, dotted-paper-feeling, **owned** notebook with rich, structured content modules — not a generic note app, not a static sheet-music viewer. If everything else fell away, the user should still be able to: open a notebook → place modules on a page → study what they put there → export to PDF.

## Users

**Primary:**
- **Self-taught hobbyist musicians** — building personal practice/reference notebooks at their own pace.
- **Music students** (formal study) — turning class material into structured, browsable notebooks.

**Secondary / future:** music teachers/instructors, gigging musicians keeping a personal reference. Out of scope for v1.

## Context & Stage

**Stage:** Solo passion project. **No public timeline, no public users yet.** Building toward a private-usable, personal-grade product. Future open-up is an option, not a commitment.

**Existing state (when this PROJECT.md was written):**
- 8 of 17 planned Speckit features delivered:
  1. Project infrastructure
  2. Auth & token management (Google OAuth + JWT in-memory + httpOnly refresh cookie)
  3. User profile & settings
  4. Notebook dashboard
  5. Notebook shell & navigation (cover / index / lesson pages)
  6. App nav sidebar
  7. Module styling system
  8. Grid canvas & module placement (`@dnd-kit/core`)
- April 2026 bug audit (`issues/bug-audit-2026-04.md`, 15 items) cleared.
- Codebase map: `.planning/codebase/{STACK,INTEGRATIONS,ARCHITECTURE,STRUCTURE,CONVENTIONS,TESTING,CONCERNS}.md`.
- Hungarian + English are first-class locales.
- 13 co-located test files; `src/features/*` test coverage is a known gap.
- `@microsoft/signalr` and `msw` are installed but not yet wired (SignalR lands in Speckit Feature 17; MSW is for future test infra).

**Speckit relationship:** Speckit (`specs/NNN-<slug>/`) remains the system of record for per-feature `spec.md`, `plan.md`, `tasks.md`, `contracts/`, `checklists/`. GSD operates as an **umbrella** above it — each GSD phase wraps exactly one Speckit feature and references its plan rather than duplicating it.

## Constraints

- **Solo developer.** Sequential execution; no parallelization required.
- **Frontend-only repo** — backend is separate; any backend change is a coordination item flagged on the issue, not implemented here.
- **Hungarian + English first-class** — all UI strings flow through `t()`; mirror keys in `en.json` + `hu.json`.
- **Self-hosted / static deploy** — no SSR. Vite builds to `dist/`.
- **Speckit constitution is non-negotiable** — folder boundaries, state-management rules (Zustand client-only, TanStack Query for server), centralized Axios, no emojis, two visual zones, RHF + Zod forms, Lucide-only icons, etc. See `frontend-speckit-prompts.md` "Constitution Prompt" for the full text.
- **No public timeline** — quality > speed; ship when ready.
- **Token storage discipline** — access token in Zustand memory **only**; never `localStorage` / `sessionStorage`.

## Requirements

> Live snapshot. Source of truth for traceability is `.planning/REQUIREMENTS.md`. This block summarizes status.

### Validated (✓ shipped + verified)

- ✓ **INFRA-01** — Vite + React 19 + TS strict + ESLint + Vitest scaffold *(Speckit F1)*
- ✓ **AUTH-01** — Google OAuth + email/password login + register *(Speckit F2)*
- ✓ **AUTH-02** — JWT in-memory + httpOnly refresh cookie + single-flight silent refresh *(Speckit F2)*
- ✓ **AUTH-03** — Protected routes + proactive refresh timer *(Speckit F2)*
- ✓ **PROFILE-01** — User profile view + edit + language preference sync *(Speckit F3)*
- ✓ **NOTEBOOK-01** — Notebook dashboard (list / create / delete) *(Speckit F4)*
- ✓ **NOTEBOOK-02** — Notebook shell + cover / index / lesson page navigation *(Speckit F5)*
- ✓ **NAV-01** — App sidebar with notebook nav *(Speckit F6)*
- ✓ **STYLE-01** — Module styling system (per-notebook style records + presets) *(Speckit F7)*
- ✓ **CANVAS-01** — Grid canvas + module placement (drag/drop, resize, snap) *(Speckit F8)*
- ✓ **STAB-01** — April 2026 bug audit cleared (15 items)

### Active (pending, in roadmap order)

- [ ] **EDIT-01** — Module content editor core *(Speckit F9)*
- [ ] **BLOCK-01** — Text & list building blocks *(Speckit F10)*
- [ ] **BLOCK-02** — Table building block *(Speckit F11)*
- [ ] **BLOCK-03** — Musical notes building block *(Speckit F12)*
- [ ] **CHORD-01** — Chord library browser + fretboard renderer *(Speckit F13)*
- [ ] **CHORD-02** — Chord progression building block *(Speckit F14)*
- [ ] **CHORD-03** — Chord tablature group building block *(Speckit F15)*
- [ ] **BLOCK-04** — Breadcrumb module *(Speckit F16)*
- [ ] **EXPORT-01** — PDF export + SignalR realtime progress *(Speckit F17)*
- [ ] **STAB-02** — Continuous stabilization track (a11y plugin, coverage threshold, MSW server, route-level code splitting) — pulled in alongside phases as warranted

### Out of Scope (v1)

- **Realtime multi-user collaboration** — SignalR in F17 is for export-progress only; collaborative editing is a future milestone.
- **Public sharing / permissions** — notebooks remain owner-only; no link-share, view-only, or org/team scopes.
- **Native mobile apps** — web only. PWA polish is deferred to a future milestone.
- **Backend changes** — frontend repo only. Surface backend coordination items as issues.
- **Built-in chord/scale content library** — the `presets` engine is in-place, but mass-authored "stock" content is deferred.
- **Music-theory tutoring layer** — interactive theory explanations are deferred; we host content, we don't author it.
- **Audio playback / DAW features** — out of scope.
- **Score engraving export** — PDF export ships first; engraved-score export (MusicXML, MIDI) is deferred.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Speckit remains system-of-record; GSD wraps it as umbrella | Avoid dual-track planning; Speckit's `spec.md`/`plan.md`/`tasks.md` are already complete per feature | — Pending validation (will be confirmed once Phase 1 wraps) |
| One GSD phase = one Speckit feature | 1:1 mapping keeps traceability trivial; future merges/forks are easy | — Pending |
| Workflow agents (research / plan_check / verifier) disabled | Speckit constitution + checklists already enforce these gates; doubling up is waste for a solo dev | — Pending |
| Token in memory only (Zustand, no `persist`) | Constitution principle III; XSS-safe; refresh cookie + silent refresh handles reload | ✓ Validated (`src/stores/authStore.ts`, `src/api/client.ts`) |
| Hungarian as first-class locale alongside English | Solo dev's home locale; cheaper to keep parity than retrofit later | ✓ Validated (`src/i18n/{en,hu}.json`) |
| Standard granularity, sequential execution | Solo dev, no parallel hands; standard slice fits a "1 feature ≈ 1 phase" cadence | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to **Out of Scope** with reason.
2. Requirements validated? → Move to **Validated** with phase reference (`(Phase N)`).
3. New requirements emerged? → Add to **Active**.
4. Decisions to log? → Add to **Key Decisions**.
5. "What This Is" still accurate? → Update if drifted.

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections.
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context & Stage with current state.

---

*Last updated: 2026-04-28 after initialization*

