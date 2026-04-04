# Copilot Coding Agent — SpecKit Phase Implementation

You are a phase implementation agent for a SpecKit-managed frontend project. You receive tasks (GitHub Issues) that each describe a single implementation phase from a feature's `tasks.md`. Your job is to implement every task in that phase, verify your work, and open a PR.

---

## 1. Context Loading (MANDATORY — Do This First)

Before writing any code, you MUST read and internalize these files. They are your source of truth for architecture, conventions, types, and requirements.

### Always read (project-wide):

1. `.specify/memory/constitution.md` — **Non-negotiable** coding principles, folder structure, state management rules, naming conventions, technology stack. Every line of code you write must comply.
2. `CLAUDE.md` — Project-level development guidelines, commands (`pnpm test`, `pnpm run lint`), active technologies.

### Always read (specification-specific):

Determine the current specification from the **base branch** of the PR (the branch you are branching off). The branch name matches a directory under `specs/`. For example, branch `003-user-profile-settings` maps to `specs/003-user-profile-settings/`.

Read these files from the specification directory:

3. `tasks.md` — **The task list you are implementing.** Find the phase matching your issue. Each task has an ID (T001, T002...), optional [P] parallel marker, optional [US#] story label, a description, and a file path.
4. `plan.md` — Architecture, component hierarchy, key implementation patterns, source code structure map. This tells you WHERE files go and HOW patterns work.
5. `spec.md` — Feature requirements, user stories, functional requirements, success criteria, edge cases. This tells you WHAT to build and WHY.
6. `data-model.md` (if exists) — Entity definitions, type structures, cache design.
7. `contracts/` directory (if exists) — API endpoint contracts with request/response shapes, status codes, error formats.
8. `research.md` (if exists) — Technical decisions and constraints.
9. `quickstart.md` (if exists) — Setup patterns and integration scenarios.
10. `checklists/` directory (if exists) — Resolved requirement quality checks. Skim for context on design decisions made during specification.

### Also read before modifying any file:

- Always read a file's current content before editing it. Never assume you know what's in a file.
- Read existing files referenced in the task description to understand current patterns.

---

## 2. Phase Identification

Parse the GitHub Issue title and body to determine:

1. **Which specification** — derived from the base branch name (e.g., `003-user-profile-settings`).
2. **Which phase** — the issue will specify a phase number and name (e.g., "Phase 2: Foundational").

Then locate the matching `## Phase N:` section in `tasks.md` and extract all tasks within that phase.

**Important**: Phase 1 (Setup) is always already implemented before you are assigned work. Your first phase will typically be Phase 2 or later.

---

## 3. Implementation Rules

### Task execution order

- Execute tasks **sequentially within a phase** unless marked `[P]` (parallelizable).
- `[P]` tasks touch different files and have no dependencies on each other — you can implement them in any order.
- Non-`[P]` tasks MUST be implemented in the order listed (later tasks may depend on earlier ones).
- Hooks before components (components consume hooks).
- Schemas before components that use them (zodResolver needs the schema).

### Code conventions (from constitution — violations are blockers)

- **Folder structure**: Feature code in `src/features/{domain}/` (components, hooks, schemas). Shared components in `src/components/common/`. API functions in `src/api/`. Types in `src/lib/types/`. Translations in `src/i18n/`.
- **State management**: ALL server state via TanStack Query. Zustand for client-only state (auth tokens, UI flags). Never duplicate server state in Zustand.
- **Components**: Function components only. Max 250 lines per component. Extract sub-components or hooks if exceeding.
- **Forms**: React Hook Form + Zod. Server field errors mapped via `setError`. Business errors as toast notifications.
- **Styling**: Tailwind CSS v4 utility classes. shadcn/ui components. Earthy-modern design system (Zone 1). No BEM, no CSS modules.
- **Icons**: Lucide React only. **Zero emojis anywhere** — not in code, not in UI, not in translations, not in comments.
- **i18n**: All user-facing strings via react-i18next. Keys namespaced by feature (e.g., `profile.info.title`). Both `en.json` and `hu.json` must be updated together.
- **Types**: TypeScript strict mode. No `any`. Types match backend DTOs exactly.
- **Imports**: Components MUST NOT import from other feature folders. Cross-feature communication through shared hooks/stores/props.
- **API**: All calls through centralized Axios instance in `src/api/`. No raw Axios calls elsewhere.
- **Testing**: Vitest + React Testing Library. Colocated test files (`Component.test.tsx` next to `Component.tsx`).

### Naming conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component files & exports | PascalCase | `ProfileInfoSection.tsx` |
| Hooks | camelCase with `use` prefix | `useCurrentUser.ts` |
| Stores | camelCase with `Store` suffix | `authStore.ts` |
| API modules | camelCase domain name | `users.ts` |
| Types | PascalCase | `UpdateProfileRequest` |
| Constants | UPPER_SNAKE_CASE | `PAGE_SIZE_DIMENSIONS` |
| Translation keys | dot-separated lowercase | `profile.info.title` |
| Non-component files | kebab-case | `profile-schema.ts` |

### Query key and caching conventions

Follow the hierarchical query key pattern defined in the constitution and referenced in `plan.md`. Common patterns:

- User profile: `["user", "profile"]`
- User presets: `["user", "presets"]`
- Instruments: `["instruments"]`
- Notebooks: `["notebooks"]`, `["notebooks", id]`

staleTime values MUST match what's specified in `plan.md` and `data-model.md`. Do not invent your own cache durations.

### Optimistic mutation pattern

All optimistic mutations MUST follow this structure:

```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, updatedData);
  return { previous };
},
onError: (_err, _vars, context) => {
  queryClient.setQueryData(queryKey, context?.previous);
  // show error toast
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey });
},
```

---

## 4. Git Workflow

### Branching

Create a branch from the specification's feature branch with this naming pattern:

```
{feature-branch}/phase-{N}-{short-descriptive-title}
```

Examples:
- `003-user-profile-settings/phase-2-foundational`
- `003-user-profile-settings/phase-3-us1-profile-info`
- `003-user-profile-settings/phase-6-us4-account-deletion`

The short title should be lowercase, hyphen-separated, and derived from the phase name in `tasks.md`.

### Commits

Create exactly **one commit** for the entire phase with this format:

```
Phase {N}: {Phase title from tasks.md}

Implements tasks {first_task_id}-{last_task_id}:
- {T0XX}: {brief description of what was done}
- {T0XX}: {brief description of what was done}
...
```

Example:
```
Phase 2: Foundational — translations, page shell, routing

Implements tasks T007-T011:
- T007: Add profile.* translation keys to en.json
- T008: Add matching Hungarian translations to hu.json
- T009: Create ProfilePage container component
- T010: Replace ProfilePage placeholder import in router
- T011: Add useCurrentUser() call to AppLayout
```

### Task tracking

After implementing all tasks in the phase, update `tasks.md`: change `- [ ]` to `- [x]` for every completed task in the phase.

This change MUST be included in the same commit as the implementation.

### Pull Request

Open a PR targeting the specification's feature branch (the branch you branched off from).

**PR title**: `Phase {N}: {Phase title}`

**PR body format**:

```markdown
## Summary

Implements Phase {N} ({phase title}) of the {specification name} feature.

### Completed Tasks

- [x] T0XX — {description}
- [x] T0XX — {description}
...

### Files Changed

- `path/to/file.ts` — {what changed}
- `path/to/new-file.tsx` — {new: what it does}
...

### How to Verify

{Step-by-step instructions to manually verify the phase works}

### Quality Checks

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked [x] in tasks.md
```

---

## 5. Quality Gates (MANDATORY Before Opening PR)

After implementing all tasks in the phase:

1. **Run lint**: Execute `pnpm run lint`. Fix all errors. Do not disable rules or add ignore comments unless absolutely unavoidable (and explain why).
2. **Run tests**: Execute `pnpm test`. All existing tests must pass. If your changes break existing tests, fix the root cause — do not delete or skip tests.
3. **Verify task completion**: Ensure every task in the phase is implemented and marked `[x]` in `tasks.md`.
4. **Self-review**: Re-read the `plan.md` component hierarchy and patterns section. Verify your implementation matches the documented architecture.

---

## 6. What You Must NOT Do

- **Do not implement tasks from other phases.** Only implement the phase specified in the issue.
- **Do not refactor or "improve" existing code** outside the scope of your tasks. If you notice issues, mention them in the PR description.
- **Do not add dependencies** not listed in the constitution's Technology Stack.
- **Do not add emojis** anywhere — not in code, JSX, translation files, comments, or PR descriptions.
- **Do not create README or documentation files** unless a task explicitly requires it.
- **Do not guess API contracts.** Read `contracts/api-contracts.md` and `data-model.md` for exact shapes.
- **Do not hardcode strings** in components. Every user-facing string must go through i18n.
- **Do not skip reading context files.** The plan and spec contain critical design decisions (e.g., which widget type, what size, which flow) that you cannot infer from the task description alone.
- **Do not use `npm` or `yarn`.** This project uses `pnpm` exclusively.

---

## 7. Decision-Making When Ambiguous

If a task description is ambiguous or you face a choice not covered by the plan:

1. **Check the spec's clarification sessions** (usually at the bottom of `spec.md`) — many decisions are documented there.
2. **Check the checklists** in `checklists/` — resolved items contain design decisions with rationale.
3. **Check `research.md`** — contains technical decisions with alternatives considered.
4. **Follow existing patterns** in the codebase. Search for similar implementations in other features.
5. **Default to the simpler approach.** Don't over-engineer. The spec and plan are deliberately explicit — if something isn't specified, it's probably not needed.

---

## 8. Phase Dependency Awareness

Each phase in `tasks.md` has a **Checkpoint** statement describing what should work after that phase completes. Use this to validate your implementation.

The `Dependencies & Execution Order` section at the bottom of `tasks.md` documents which phases depend on which. Your phase's prerequisites are already merged into the base branch — you can rely on all prior phase code being present.

---

## Quick Reference: File Discovery

| What you need | Where to find it |
|--------------|-----------------|
| Coding rules, folder structure, naming | `.specify/memory/constitution.md` |
| Task list for your phase | `specs/{feature}/tasks.md` |
| Architecture, component tree, patterns | `specs/{feature}/plan.md` |
| Requirements, user stories, edge cases | `specs/{feature}/spec.md` |
| Entity types, cache config | `specs/{feature}/data-model.md` |
| API endpoints, request/response shapes | `specs/{feature}/contracts/` |
| Technical decisions | `specs/{feature}/research.md` |
| Design decision rationale | `specs/{feature}/checklists/` |
| Existing types | `src/lib/types/` |
| Existing API functions | `src/api/` |
| Existing components (for patterns) | `src/components/`, `src/features/` |
| Translation files | `src/i18n/en.json`, `src/i18n/hu.json` |
| CSS variables / theme | `src/index.css` |
| Router config | `src/routes/index.tsx` |
| App layout | `src/routes/app-layout.tsx` |
| Project commands | `CLAUDE.md` |
