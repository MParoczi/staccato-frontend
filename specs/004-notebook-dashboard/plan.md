# Implementation Plan: Notebook Dashboard

**Branch**: `004-notebook-dashboard` | **Date**: 2026-04-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-notebook-dashboard/spec.md`

## Summary

Build the notebook dashboard at `/app/notebooks` — the application's home screen — where authenticated users view, create, and delete their music notebooks. Notebooks display as physical-notebook-themed cards in a responsive CSS Grid. A multi-step creation wizard (Dialog) collects title, instrument, page size, cover color, and optional style preset. Deletion uses optimistic updates via TanStack Query's `onMutate`/`onError`/`onSettled` pattern. All data flows through TanStack Query with query key `["notebooks"]` for the list, `["instruments"]` and `["presets"]` for wizard reference data (fetched lazily when the dialog opens).

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode enabled
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React
**Storage**: N/A (frontend-only; server state via TanStack Query cache, auth token in Zustand memory)
**Testing**: Vitest + React Testing Library + MSW
**Target Platform**: Modern browsers (Chrome/Firefox/Safari/Edge latest 2)
**Project Type**: Web application (SPA frontend)
**Performance Goals**: Dashboard renders within 1s from cache; optimistic delete removes card within frame of confirming; wizard opens instantly (reference data loads in background)
**Constraints**: Max 250 LOC per component, no emojis (Lucide icons only), earthy-modern design system (Zone 1), all strings localized
**Scale/Scope**: Dashboard page, ~14 new components, 4 hooks, 1 Zod schema, 1 constants file, i18n updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Folder Structure | PASS | Feature code in `src/features/notebooks/`, API already in `src/api/notebooks.ts`, constants in `src/lib/constants/` |
| II. State Management | PASS | All server state via TanStack Query: `["notebooks"]`, `["instruments"]`, `["presets"]`. No Zustand duplication. Optimistic delete uses `onMutate`/`onError`/`onSettled` |
| III. API Integration | PASS | All calls through existing `src/api/notebooks.ts`, `src/api/instruments.ts`, `src/api/presets.ts`. `createNotebook()` updated to accept optional `styles` field |
| IV. Component Architecture | PASS | NotebooksDashboardPage = container. Cards, selectors, pickers = presentational. Dialog = container. All function components. Each under 250 lines |
| V. Design System | PASS | Zone 1 (App Shell) — earthy-modern palette. Cream background, warm white cards, earthy color palette for cover picker, subtle shadows, smooth hover transitions |
| VI. No Emojis | PASS | All icons via Lucide React (Plus, MoreVertical, Trash2, BookOpen, AlertTriangle, ArrowLeft, ArrowRight, Check, etc.) |
| VII. Form Handling | PASS | Creation wizard uses React Hook Form + Zod schema. Title, instrument, page size validated client-side. Server errors mapped via `setError` |
| VIII. Routing | PASS | `/app/notebooks` and `/app/notebooks/new` routes already exist as placeholders. Dashboard component checks path to auto-open creation dialog |
| IX. Internationalization | PASS | All strings via i18next with `notebooks.*` namespace. Dates via `Intl.DateTimeFormat` with user locale |
| X. Type Safety | PASS | `NotebookSummary`, `NotebookDetail`, `Instrument`, `SystemStylePreset`, `PageSize` types already exist. New `CreateNotebookRequest` type needed |
| XI. Performance | PASS | Notebooks staleTime: 0 (refetch on focus). Instruments: 300,000ms. System presets: 300,000ms (public, rarely change). Lazy-fetch wizard data on dialog open |
| XII. Testing | PASS | Colocated tests. Zod schema tests (100% branch). Hook tests with MSW. Component tests for card interactions, wizard flow, delete confirmation |

**Post-Phase 1 re-check**: All gates still pass. No violations introduced during design phase.

## Project Structure

### Documentation (this feature)

```text
specs/004-notebook-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity and cache design
├── quickstart.md        # Phase 1: setup and patterns guide
├── contracts/
│   └── api-contracts.md # Phase 1: API endpoint contracts
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── notebooks.ts                          # MODIFY: update createNotebook signature to accept optional styles
├── features/
│   └── notebooks/
│       ├── components/
│       │   ├── NotebooksDashboardPage.tsx     # NEW: main dashboard container
│       │   ├── NotebookCard.tsx               # NEW: individual notebook card (presentational)
│       │   ├── NotebookCardSkeleton.tsx       # NEW: skeleton loading card
│       │   ├── EmptyState.tsx                 # NEW: empty dashboard state with CTA
│       │   ├── SortControl.tsx                # NEW: sort dropdown control
│       │   ├── CreateNotebookDialog.tsx       # NEW: multi-step wizard dialog (container)
│       │   ├── StepBasics.tsx                 # NEW: wizard Step 1 — title, instrument, page size
│       │   ├── StepAppearance.tsx             # NEW: wizard Step 2 — cover color, preset
│       │   ├── PageSizeSelector.tsx           # NEW: visual page size picker with aspect ratios
│       │   ├── CoverColorPicker.tsx           # NEW: curated palette + custom hex input
│       │   ├── PresetSelector.tsx             # NEW: preset thumbnail grid
│       │   ├── PresetThumbnail.tsx            # NEW: single preset mini-preview
│       │   └── DeleteNotebookDialog.tsx       # NEW: delete confirmation dialog
│       ├── hooks/
│       │   ├── useNotebooks.ts                # NEW: query hook for GET /notebooks
│       │   ├── useCreateNotebook.ts           # NEW: mutation hook for POST /notebooks
│       │   ├── useDeleteNotebook.ts           # NEW: mutation with optimistic update
│       │   └── useSystemPresets.ts            # NEW: query hook for GET /presets/system
│       └── schemas/
│           └── create-notebook-schema.ts      # NEW: Zod validation for creation form
├── i18n/
│   ├── en.json                                # MODIFY: add notebooks.* keys
│   └── hu.json                                # MODIFY: add notebooks.* keys
├── lib/
│   ├── constants/
│   │   └── notebook-colors.ts                 # NEW: curated cover color palette constant
│   └── types/
│       └── notebooks.ts                       # MODIFY: add CreateNotebookRequest type
└── routes/
    ├── index.tsx                               # MODIFY: replace placeholder imports
    └── placeholders.tsx                        # MODIFY: remove NotebooksDashboard, NewNotebook
```

**Structure Decision**: Follows the existing single-project frontend structure established by the constitution. Feature-specific code lives in `src/features/notebooks/` (components, hooks, schemas). API functions are already in `src/api/notebooks.ts`. The `useInstruments` hook is moved from `src/features/profile/hooks/` to `src/hooks/useInstruments.ts` (shared hooks directory) to comply with constitution Principle I, and updated to accept an optional `enabled` parameter for lazy wizard fetching. A new constants file for the curated color palette lives in `src/lib/constants/`.

## Component Hierarchy

```
AppLayout (existing)
└── <Outlet />
    └── NotebooksDashboardPage (NEW — container, handles both /app/notebooks and /app/notebooks/new)
        ├── Page header: title + SortControl + "Create Notebook" Button
        ├── Loading state → NotebookCardSkeleton × 6
        ├── Empty state → EmptyState (when notebooks.length === 0)
        ├── NotebookCard × N (presentational, responsive CSS Grid)
        │   └── DropdownMenu (three-dot overflow → "Delete" item)
        ├── CreateNotebookDialog (container/dialog, auto-opens for /new route)
        │   ├── Step 1: StepBasics
        │   │   ├── Title input (React Hook Form)
        │   │   ├── Instrument dropdown (shadcn Select, data from useInstruments)
        │   │   ├── PageSizeSelector (visual rectangles with aspect ratios)
        │   │   └── Immutability warning banner
        │   └── Step 2: StepAppearance
        │       ├── CoverColorPicker (Popover with palette grid + hex input)
        │       └── PresetSelector (thumbnail grid, data from useSystemPresets)
        │           └── PresetThumbnail × N
        └── DeleteNotebookDialog (AlertDialog, triggered from card dropdown)
```

## Key Implementation Patterns

### 1. useNotebooks Hook

```
Query key: ["notebooks"]
staleTime: 0 (always refetch on window focus, per constitution XI)
Fetcher: getNotebooks() from src/api/notebooks.ts
Usage: NotebooksDashboardPage
```

Returns the full notebook list. Client-side sorting applied in the component (no server sort since the list is unbounded to ~100 items per assumptions).

### 2. Optimistic Delete

```
1. User clicks three-dot menu → "Delete" → DeleteNotebookDialog opens
2. User confirms deletion
3. onMutate:
   - Cancel any outgoing refetches for ["notebooks"]
   - Snapshot current cache: previousNotebooks = queryClient.getQueryData(["notebooks"])
   - Optimistically remove the notebook from cache
   - Return { previousNotebooks } as context
4. mutationFn: deleteNotebook(id)
5. onError:
   - Restore cache from context.previousNotebooks
   - Show error toast
6. onSettled:
   - Invalidate ["notebooks"] to ensure server consistency
```

### 3. Create Notebook Wizard

```
1. Dialog opens (button click, add-card click, or /app/notebooks/new route)
2. React Hook Form manages form state across both steps
3. Step 1 (Basics): title, instrumentId, pageSize — validated by Zod schema
   - Instrument dropdown: data from useInstruments() (shared hook, staleTime 300s)
   - Page size: visual selector using PAGE_SIZE_DIMENSIONS constants
   - Pre-fill from user profile defaults (useCurrentUser cache)
4. Step 2 (Appearance): coverColor, presetId (optional)
   - Cover color: curated palette from COVER_COLORS constant + custom hex input
   - Presets: data from useSystemPresets() (staleTime 300s)
   - Default: leather brown color, "Colorful" preset applied if no selection
5. On submit: createNotebook({ title, instrumentId, pageSize, coverColor, styles? })
6. On success: invalidate ["notebooks"], navigate to /app/notebooks/:id
7. Back button: preserves form state, returns to Step 1
8. Close dialog: discards all form data silently
```

### 4. Routing: /app/notebooks vs /app/notebooks/new

Both routes render `NotebooksDashboardPage`. The component uses `useLocation()` to detect the `/new` path and auto-opens the creation dialog. When the dialog closes (submit or cancel), the URL navigates back to `/app/notebooks`. This avoids duplicating the dashboard component.

### 5. Client-Side Sorting

```
Sort state: React useState, defaults to "updatedAt"
Options: "updatedAt" (last updated, desc), "createdAt" (created date, desc), "title" (alphabetical, asc)
Applied via useMemo over the query data
Resets to "updatedAt" on each page visit (not persisted)
```

### 6. Cover Color Palette

A curated constant array of book-cover colors (hex values + display names for accessibility):

```
Leather Brown (#8B4513) — default
Dark Navy (#1B2A4A)
Forest Green (#2D5016)
Burgundy (#722F37)
Charcoal (#36454F)
Slate Blue (#4A6274)
Deep Teal (#1A5653)
Warm Terracotta (#C75B39)
```

Plus a custom hex input field for advanced users.

### 7. Page Size Visual Selector

Uses the existing `PAGE_SIZE_DIMENSIONS` constant (`src/lib/constants/grid.ts`) to render rectangles at correct aspect ratios. Each option shows:
- A scaled rectangle matching the width:height ratio
- The size label (e.g., "A4")
- Grid dimensions as subtitle (e.g., "42 × 59 grid")

Selected state: prominent border + background highlight.

### 8. Preset Thumbnails

Each `SystemStylePreset` contains 12 `NotebookModuleStyle` entries (one per ModuleType). The thumbnail renders a small grid of colored rectangles — each rectangle's background color taken from the style's `backgroundColor`, with a smaller accent from `headerBgColor`. This gives users a visual sense of the color scheme without rendering full modules.

### 9. Notebook Card Design

```
Layout:
┌──────────────────────────────┐
│ ████████████████████████████ │ ← coverColor stripe (top 40% or full tint)
│                              │
│  Title                  •••  │ ← three-dot menu (top-right of content area)
│  [Music] Instrument    A4   │ ← Lucide Music icon + name + page size badge
│                              │
│  12 lessons                  │ ← lesson count
│  Updated Mar 15, 2026        │ ← formatted date
└──────────────────────────────┘

Hover: translateY(-2px) + shadow elevation increase + 150ms transition
Click: navigate to /app/notebooks/:id
```

## Complexity Tracking

No constitution violations. No complexity justifications needed.
