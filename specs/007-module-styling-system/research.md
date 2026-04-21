# Research: Module Styling System

**Feature**: 007-module-styling-system  
**Date**: 2026-04-21

## R1: Color Picker Approach

**Decision**: Hex input field + curated swatch palette inside a shadcn/ui Popover.

**Rationale**: shadcn/ui has no native color picker. A hex input with swatches is simpler, faster to use, and fits the notebook aesthetic. The user can type any hex value or click a swatch for quick selection. The Popover provides a clean, dismissible container.

**Alternatives considered**:
- **react-colorful** inside a Popover: Adds a new library (constitution violation), more complex for limited benefit. Users primarily need to pick from a curated palette or paste a known hex.
- **Native `<input type="color">`**: Inconsistent browser UX, cannot style or curate swatches, doesn't match the design system.

**Implementation details**:
- Popover trigger: small colored square showing current value
- Popover content: hex input (validated to `#RRGGBB`), grid of ~24 curated swatches (earthy tones, vibrant accents, neutrals)
- Validation: real-time hex character filtering, 7-char max (`#` + 6 hex digits)
- Swatch click sets the value immediately and closes the popover

## R2: Form State Management for 12 Module Types

**Decision**: Single React Hook Form instance with a Zod schema wrapping all 12 module type styles as a record/object keyed by `ModuleType`.

**Rationale**: Using one form for all 12 types enables a single `handleSubmit` to gather all values for the bulk PUT. Each tab maps to a sub-path in the form (`styles.Theory.backgroundColor`, etc.). Switching tabs doesn't require form reinitialization.

**Alternatives considered**:
- **12 separate forms**: Would require coordinating 12 submissions on save. More complex, no benefit.
- **Zustand for form state**: Constitution Principle II forbids Zustand for data that becomes server state. React Hook Form is the prescribed form library.

**Implementation details**:
- Form shape: `{ styles: Record<ModuleType, ModuleStyleFormValues> }`
- `ModuleStyleFormValues`: all 9 style properties (backgroundColor, borderColor, borderStyle, borderWidth, borderRadius, headerBgColor, headerTextColor, bodyTextColor, fontFamily)
- Title and Subtitle tabs: same form fields exist but only bodyTextColor and fontFamily controls are rendered. Other fields preserve the server-loaded values unchanged.
- `useForm` with `defaultValues` populated from the TanStack Query cache on editor open
- `reset()` called when applying a preset to replace all form values

## R3: Bulk Style Save API

**Decision**: Add a `PUT /notebooks/{id}/styles` function to `src/api/notebooks.ts` that sends all 12 styles in one request.

**Rationale**: The spec requires saving all 12 module styles in a single operation (FR-017). The existing `updateNotebookStyle` patches one style at a time, which would require 12 sequential requests. A bulk PUT is more efficient and atomic.

**Alternatives considered**:
- **12 individual PATCH calls**: Slow, non-atomic, poor UX on partial failure.
- **Single PATCH with array**: PUT is more semantically correct for replacing the full set of 12 styles.

**Implementation details**:
- Function: `updateNotebookStyles(notebookId: string, styles: UpdateNotebookStyleInput[]): Promise<NotebookModuleStyle[]>`
- Input type: `UpdateNotebookStyleInput` = style properties without `id` and `notebookId` (same as `CreateNotebookStyleInput` but includes `moduleType`)
- Used by both explicit "Save" and preset application

## R4: Preset Application Flow

**Decision**: Applying a preset auto-persists immediately. The flow: (1) optimistically update `["notebooks", id, "styles"]` cache, (2) reset the form with preset values, (3) call `POST /notebooks/{id}/styles/apply-preset/{presetId}` in background, (4) rollback on error.

**Rationale**: The spec explicitly requires auto-persist on preset apply (FR-021). Optimistic update ensures the notebook canvas updates instantly (SC-008).

**Alternatives considered**:
- **Stage in form, require manual Save**: Spec explicitly rejects this — "No separate 'Save' click is required after applying a preset."

**Implementation details**:
- System preset apply: call the dedicated preset-apply endpoint with the selected preset ID, then hydrate the form from the returned 12 saved styles
- User preset apply: call the same dedicated preset-apply endpoint with the selected user preset ID, then hydrate the form from the returned 12 saved styles
- On error: rollback cache, show error toast, form retains previous values

## R5: Preset Thumbnail Rendering

**Decision**: Render a 4×3 grid of small colored rectangles (one per module type) from the preset's style data. Each rectangle uses the module type's `backgroundColor` and `headerBgColor` as a two-tone swatch.

**Rationale**: Gives a quick visual sense of the color scheme without rendering full modules. 12 rectangles in a grid is compact and fast. Using `backgroundColor` + `headerBgColor` shows two dominant colors per type.

**Alternatives considered**:
- **Single color per type**: Loses the header/body color contrast information.
- **Full module mini-rendering**: Overkill for a thumbnail, performance cost.

**Implementation details**:
- Each rectangle: ~20×16px, split horizontally (top half = headerBgColor, bottom half = backgroundColor)
- Grid: 4 columns × 3 rows, fits inside a ~100×60px card area
- Wrapped in `React.memo` since preset data is stable

## R6: Font Family Preview

**Decision**: Show a sample text line rendered in each font family option within the fontFamily dropdown or adjacent to it.

**Rationale**: Users need to see the visual difference between Default (sans-serif), Monospace, and Serif to make an informed choice (user input item 6).

**Alternatives considered**:
- **Just labels**: Users might not know what "Monospace" looks like.
- **Separate preview panel**: Overcomplicates the UI for 3 options.

**Implementation details**:
- `FontFamilyPreview` component: renders 3 short text samples ("The quick brown fox") each styled with the corresponding font-family CSS
- Displayed inline below the font family Select control on each tab
- Font mapping: Default → `font-sans`, Monospace → `font-mono`, Serif → `font-serif` (Tailwind classes)

## R7: Missing API Functions

**Decision**: Add `renameUserPreset` to `src/api/presets.ts` and `applyPresetToNotebook` plus `updateNotebookStyles` to `src/api/notebooks.ts`.

**Rationale**: The existing API module has `createUserPreset` and `deleteUserPreset` but lacks rename. The backend contract for this feature also provides a dedicated apply-preset endpoint that should be used instead of reconstructing preset application client-side.

**Implementation details**:
- `renameUserPreset(id: string, name: string): Promise<UserSavedPreset>` → `PUT /users/me/presets/{id}` with `{ name }`
- `updateNotebookStyles(notebookId: string, styles: UpdateNotebookStyleInput[]): Promise<NotebookModuleStyle[]>` → `PUT /notebooks/{notebookId}/styles`
- `applyPresetToNotebook(notebookId: string, presetId: string): Promise<NotebookModuleStyle[]>` → `POST /notebooks/{notebookId}/styles/apply-preset/{presetId}`

## R8: User Preset Ordering

**Decision**: `GET /users/me/presets` is treated as a newest-first contract, so the frontend preserves server order rather than inventing a local sort key.

**Rationale**: The documented client model does not expose `createdAt`, and preserving backend order avoids hidden sorting heuristics.

**Implementation details**:
- `useUserPresets()` should preserve response order from the API
- No client-side re-sorting is required unless the backend contract changes to expose an explicit sortable field

