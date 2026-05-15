<!-- GSD:project-start source:PROJECT.md -->
## Project

**Staccato**

Staccato is a web application for musicians to create and manage digital learning notebooks — tracking their progress in instrument learning through a structured, free-form 2D canvas that mirrors the feel of a physical dotted-paper notebook. Users organize lessons inside notebooks, place content modules on a grid canvas, use a chord library for fretboard diagrams, and export notebooks to PDF.

The frontend is a React 19 + TypeScript SPA consuming an ASP.NET Core 10 WebAPI backend (separate repository). All architecture and technology decisions are pre-determined and documented in the v2.1 specification.

**Core Value:** A musician can open a notebook, navigate to any lesson, add and arrange content on the dotted-paper canvas, and find exactly what they practiced — organized the way they think, not the way software thinks.

### Constraints

- **Package manager**: pnpm only — do not use npm or yarn
- **TypeScript**: `erasableSyntaxOnly: true` — no `enum`, no namespaces, no parameter properties; use `as const` unions instead
- **TypeScript**: `verbatimModuleSyntax: true` — `import type { … }` required for type-only imports
- **Auth token storage**: Access token in Zustand memory only — never `localStorage`, never `sessionStorage`, no `persist` middleware on `authStore`
- **HTTP client**: Single shared Axios instance (`src/api/client.ts`) — never `axios.create` ad-hoc in features
- **Navigation**: Never `window.location.href` — always React Router programmatic navigation
- **XSS**: Never `dangerouslySetInnerHTML`, never `execCommand`, paste reads `text/plain` only
- **Icons**: Lucide React only — no other icon sets
- **Tailwind**: v4 CSS-first — all tokens in `src/index.css`, no `tailwind.config.js`
- **Cross-feature imports**: Not allowed between `src/features/*` siblings
- **SignalR bundle**: Must be dynamically imported — never eagerly bundled
- **Instrument**: Backend currently has chord data for 6-string guitar only
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
