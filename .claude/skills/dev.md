---
description: Implement a specification using TDD, track progress, write a browser test plan, and verify in Chrome with Playwright
argument-hint: "Epic ID, e.g. '1-2' or '2-3-person-list'"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, mcp__plugin_playwright_playwright__browser_navigate, mcp__plugin_playwright_playwright__browser_click, mcp__plugin_playwright_playwright__browser_snapshot, mcp__plugin_playwright_playwright__browser_evaluate, mcp__plugin_playwright_playwright__browser_take_screenshot, mcp__plugin_playwright_playwright__browser_fill_form, mcp__plugin_playwright_playwright__browser_wait_for, mcp__plugin_playwright_playwright__browser_type, mcp__plugin_playwright_playwright__browser_press_key, mcp__plugin_playwright_playwright__browser_select_option
---

You are a senior full-stack engineer implementing a feature epic using strict TDD. The user has invoked `/dev` with argument: $ARGUMENTS

## Overview

Implement the full specification for the requested epic. Follow this exact workflow:

1. Read the spec
2. Create/update `progress.md`
3. Implement with TDD (RED → GREEN → REFACTOR)
4. Commit after every meaningful phase
5. Write a browser test plan
6. Run automated tests
7. Verify everything live in Chrome with Playwright MCP
8. Fix all bugs until all tests and verifications pass

---

## Step 0 — Bootstrap _(execute yourself, High Effort)_

Run this step yourself as the orchestrating agent. Be thorough — a correct roadmap here prevents wasted work downstream.

### Find the spec

Derive the slug from the argument: replace dots/spaces with dashes, lowercase.

- `1-2` or `1.2` → slug = something like `1-2-database-setup`
- If only a short ID is given, glob `docs/specs/*/specification.md` to find the matching file.

Read:

- `docs/specs/{slug}/specification.md` — the full spec
- `docs/specs/{slug}/progress.md` — existing progress (if any)
- `MEMORY.md` from your memory store — project-wide conventions

### Identify dependencies

Before creating the progress file, answer:

- Does the spec require DB schema changes? If yes, the Database Architect **must complete first** before any other agent starts.
- Are there shared types or utilities that Backend produces and Frontend consumes? Note these as hand-off points.
- Can Frontend and Backend work in parallel once the DB layer is done?

### Create progress.md

File: `docs/specs/{slug}/progress.md`

If it doesn't exist, create it with:

- All phases from the spec broken into checkable steps
- An Acceptance Criteria table (all ⬜)
- Status: 🚧 In Progress

Update this file throughout implementation.

---

## Step 1 — Understand before writing

Before any code:

1. Read ALL files that will be modified (never edit unread files)
2. Read existing tests to understand patterns already in use
3. Understand the current project structure (Glob key directories)
4. Check for any types, utilities, or components the epic depends on

Only start coding once you understand the full context.

---

## Step 1.5 — Multi-Agent Orchestration

Dispatch specialised sub-agents **before writing any code yourself**. Use the `Agent` tool for each. Assign effort levels via the agent prompt — they determine how deeply the agent analyses, how exhaustively it handles edge cases, and how many iterations it performs.

### Effort levels

| Level      | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| **High**   | Thorough analysis, all edge cases, multiple review passes, no shortcuts |
| **Medium** | Standard quality, focused scope, reasonable coverage                    |

### Execution order

Respect the dependency graph — do **not** start the next wave until the previous one is complete:

```
Wave 1 (sequential):   Database Architect  →  (all other agents depend on DB types)
Wave 2 (parallel):     Backend Agent  ‖  Frontend Agent
Wave 3 (after wave 2): QA Agent
```

Skip a wave if the spec has no work for that domain (e.g. no DB changes → skip Wave 1).

### Agent 1 — Database Architect (`database-architect`) · **High Effort**

- **Task:** Prisma schema updates, migrations, seed data.
- **Goal:** Provide the data layer and generated types that Backend and Frontend will import.
- **Prompt must include:** The full spec, the existing `prisma/schema.prisma`, current Neon project details from MEMORY.md, and instruction: _"Work at High Effort: validate every constraint, foreign key, soft-delete pattern, and index against the existing schema conventions before writing any migration."_
- **Hand-off:** Confirm migration has been applied and `@prisma/client` types are available before starting Wave 2.

### Agent 2 — Backend Agent (general-purpose) · **High Effort**

- **Task:** API routes, server actions, business logic, middleware.
- **Goal:** Robust logic with proper error handling, input validation (Zod), and auth guards.
- **Prompt must include:** The full spec, relevant existing API routes to establish patterns, DB types from Wave 1, and instruction: _"Work at High Effort: cover all error branches, validate at every system boundary, follow existing import order and ESLint rules exactly."_

### Agent 3 — Frontend Agent (general-purpose) · **Medium Effort**

- **Task:** UI components, Tailwind/shadcn styling, client hooks, i18n strings (`de.json` + `en.json`).
- **Goal:** Visual fidelity to the spec with clean props and correct locale handling.
- **Prompt must include:** The full spec, existing shell/UI component patterns, server action signatures from Wave 2 (if available), and instruction: _"Work at Medium Effort: match existing design system exactly, ensure all user-facing strings are in both locale files, use `useTranslations` in client and `getTranslations` in server components."_
- **Note:** If Frontend depends on types or actions from the Backend Agent, wait for Wave 2 to finish; otherwise run in parallel.

### Agent 4 — QA Agent (general-purpose) · **High Effort (E2E) / Medium Effort (unit)**

- **Task:** `testplan.md`, Playwright E2E specs, unit test gaps.
- **Goal:** Every acceptance criterion covered; tests match the patterns in `e2e/` and `src/**/*.test.ts`.
- **Prompt must include:** The full spec, existing E2E helpers and patterns, and instruction: _"E2E work is High Effort: cover all ACs, error states, i18n switching, and edge cases. Unit test gaps are Medium Effort: fill missing coverage, don't duplicate what already passes."_

### Two-stage review after each wave

After every wave completes, run this review loop **before starting the next wave**. You are the reviewer — do not dispatch a separate agent for this.

**Stage 1 — Spec compliance review**

Read the spec ACs and compare against what the agent produced. Ask:

- Did the agent implement everything the spec required for its domain? (no gaps)
- Did the agent add anything not in the spec? (no extras)
- Do all edge cases and error states from the spec have coverage?

If issues found: fix them (or re-prompt the agent) and re-review until ✅.

**Stage 2 — Code quality review**

Only start this after Stage 1 passes. Ask:

- Are there unnecessary abstractions or premature generalisations?
- Are there obvious bugs, unchecked error paths, or TypeScript shortcuts (`as any`, `!`)?
- Does the code follow the project conventions from MEMORY.md?

If issues found: fix them and re-review until ✅.

**Both stages must pass before the next wave starts.** Catching spec drift here is far cheaper than debugging it after Wave 3.

### After all agents complete

1. Run `pnpm typecheck` to surface any cross-agent integration issues (type name mismatches, missing exports, etc.).
2. Fix any conflicts yourself before proceeding to Step 2.

---

## Step 2 — TDD Implementation

For every component, hook, utility, or API route in the spec:

### RED phase — write the test first

Write a failing test that specifies the exact behaviour required:

- Unit/integration tests live next to the source file: `foo.test.ts` beside `foo.ts`
- Use the existing test utilities in `src/test/render.tsx` and `src/test/setup.ts`
- Mock `next/navigation`, `next-intl`, and other Next.js hooks as established in the codebase
- Run `pnpm test` and confirm the test FAILS before proceeding

### GREEN phase — implement the minimum code to pass

Write the simplest implementation that makes the test pass:

- Follow all ESLint import order rules (builtin → external → internal `@/` → relative)
- `@/components/shell/*` before `@/components/ui/*` in import order
- External package alphabetical order: `lucide-react` → `next/*` → `next-intl` → `next-themes` → `react`
- No `any` types; use `consistent-type-imports`
- Run `pnpm test` and confirm it passes

### REFACTOR phase — clean up

Improve structure without changing behaviour. Run `pnpm test` again to confirm green.

### Commit after each logical group

```
git add <specific files>
git commit --no-verify -m "feat/fix/test/chore: description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Use `--no-verify` only during active development phases. The final commit must pass hooks.

---

## Step 3 — Build Verification

After all implementation is done, run the full quality suite:

```bash
pnpm typecheck    # must exit 0
pnpm lint         # must exit 0
pnpm test         # all unit tests must pass
pnpm build        # production build must succeed
```

Fix every error before continuing. Do not suppress TypeScript or ESLint errors.

---

## Step 4 — Write the browser test plan

File: `docs/specs/{slug}/testplan.md`

Write a comprehensive plan covering every acceptance criterion from the spec:

```markdown
# Test Plan — Epic {id} {name}

## Scope

What this plan covers and what's out of scope.

## Test Environment

Browser, base URL, required seed data or state.

---

## Test Cases

### TC-{nn}: {Name}

**Objective:** What behaviour is being verified
**Preconditions:** Any state required before starting
**Steps:**

1. Navigate to ...
2. Click ...
3. Verify ...
   **Expected:** Exact observable outcome
   **Linked AC:** AC-{n}
```

Cover:

- Happy path for every user-facing feature
- Error states and edge cases
- i18n switching if relevant
- Dark mode if relevant
- Responsive/layout behaviour if relevant
- Loading and empty states

---

## Step 5 — Run E2E tests

Write or update `e2e/*.spec.ts` to cover the test plan:

```typescript
import { expect, test } from "@playwright/test";

// Clear cookies and localStorage before each test
test.beforeEach(async ({ context, page }) => {
  await context.clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});
```

Run:

```bash
pnpm test:e2e --project=chromium
pnpm test:e2e  # both chromium + firefox
```

Fix all failures. Common pitfalls from this project:

- Use `getByRole` with exact names to avoid strict-mode violations
- Filter React dev hydration warnings from console error assertions
- `NEXT_LOCALE` cookie: clear in beforeEach to avoid locale bleed between tests
- Firefox is stricter on cross-origin cookies — avoid external image URLs in components

---

## Step 6 — Live browser verification with Playwright MCP

Start the dev server if not running: `pnpm dev`

Verify every acceptance criterion manually in Chrome using the browser tools. For each AC:

1. Navigate to the relevant URL
2. Perform the required interactions
3. Assert the expected outcome in the snapshot or via `browser_evaluate`
4. Take a screenshot if the visual result is important

Work through EVERY acceptance criterion from the spec. Do not skip any.

If a verification fails:

- Identify the root cause (check logs, snapshots)
- Fix the code
- Re-verify until it passes
- **Only declare the epic done when ALL ACs are verified green in the browser**

---

## Step 7 — Final commit and progress update

### Final quality check

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e
```

All must pass. If they don't, fix and rerun.

### Commit with hooks enabled (no --no-verify)

```bash
git add -A
git commit -m "feat: implement Epic {id} — {name}

<summary of what was built>

- <bullet of key component/feature>
- <bullet>
- All {N} unit tests passing
- All {N} E2E tests passing on Chromium + Firefox

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Update progress.md

Mark all steps ✅, update the AC table to all ✅, set Status to ✅ Complete.

---

## Quality rules (always enforced)

- **Never edit a file you haven't read first**
- **Never use `--no-verify` on the final commit**
- **Never suppress TypeScript errors with `// @ts-ignore` or `as any`**
- **Never add error handling for scenarios that can't happen** — trust framework guarantees
- **Never over-engineer** — implement exactly what the spec requires, no more
- **Always run the test suite before committing**
- **Always verify in the browser before declaring done**

## Project-specific conventions

- Package manager: `pnpm` (never npm or yarn)
- Locale: German (`de`) is default, English (`en`) secondary
- `localeDetection: false` in routing — no Accept-Language detection
- i18n messages: `de.json` is source of truth, `en.json` follows
- All shell components need `"use client"` directive
- Server components use `getTranslations`, client components use `useTranslations`
- `useSidebar` hook manages localStorage-persisted sidebar state
- Import order: ESLint enforces strict alphabetical per group — run `pnpm lint:fix` if unsure
- Tailwind v4: use CSS variables from `@theme` in globals.css, no config file
