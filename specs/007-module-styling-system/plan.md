# Implementation Plan: Module Styling System

**Branch**: `007-module-styling-system` | **Date**: 2026-04-21 | **Spec**: `specs/007-module-styling-system/spec.md`
**Input**: Feature specification from `specs/007-module-styling-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build the module styling system for Staccato notebooks, consisting of:
1. A **style editor** opened from an icon-only Paintbrush toolbar trigger with tooltip `Styles`, rendered as a desktop-only right-side Sheet drawer (~480 px wide) with a single horizontal scrollable tab row for 12 module types, live preview, subtle unsaved-changes indicator, and save-all behavior.
2. A **preset browser** showing 5 system presets and user-saved presets as color-swatch thumbnail cards, with user presets rendered in the newest-first order returned by `GET /users/me/presets` and one-click apply guarded by a confirmation when unsaved editor changes would be replaced.
3. **User preset management**: save-as-preset (allowed even when styles match an existing preset if the name is unique), rename from a pencil icon with Enter/blur commit and Escape cancel, delete (with confirmation), capped at 20.

All server state flows through TanStack Query with optimistic updates. No new libraries required — hex input + curated swatch palette for color picking, shadcn/ui Sheet for the drawer, Tabs for module type navigation, and basic keyboard interaction support limited to Tab traversal plus Enter/Escape for popovers.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode) with React 19  
**Primary Dependencies**: React Hook Form, Zod, TanStack Query v5, Zustand, shadcn/ui (Radix primitives), Tailwind CSS v4, Axios, Lucide React, react-i18next  
**Storage**: Server-side via REST API (no local persistence)  
**Testing**: Vitest + React Testing Library + MSW  
**Target Platform**: Modern desktop browsers (Chrome/Firefox/Safari/Edge latest 2); no mobile-specific layout in this feature  
**Project Type**: Single-page web application (frontend)  
**Performance Goals**: Live preview <100ms, editor open <2s, preset apply <3s  
**Constraints**: No new libraries outside constitution stack; max 250 lines per component; desktop-only drawer for now; basic keyboard navigation only; backend guarantees style fetches return exactly 12 provisioned records so no client fallback generation  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Folder Structure & Module Boundaries | ✅ PASS | Feature code stays in `src/features/styling/`, API in `src/api/`, types in `src/lib/types/`. Composition happens in `src/routes/notebook-layout.tsx`, and `NotebookToolbar` only receives props/callbacks so no feature imports cross boundaries. |
| II. State Management | ✅ PASS | Server state via TanStack Query (`["notebooks", id, "styles"]`, `["user", "presets"]`, `["presets"]`). Editor form state is local (React Hook Form). No Zustand for server data. |
| III. API Integration Discipline | ✅ PASS | All calls via `src/api/notebooks.ts` and `src/api/presets.ts` using centralized Axios client. |
| IV. Component Architecture | ✅ PASS | Presentational components (StylePreview, ColorPicker, PresetCard) + container/feature components (StyleEditorDrawer, PresetBrowser). All function components. |
| V. Design System — Two Zones | ✅ PASS | Style editor is App Shell (Zone 1, earthy theme). Live preview renders a Zone 2 notebook-style mock on dotted-paper background. |
| VI. No Emojis | ✅ PASS | All icons via Lucide React (Paintbrush, Check, Trash2, Pencil, Plus, AlertTriangle). |
| VII. Form Handling & Validation | ✅ PASS | React Hook Form + Zod for the 12-style editor form. Hex validation in schema. Server errors mapped via setError / toast. |
| VIII. Routing & Navigation | ✅ PASS | No new routes. Editor opens as a Sheet overlay from the notebook toolbar. |
| IX. Internationalization | ✅ PASS | All strings via `t()`. New namespace: `styling.*`. Both en.json and hu.json updated. |
| X. Type Safety | ✅ PASS | Existing types (`NotebookModuleStyle`, `SystemStylePreset`, `UserSavedPreset`, `StyleEntry`, `ModuleType`, `BorderStyle`, `FontFamily`) already defined. |
| XI. Performance Patterns | ✅ PASS | Optimistic updates via onMutate/onError/onSettled. staleTime 0 for styles (notebook data). Memo on PresetCard thumbnails. |
| XII. Testing | ✅ PASS | Zod schema tests with 100% branch coverage, utility branch-coverage tests, API-module tests with MSW mocks, hook tests, and component/integration tests with RTL are all required in the execution plan. |

**Gate result**: ✅ All checks pass. No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/007-module-styling-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── notebooks.ts         # + updateNotebookStyles (bulk PUT), applyPresetToNotebook
│   └── presets.ts            # + renameUserPreset, /users/me/presets helpers
├── features/
│   └── styling/
│       ├── components/
│       │   ├── StyleEditorDrawer.tsx      # Right-side ~480 px Sheet, icon-triggered open state, dirty indicator
│       │   ├── StyleEditorTab.tsx         # Controls for one module type
│       │   ├── StylePreview.tsx           # Live mock module card preview
│       │   ├── ColorPickerPopover.tsx     # Hex input + swatch palette in Popover
│       │   ├── PresetBrowser.tsx          # System + user preset grid (user presets newest first)
│       │   ├── PresetCard.tsx             # Thumbnail card with color swatches
│       │   ├── SavePresetDialog.tsx       # Name input dialog for saving preset
│       │   └── FontFamilyPreview.tsx      # Sample text in each font
│       ├── hooks/
│       │   ├── useNotebookStyles.ts       # TanStack Query hook for styles
│       │   ├── useStyleMutations.ts       # Save styles, apply preset mutations
│       │   ├── useSystemPresets.ts        # TanStack Query hook for system presets
│       │   └── useUserPresets.ts          # TanStack Query + mutations for user presets
│       └── utils/
│           ├── style-schema.ts           # Zod schemas for style form
│           ├── style-defaults.ts         # UI constants only: swatch palette, tab order, font preview defaults
│           ├── style-serialization.ts    # StyleEntry serialize/deserialize helpers
│           └── module-type-config.ts     # Per-type control visibility + disabled border controls when style=None
├── lib/
│   └── types/
│       └── styles.ts          # Already exists (SystemStylePreset, UserSavedPreset, StyleEntry)
├── routes/
│   └── notebook-layout.tsx   # + compose drawer open state and pass toolbar callback
└── i18n/
    ├── en.json               # + styling.* namespace
    └── hu.json               # + styling.* namespace
```

**Structure Decision**: Single-project React SPA. Feature code stays grouped under `src/features/styling/` per constitution Principle I, while `src/routes/notebook-layout.tsx` owns the drawer open state and passes an `onOpenStyles` callback into `NotebookToolbar` to avoid cross-feature imports. Types already exist in `src/lib/types/styles.ts` and `src/lib/types/notebooks.ts`. API functions extend existing `src/api/notebooks.ts` and `src/api/presets.ts`. The UI remains desktop-only in this feature and relies on a right-side Sheet drawer with a horizontally scrollable tab strip.
