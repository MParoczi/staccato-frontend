<!-- PROJECT CONTEXT -->
For current project context and active phase, read `.planning/STATE.md`,
`.planning/PROJECT.md`, and `.planning/ROADMAP.md`.
For codebase conventions, stack, structure, and known concerns, read the
files under `.planning/codebase/` (STACK, INTEGRATIONS, ARCHITECTURE,
STRUCTURE, CONVENTIONS, TESTING, CONCERNS).
For frontend dev guidelines (active tech, commands, code style), read
`CLAUDE.md`.

`specs/001..008/` are kept as a read-only historical record of features
delivered before the GSD migration. `frontend-speckit-prompts.md` is
retained as a PRD source — its F9–F17 prompt blocks are well-formed
feature briefs that feed `/gsd-discuss-phase` as initial context. Do not
treat `specs/` or those prompts as current implementation guidance.
<!-- /PROJECT CONTEXT -->

<!-- GSD Configuration — managed by get-shit-done installer -->
# Instructions for GSD

- Use the get-shit-done skill when the user asks for GSD or uses a `gsd-*` command.
- Treat `/gsd-...` or `gsd-...` as command invocations and load the matching file from `.github/skills/gsd-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply GSD workflows unless the user explicitly asks for them.
- After completing any `gsd-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
<!-- /GSD Configuration -->
