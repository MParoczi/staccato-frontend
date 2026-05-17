# Phase 4: Notebook Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 04-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 04-notebook-management
**Areas discussed:** Dashboard layout, Create notebook flow, Notebook settings access, Book view structure

---

## Dashboard Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Grid of cards | 2-3 columns, reuses Card component | ✓ |
| List rows | Single-column with inline metadata | |
| Masonry / Pinterest-style | Variable-height cards | |

**Question 2 — Card info:**

| Option | Description | Selected |
|--------|-------------|----------|
| Title + cover color + instrument | Three core fields, clean | ✓ |
| Title + cover color + instrument + page size + lesson count | More metadata; lesson count needs extra API work | |
| Title + cover color only | Minimal | |

**Question 3 — New Notebook action:**

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right header button | Always discoverable | |
| First card as "+" slot | Visually integrated | |
| Both — header button + first-card slot | Maximum discoverability | ✓ |

**Question 4 — Empty state:**

| Option | Description | Selected |
|--------|-------------|----------|
| Centered illustration with CTA | Friendly, welcoming | ✓ |
| Subtle text + button only | Minimal | |
| You decide | Claude picks approach | |

---

## Create Notebook Flow

**Question 1 — Form presentation:**

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | In-context, reuses Dialog component | ✓ |
| Sheet/drawer from right | More room for fields | |
| Full-page form at /app/notebooks/new | Full focus, navigates away | |

**Question 2 — Fields shown:**

| Option | Description | Selected |
|--------|-------------|----------|
| Title + cover color + instrument | Minimal, others default silently | |
| All fields: title + cover + instrument + page size + style preset | Complete upfront configuration | ✓ |
| Title only | Maximum simplicity | |

**Question 3 — Cover color picker:**

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed palette of swatches | 8-12 presets, simple | ✓ |
| Full color picker (hex/HSL) | Free choice, needs library | |
| Named themes only | Friendly labels, less visual | |

**Question 4 — Style preset:**

| Option | Description | Selected |
|--------|-------------|----------|
| Select dropdown (5 system presets) | Plain select, no preview | |
| Visual preset picker (thumbnail swatches) | Small CSS-generated previews | ✓ |
| Hidden — default to Classic silently | Simplest form | |

---

## Notebook Settings Access

**Question 1 — Dashboard access:**

| Option | Description | Selected |
|--------|-------------|----------|
| ⋮ Context menu on each card | DropdownMenu, standard pattern | ✓ |
| Click card to open; settings only from inside | Settings discovery requires opening notebook | |
| Both — context menu + within notebook | Maximum flexibility | |

**Question 2 — Settings form:**

| Option | Description | Selected |
|--------|-------------|----------|
| Sheet/drawer from right | Stays in current view | |
| Edit dialog (pre-filled create dialog) | Consistent with create flow | ✓ |
| Dedicated settings page | Full-page, easy to extend | |

**Question 3 — Delete action:**

| Option | Description | Selected |
|--------|-------------|----------|
| In ⋮ context menu + confirmation dialog | Separate step before DELETE | ✓ |
| Delete button inside settings dialog | Shorter context menu | |
| Both — context menu + settings dialog | More surface area | |

---

## Book View Structure

**Question 1 — Cover page:**

| Option | Description | Selected |
|--------|-------------|----------|
| Full-bleed color + title + instrument centered | Atmospheric, physical notebook feel | ✓ |
| Color swatch panel + metadata list | More info-dense | |
| Skip cover, land on index | Faster but loses metaphor | |

**Question 2 — Navigation:**

| Option | Description | Selected |
|--------|-------------|----------|
| Top tab bar: Cover / Index / Lessons… | Standard, horizontal tabs | ✓ |
| Sidebar navigation drawer | More scalable, uses Sheet | |
| Breadcrumb + next/prev arrows | Immersive book metaphor | |

**Question 3 — Index page (Phase 4):**

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state: "No lessons yet" + placeholder | Honest, informative | ✓ |
| Skeleton placeholder rows | Hints at future content | |
| Blank white area | Minimal | |

**Question 4 — Back to dashboard:**

| Option | Description | Selected |
|--------|-------------|----------|
| Breadcrumb in Navbar: Notebooks > [Name] | Consistent with standard SaaS pattern | ✓ |
| Browser back + no Navbar change | Simplest | |
| Back button in page header | Separate from Navbar | |

---

## Claude's Discretion

- Color palette values (hex codes for 8–12 cover color swatches)
- Style preset thumbnail CSS rendering approach
- Grid breakpoints (2 vs 3 columns)
- Exact route structure for book view nested tabs

## Deferred Ideas

None — discussion stayed within Phase 4 scope.
