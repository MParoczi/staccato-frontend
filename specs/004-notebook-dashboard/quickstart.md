# Quickstart: 004-notebook-dashboard

**Date**: 2026-04-04

## Prerequisites

- Node.js LTS installed
- pnpm installed
- Backend API running (or `.env` configured with `VITE_API_BASE_URL`)

## Setup

```bash
pnpm install
cp .env.example .env  # if not already done
pnpm dev
```

## What This Feature Adds

### New Files

```
src/features/notebooks/
├── components/
│   ├── NotebooksDashboardPage.tsx     # Main dashboard container (both /app/notebooks and /new)
│   ├── NotebookCard.tsx               # Individual notebook card (presentational)
│   ├── NotebookCardSkeleton.tsx       # Skeleton loading placeholder
│   ├── EmptyState.tsx                 # Empty state with CTA
│   ├── SortControl.tsx                # Sort dropdown
│   ├── CreateNotebookDialog.tsx       # Multi-step wizard dialog (container)
│   ├── StepBasics.tsx                 # Step 1: title, instrument, page size
│   ├── StepAppearance.tsx             # Step 2: cover color, preset selector
│   ├── PageSizeSelector.tsx           # Visual page size picker
│   ├── CoverColorPicker.tsx           # Color palette + hex input in Popover
│   ├── PresetSelector.tsx             # Preset thumbnail grid
│   ├── PresetThumbnail.tsx            # Single preset color preview
│   └── DeleteNotebookDialog.tsx       # Delete confirmation dialog
├── hooks/
│   ├── useNotebooks.ts                # TanStack Query: GET /notebooks
│   ├── useCreateNotebook.ts           # Mutation: POST /notebooks
│   ├── useDeleteNotebook.ts           # Mutation: DELETE /notebooks/{id} (optimistic)
│   └── useSystemPresets.ts            # TanStack Query: GET /presets/system
└── schemas/
    └── create-notebook-schema.ts      # Zod: title, instrumentId, pageSize, coverColor

src/lib/constants/
└── notebook-colors.ts                 # Curated cover color palette
```

### Modified Files

```
src/api/notebooks.ts         # Update createNotebook to accept optional styles
src/lib/types/notebooks.ts   # Add CreateNotebookRequest, CreateNotebookStyleInput
src/routes/index.tsx          # Replace placeholder imports with real components
src/routes/placeholders.tsx   # Remove NotebooksDashboard, NewNotebook placeholders
src/hooks/useInstruments.ts   # Move from src/features/profile/hooks/ + add enabled option
src/features/profile/components/PreferencesSection.tsx  # Update useInstruments import path
src/i18n/en.json              # Add notebooks.* translation keys
src/i18n/hu.json              # Add notebooks.* translation keys
```

## Key Patterns

### useNotebooks Hook
Wraps `useQuery` with key `["notebooks"]` and `staleTime: 0` (always refetch on window focus, per constitution). Returns the full notebook list for client-side sorting.

### Optimistic Delete Flow
1. User confirms deletion in `DeleteNotebookDialog`
2. `onMutate`: snapshot `["notebooks"]` cache, remove notebook optimistically
3. `mutationFn`: `deleteNotebook(id)` via `src/api/notebooks.ts`
4. `onError`: restore from snapshot, show error toast
5. `onSettled`: invalidate `["notebooks"]`

### Create Notebook Wizard
1. Dialog opens → `useInstruments()` and `useSystemPresets()` fetch in parallel
2. Step 1: title + instrument dropdown + visual page size selector. Pre-filled from `useCurrentUser()` defaults
3. Step 2: curated cover color palette (default: leather brown) + optional preset selection
4. Submit: `createNotebook(data)` → invalidate `["notebooks"]` → navigate to `/app/notebooks/:id`
5. Back button preserves state; closing discards silently

### Lazy Wizard Data
Instruments and presets are fetched only when the creation dialog opens (`enabled: isDialogOpen`). Both have `staleTime: 300,000ms`, so subsequent opens are instant from cache.

### /app/notebooks/new Route
Same `NotebooksDashboardPage` component as `/app/notebooks`. Uses `useLocation()` to detect `/new` path and auto-open the creation dialog. On close, navigates back to `/app/notebooks`.

### Client-Side Sorting
`useMemo` sorts the query data by `updatedAt` (default), `createdAt`, or `title`. Sort state is local `useState`, resets to `updatedAt` on each page mount.

### Cover Color Picker
shadcn/ui `Popover` with a grid of 8 curated colors from `COVER_COLORS` constant, plus a hex input field for custom colors. Default: leather brown (#8B4513).

### Page Size Selector
Renders scaled rectangles at correct aspect ratios using `PAGE_SIZE_DIMENSIONS` from `src/lib/constants/grid.ts`. Shows size label and grid dimensions (e.g., "A4 — 42 × 59 grid").

## Testing

```bash
pnpm test                # Run all tests
pnpm test -- --run       # Run tests once (no watch)
```

Test files are colocated:
- `src/features/notebooks/schemas/create-notebook-schema.test.ts`
- `src/features/notebooks/hooks/useNotebooks.test.ts` (etc.)
- `src/features/notebooks/components/NotebookCard.test.tsx` (etc.)
