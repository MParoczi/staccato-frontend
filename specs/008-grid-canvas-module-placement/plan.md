# Implementation Plan: Grid Canvas & Module Placement

**Branch**: `008-grid-canvas-module-placement` | **Date**: 2026-04-22 | **Spec**: `specs/008-grid-canvas-module-placement/spec.md`
**Input**: Feature specification from `specs/008-grid-canvas-module-placement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver the notebook lesson-page canvas for module placement and layout management: render a dotted-paper page at true grid dimensions, load and style existing modules, support selection, snapping drag/resize, add/delete/layer actions, and zoom/pan interactions without violating page bounds or overlap rules. The plan uses `@dnd-kit/core` for dragging, custom resize handles for snapped grid resizing, an `O(n)` overlap validator, first-fit auto-placement for new modules, and TanStack Query optimistic updates with 500 ms delayed `PATCH /modules/{id}/layout` persistence.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode) with React 19  
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), TanStack Query v5, Zustand 5, Axios, react-i18next, Lucide React, `@dnd-kit/core`  
**Storage**: REST API server state via TanStack Query; client-only selection/zoom state in Zustand with zoom persisted as a UI preference  
**Testing**: Vitest + React Testing Library + MSW  
**Target Platform**: Modern desktop browsers (Chrome/Firefox/Safari/Edge latest 2) with pointer, wheel, and keyboard support  
**Project Type**: Single-page web application (frontend)  
**Performance Goals**: Canvas render with existing modules <2s under normal load; drag/resize remains visually smooth for typical pages with 10-20 modules; invalid-state feedback appears in <1s  
**Constraints**: 5 mm logical grid; page-size bounds from `PAGE_SIZE_DIMENSIONS`; zoom range 50%-200% in 10% steps; all drag/resize math must flow through `pixelsToGridUnits(px, zoom) = Math.round(px / gridUnitsToPixels(1, zoom))`; overlap detection stays `O(n)`; no additional resize library; layout PATCH debounced by 500 ms  
**Scale/Scope**: Single lesson page at a time, 12 module types, typical page density 10-20 modules, module content editing deferred to Feature 9

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Folder Structure & Module Boundaries | ✅ PASS | Canvas-specific code stays inside `src/features/notebooks/` because the lesson editor route already lives there; shared constants/types remain in `src/lib/` and API access stays in `src/api/modules.ts`. |
| II. State Management | ✅ PASS | Page modules remain TanStack Query server state under `['pages', pageId, 'modules']`; Zustand is limited to selected module id and zoom preference. Optimistic updates follow `onMutate/onError/onSettled`. |
| III. API Integration Discipline | ✅ PASS | Existing and new layout calls go through the centralized Axios client in `src/api/modules.ts`, with a new dedicated `updateModuleLayout()` helper for `PATCH /modules/{id}/layout`. |
| IV. Component Architecture | ✅ PASS | `LessonPage` remains the route-level container; memoized canvas/module components stay presentational; drag/resize and mutation orchestration move into hooks/utilities to keep component sizes below the 250-line guideline. |
| V. Design System — Two Zones | ✅ PASS | The canvas remains Zone 2: warm off-white dotted paper, subtle page-edge border/shadow, earthy selection outline, muted terracotta conflict highlight, and shell controls styled to blend with the existing notebook chrome. |
| VI. No Emojis | ✅ PASS | All feedback and controls use Lucide icons only. |
| VII. Form Handling & Validation | ✅ PASS | The add-module picker and delete confirmations are not form-heavy; business-rule errors stay in toast notifications, while placement validation is handled via pure utilities before mutation. |
| VIII. Routing & Navigation | ✅ PASS | No new routes. The existing lesson-page route becomes the canvas entry point. |
| IX. Internationalization | ✅ PASS | All new labels, errors, menu items, and zoom/add-module strings must be added to `src/i18n/en.json` and `src/i18n/hu.json`. |
| X. Type Safety | ✅ PASS | Existing `Module`, `ModuleType`, `PageSize`, and style types are extended with typed layout payload helpers; `any` is not introduced. |
| XI. Performance Patterns | ✅ PASS | Each module card is `React.memo`-wrapped, drag preview is isolated in `DragOverlay`, overlap detection remains linear, and content-heavy module bodies are explicitly deferred to lazy/virtualized rendering work in Feature 9. |
| XII. Testing | ✅ PASS | Grid math, overlap detection, first-fit placement, bounds validation, optimistic rollback, and lesson-page integration flows are all covered in the plan's test targets. |

**Gate result (pre-design)**: ✅ All checks pass. Proceeding to Phase 0.

**Gate result (post-design)**: ✅ All checks still pass after the design artifacts below. No justified violations required.

## Project Structure

### Documentation (this feature)

```text
specs/008-grid-canvas-module-placement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── api.md           # Backend contracts consumed by the canvas
│   └── ui-contracts.md  # Canvas interaction contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── modules.ts                         # + updateModuleLayout(), keep create/delete helpers aligned to backend contracts
├── components/
│   └── common/
│       └── DottedPaper.tsx               # evolve or replace to support true grid sizing, page edge treatment, and zoom-aware dots
├── features/
│   └── notebooks/
│       ├── components/
│       │   ├── LessonPage.tsx            # replace placeholder with real canvas composition
│       │   ├── GridCanvas.tsx            # DndContext, page surface, pan/zoom event wiring
│       │   ├── CanvasViewportControls.tsx# zoom in/out/reset controls
│       │   ├── ModuleCard.tsx            # memoized positioned module shell with style application
│       │   ├── ModuleDragOverlay.tsx     # snapped semi-transparent ghost preview
│       │   ├── ModuleResizeHandles.tsx   # eight custom resize handles
│       │   ├── AddModulePicker.tsx       # 12-type picker, first-fit placement entry
│       │   └── ModuleContextMenu.tsx     # delete + layering actions
│       ├── hooks/
│       │   ├── usePageModules.ts         # query for `['pages', pageId, 'modules']`
│       │   ├── useModuleLayoutMutations.ts # optimistic move/resize/layer/delete/create mutations
│       │   ├── useCanvasInteractions.ts  # selection, drag state, resize state, wheel handling
│       │   └── useCanvasZoomShortcuts.ts # Ctrl+/0 keyboard shortcuts
│       └── utils/
│           ├── grid-layout.ts            # gridUnitsToPixels, pixelsToGridUnits, bounds helpers
│           ├── overlap.ts                # checkOverlap()
│           ├── placement.ts              # firstAvailablePosition()
│           ├── layout-validation.ts      # min-size, bounds, overlap validation
│           └── z-index.ts                # bring-to-front/send-to-back calculations
├── lib/
│   ├── constants/
│   │   └── grid.ts                       # + base pixel unit / zoom constants if centralized here
│   └── types/
│       └── modules.ts                    # + typed layout mutation payloads/view models
├── stores/
│   └── uiStore.ts                        # clamp/persist zoom in 50%-200% range; selected module id already present
└── i18n/
    ├── en.json                           # + notebooks.canvas.* strings
    └── hu.json                           # + notebooks.canvas.* strings
```

**Structure Decision**: Single-project React SPA. The lesson-page route already lives in `src/features/notebooks/`, so the canvas implementation stays in that domain to avoid cross-feature imports. `src/api/modules.ts` owns backend contracts, `src/features/notebooks/` owns canvas UI/hooks/utils, shared math types stay in `src/lib/`, and `src/stores/uiStore.ts` remains the only client-state holder for selection and zoom preference.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations or exceptional complexity exemptions are required for this feature.

