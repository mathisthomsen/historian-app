---
description: Implement the design system using a strict Spec → Test → Implement → Verify cycle
---

You are the **Design System Implementation Orchestrator**. Your job is to take the completed design system documentation in `/docs/design-system/` and systematically implement it into the codebase. You delegate to specialized sub-agents in `.claude/agents/` and follow a strict **Specification → Test → Implement → Verify** cycle.

**Prerequisite:** `/project:design-system` must have been completed. All files in `/docs/design-system/` must exist. Verify this before starting.

## PHILOSOPHY: SPECIFICATION-DRIVEN DEVELOPMENT

1. **Spec first.** Before touching any source file, a specification defines the exact expected outcome.
2. **Test second.** Before implementation, automated tests encode the spec. They MUST fail initially (red phase).
3. **Implement third.** Code is written to make tests pass. Nothing more, nothing less.
4. **Verify last.** Tests pass, visual verification confirms spec, accessibility is validated.

## CRITICAL RULES

1. **Never implement without a spec.** Every change traces to a specification traces to the design system docs.
2. **Never skip red-green.** Tests must fail before implementation, confirming they test something real.
3. **Atomic units.** Each implementation unit (one component, one token layer, one page layout) is self-contained with its own spec, test, and implementation.
4. **Non-destructive.** Existing functionality must not break. Run the full test suite after each unit.
5. **Design system docs are source of truth.** Ambiguity → refer to `/docs/design-system/`. Docs don't answer it → ask user. Never guess.
6. **Delegate, don't do.** Use the named sub-agents for all substantive work.
7. **Respect the stack:**
   - Next.js / TypeScript — type-safe, no `any`
   - Tailwind CSS-first — NO tailwind.config.js modifications
   - CSS custom properties for all tokens
   - shadcn/ui — extend via CSS, not by forking components
   - next-themes — `.dark` class strategy
   - i18n — test with both DE and EN, account for text expansion

## OUTPUT STRUCTURE

```
docs/implementation/
├── 00-plan/
│   ├── implementation-plan.md
│   └── test-strategy.md
├── 01-tokens/
│   └── token-spec.md
├── 02-base/
│   └── base-styles-spec.md
├── 03-components/
│   ├── {component-name}-spec.md
│   └── ...
├── 04-layouts/
│   └── layout-spec.md
├── 05-pages/
│   └── page-composition-spec.md
├── 06-motion/
│   └── motion-spec.md
└── 07-verification/
    └── final-audit.md
```

## ORCHESTRATION SEQUENCE

### PHASE 0 — IMPLEMENTATION PLANNING

Delegate to **impl-planner**.

Instruction: "Read everything in `/docs/design-system/` and audit the current codebase (package.json, tsconfig, existing test setup, CI config, global styles, component files). Create: (1) Implementation plan → `/docs/implementation/00-plan/implementation-plan.md` covering current state assessment, implementation sequence (Layer 0: test infra → Layer 1: tokens → Layer 2: base styles → Layer 3: components → Layer 4: layouts → Layer 5: pages → Layer 6: motion → Layer 7: verification), component implementation order within Layer 3, and migration strategy. (2) Test strategy → `/docs/implementation/00-plan/test-strategy.md` covering visual regression (Playwright), accessibility testing (axe-core), component testing, CSS token testing, responsive testing, motion testing, test naming convention, file structure, CI integration."

**After Phase 0:** Present plan to user. Highlight dependencies to install, risks, estimated sequence. Get approval.

---

### PHASE 1 — TEST INFRASTRUCTURE

Delegate to **impl-test-infra**.

Instruction: "Read `/docs/implementation/00-plan/test-strategy.md` and current project config. Set up complete test infrastructure: (1) Install only what's needed — adapt to existing framework, don't switch. (2) Configure visual regression (Playwright screenshots), accessibility testing (axe-core), token validation utility, theme testing helpers, motion testing helpers. (3) Configure test scripts in package.json. (4) Write and run ONE smoke test exercising the full pipeline. Fix until it passes."

Verify: smoke test passes before proceeding.

---

### PHASE 2 — DESIGN TOKENS

**Step 1:** Delegate to **impl-spec-writer**.

Instruction: "Read `/docs/design-system/02-brand/identity.md` and `/docs/design-system/04-design-system/tokens.md` and current CSS files. Write token implementation specification to `/docs/implementation/01-tokens/token-spec.md`. For every token: light mode value, dark mode value, category, used-by list, contrast requirements, acceptance criteria checklist. Include token dependency map, deletion list, migration map."

**Step 2:** Delegate to **impl-test-writer**.

Instruction: "Read `/docs/implementation/01-tokens/token-spec.md` and test infrastructure. Write tests: token completeness (both :root and .dark), token value verification (both modes), contrast ratio tests (both themes), no undefined references test, visual baseline swatch page. Run tests — confirm they FAIL (red phase). Report failure count as baseline."

**Step 3:** Delegate to **impl-engineer**.

Instruction: "Read `/docs/implementation/01-tokens/token-spec.md` and the failing tests. Implement all tokens in CSS to make tests pass. Use `@layer base`, HSL without wrapper (shadcn convention), preserve unrelated existing CSS. Run token tests until green. Run FULL test suite — fix any regressions."

Verify: full suite green.

---

### PHASE 3 — BASE STYLES

**Step 1:** Delegate to **impl-spec-writer**.

Instruction: "Read brand identity, UI concept, and token docs. Write base styles specification to `/docs/implementation/02-base/base-styles-spec.md` covering: CSS reset adjustments beyond Tailwind preflight, typography base (font loading, body, headings h1-h6, prose, mono, links, lists, code), global layout (root container, page padding, max-width, scroll behavior), selection and focus styles, scrollbar styling, utility classes (animation with reduced-motion, custom utilities). Each item with exact expected CSS and acceptance criteria."

**Step 2:** Delegate to **impl-test-writer**.

Instruction: "Write tests for base styles spec: typography rendering (computed styles for each level), focus indicator tests (both themes), selection style tests, heading hierarchy, focus visibility on all interactive elements, responsive typography (320px, 200% zoom), reduced motion, visual regression of typography specimen page. Run — confirm FAIL. Report baseline."

**Step 3:** Delegate to **impl-engineer**.

Instruction: "Read spec and failing tests. Implement base styles in `@layer base` and `@layer utilities`. Run tests until green. Full suite — fix regressions."

**⏸ CHECKPOINT:** Show user the base typography + token rendering. Get confirmation.

---

### PHASE 4 — COMPONENT STYLING

For EACH component in the order from the implementation plan, delegate to **impl-component-engine**.

Instruction: "Component: {component_name}. Read the component's section in `/docs/design-system/04-design-system/components.md`, the UI concept, the accessibility audit, and current component source. Execute full cycle: (1) Write spec to `/docs/implementation/03-components/{component_name}-spec.md` — visual spec (all variants, states, themes, responsive, spacing), behavioral spec (keyboard, ARIA, focus management, loading/error), integration spec, acceptance criteria checklist. (2) Write tests — visual regression (variant × state × theme), accessibility (axe-core, ARIA, keyboard, focus contrast), theme tests, interaction tests. Run — confirm FAIL. (3) Implement — modify styling via Tailwind classes and CSS custom properties, use `motion-safe:` for transitions. Run until green. Full suite — fix regressions. (4) Report: spec path, test count, modified files, regression status."

**After every 5 components:** ⏸ BATCH CHECKPOINT. Report progress.

Verify: full suite green after all components.

---

### PHASE 5 — LAYOUT PATTERNS

Delegate to **impl-layout-engineer**.

Instruction: "Read UX architecture layout section, UI concept page templates, design system layout patterns, and implementation plan. Execute spec→test→implement cycle: (1) Spec to `/docs/implementation/04-layouts/layout-spec.md` — Grid/Flexbox structure, breakpoint reflow, sidebar/header/content relationships, density variants, scroll containment, landmark structure. (2) Tests — visual regression all breakpoints (320, 768, 1024, 1280, 1536px), landmarks, reflow, no overflow, sidebar collapse, German text expansion, empty states. (3) Implement — layout components, responsive Tailwind classes, semantic landmarks, test both themes, test 200% zoom."

Verify: full suite green.

---

### PHASE 6 — PAGE COMPOSITIONS

For EACH page/route, delegate to **impl-page-engineer**.

Instruction: "Page: {page_name}. Read all implementation specs and the route inventory. Execute spec→test→implement cycle: (1) Spec to `/docs/implementation/05-pages/{page_name}-spec.md` — layout template used, component inventory, content hierarchy, page-specific interactions, loading sequence, empty states, error states, responsive notes. (2) Tests — full-page visual regression (both themes, key breakpoints), full-page a11y audit (axe-core, landmarks, headings), interaction tests, loading/empty/error state tests. (3) Implement — wire components, apply page-specific spacing, implement loading/skeleton/empty/error states, verify i18n with both DE and EN (check overflow/truncation)."

**⏸ CHECKPOINT:** Show user the complete styled pages.

Verify: full suite green.

---

### PHASE 7 — MOTION & TRANSITIONS

Delegate to **impl-motion-engineer**.

Instruction: "Read brand identity motion tokens and UI concept micro-interactions. Execute spec→test→implement cycle: (1) Spec to `/docs/implementation/06-motion/motion-spec.md` — table: animation, trigger, duration token, easing token, properties animated, reduced motion behavior. (2) Tests — correct duration/easing tokens (computed style), prefers-reduced-motion disables/simplifies all animations, no layout shift (CLS=0), no >5s uncontrolled animation, no content inaccessible without animations. (3) Implement — CSS transitions/animations consuming tokens, `@media (prefers-reduced-motion: reduce)` fallbacks, JS animations check matchMedia, CSS `will-change` used sparingly. Performance: 60fps, compositor-only transforms/opacity preferred."

Verify: full suite green.

---

### PHASE 8 — FINAL VERIFICATION

Delegate to **impl-qa-auditor**.

Instruction: "Read all files in `/docs/design-system/` and `/docs/implementation/`. Execute comprehensive final audit: (1) Full test suite — report total/passing/failing/skipped. (2) Fresh screenshots all pages/components — light+dark, desktop+tablet+mobile — compare against design system spec. (3) axe-core every page + manual checks (tab order, alt text, labels, ARIA, skip nav). WCAG 2.1 AA status per page. (4) Cross-theme consistency — no invisible/unreadable elements, semantics preserved, focus visible in both. (5) i18n — switch to DE, check truncation/overflow/hardcoded strings. (6) Performance — CSS bundle size before/after, unused CSS, LCP impact, CLS impact. (7) Compliance matrix to `/docs/implementation/07-verification/final-audit.md`. (8) Issues list (🔴 blocking, 🟡 should fix, 🟢 nice to have). (9) Recommendations for ongoing maintenance."

**If blocking issues:** Loop back to relevant phase to fix.

**⏸ FINAL CHECKPOINT:** Present complete audit results.

---

### COMPLETION

Present summary:

- Total files created/modified
- Total tests written and passing
- Compliance matrix summary
- Remaining issues (if any)
- Recommended next steps

## FAILURE HANDLING

- **Test won't go green after 3 attempts:** Escalate to user with specific failure, what was tried, options.
- **Regression introduced:** Stop. Diagnose which change caused it. Fix before continuing.
- **Spec ambiguity:** Check design system docs first. If still ambiguous, ask user. Never assume.
- **Performance degradation:** Flag if CSS bundle >50% growth or any Core Web Vital regresses.
- **Dependency conflict:** Present to user with options. Never force-install.

## RESUME CAPABILITY

If interrupted, the orchestrator can resume:

1. Read `/docs/implementation/` to determine which specs and tests exist
2. Run full test suite to determine current state
3. Identify last completed component/phase
4. Resume from next item in sequence

To resume: invoke `/project:implement-design-system` and state "Resume from where we left off."
