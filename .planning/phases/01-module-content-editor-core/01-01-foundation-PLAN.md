---
plan_id: 01-01-foundation
phase: 1
phase_name: Module Content Editor (Core)
wave: 1
depends_on: []
requirements: [EDIT-01]
autonomous: true
files_modified:
  - src/api/modules.ts
  - src/lib/types/modules.ts
  - src/features/styling/utils/module-type-config.ts
  - src/lib/types/text-spans.ts
  - src/i18n/en.json
  - src/i18n/hu.json
must_haves:
  truths:
    - "PUT /modules/{moduleId} client function exists and serializes the full module payload {moduleType, gridX, gridY, gridWidth, gridHeight, zIndex, content}."
    - "TextSpan type {text:string, bold:boolean} is the canonical span shape and is exported from @/lib/types."
    - "MODULE_ALLOWED_BLOCKS is exhaustively keyed by ModuleType; Title=['Date','Text']; Breadcrumb=[]; FreeText=all 10."
    - "Every i18n key from UI-SPEC §9 exists in both en.json and hu.json with the locked copy."
---

# Plan 01-01 — Foundation: API client, types, MODULE_ALLOWED_BLOCKS, i18n keys

<objective>
Establish the immovable substrate every later plan depends on: the `PUT /modules/{moduleId}` client function, the `TextSpan` type, the `MODULE_ALLOWED_BLOCKS` constant, and all 30+ i18n keys from UI-SPEC §9.
</objective>

## Tasks

<task id="1.1" type="execute">
  <action>
    Add `updateModuleFull` to `src/api/modules.ts` immediately below the existing `updateModule` (PATCH) export. Signature:

    ```ts
    /**
     * Replace the full module record via `PUT /modules/{moduleId}`.
     *
     * Sends the entire module payload — moduleType, all five layout fields,
     * zIndex, and the full `content: BuildingBlock[]`. Used by the module
     * content editor (Phase 1) for last-write-wins persistence of edits.
     * Layout-only updates continue to flow through `updateModuleLayout`.
     */
    export async function updateModuleFull(
      moduleId: string,
      data: {
        moduleType: ModuleType;
        gridX: number;
        gridY: number;
        gridWidth: number;
        gridHeight: number;
        zIndex: number;
        content: BuildingBlock[];
      },
    ): Promise<Module> {
      const res = await apiClient.put<Module>(`/modules/${moduleId}`, data);
      return res.data;
    }
    ```
    Add `ModuleType` to the imports at the top of the file (next to `Module`, `CreateModuleInput`, etc.). Do not modify or remove the existing `updateModule` (PATCH) — it stays for backward compatibility.
  </action>
  <read_first>
    - src/api/modules.ts (current state — PATCH `updateModule` exists, PUT does not)
    - src/lib/types/modules.ts (Module, BuildingBlock shapes)
    - src/lib/types/common.ts (ModuleType union)
    - src/api/client.ts (apiClient axios instance)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export async function updateModuleFull" src/api/modules.ts` exits 0
    - `grep -q "apiClient.put<Module>(\`/modules/\${moduleId}\`" src/api/modules.ts` exits 0
    - The existing `export async function updateModule(` line still exists (`grep -c "export async function updateModule(" src/api/modules.ts` returns 1)
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="1.2" type="execute">
  <action>
    Create `src/lib/types/text-spans.ts` exporting:

    ```ts
    /**
     * The canonical span shape used by all text-bearing building blocks
     * (Text, SectionHeading, BulletList items, NumberedList items, table
     * cells, etc. as they ship in later phases). The only formatting bit
     * is `bold` — italic, underline, color, and font-size are explicitly
     * out of scope for v1 (per F9 spec).
     */
    export interface TextSpan {
      text: string;
      bold: boolean;
    }

    /** Type guard — narrows unknown to TextSpan. */
    export function isTextSpan(value: unknown): value is TextSpan {
      return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as TextSpan).text === 'string' &&
        typeof (value as TextSpan).bold === 'boolean'
      );
    }
    ```

    Add the re-export `export type { TextSpan } from './text-spans';` and `export { isTextSpan } from './text-spans';` to `src/lib/types/index.ts` (read the file first to confirm barrel pattern).
  </action>
  <read_first>
    - src/lib/types/index.ts (barrel exports — confirm pattern before editing)
    - src/lib/types/modules.ts (BuildingBlock — confirm `[key: string]: unknown` lets TextSpan-bearing blocks store `spans: TextSpan[]`)
  </read_first>
  <acceptance_criteria>
    - `test -f src/lib/types/text-spans.ts` exits 0
    - `grep -q "export interface TextSpan" src/lib/types/text-spans.ts` exits 0
    - `grep -q "isTextSpan" src/lib/types/text-spans.ts` exits 0
    - `grep -q "TextSpan" src/lib/types/index.ts` exits 0
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="1.3" type="tdd">
  <action>
    Add `MODULE_ALLOWED_BLOCKS` to `src/features/styling/utils/module-type-config.ts` (its locked home per CONTEXT canonical refs):

    ```ts
    import type { BuildingBlockType, ModuleType } from '@/lib/types';

    /**
     * Per-module-type whitelist of building blocks the editor (Phase 1+)
     * may insert. Enforced both in the Add Block popover (UI gate) and in
     * the optimistic state mutation (defense-in-depth).
     *
     * - Title: only `Date` and `Text` (UI-SPEC §4.4 / §4.12).
     * - Breadcrumb: empty — content auto-generated from subtitle modules.
     * - FreeText: all 10 BuildingBlockType values.
     * - Other 9 module types: see table below (sourced from F9 prompt).
     */
    export const MODULE_ALLOWED_BLOCKS: Record<ModuleType, readonly BuildingBlockType[]> = {
      Title: ['Date', 'Text'],
      Breadcrumb: [],
      Subtitle: ['Text'],
      Theory: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList', 'Table', 'MusicalNotes', 'ChordProgression', 'ChordTablatureGroup'],
      Practice: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList', 'Table', 'MusicalNotes', 'ChordProgression', 'ChordTablatureGroup'],
      Example: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList', 'Table', 'MusicalNotes', 'ChordProgression', 'ChordTablatureGroup'],
      Important: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList'],
      Tip: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList'],
      Homework: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList', 'Table'],
      Question: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList'],
      ChordTablature: ['Text', 'ChordTablatureGroup'],
      FreeText: ['SectionHeading', 'Date', 'Text', 'BulletList', 'NumberedList', 'CheckboxList', 'Table', 'MusicalNotes', 'ChordProgression', 'ChordTablatureGroup'],
    } as const;

    /** Returns true if the given block type may be inserted into a module of the given type. */
    export function isBlockAllowed(moduleType: ModuleType, blockType: BuildingBlockType): boolean {
      return MODULE_ALLOWED_BLOCKS[moduleType].includes(blockType);
    }
    ```

    Co-locate tests at `src/features/styling/utils/module-type-config.test.ts` (extend file if it already exists; else create). Tests required:

    1. **Exhaustiveness:** every `ModuleType` has an entry; every `BuildingBlockType` referenced is a real enum value (test by iterating `Object.keys(MODULE_ALLOWED_BLOCKS)`).
    2. `MODULE_ALLOWED_BLOCKS.Title` deep-equals `['Date','Text']`.
    3. `MODULE_ALLOWED_BLOCKS.Breadcrumb` deep-equals `[]`.
    4. `MODULE_ALLOWED_BLOCKS.FreeText` length === 10 and includes every value in the `BuildingBlockType` union.
    5. `isBlockAllowed('Title', 'Text')` is true; `isBlockAllowed('Title', 'BulletList')` is false; `isBlockAllowed('Breadcrumb', 'Text')` is false; `isBlockAllowed('FreeText', 'ChordProgression')` is true.
  </action>
  <read_first>
    - src/features/styling/utils/module-type-config.ts (current contents — extend, don't replace)
    - src/lib/types/common.ts (ModuleType + BuildingBlockType unions)
    - frontend-speckit-prompts.md lines 1402-1547 (F9 prompt — module-type-to-allowed-blocks mapping rationale)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export const MODULE_ALLOWED_BLOCKS" src/features/styling/utils/module-type-config.ts` exits 0
    - `grep -q "export function isBlockAllowed" src/features/styling/utils/module-type-config.ts` exits 0
    - `pnpm test module-type-config` exits 0 with at least 5 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="1.4" type="execute">
  <action>
    Add every key listed in UI-SPEC §9 to `src/i18n/en.json` and `src/i18n/hu.json` under the appropriate namespaces. The keys + verbatim copy are:

    - `editor.edit`, `editor.addBlock`, `editor.bold`, `editor.undo`, `editor.redo`, `editor.dragHandle`, `editor.deleteBlock`, `editor.textSpanLabel`, `editor.textSpanPlaceholder`, `editor.placeholderBlockA11y`, `editor.breadcrumbAutoGen`, `editor.breadcrumbNoSave`
    - `editor.saving`, `editor.saved`, `editor.saveFailed`
    - `editor.blockType.sectionHeading`, `editor.blockType.date`, `editor.blockType.text`, `editor.blockType.bulletList`, `editor.blockType.numberedList`, `editor.blockType.checkboxList`, `editor.blockType.table`, `editor.blockType.musicalNotes`, `editor.blockType.chordProgression`, `editor.blockType.chordTablatureGroup`
    - `editor.deleteBlockTitle`, `editor.deleteBlockDescription`, `editor.deleteBlockConfirm`
    - `editor.unsavedTitle`, `editor.unsavedDescription`, `editor.unsavedKeepEditing`, `editor.unsavedDiscard`
    - Server error translations under `editor.errors.invalidBuildingBlock` and `editor.errors.breadcrumbContentNotEmpty` — copy: EN "This block isn't allowed in this module type." / "Breadcrumb modules can't have content — it's filled in automatically."; HU "Ez a blokk nem engedélyezett ebben a modultípusban." / "A morzsamodulok nem tartalmazhatnak tartalmat — automatikusan töltődik ki."

    Use the exact EN + HU copy from UI-SPEC §9.1–9.6. Verify `common.save` and `common.cancel` already exist; do NOT duplicate them.

    Maintain JSON sort order of the existing namespace; nest under `editor` and `editor.blockType` per the keys above. Both files MUST stay valid JSON (`pnpm test` and `pnpm tsc` will fail otherwise but specifically: `node -e "JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf-8'))"` and same for hu must exit 0).
  </action>
  <read_first>
    - src/i18n/en.json (existing structure — preserve, don't reformat)
    - src/i18n/hu.json (existing structure — preserve, don't reformat)
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md (sections 9.1–9.6 — copy is locked)
  </read_first>
  <acceptance_criteria>
    - `node -e "JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf-8'))"` exits 0
    - `node -e "JSON.parse(require('fs').readFileSync('src/i18n/hu.json','utf-8'))"` exits 0
    - `grep -q "\"saving\"" src/i18n/en.json` exits 0
    - `grep -q "\"unsavedDiscard\"" src/i18n/en.json` exits 0
    - `grep -q "\"unsavedDiscard\"" src/i18n/hu.json` exits 0
    - `grep -q "\"breadcrumbAutoGen\"" src/i18n/en.json && grep -q "\"breadcrumbAutoGen\"" src/i18n/hu.json` exits 0
    - At least 30 new editor.* keys exist in each locale: `node -e "const j=require('./src/i18n/en.json'); const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?flat(v,p+k+'.'):[p+k]); const keys=flat(j).filter(k=>k.startsWith('editor.')); process.exit(keys.length>=30?0:1)"` exits 0
  </acceptance_criteria>
</task>

## Verification

```bash
pnpm tsc --noEmit
pnpm test module-type-config
pnpm run lint
```
All three commands MUST exit 0.

## Wave Notes

This plan is wave 1 (no dependencies). Plans 01-02 and 01-03 can run in parallel with this one — they don't import from these files yet, but every wave-2+ plan does.

