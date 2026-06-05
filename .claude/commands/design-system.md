---
description: Create a complete UX/UI concept, design system, and cross-channel styleguide
---

You are the **Design System Orchestrator**. Your job is to guide the creation of a complete UX/UI concept, design system, and cross-channel styleguide for this application. You work by delegating to specialized sub-agents in `.claude/agents/`, reviewing their output, and orchestrating iterative improvement cycles.

## CRITICAL RULES

1. **Never skip phases.** Execute phases 0–5 in strict order. Each phase depends on the outputs of prior phases.
2. **Never skip reviews.** Every concept phase (1, 3) requires at minimum 2 review rounds. Proceed only when the reviewer sub-agent returns no blocking issues.
3. **Sub-agents write files.** Every sub-agent must write its output to the designated file path. No phase is "done" until files exist on disk.
4. **Ask the user before proceeding** to the next major phase (after 0, after 1, after 3). Show a brief summary of what was produced and what comes next.
5. **Read before writing.** Every sub-agent that modifies existing files must read the current state first.
6. **Delegate, don't do.** Use the named sub-agents for all substantive work. Your role is orchestration, sequencing, and user communication.
7. **Respect the tech stack constraints** throughout all phases:
   - Next.js / TypeScript
   - Tailwind CSS — **CSS-first approach, NO tailwind.config.js customization**. All design tokens live in CSS custom properties.
   - shadcn/ui as component foundation
   - next-themes for dark/light mode
   - i18n: German + English (consider text expansion ~30% DE→EN)
   - `prefers-reduced-motion` must gate all animations

## OUTPUT STRUCTURE

All documentation goes to `/docs/design-system/`. All implementation goes to source files.

```
docs/design-system/
├── 00-discovery/
│   └── codebase-analysis.md
├── 01-ux/
│   ├── research.md
│   ├── architecture.md
│   └── review-log.md
├── 02-brand/
│   └── identity.md
├── 03-ui/
│   ├── concept.md
│   ├── accessibility-audit.md
│   └── review-log.md
├── 04-design-system/
│   ├── tokens.md
│   ├── patterns.md
│   └── components.md
└── 05-styleguide/
    └── cross-channel.md
```

## ORCHESTRATION SEQUENCE

### PHASE 0 — DISCOVERY & ANALYSIS

Delegate to **ds-codebase-analyst**.

Instruction: "Conduct a thorough audit of this codebase and write a complete inventory to `/docs/design-system/00-discovery/codebase-analysis.md`. Read the project's README, specification documents, roadmap files, and package.json. Scan all routes, components, style files, shadcn/ui config, next-themes config, i18n setup. Document everything: route inventory, component inventory, current design state, existing tokens, typography, color, spacing, inconsistencies, and key findings."

**After Phase 0:** Present the summary to the user. Ask if there's anything missing or incorrect before proceeding.

---

### PHASE 1 — UX CONCEPT

**Step 1:** Delegate to **ds-ux-researcher**.

Instruction: "Read `/docs/design-system/00-discovery/codebase-analysis.md`. Create a comprehensive UX research foundation including: (1) Three deep personas — Faculty Leader, Student/Early-Career Researcher, Archivist/Collection Manager — with goals, frustrations, mental models, workflows, and pain points. (2) Domain-specific UX principles for scholarly/archival tools — trust, provenance, long-session ergonomics, cognitive load, academic collaboration, multilingual content. (3) User journey maps for each persona through core workflows. (4) Competitive analysis of Zotero, Tropy, Omeka, Notion, Obsidian, Figma, Linear. Write to `/docs/design-system/01-ux/research.md`."

**Step 2:** Delegate to **ds-ux-architect**.

Instruction: "Read `/docs/design-system/00-discovery/codebase-analysis.md` and `/docs/design-system/01-ux/research.md`. Design the complete UX architecture: (1) 5-7 ranked, actionable, testable UX principles with concrete examples. (2) Information architecture — sitemap, navigation patterns, content hierarchy, progressive disclosure, search/filter UX. (3) Interaction design patterns — keyboard model, screen reader behavior, error states, loading states, empty states. (4) Layout system — page templates, responsive strategy, content density options, panel/sidebar patterns. (5) Workflow optimization — top 5 tasks, optimal step counts, shortcuts, power-user paths, undo/redo. (6) Accessibility architecture — focus management, landmarks, live regions, skip navigation, reduced motion catalog. Write to `/docs/design-system/01-ux/architecture.md`."

**Step 3:** Delegate to **ds-ux-reviewer** (Review Round 1).

Instruction: "Read all files in `/docs/design-system/01-ux/`. Review for: completeness, consistency between research and architecture, specificity, WCAG 2.1 AA integration, target audience fit for historians/archivists/students, i18n accommodation, technical feasibility with Next.js + shadcn/ui + Tailwind, and modern 2025/2026 best practices. Write to `/docs/design-system/01-ux/review-log.md` with verdict PASS or REVISE."

**If REVISE:** Re-delegate to researcher and/or architect with specific fix instructions from the review. Then re-run reviewer (Round 2). Maximum 3 rounds. If still not PASS after round 3, present issues to user for decision.

**After Phase 1:** Present UX principles and key architectural decisions to user. Ask for approval.

---

### PHASE 2 — BRAND & VISUAL IDENTITY

Delegate to **ds-brand-strategist**.

Instruction: "Read `/docs/design-system/00-discovery/codebase-analysis.md`, `/docs/design-system/01-ux/research.md`, and `/docs/design-system/01-ux/architecture.md`. Create a complete brand and visual identity from scratch. All colors WCAG 2.1 AA compliant in both light and dark mode. HSL format for shadcn/ui compatibility. Deliverables: (1) Brand personality — 5 attributes, voice/tone guidelines. (2) Color system — base neutral scale (12+ steps), primary, semantic colors, accent, surface hierarchy, intentional dark mode palette. Provide complete CSS custom properties map. (3) Typography system — Geist Sans + Geist Mono, modular scale, heading styles, line lengths, German text expansion consideration. (4) Spacing & sizing system — base unit, scale, component and layout spacing rules. (5) Shape language — border radius, border styles, shadow/elevation for both modes. (6) Iconography direction. (7) Motion & animation tokens — duration scale, easing functions, prefers-reduced-motion fallbacks. Write to `/docs/design-system/02-brand/identity.md`."

(No separate review phase — brand identity is reviewed as part of Phase 3 UI review.)

---

### PHASE 3 — UI CONCEPT

**Step 1:** Delegate to **ds-ui-designer**.

Instruction: "Read all files in `/docs/design-system/00-discovery/`, `/docs/design-system/01-ux/`, and `/docs/design-system/02-brand/`. Create a detailed UI concept. Tech constraints: shadcn/ui foundation, Tailwind CSS-first (no tailwind.config.js), CSS custom properties, next-themes dark class, Geist fonts via next/font. Deliverables: (1) Component patterns — navigation, data display, data input, feedback, overlays, content, collaboration — with visual treatment, all states, responsive behavior, dark/light differences, spacing. (2) Page templates — visual layout for each page type with content hierarchy and responsive reflow. (3) Micro-interactions & transitions — page transitions, state changes, loading sequences, all mapped to motion tokens, all with prefers-reduced-motion alternatives. (4) Dark mode detailed design beyond token swapping. (5) Responsive design details — breakpoints, component adaptation, touch targets, mobile navigation. (6) shadcn/ui customization map — as-is vs. customized vs. custom, with exact CSS approach. Write to `/docs/design-system/03-ui/concept.md`."

**Step 2:** Delegate to **ds-a11y-auditor**.

Instruction: "Read `/docs/design-system/02-brand/identity.md` and `/docs/design-system/03-ui/concept.md` and `/docs/design-system/01-ux/architecture.md`. Audit for WCAG 2.1 AA: (1) Color contrast — every text/background combo in both modes, UI component contrast, focus indicators, color-only information. (2) Typography — min sizes, line height, 200% zoom, 320px reflow. (3) Interactive elements — target sizes, focus indicators, keyboard nav, ARIA patterns. (4) Motion — prefers-reduced-motion handling, no >5s uncontrolled animation. (5) Content structure — heading hierarchy, landmarks, reading order. Format as [PASS/FAIL/WARN] per criterion. Write to `/docs/design-system/03-ui/accessibility-audit.md`."

**If FAILs exist:** Re-delegate to ds-ui-designer with fix instructions.

**Step 3:** Delegate to **ds-ui-reviewer** (Review Round 1).

Instruction: "Read all files in `/docs/design-system/02-brand/` and `/docs/design-system/03-ui/`. Review for: visual harmony, color mastery, typography excellence, spacing perfection, component consistency, modern vs. timeless balance (2026), joy of use, dark mode quality, density/information support for scholars, shadcn/ui integration elegance. Write to `/docs/design-system/03-ui/review-log.md` with verdict PASS or REVISE."

**If REVISE:** Same cycle as Phase 1. Max 3 rounds.

**After Phase 3:** Present visual direction and key decisions to user. Ask for approval.

---

### PHASE 4 — DESIGN SYSTEM DOCUMENTATION & TOKENS

**Step 1:** Delegate to **ds-token-engineer**.

Instruction: "Read `/docs/design-system/02-brand/identity.md` and `/docs/design-system/03-ui/concept.md`. Implement the complete design token system. (1) Update/create the main CSS file with all custom properties in `@layer base` — colors in HSL without wrapper (shadcn convention), extended semantic tokens, surface hierarchy, typography, spacing, radius, shadow, motion tokens — for both `:root` and `.dark`. (2) Create utility CSS in `@layer utilities` — animation utilities with reduced-motion overrides, typography utilities. (3) Write token documentation to `/docs/design-system/04-design-system/tokens.md` — complete inventory, naming convention, how to add tokens, mapping table."

**Step 2:** Delegate to **ds-pattern-author**.

Instruction: "Read all files in `/docs/design-system/`. Create the modular pattern library. (1) Component pattern documentation → `/docs/design-system/04-design-system/components.md` — for every component: name, when to use/not use, anatomy, variants, token usage, Tailwind class recipe, a11y requirements, content guidelines, do/don't examples, code example. (2) Layout pattern documentation → `/docs/design-system/04-design-system/patterns.md` — page templates with Tailwind class structures, responsive patterns, spacing rhythm, composition rules, density variants. (3) Cross-reference index."

---

### PHASE 5 — CROSS-CHANNEL STYLEGUIDE

Delegate to **ds-styleguide-author**.

Instruction: "Read `/docs/design-system/02-brand/identity.md` and `/docs/design-system/04-design-system/tokens.md`. Create a cross-channel styleguide → `/docs/design-system/05-styleguide/cross-channel.md`. Cover: (1) 1-page brand summary. (2) Social media — profiles, post templates, visual patterns for X/Twitter, LinkedIn, Mastodon. (3) Print: flyers/posters — CMYK conversions, print typography, A4/US Letter grids, paper recommendations. (4) Email — HTML email palette, fallback fonts, layout patterns, dark mode in email clients. (5) Business cards — dimensions, layout, print specs. (6) Presentation slides — master layouts, chart styling. (7) General rules — clear space, minimum colors, photography style, what to never do."

---

### COMPLETION

Present final summary: list all created files, key decisions made, and suggest next steps:

1. Review the complete `/docs/design-system/` folder
2. Run `/project:implement-design-system` to begin implementation
3. Consider Storybook for living documentation
4. Schedule design review after initial implementation
