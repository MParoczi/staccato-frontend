---
phase: 1
phase_name: Module Content Editor (Core)
date: 2026-04-28
status: draft
design_system: shadcn/ui (existing) + Tailwind v4 + Lucide
---

# UI-SPEC — Phase 1: Module Content Editor (Core)

> Locks the visual + interaction contract for every new surface introduced by Phase 1.
> The design system, palette, typography families, and primitives are **already established**
> by Features 1–8 of Staccato. This spec does **not** introduce new colors, fonts, or libraries —
> it specifies exactly how the editor surfaces compose against them.

## 0. Scope & Inheritance

| Layer | Source of Truth | Notes |
| --- | --- | --- |
| Tokens (color, spacing, radius, shadow) | `src/index.css` (Tailwind v4 `@theme`) | Reuse existing earthy palette tokens. |
| Primitives (`Button`, `Popover`, `AlertDialog`, `Tooltip`) | `src/components/ui/*` (shadcn via unified `radix-ui` package) | Reuse — never re-skin. |
| Icons | `lucide-react` | Stroke 1.5 px, size 16 px in chrome / 14 px in inline toolbar buttons. |
| Notebook content typography | `src/features/styling/` per-module style record (F7) | The block render surface uses module style; chrome does **not**. |
| i18n | `src/i18n/en.json` + `src/i18n/hu.json` | Every visible string in section 9. |

Two visual contexts coexist inside one module while editing:

1. **App chrome** (toolbar, popover, AlertDialog, Edit/Save/Cancel buttons, drag handle, delete button, edit-mode glow, save indicator) — earthy/warm chrome palette.
2. **Notebook content surface** (the rendered block list, contentEditable TextSpan) — dotted-paper background + notebook typography from F7.

The editor is the *only* place where these two contexts touch; section 5 defines the boundary.

---

## 1. Spacing

**Scale:** Tailwind default 4-pt step (`0.5 = 2px`, `1 = 4px`, `2 = 8px`, `3 = 12px`, `4 = 16px`, `6 = 24px`, `8 = 32px`, `12 = 48px`). Use only these stops. No arbitrary values for editor surfaces.

| Surface | Padding | Gap (between siblings) | Notes |
| --- | --- | --- | --- |
| Editor toolbar (top of module, locked position) | `px-3 py-2` (12 / 8) | `gap-1` (4) between icon buttons; `gap-3` (12) between groups | Toolbar height fixed at 40 px so it never reflows. |
| Add Block popover content | `p-2` (8); each item `px-3 py-2` (12 / 8) | `gap-1` between items | Width 240 px; max-height `60vh` with `overflow-y-auto`. |
| Per-block hover chrome (drag handle + delete) | Handle column 24 px wide, `mr-2` (8) from block; delete button `p-1` (4), `ml-2` (8) | — | Handle + delete sit in a 24 px gutter that is reserved at all viewport widths. |
| AlertDialog (delete-confirm + nav-guard) | shadcn defaults (`p-6` content, `gap-4` actions) | — | Reused as-is. |
| Block separation inside module canvas | `gap-3` (12) between blocks | — | Tighter than reading-mode (`gap-4`) so drop targets stay reachable. |
| Edit-mode glow inset | `outline-offset-2` (2 px) | — | Glow lives on a wrapper, never intrudes into block content. |
| Save indicator | `gap-1.5` (6) between icon + label | — | Sits flush right inside toolbar. |

**Touch targets:** every interactive element ≥ 32 × 32 px (toolbar icon buttons use `h-8 w-8`); drag handle hit-zone widened to 24 × 32 px via padding.

**Responsive floor:** Editor must remain functional in the smallest grid cell width of the F8 layout (≈ 280 px content). At < 360 px the toolbar collapses to icon-only (labels move to tooltips); the Add Block popover anchors `align="start" side="bottom"` and uses `collisionPadding: 8` so it never overflows the canvas.

---

## 2. Typography

Two type contexts. **Chrome** = system-ui sans (existing Staccato chrome font). **Content** = the module's notebook style record (F7); this spec only fixes the *contentEditable* defaults and placeholder text style.

### 2.1 Chrome typography (toolbar, buttons, popover items, dialog, save indicator)

| Token | Size / px | Line-height | Weight | Usage |
| --- | --- | --- | --- | --- |
| `text-xs` | 12 | 1.4 | 500 (medium) | Save indicator label, tooltips, drag-handle aria text. |
| `text-sm` | 14 | 1.5 | 500 (medium) | Toolbar button labels, popover items, Edit/Save/Cancel button labels, AlertDialog description. |
| `text-base` | 16 | 1.5 | 600 (semibold) | AlertDialog title. |
| `text-lg` | 18 | 1.3 | 600 (semibold) | (Reserved — not used in Phase 1 chrome.) |

**Two weights only in chrome:** `font-medium` (500) and `font-semibold` (600). No bold (700) in chrome.

### 2.2 Content typography

- contentEditable TextSpan inherits the module's notebook style (font family, size, line-height, color) from F7. This spec does **not** override.
- **Bold** inside TextSpan is rendered with `font-weight: 700` (notebook strong). The toolbar Bold toggle wraps selection in a strong-style mark.
- **Placeholder block** (`[Type — coming soon]`) renders in the module's notebook font but at `font-style: italic`, `opacity: 0.6`, and uses neutral muted color (see §3) — never the accent.
- **Breadcrumb auto-gen message** uses chrome `text-sm` italic at `text-muted-foreground` so it visually separates from any real notebook content.

---

## 3. Color (60 / 30 / 10)

The earthy palette already lives in `src/index.css` `@theme` and tailwind tokens. This spec **assigns roles**, never redefines values.

| Role | Token (Tailwind / CSS var) | % of Editor Pixel Real Estate | Used For |
| --- | --- | --- | --- |
| Dominant 60 % | `bg-background` (warm off-white / dotted-paper) + module canvas | 60 % | Module content surface (notebook canvas), toolbar background. |
| Secondary 30 % | `bg-card`, `bg-muted`, `border-border` (warm gray browns) | 30 % | Toolbar surface, popover surface, AlertDialog surface, drag handle hover, delete-button hover bg, placeholder-block bg. |
| Accent 10 % | `--color-primary` / `bg-primary` (warm brown) — exposed as new CSS var **`--editor-edit-glow`** that defaults to `var(--color-primary)` at 35 % alpha | 10 % | **Reserved for:** (a) edit-mode border/glow on the active module, (b) Bold toggle active state, (c) Save button (primary CTA), (d) toolbar focus rings. Nothing else. |
| Semantic — destructive | `--color-destructive` | rare | Reserved for: (a) AlertDialog destructive action button (Discard / Delete block), (b) save-failed state of the save indicator (icon + label tinted destructive). Never on hover-only chrome. |
| Muted text | `text-muted-foreground` | — | Save indicator idle label, placeholder block, breadcrumb auto-gen message, drag-handle resting state. |

**Edit-mode glow contract:**

```css
--editor-edit-glow: color-mix(in oklab, var(--color-primary) 35%, transparent);
--editor-edit-glow-ring: var(--color-primary);
```

Wrapper applies `outline: 2px solid var(--editor-edit-glow-ring); outline-offset: 2px; box-shadow: 0 0 0 6px var(--editor-edit-glow);` only when `data-edit-mode="true"`. STYLE-01 may later move these vars into per-module style records.

**Z-index ordering (locked):**

```
canvas (0)  <  selection chrome (10)  <  edit-mode glow wrapper (20)
            <  toolbar (30)            <  popover / dropdown (40)
            <  AlertDialog overlay (50) <  Toast (60, existing)
```

**Hover / active / focus states (chrome):**

- Hover: bg shifts to `bg-muted/60` for ghost buttons; no color shift on filled buttons.
- Active (pressed): `bg-muted` for ghost; `brightness-95` for filled.
- Focus: `outline-2 outline-offset-2 outline-ring` (existing token). Never remove the focus ring.
- Bold toggle active: `bg-primary/15 text-primary` + `aria-pressed="true"`.

**Motion:**

- Edit-mode glow appears with `transition: outline-color 150ms ease, box-shadow 200ms ease`. No keyframed pulse.
- Save indicator transitions opacity over 200 ms; "Saved" badge auto-fades to 0 over 1.5 s after settle (`transition-opacity duration-300` + delay).
- Hover-revealed chrome (drag handle, delete button) fades in over 100 ms (`opacity-0 group-hover:opacity-100 transition-opacity`). Always visible when block is keyboard-focused (see §6).
- All motion respects `@media (prefers-reduced-motion: reduce)` → durations collapse to 0 ms, fades become instant.

---

## 4. Surface-by-Surface Contract

### 4.1 Module selection chrome + Edit button

- Module wrapper gets a thin `outline outline-1 outline-border` when *selected but not editing*; outline upgrades to the edit-mode glow contract above when editing.
- **Edit button**: `<Button variant="ghost" size="sm">` with `Pencil` icon (14 px) + label `t('editor.edit')`. Anchored top-right of the selected module, offset `top-2 right-2`. Visible only when module is selected AND not in edit mode. Activates on click, `Enter`, `Space`. Coexists with F9 click gestures (gestures are alternative entry; this button is the discoverable + a11y-mandated entry).

### 4.2 Edit-mode visual indicator

- See §3 glow contract. Driven by `data-edit-mode="true"` on the module wrapper.
- The active module is the *only* module that carries the glow at any time (single-edit invariant — F8 already enforces).

### 4.3 Editor toolbar

- **Position:** top of the module (locked), inside the edit-mode wrapper, `sticky top-0` relative to the module so it stays reachable while scrolling within the module canvas. Height 40 px.
- **Surface:** `bg-card border-b border-border rounded-t-md` matching the module's existing border radius.
- **Layout (left → right):**
  1. Add Block button — `<Button variant="ghost" size="sm">` with `Plus` 14 px + `t('editor.addBlock')`. Opens Popover.
  2. Divider (`w-px h-5 bg-border`).
  3. Bold toggle — `<Button variant="ghost" size="icon" aria-pressed={isBold}>` with `Bold` 14 px. Active style per §3.
  4. Divider.
  5. Undo — `Button variant="ghost" size="icon"` + `Undo2` 14 px. Disabled when stack empty (`disabled:opacity-40`).
  6. Redo — same pattern + `Redo2`.
  7. Spacer (`flex-1`).
  8. Save indicator (§4.6).
  9. Divider.
  10. Cancel — `<Button variant="ghost" size="sm">` + `t('common.cancel')`.
  11. Save — `<Button variant="default" size="sm">` + `t('common.save')`. **Primary CTA — only filled-accent button in this surface.**
- All buttons have tooltips (Tooltip primitive) at `delayDuration={300}`.
- Keyboard shortcut hints appear inside tooltips: "Bold (Ctrl+B)", "Undo (Ctrl+Z)", "Redo (Ctrl+Shift+Z)".

### 4.4 Add Block popover

- Primitive: shadcn `Popover` (`align="start" side="bottom" sideOffset={6} collisionPadding={8}`).
- Width: `w-60` (240 px). Max-height `60vh`, scrollable.
- Anchor: Add Block button.
- **Content:** vertical list of items, one per allowed block type from `MODULE_ALLOWED_BLOCKS[moduleType]`. Each item is a `<button>` with: 16 px Lucide icon (left, `text-muted-foreground`) + i18n label `text-sm` + (when relevant) keyboard hint `text-xs text-muted-foreground` right-aligned.
- Item hover: `bg-muted`. Active/keyboard-focused: `bg-muted` + `outline-ring`.
- Roving focus: `Arrow Up/Down` cycles, `Enter` inserts, `Esc` closes and returns focus to Add Block button.
- **Title module**: the popover lists exactly `Date` and `Text`. Other types are not rendered (not "rendered disabled" — completely omitted) to keep the surface honest.
- **Breadcrumb module**: Add Block button is itself disabled (Tooltip explains: `t('editor.breadcrumbAutoGen')`).

### 4.5 Per-block editing chrome

- Block wrapper uses `group relative` so drag handle + delete button reveal on hover.
- **Drag handle:** Lucide `GripVertical` 16 px in `text-muted-foreground`. 24 × 32 px hit area. Cursor `grab` resting / `grabbing` active. Always rendered to the left of the block in a fixed 24 px gutter (reserves space so layout doesn't shift on hover). `aria-label={t('editor.dragHandle')}`. Keyboard drag: `Space` to lift, `Arrow Up/Down` to move, `Space` again to drop, `Esc` to cancel (see §6).
- **Delete button:** Lucide `Trash2` 14 px in `text-muted-foreground`, `<Button variant="ghost" size="icon" className="h-7 w-7">`. Right side of the block, `top-1 right-1` absolute. Hover: `text-destructive bg-destructive/10`. **Not visually aggressive at rest** — muted gray only, never red until hover/focus. `aria-label={t('editor.deleteBlock')}`.
- Visibility: `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[selected=true]:opacity-100`. Always visible during keyboard navigation.

### 4.6 Save indicator

- Four states, mutually exclusive:
  1. **Idle** — no element rendered (or `opacity-0`).
  2. **Saving** — Lucide `Loader2` 14 px with `animate-spin` (skipped under reduced-motion → static dot) + `text-xs text-muted-foreground` label `t('editor.saving')` ("Saving…").
  3. **Saved** — Lucide `Check` 14 px in `text-primary` + `text-xs text-muted-foreground` label `t('editor.saved')` ("Saved"). Auto-fades after 1.5 s.
  4. **Failed** — Lucide `AlertCircle` 14 px in `text-destructive` + `text-xs text-destructive` label `t('editor.saveFailed')` ("Couldn't save — try again"). Persists until next save attempt.
- `role="status" aria-live="polite"` on Saving/Saved; `role="alert"` on Failed.

### 4.7 Block delete confirmation

- Reuse existing `AlertDialog` primitive (same component used by delete-notebook / delete-lesson).
- **Triggered only when** the block has non-empty content (empty blocks delete immediately with no dialog).
- Title: `t('editor.deleteBlockTitle')` — "Delete this block?"
- Description: `t('editor.deleteBlockDescription')` — "This block has content. Deleting it can't be undone after you save."
- Cancel button (`AlertDialogCancel`): label `t('common.cancel')`, default variant.
- Confirm button (`AlertDialogAction`, destructive variant): label `t('editor.deleteBlockConfirm')` — "Delete block".
- Default focus: Cancel.

### 4.8 TextSpan editor (contentEditable)

- Element: `<div contentEditable suppressContentEditableWarning role="textbox" aria-multiline="false" aria-label={t('editor.textSpanLabel')}>`.
- Inherits notebook style from F7 (font, size, line-height, color, letter-spacing). This spec does not override.
- Selection style: native browser selection — but with `::selection { background: color-mix(in oklab, var(--color-primary) 25%, transparent); }` scoped to the editor.
- Caret color: `caret-color: var(--color-primary)`.
- **Bold:** `Ctrl+B` / `Cmd+B` toggles `font-weight: 700` on the selection via a selection-mark wrapper (per CONTEXT.md decision 2: contentEditable + manual span tracking; do **not** rely on `document.execCommand`). Toolbar Bold toggle reflects current selection state.
- Placeholder (when block is empty AND focused): `t('editor.textSpanPlaceholder')` — "Start writing…" rendered via `:before` content, `text-muted-foreground italic`.

### 4.9 Placeholder block (unimplemented types)

- Rendered as: `<div role="note" aria-label={t('editor.placeholderBlockA11y', { type })}>` containing italic muted text `[{TypeLabel} — coming soon]`.
- Background: `bg-muted/40`, border `border border-dashed border-border`, padding `px-3 py-2`, radius `rounded-sm`.
- Not editable. Drag/delete chrome still works (so user can re-order or remove).

### 4.10 Breadcrumb-module empty-content state

- When a module of type `Breadcrumb` enters edit mode, the editor body (block list area) is replaced by a single static panel:
  - Centered, `py-8`, `bg-muted/30 border border-dashed border-border rounded-md`.
  - Lucide `Info` 16 px in `text-muted-foreground` + `text-sm italic text-muted-foreground` label `t('editor.breadcrumbAutoGen')` — "Content is auto-generated from subtitle modules."
- Toolbar's Add Block button is disabled (per §4.4); Save is disabled with tooltip `t('editor.breadcrumbNoSave')` — "Nothing to save here." Cancel + edit-mode exit still work.

### 4.11 Dirty-state navigation guard AlertDialog

- Reuse `AlertDialog` primitive.
- **Trigger condition (locked by CONTEXT.md decision 4):** route change attempt while edit-mode is active AND last save attempt failed (i.e. dirty + failed). Successful debounced saves do NOT trigger.
- Title: `t('editor.unsavedTitle')` — "You have unsaved changes."
- Description: `t('editor.unsavedDescription')` — "Your last save didn't go through. Leaving now will discard your latest edits."
- Cancel button: `t('editor.unsavedKeepEditing')` — "Keep editing". Default focus.
- Action button (destructive): `t('editor.unsavedDiscard')` — "Discard changes".

### 4.12 Title-module constraint

- Enforced *visually* by §4.4 (popover lists only Date + Text).
- No additional surface — selection set is filtered upstream by `MODULE_ALLOWED_BLOCKS.Title`.

---

## 5. Chrome ↔ Content Boundary

The edit-mode wrapper has two regions:

```
┌─ wrapper (data-edit-mode=true; glow on outer outline) ────────┐
│ ┌─ Toolbar (chrome context: app fonts, earthy chrome) ──────┐ │
│ │ [+ Add Block] | B | ↶ ↷    Saving… | Cancel | [Save]      │ │
│ └────────────────────────────────────────────────────────────┘ │
│ ┌─ Block canvas (notebook context: F7 style) ───────────────┐ │
│ │ ┊ <handle>  block 1 (notebook typography)        <delete> │ │
│ │ ┊ <handle>  block 2 contentEditable…             <delete> │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

The boundary is a `border-b border-border` line under the toolbar. No background gradient, no shadow — keep it crisp so the notebook canvas reads as paper, not as a panel.

---

## 6. Accessibility (STAB-02 ready)

| Requirement | How |
| --- | --- |
| Every interactive element has an accessible name | Toolbar buttons: visible label OR `aria-label` (icon-only). Drag handle: `aria-label={t('editor.dragHandle')}`. Delete: `aria-label={t('editor.deleteBlock')}`. |
| Toggle state exposed | Bold toggle uses `aria-pressed`. |
| Disabled state exposed | `disabled` attribute (not just visual opacity) for Undo/Redo/Save. |
| Keyboard activation | Native `<button>` everywhere — Enter + Space work for free. Edit button activates on Enter/Space. |
| Roving focus inside Add Block popover | Arrow keys cycle, Esc closes, focus returns to trigger. |
| Keyboard drag-and-drop | Drag handle: Space to lift (`aria-grabbed="true"` plus dnd-kit's keyboard sensor), Arrows to move (announce position via `aria-live`), Space to drop, Esc to cancel. |
| Focus visible | Existing `outline-ring` token, never `outline-none` without replacement. |
| Save status announced | `role="status" aria-live="polite"` on Saving/Saved; `role="alert"` on Failed. |
| Dialog semantics | `AlertDialog` primitive provides `role="alertdialog"`, focus trap, Esc cancel. |
| contentEditable a11y | `role="textbox"`, `aria-multiline="false"`, `aria-label`, `aria-describedby` linking to placeholder when empty. |
| Color-not-only signaling | Save Failed: icon + label + color. Bold active: `aria-pressed` + bg + weight. Edit mode: glow + `data-edit-mode` + `aria-label="Editing"`. |
| Contrast | All chrome text uses existing tokens already validated ≥ 4.5:1 in F1–F7. Placeholder italic uses `text-muted-foreground` which is ≥ 4.5:1 on `bg-background`. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` collapses all transitions to 0 ms; spinner becomes static dot. |
| `eslint-plugin-jsx-a11y` clean | Every interactive element in this spec maps to a native `<button>`/`<a>`/`<input>` or shadcn primitive that already passes the rule set. No `onClick` on `<div>`. |

---

## 7. Design-System Alignment

| Decision | Reuses | New |
| --- | --- | --- |
| Button | shadcn `Button` (variants: `default`, `ghost`, `destructive`; sizes: `sm`, `icon`) | none |
| Popover | shadcn `Popover` | none |
| AlertDialog | shadcn `AlertDialog` (same primitive used by F2/F3 delete flows) | none |
| Tooltip | shadcn `Tooltip` | none |
| Icons | `lucide-react`: `Pencil`, `Plus`, `Bold`, `Undo2`, `Redo2`, `Check`, `Loader2`, `AlertCircle`, `GripVertical`, `Trash2`, `Info`, plus block-type icons (`Type`, `Calendar`, `List`, `ListOrdered`, `CheckSquare`, `Table2`, `Music2`, `Music3`, `Music4`) — final mapping in §8 | none |
| Color | Existing `@theme` tokens | One CSS var alias `--editor-edit-glow` (defaults to `color-mix(primary, 35%)`) so STYLE-01 can override per-module without touching the editor. |
| Typography | Existing chrome `font-sans` + per-module notebook font from F7 | none |
| Spacing | Tailwind defaults | none |
| Radius / Shadow | Existing `--radius` + shadow scale | none |
| Registry safety | Only shadcn official primitives (already vendored). No third-party registry. | n/a |

**Registry safety:** No third-party registries. All primitives already live in the repo. **Safety Gate: not applicable — no external block ingested in this phase.**

---

## 8. Block-Type Inventory (Add Block popover order + icons)

Order matches `MODULE_ALLOWED_BLOCKS` for the active module type. Icon + label per type — using the actual 10 `BuildingBlockType` values from `src/lib/types/common.ts`:

| Block type | Lucide icon | i18n key | Status in P1 |
| --- | --- | --- | --- |
| `SectionHeading` | `Heading` | `editor.blockType.sectionHeading` | Placeholder. |
| `Date` | `Calendar` | `editor.blockType.date` | Placeholder. |
| `Text` | `Type` | `editor.blockType.text` | **Implemented** (TextSpan editor). |
| `BulletList` | `List` | `editor.blockType.bulletList` | Placeholder. |
| `NumberedList` | `ListOrdered` | `editor.blockType.numberedList` | Placeholder. |
| `CheckboxList` | `CheckSquare` | `editor.blockType.checkboxList` | Placeholder. |
| `Table` | `Table2` | `editor.blockType.table` | Placeholder. |
| `MusicalNotes` | `Music2` | `editor.blockType.musicalNotes` | Placeholder. |
| `ChordProgression` | `Music3` | `editor.blockType.chordProgression` | Placeholder. |
| `ChordTablatureGroup` | `Music4` | `editor.blockType.chordTablatureGroup` | Placeholder. |

All allowed types are selectable from the popover (subject to `MODULE_ALLOWED_BLOCKS` filtering). Selecting an unimplemented type inserts a placeholder block (§4.9) — never an error.

---

## 9. Copywriting Contract (locked, en + hu)

Add to `src/i18n/en.json` and `src/i18n/hu.json` under the namespaces shown.

### 9.1 Common (reuse if already present; verify keys exist)

| Key | EN | HU |
| --- | --- | --- |
| `common.save` | Save | Mentés |
| `common.cancel` | Cancel | Mégse |

### 9.2 Editor chrome

| Key | EN | HU |
| --- | --- | --- |
| `editor.edit` | Edit | Szerkesztés |
| `editor.addBlock` | Add block | Blokk hozzáadása |
| `editor.bold` | Bold | Félkövér |
| `editor.undo` | Undo | Visszavonás |
| `editor.redo` | Redo | Újra |
| `editor.dragHandle` | Drag to reorder | Húzd át a sorrend módosításához |
| `editor.deleteBlock` | Delete block | Blokk törlése |
| `editor.textSpanLabel` | Block text | Blokk szövege |
| `editor.textSpanPlaceholder` | Start writing… | Kezdj írni… |
| `editor.placeholderBlockA11y` | `{type}` block — coming soon | `{type}` blokk — hamarosan |
| `editor.breadcrumbAutoGen` | Content is auto-generated from subtitle modules. | A tartalom automatikusan a feliratmodulokból készül. |
| `editor.breadcrumbNoSave` | Nothing to save here. | Itt nincs mit menteni. |

### 9.3 Save indicator

| Key | EN | HU |
| --- | --- | --- |
| `editor.saving` | Saving… | Mentés… |
| `editor.saved` | Saved | Mentve |
| `editor.saveFailed` | Couldn't save — try again | A mentés nem sikerült — próbáld újra |

### 9.4 Block-type labels

| Key | EN | HU |
| --- | --- | --- |
| `editor.blockType.sectionHeading` | Section heading | Szakaszcím |
| `editor.blockType.date` | Date | Dátum |
| `editor.blockType.text` | Text | Szöveg |
| `editor.blockType.bulletList` | Bullet list | Felsorolás |
| `editor.blockType.numberedList` | Numbered list | Számozott lista |
| `editor.blockType.checkboxList` | Checklist | Teendőlista |
| `editor.blockType.table` | Table | Táblázat |
| `editor.blockType.musicalNotes` | Musical notes | Kotta |
| `editor.blockType.chordProgression` | Chord progression | Akkordmenet |
| `editor.blockType.chordTablatureGroup` | Chord tablature | Akkordtáblázat |

### 9.5 Delete-block AlertDialog

| Key | EN | HU |
| --- | --- | --- |
| `editor.deleteBlockTitle` | Delete this block? | Törlöd ezt a blokkot? |
| `editor.deleteBlockDescription` | This block has content. Deleting it can't be undone after you save. | A blokk tartalmaz adatot. Mentés után a törlés nem vonható vissza. |
| `editor.deleteBlockConfirm` | Delete block | Blokk törlése |

### 9.6 Unsaved-changes nav-guard AlertDialog

| Key | EN | HU |
| --- | --- | --- |
| `editor.unsavedTitle` | You have unsaved changes. | Nem mentett változásaid vannak. |
| `editor.unsavedDescription` | Your last save didn't go through. Leaving now will discard your latest edits. | Az utolsó mentés nem sikerült. Ha most kilépsz, elveszíted a friss módosításokat. |
| `editor.unsavedKeepEditing` | Keep editing | Maradok |
| `editor.unsavedDiscard` | Discard changes | Változások elvetése |

**No emojis anywhere** — per project brief.

---

## 10. State Matrix (per surface)

| Surface | Default | Hover | Focus | Active / Pressed | Disabled | Loading | Error | Empty |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Edit button | ghost, muted icon | `bg-muted/60` | ring | — | n/a | — | — | — |
| Toolbar Add Block | ghost | `bg-muted/60` | ring | popover open → `bg-muted` | when breadcrumb module | — | — | — |
| Bold toggle | ghost | `bg-muted/60` | ring | `bg-primary/15 text-primary` (`aria-pressed`) | when no selection | — | — | — |
| Undo / Redo | ghost | `bg-muted/60` | ring | — | when stack empty | — | — | — |
| Save | filled accent | `brightness-95` | ring | depressed | when no dirty changes / breadcrumb | spinner inside button (Saving) | tinted destructive ring + tooltip | — |
| Cancel | ghost | `bg-muted/60` | ring | — | — | — | — | — |
| Drag handle | hidden | revealed muted | revealed + ring | grabbing cursor + `bg-muted` | n/a | — | — | — |
| Delete button | hidden | revealed `text-destructive bg-destructive/10` | revealed + ring | — | n/a | — | — | — |
| Add Block popover items | muted icon + label | `bg-muted` | `bg-muted` + ring | — | filtered out (not rendered) | — | — | "No blocks available" message in popover when allowed list empty (defensive — shouldn't happen). |
| TextSpan | empty → placeholder visible | — | caret + `::selection` accent | — | — | — | — | placeholder shown |
| Save indicator | hidden | — | — | — | — | spinner + "Saving…" | "Couldn't save — try again" destructive | — |
| Edit-mode glow | absent | — | — | present when `data-edit-mode=true` | — | — | — | — |

---

## 11. Acceptance Checklist (mirrors gsd-ui-checker dimensions)

- [x] **Spacing** — only Tailwind 4-pt steps; touch targets ≥ 32 px; 24 px gutter reserved for handle/delete at all viewports.
- [x] **Typography** — chrome uses 2 weights (500, 600) across `text-xs` / `text-sm` / `text-base`; content inherits F7 notebook style; placeholder + breadcrumb message use italic muted token.
- [x] **Color** — 60/30/10 assigned (canvas 60, chrome surfaces 30, accent 10 reserved for edit-glow + Save + Bold-active + focus); destructive scoped to AlertDialog destructive button + save-failed; new var `--editor-edit-glow` is the only addition.
- [x] **Copywriting** — every visible string has en + hu keys (§9); CTA verbs are concrete ("Save", "Add block", "Delete block", "Discard changes"); no emojis.
- [x] **Design-system alignment** — only existing shadcn primitives + Lucide icons; no new component library; no third-party registry; shadcn already initialized.
- [x] **Accessibility** — names, roles, aria-pressed/disabled, keyboard drag, focus visible, reduced motion, save status live region, dialog focus trap, contentEditable role/label — all locked. STAB-02 lint set will pass.

---

## 12. Open Questions

None. All 11 surfaces from the phase brief are locked. CONTEXT.md decisions (registry seed = Text only; contentEditable + manual span tracking; whole-module undo stack; route-only dirty guard fired only on save-failed; shared 1000 ms debounce; F9 gestures + Edit button) are honored.

