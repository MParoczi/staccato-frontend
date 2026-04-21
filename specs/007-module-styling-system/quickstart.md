# Quickstart: Module Styling System

**Feature**: 007-module-styling-system  
**Branch**: `007-module-styling-system`

## Prerequisites

- Node.js LTS installed
- Repository cloned, dependencies installed (`pnpm install`)
- Backend API running (or MSW mocks active for development)
- At least one notebook created with provisioned styles (backend guarantees each notebook style fetch returns exactly 12 style records)

## Development Setup

```bash
# Switch to feature branch
git checkout 007-module-styling-system

# Install dependencies (if not already)
pnpm install

# Start dev server
pnpm run dev
```

## Feature Entry Points

### Opening the Style Editor

The style editor is triggered from `NotebookToolbar` (existing component at `src/features/notebooks/components/NotebookToolbar.tsx`), but the actual drawer state is composed in `src/routes/notebook-layout.tsx` to preserve constitution-compliant feature boundaries. An icon-only Paintbrush button with tooltip `Styles` calls an `onOpenStyles` prop, and `NotebookLayout` opens the `StyleEditorDrawer` as a right-side Sheet panel (~480 px wide) on desktop.

### Key Files to Create

| File | Purpose |
|------|---------|
| `src/features/styling/components/StyleEditorDrawer.tsx` | Main Sheet container with horizontal tab navigation, dirty indicator, and Save button |
| `src/features/styling/components/StyleEditorTab.tsx` | Style controls for a single module type |
| `src/features/styling/components/StylePreview.tsx` | Live preview mock module card |
| `src/features/styling/components/ColorPickerPopover.tsx` | Hex input + swatch palette color picker |
| `src/features/styling/components/PresetBrowser.tsx` | System and user preset cards |
| `src/features/styling/components/PresetCard.tsx` | Thumbnail card with color swatch grid |
| `src/features/styling/components/SavePresetDialog.tsx` | Dialog for naming a new preset |
| `src/features/styling/components/FontFamilyPreview.tsx` | Font sample text display |
| `src/features/styling/hooks/useNotebookStyles.ts` | TanStack Query hook for notebook styles |
| `src/features/styling/hooks/useStyleMutations.ts` | Mutations for saving styles and applying presets |
| `src/features/styling/hooks/useSystemPresets.ts` | TanStack Query hook for system presets |
| `src/features/styling/hooks/useUserPresets.ts` | TanStack Query + mutations for user presets |
| `src/features/styling/utils/style-schema.ts` | Zod validation schemas |
| `src/features/styling/utils/style-defaults.ts` | UI constants only: swatch palette, tab order, and font preview defaults (not fallback notebook style records) |
| `src/features/styling/utils/style-serialization.ts` | Serialize/deserialize `StyleEntry.stylesJson` payloads |
| `src/features/styling/utils/module-type-config.ts` | Per-type control visibility |

### Key Files to Modify

| File | Change |
|------|--------|
| `src/api/notebooks.ts` | Add `updateNotebookStyles()` and `applyPresetToNotebook()` helpers |
| `src/api/presets.ts` | Add `renameUserPreset()` function |
| `src/routes/notebook-layout.tsx` | Compose the style drawer open state and pass an `onOpenStyles` callback into `NotebookToolbar` |
| `src/features/notebooks/components/NotebookToolbar.tsx` | Add icon-only Styles trigger button with tooltip to open the drawer |
| `src/i18n/en.json` | Add `styling.*` translation keys |
| `src/i18n/hu.json` | Add `styling.*` translation keys |

## Architecture Overview

```
NotebookLayout
  ├── NotebookToolbar
  │   └── [Paintbrush icon, tooltip "Styles"] ──calls──> onOpenStyles()
  └── StyleEditorDrawer (Sheet, right side, ~480 px, desktop only)
      ├── Tabs (12 module types in one horizontal scroll row)
      │   └── StyleEditorTab
      │       ├── ColorPickerPopover (×3–5 per tab, Enter/Escape support)
      │       ├── Select (borderStyle, fontFamily)
      │       ├── Number inputs (borderWidth, borderRadius)
      │       ├── FontFamilyPreview
      │       └── StylePreview (live mock card)
      ├── PresetBrowser
      │   ├── PresetCard (system ×5)
      │   └── PresetCard (user ×0–20, server-provided newest-first order)
      ├── Unsaved changes indicator
      ├── Save button
      └── SavePresetDialog
```

## Data Flow

1. **On editor open**: `useNotebookStyles(notebookId)` fetches from `["notebooks", id, "styles"]` cache → populates React Hook Form via `reset()`
2. **On field change**: Form state updates locally → `watch()` feeds `StylePreview` for live preview and toggles the subtle dirty-state indicator
3. **On Save**: `handleSubmit` → `updateNotebookStyles` mutation → optimistic cache update; Title/Subtitle hidden properties are preserved from server-loaded values
4. **On Apply Preset**: if form is dirty, show confirmation first → `applyPresetToNotebook` mutation via `POST /notebooks/{id}/styles/apply-preset/{presetId}` → `reset()` form with returned styles → optimistic cache update
5. **On Save as Preset**: read form values → serialize to `StyleEntry[]` using the 9 canonical camelCase style keys → `createUserPreset` mutation; identical style payloads may still be saved as separate presets when the new name is unique
6. **On Border Style = None**: disable `borderColor`, `borderWidth`, and `borderRadius` inputs until a visible border style is selected again
7. **On Rename Preset**: click the preset card pencil icon → inline edit mode opens → Enter or blur commits, Escape cancels
8. **On Load User Presets**: preserve the newest-first order returned by `GET /users/me/presets` rather than applying a client-side sort heuristic

## Testing Strategy

```bash
# Run all tests
pnpm test

# Run styling feature tests only
pnpm test -- --filter styling
```

### Test priorities:
1. **Zod schemas** (`style-schema.test.ts`): valid/invalid hex, range validation, form shape
2. **Utilities** (`module-type-config.test.ts`, `style-serialization.test.ts`): disabled-control rules and serialization branch coverage
3. **API modules** (`src/api/notebooks.test.ts`, `src/api/presets.test.ts`): request shaping and response handling with MSW mocks
4. **Hooks** (`useStyleMutations.test.ts`): optimistic update, rollback on error (MSW mocks), preset-apply confirmation when dirty
5. **Components** (`ColorPickerPopover.test.tsx`): hex input validation, swatch click behavior, Enter/Escape keyboard handling
6. **Integration** (`StyleEditorDrawer.test.tsx`): open via icon-only trigger → edit → unsaved indicator → save flow; horizontal tab row; rename via pencil icon with Enter/blur commit and Escape cancel; duplicate rename error; save-as-preset allowed for identical styles when name differs

## Validation Checklist

- Measure drawer open responsiveness against `SC-001` (<2s) in a desktop dev/prod-like build
- Validate live preview response against `SC-002` (<100ms) while editing representative fields
- Validate preset apply against `SC-003` (<3s) with both clean and dirty forms
- Validate color picker popover open/close timing against `FR-048` (~150ms target)
- Validate success and destructive toast behavior, including ~5 second auto-dismiss and manual dismissal affordances
- Validate the feature on the latest two desktop versions of Chrome, Firefox, Safari, and Edge
