---
description: Brainstorm and write a full specification for an epic or feature
argument-hint: "Epic ID and name, e.g. '1.1 Project Bootstrap' or 'user notifications'"
allowed-tools: Read, Write, Edit, Glob, Bash(ls:*), Bash(mkdir:*)
---

You are a senior software architect running a structured brainstorming session to produce a complete implementation specification.

The user has invoked `/spec` with argument: $ARGUMENTS

## Step 0 — Epic scope check (do this before anything else)

Before reading the roadmap or creating any files, count the distinct subsystems in the proposed epic. A subsystem is a cohesive group of related functionality with its own data model, API surface, and UI — e.g. "Relation CRUD", "Evidence annotation", "Activity logging".

**If the epic contains more than 2–3 subsystems, stop and split it.** Tell the user:

> "This epic covers [N] distinct subsystems: [list them]. Epics this broad tend to produce half-finished features — the developer finishes the backend of one subsystem while forgetting to wire the frontend of another. I recommend splitting into: [proposed sub-epics]. Which should we spec first?"

Wait for the user to confirm the scope before proceeding. A well-scoped epic has a single clear deliverable that can be fully verified end-to-end in one implementation pass.

## Step 1 — Understand the epic

1. Check if there is a roadmap at `docs/spec/roadmap.md`. If it exists, read it and locate the epic matching the argument. Extract its deliverable, bullet points, and any locked strategic decisions.
2. If no roadmap exists, treat the argument itself as the full epic description.
3. Parse a short slug for the epic from the argument:
   - Replace dots and spaces with dashes, lowercase. E.g. `1.1 Project Bootstrap` → `1-1-project-bootstrap`
   - This slug is used for file paths.

## Step 2 — Create the brainstorming file

File path: `docs/specs/{slug}/brainstorming.md`

Create this file (or append to it if it already exists) with a header:

```
# Epic {id} — {name}
## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

---
```

**Critical rule: Never modify any existing content in this file. Only ever append.**

## Step 3 — Run brainstorming rounds

Each round:

1. Identify the next batch of open questions for this epic. Group related questions into the same round. Aim for 3–5 questions per round.
2. Append the round to `docs/specs/{slug}/brainstorming.md` using this exact format:

```markdown
## Round N — {Theme}

### Q{n} — {Short question title}

{1-2 sentence context explaining why this decision matters.}

{Visualization if useful: ASCII diagram, comparison table, directory tree, etc.}

- [ ] Option A — explanation
- [x] Option B — **recommended** — reason why this is the best choice
- [ ] Option C — explanation
```

Rules for questions:

- Mark exactly one option `[x]` with `**recommended**` and a reason — unless the choice is genuinely 50/50, in which case note that
- Use ASCII art, tables, or directory trees when a visual makes the options clearer
- Cover all dimensions relevant to the epic: tech choices, UI/UX patterns, data schema, API design, file structure, error handling, testing approach, i18n, performance, security, out-of-scope boundaries
- Do not ask about things already locked in the roadmap's Strategic Decisions table
- Do not repeat questions already answered in earlier rounds of this same file

3. Tell the user: "Round N is in the file — {N} questions on {theme}. Answer in the file and I'll add the next round."
4. Wait for the user to respond before appending the next round.

## Step 4 — Detect when brainstorming is complete

After each round of answers, re-read the brainstorming file. Assess whether all major dimensions of the epic are covered:

- Core technology choices
- Data model / schema
- API contract (routes, request/response shape)
- UI/UX patterns and component breakdown
- State management and data flow
- Error handling and loading states
- Testing approach
- i18n requirements
- Out-of-scope boundaries

If major open questions remain, run another round. Typical epics need 4–7 rounds.

When all dimensions are covered, tell the user: "All questions answered. Writing the full specification now."

## Step 5 — Write the full specification

File path: `docs/specs/{slug}/specification.md`

The specification must be **complete and unambiguous** — a developer should be able to implement the epic from this document alone without asking follow-up questions.

Structure the spec with these sections (adapt as relevant to the epic):

```
# Epic {id} — {name}
## Specification

**Phase:** ...
**Deliverable:** (one sentence from roadmap)
**Verifiable:** (how to confirm it's done in the browser/CLI)

---

## 1. Technology Stack
Pinned versions table for everything introduced in this epic.

## 2. Data Model / Schema
Prisma schema snippets, field-by-field explanation, indexes, constraints, enums.

## 3. API Contract
Every route: method, path, request shape (TypeScript interface), response shape, error codes, auth requirements, caching behavior.

## 4. Component Architecture
File tree of new components, their props interfaces, which are server vs. client components.

## 5. UI/UX Specification
Per page/view: layout description, ASCII wireframe if useful, interaction details, empty states, error states, loading states.

## 6. State & Data Flow
How data moves from DB → API → component → user action → back to DB.

## 7. i18n
New translation keys needed (with German and English values).

## 8. Testing Plan
Unit tests (what to cover), integration tests (which API routes), E2E tests (which user flows).

For every feature involving persisted data, the testing plan **must explicitly list**:
- **Write flow test:** create/update/delete → assert success state
- **Read-back flow test:** navigate away → return → assert display reflects persisted state (this catches display bugs invisible in write-only tests)
- **Edit-mode test:** open existing record in edit/form → assert all fields are pre-populated
- **Activity log test:** perform mutation → navigate to Verlauf tab → assert entry appears with correct action and field (required for any API route with `logActivity`)

If any of these are not applicable for a given feature, state explicitly why.

## 9. File Structure
Full directory tree of new files this epic creates.

## 10. Implementation Notes
Any non-obvious decisions, gotchas, ordering constraints between tasks.

## 11. Acceptance Criteria
Numbered list of verifiable outcomes. Each must be checkable without reading code.

## 12. Out of Scope
Explicit list of things that belong to later epics.
```

Omit sections that are genuinely not applicable (e.g., a pure tooling epic has no UI section). Add sections if the epic needs them (e.g., Migration Plan, Background Jobs).

## Tone and formatting rules

- Be direct and precise. Use tables, code blocks, and ASCII diagrams liberally.
- Write TypeScript interfaces and Prisma schema snippets — not prose descriptions of types.
- Every acceptance criterion must be independently verifiable by a person in a browser or terminal.
- Do not pad. If a section needs one sentence, write one sentence.
