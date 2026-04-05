# Research: 004-notebook-dashboard

**Date**: 2026-04-04

## R-001: createNotebook API — Passing Styles from a Preset

**Decision**: Update `createNotebook()` in `src/api/notebooks.ts` to accept an optional `styles` field of type `Omit<NotebookModuleStyle, 'id' | 'notebookId'>[]`. When the user selects a system preset, extract the preset's `styles` array, strip `id` and `notebookId` fields, and pass them in the creation request body.

**Rationale**: The spec says `POST /notebooks` accepts `{ title, instrumentId, pageSize, coverColor, styles? }`. The `SystemStylePreset.styles` array contains `NotebookModuleStyle` objects which include server-generated `id` and `notebookId` — these must be omitted from the creation request since the notebook doesn't exist yet. The backend will generate those fields.

**Alternatives considered**: Sending a `presetId` instead of the full styles array (not supported by the documented API contract — the endpoint accepts `styles`, not `presetId`).

## R-002: Wizard Data Fetching Strategy

**Decision**: Fetch `GET /instruments` and `GET /presets/system` lazily when the creation dialog opens, not on dashboard page load. Use `enabled: isDialogOpen` on both query hooks.

**Rationale**: The user explicitly stated: "Fetch them when the wizard opens, not on dashboard load." Both datasets are public and cached (staleTime: 300,000ms), so subsequent opens are instant from cache. This avoids unnecessary network requests for users who only browse the dashboard without creating.

**Alternatives considered**: Prefetch on dashboard mount (wastes bandwidth for browse-only sessions); fetch on each step (adds latency between steps for instrument dropdown on Step 1).

## R-003: Routing — Shared Component for /app/notebooks and /app/notebooks/new

**Decision**: Both routes render the same `NotebooksDashboardPage` component. The component uses `useLocation()` to detect `/app/notebooks/new` and auto-opens the creation dialog. On dialog close or submit, navigate to `/app/notebooks` (or `/app/notebooks/:id` on success).

**Rationale**: The spec requires the wizard to be accessible both via a button on the dashboard and via direct navigation to `/app/notebooks/new`. Using a single component avoids duplicating the entire dashboard. The Dialog component is always rendered but conditionally open.

**Alternatives considered**: Having `/app/notebooks/new` render a separate page (loses dashboard context; spec says it's a dialog over the dashboard).

## R-004: Optimistic Delete with TanStack Query

**Decision**: Use the standard `onMutate`/`onError`/`onSettled` pattern from the constitution. `onMutate` snapshots the current `["notebooks"]` cache, removes the deleted notebook optimistically, and returns the snapshot as context. `onError` restores from the snapshot and shows an error toast. `onSettled` always invalidates `["notebooks"]`.

**Rationale**: The constitution (Principle II) mandates this exact pattern for optimistic updates. The spec requires immediate visual removal (FR-020) with rollback on server error.

**Alternatives considered**: None — the constitution is prescriptive on this pattern.

## R-005: Client-Side Sorting

**Decision**: Sort the notebook list client-side using `useMemo` over the TanStack Query data. No server-side sort parameter. Sort state is a `useState` that defaults to `"updatedAt"` on every mount (not persisted).

**Rationale**: The spec assumes <100 notebooks without pagination (Assumption 5). Client-side sorting is instant for this scale. The clarification confirms sort preference resets to default each visit.

**Alternatives considered**: Server-side sorting via query parameter (unnecessary complexity for <100 items; would require separate cache entries per sort key).

## R-006: Cover Color Picker Implementation

**Decision**: Use a shadcn/ui `Popover` containing a grid of curated color swatches (8 earthy/rich book-cover colors) plus a hex input field. The popover triggers from a button showing the currently selected color. Default selection: leather brown (#8B4513).

**Rationale**: The user explicitly requested a shadcn/ui Popover with a predefined palette of book-cover colors plus custom hex input. A popover is lightweight, dismissible, and consistent with the shadcn/ui component library. The curated palette avoids analysis paralysis while the hex input accommodates power users.

**Alternatives considered**: Native `<input type="color">` (inconsistent across browsers, no curated palette); full third-party color picker library (violates constitution — no new libraries without amendment).

## R-007: Page Size Visual Selector

**Decision**: Render scaled SVG or div rectangles using the existing `PAGE_SIZE_DIMENSIONS` constant from `src/lib/constants/grid.ts`. Each option displays a rectangle at the correct width:height ratio, the size label (A4, A5, etc.), and grid dimensions as a subtitle (e.g., "42 × 59 grid"). Use radio-button-group semantics for accessibility.

**Rationale**: The user specified visual rectangles at correct aspect ratios with grid dimension subtitles. The `PAGE_SIZE_DIMENSIONS` constant already maps each PageSize to `{ width, height }` which gives both the aspect ratio for rendering and the grid dimensions for the subtitle.

**Alternatives considered**: Simple dropdown (user explicitly requested visual selector with aspect ratios).

## R-008: Preset Thumbnail Rendering

**Decision**: Each `PresetThumbnail` renders a small 3×4 grid of colored rectangles. Each rectangle represents one of the 12 `ModuleType` styles from the preset. The rectangle's fill color is the style's `backgroundColor`, with a small accent stripe or top bar using `headerBgColor`. This creates a "color palette" overview that communicates the preset's visual theme at a glance.

**Rationale**: The user suggested "a small rendering of differently-colored module blocks to give a sense of the color scheme." Since each preset has 12 styles (one per ModuleType), a 3×4 mini-grid naturally shows all 12 colors. Using `backgroundColor` + `headerBgColor` provides enough visual differentiation without needing to render full module components.

**Alternatives considered**: Rendering a single representative module (shows only 1 of 12 styles); using just color dots (less informative); rendering actual scaled-down modules (too complex for a thumbnail).

## R-009: Reusing useInstruments Hook

**Decision**: Move `useInstruments` from `src/features/profile/hooks/useInstruments.ts` to `src/hooks/useInstruments.ts` (shared hooks directory). Add an optional `options` parameter with `enabled` (defaults to `true`) for lazy wizard fetching. Update all existing consumers to import from the new shared location.

**Rationale**: Constitution Principle I states "Components MUST NOT import from other feature folders. Cross-feature communication goes through shared hooks." The hook is consumed by both the profile feature and the notebook wizard, making it a shared concern. Moving it to `src/hooks/` complies with the constitution while avoiding duplication. The `enabled` parameter allows lazy fetching when the wizard dialog opens.

**Alternatives considered**: Importing directly from `src/features/profile/hooks/` (violates constitution Principle I cross-feature import rule); creating a duplicate in `src/features/notebooks/hooks/` (unnecessary duplication of identical logic and query key).

## R-010: "Colorful" Default Preset Selection

**Decision**: When no preset is explicitly selected by the user, find the preset where `isDefault === true` in the `SystemStylePreset[]` response and use its styles. If no preset has `isDefault: true`, omit the `styles` field from the creation request (the backend applies its own default).

**Rationale**: The `SystemStylePreset` type already has an `isDefault` boolean field. The spec says "Colorful" is the default, which aligns with the backend marking one preset as `isDefault: true`. Using the `isDefault` flag is more robust than matching by name string.

**Alternatives considered**: Matching by `name === "Colorful"` (fragile if name is localized or renamed); hardcoding a preset ID (breaks if IDs change).
