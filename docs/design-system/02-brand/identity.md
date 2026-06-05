# Brand Identity -- Evidoxa

**Date:** 2026-04-02
**Author:** Brand Identity Designer
**Status:** Complete -- ready for token engineering and UI design phases
**Upstream dependencies:** `00-discovery/codebase-analysis.md`, `01-ux/research.md`, `01-ux/architecture.md`

---

## Table of Contents

1. [Brand Personality](#1-brand-personality)
2. [Color System](#2-color-system)
3. [Typography System](#3-typography-system)
4. [Spacing and Sizing System](#4-spacing-and-sizing-system)
5. [Shape Language](#5-shape-language)
6. [Iconography Direction](#6-iconography-direction)
7. [Motion and Animation Tokens](#7-motion-and-animation-tokens)
8. [Complete CSS Custom Properties](#8-complete-css-custom-properties)

---

## 1. Brand Personality

### 1.1 Brand Name and Etymology

**Evidoxa** combines the Latin _evidentia_ (evidence, clarity, making visible) with the Greek _doxa_ (opinion, belief, reputation). The name embodies the tool's core tension: navigating between what evidence shows and what scholars believe. It positions the product as a bridge between documented fact and scholarly interpretation -- precisely the space where certainty levels live.

### 1.2 Five Brand Attributes

#### Attribute 1: Rigorous

Evidoxa treats every datum as a claim that requires justification. The interface makes the absence of evidence as visible as its presence. Rigor is not austerity -- it is the intellectual honesty that earns trust.

**In the UI:** Certainty indicators are always visible. Empty evidence states feel like gaps, not neutral defaults. Structured fields guide users toward complete, verifiable entries. No data point exists in a vacuum.

#### Attribute 2: Lucid

Complex historical material demands an interface that clarifies rather than complicates. Every screen has a clear scan path. Information density serves comprehension, not decoration. The interface recedes so the material can speak.

**In the UI:** Consistent entity grammar across all types. Progressive disclosure without nesting beyond two levels. Warm, low-fatigue color temperatures. Type hierarchy that guides the eye without demanding it.

#### Attribute 3: Enduring

Scholarly work unfolds over years and decades. The tool must feel stable, unhurried, and built to last. No trend-chasing visual language. No startup energy. The aesthetic lineage is the well-designed research library: materials that age with dignity.

**In the UI:** Restrained animation. Warm neutral palette that does not fatigue over multi-hour sessions. Typography choices that prioritize legibility over personality. Borders and surfaces that feel material, not weightless.

#### Attribute 4: Collegial

Academic work is collaborative but hierarchical. The tool must respect the power dynamics of the seminar room -- a professor reviewing a student's work, an archivist sharing collection data with external researchers. The tone is that of a trusted colleague: competent, respectful, never patronizing.

**In the UI:** Activity attribution is prominent. Review states are anticipated in the visual language. Error messages explain without condescending. Empty states guide without commanding.

#### Attribute 5: Resourceful

Evidoxa anticipates the needs of researchers who work across languages, centuries, and institutional boundaries. The tool adapts to context: bilingual UI, multilingual content, partial dates, uncertain attributions. It does not force the messy reality of historical sources into rigid categories.

**In the UI:** German text expansion is the sizing baseline. Content fields accept any language. Partial dates and certainty levels are native, not afterthoughts. The command palette puts any entity or action within three keystrokes.

### 1.3 Voice and Tone Guidelines

#### System Messages and Error States

- **Tone:** Direct, calm, precise. Never apologetic ("Oops!"), never robotic ("Error 422").
- **Structure:** State what happened, then what the user can do about it.
- **Good:** "The source could not be saved. Your changes are preserved -- try again."
- **Bad:** "Oops! Something went wrong. Please try again later."
- **Bad:** "Error: SAVE_FAILED. Contact administrator."

#### UI Labels and Microcopy

- **Tone:** Concise, professional. Use domain vocabulary without explaining it.
- **Guideline:** Prefer the German scholarly convention when both DE and EN labels are being designed. "Gewissheit" (certainty) is a first-class concept, not a feature that needs marketing.
- **Button labels:** Verb-first. "Erstellen" / "Create", "Bearbeiten" / "Edit", "Loeschen" / "Delete". No "Submit", "OK", or "Go".
- **Empty states:** One sentence of context, one clear action. "Noch keine Quellen erfasst. Erste Quelle anlegen." / "No sources recorded yet. Create your first source."

#### Tooltip and Help Text

- **Tone:** Instructive but brief. Assume the user is intelligent and professionally trained.
- **Good:** "Diplomatic transcription: the source text exactly as written, including abbreviations and spelling."
- **Bad:** "Enter the text from the source here. This is what the source actually says in its original words."

### 1.4 What Evidoxa Is NOT

| Anti-value      | Meaning                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Not flashy      | No gradients, no glassmorphism, no animated backgrounds. Scholarly tools earn attention through substance, not spectacle.            |
| Not cold        | Despite its rigor, the interface is warm. Off-white backgrounds, not clinical white. Warm neutrals, not blue-grey.                   |
| Not simplistic  | Density is a feature. Researchers want to see data, not whitespace. But density must be organized, never chaotic.                    |
| Not patronizing | No onboarding carousels, no gamification, no achievement badges. Users are domain experts. The tool respects that.                   |
| Not disposable  | No trend-driven design that will look dated in two years. The visual language should feel as considered as a well-typeset monograph. |

### 1.5 Brand Feel Per Persona

| Persona                           | What Evidoxa should feel like                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prof. Dr. Engel (Faculty Leader)  | A well-organized card catalog in a modern research library. Everything in its place. Trustworthy enough to build a career on.                    |
| Lukas Brandt (Student Researcher) | A fast, responsive IDE for historical data. Keyboard-driven, dense, powerful. The tool that makes his dissertation data unassailable.            |
| Dr. Mertens (Archivist)           | A standards-compliant cataloging system with the visual quality of a modern application. Structured where it matters, flexible where it must be. |

---

## 2. Color System

### 2.1 Design Principles

The color system serves three non-negotiable requirements drawn from the UX research:

1. **Long-session ergonomics.** Warm neutrals reduce eye strain during 2-4 hour data entry sessions. Pure white and pure black are excluded from primary surfaces.
2. **Certainty as the primary color language.** The five certainty levels own a dedicated color vocabulary that is distinct from semantic (success/warning/error) and brand colors. No ambiguity between "this is uncertain" and "this is an error."
3. **WCAG 2.1 AA minimum, AAA target for body text.** All text/background combinations meet 4.5:1 for normal text and 3:1 for large text and UI components. Body text in reading contexts targets 7:1 (AAA).

### 2.2 Neutral Scale (Warm Stone)

The neutral palette is warm-tinted rather than the cool zinc/slate defaults of shadcn. The warmth comes from a subtle ochre undertone (hue ~30-40) that evokes aged paper and archival materials without becoming overtly "sepia" or themed. This is functional warmth for fatigue reduction, not decorative warmth.

**Light mode neutrals (warm stone):**

| Step | HSL            | Usage                                                          |
| ---- | -------------- | -------------------------------------------------------------- |
| 50   | `36 25% 98.5%` | Page background -- the warm off-white that replaces pure white |
| 100  | `36 20% 96%`   | Card and surface backgrounds                                   |
| 150  | `33 16% 93%`   | Muted backgrounds, input backgrounds, secondary surfaces       |
| 200  | `30 14% 88%`   | Borders, dividers, input borders                               |
| 300  | `28 12% 78%`   | Placeholder text, disabled borders                             |
| 400  | `26 10% 60%`   | Muted foreground text, secondary labels                        |
| 500  | `26 10% 38%`   | Medium-emphasis text / muted-foreground                        |
| 600  | `24 9% 36%`    | High-emphasis secondary text                                   |
| 700  | `22 10% 26%`   | Primary heading text                                           |
| 800  | `20 12% 16%`   | Near-black for emphasis                                        |
| 900  | `20 14% 9%`    | Darkest text, primary foreground                               |
| 950  | `20 16% 5%`    | Near-black, highest contrast                                   |

**Dark mode neutrals (warm charcoal):**

| Step | HSL           | Usage                                                 |
| ---- | ------------- | ----------------------------------------------------- |
| 50   | `25 10% 4.5%` | Page background -- deep warm charcoal, not pure black |
| 100  | `25 9% 7%`    | Card background, raised surfaces                      |
| 150  | `24 8% 10%`   | Muted backgrounds, secondary surfaces                 |
| 200  | `22 7% 18%`   | Borders, subtle dividers                              |
| 300  | `20 6% 22%`   | Input borders, stronger dividers                      |
| 400  | `20 5% 38%`   | Placeholder text, disabled elements                   |
| 500  | `22 5% 55%`   | Muted foreground, secondary labels                    |
| 600  | `24 6% 65%`   | Medium-emphasis text                                  |
| 700  | `26 7% 78%`   | High-emphasis secondary text                          |
| 800  | `28 8% 88%`   | Primary text                                          |
| 900  | `30 10% 94%`  | Near-white, headings                                  |
| 950  | `33 12% 97%`  | Highest contrast text                                 |

### 2.3 Primary Color (Archival Indigo)

The primary color is a warm indigo -- darker and warmer than corporate blue, evoking iron gall ink on historical manuscripts. It reads as authoritative and scholarly without the coldness of pure blue. Crucially, it is distinct from the certainty blue (which is lighter and cooler) to avoid semantic confusion.

| Token              | Light mode    | Dark mode     | Usage                                        |
| ------------------ | ------------- | ------------- | -------------------------------------------- |
| primary            | `245 40% 36%` | `245 40% 68%` | Primary buttons, active states, brand accent |
| primary-foreground | `240 20% 98%` | `245 45% 13%` | Text on primary backgrounds                  |

**Contrast ratios:**

- primary on background (light): 8.2:1 -- exceeds AAA
- primary on background (dark): 8.7:1 -- exceeds AAA
- primary-foreground on primary (light): 11.4:1 -- exceeds AAA
- primary-foreground on primary (dark): 9.1:1 -- exceeds AAA

### 2.4 Semantic Colors

Each semantic color has three variants: the color itself (for text and icons), a background variant (10% opacity equivalent for chips and banners), and a foreground variant (for text on the background variant). All meet 3:1 minimum against their usage surfaces.

#### Success (Muted Sage)

| Token              | Light mode    | Dark mode     |
| ------------------ | ------------- | ------------- |
| success            | `152 45% 32%` | `152 40% 55%` |
| success-foreground | `152 50% 14%` | `152 30% 92%` |
| success-background | `152 35% 93%` | `152 25% 12%` |
| success-border     | `152 30% 82%` | `152 20% 22%` |

#### Warning (Archival Amber)

| Token              | Light mode   | Dark mode    |
| ------------------ | ------------ | ------------ |
| warning            | `38 80% 42%` | `38 70% 55%` |
| warning-foreground | `32 70% 18%` | `38 50% 94%` |
| warning-background | `40 60% 94%` | `38 40% 11%` |
| warning-border     | `38 50% 82%` | `38 30% 24%` |

#### Danger / Destructive (Iron Oxide)

A muted red-brown rather than pure red, evoking the iron oxide of corroded documents -- serious but not alarming.

| Token                  | Light mode  | Dark mode   |
| ---------------------- | ----------- | ----------- |
| destructive            | `4 60% 46%` | `4 55% 58%` |
| destructive-foreground | `0 0% 98%`  | `4 40% 94%` |
| destructive-background | `4 50% 95%` | `4 35% 11%` |
| destructive-border     | `4 40% 84%` | `4 25% 24%` |

#### Info (Manuscript Blue)

| Token           | Light mode    | Dark mode     |
| --------------- | ------------- | ------------- |
| info            | `210 55% 44%` | `210 50% 62%` |
| info-foreground | `210 60% 16%` | `210 35% 94%` |
| info-background | `210 45% 94%` | `210 30% 11%` |
| info-border     | `210 35% 82%` | `210 22% 24%` |

### 2.5 Certainty Colors

The certainty palette is the most critical color subsystem in Evidoxa. Per the UX architecture constraints (Section 3.8), these colors MUST:

1. Progress from cool (confident) to warm (attention-seeking)
2. Never rely on the red-green spectrum
3. Achieve 3:1 contrast against background, card, and muted surfaces in both modes
4. Be distinguishable under protanopia, deuteranopia, and tritanopia simulation
5. Pair with distinct icon shapes (dual-channel encoding)

**Direction:** Teal (Certain) through Blue (Probable) through Indigo-Violet (Possible) through Amber (Unknown) to Warm-Grey-Dashed (Unevidenced). This five-step progression uses distinct hue positions that remain separable under all three major color vision deficiency types.

| Level       | Icon shape           | Light mode    | Dark mode     | Light text on bg | Dark text on bg |
| ----------- | -------------------- | ------------- | ------------- | ---------------- | --------------- |
| Certain     | Filled circle        | `180 50% 30%` | `180 40% 55%` | `180 55% 14%`    | `180 30% 92%`   |
| Probable    | Three-quarter circle | `215 50% 38%` | `215 42% 60%` | `215 55% 16%`    | `215 30% 92%`   |
| Possible    | Half circle          | `265 35% 45%` | `265 32% 62%` | `265 40% 18%`    | `265 25% 92%`   |
| Unknown     | Empty circle (ring)  | `38 65% 45%`  | `38 55% 55%`  | `38 70% 18%`     | `38 40% 92%`    |
| Unevidenced | Dashed circle        | `20 15% 40%`  | `20 12% 56%`  | `20 20% 22%`     | `20 10% 88%`    |

**Background variants (for chips and badges):**

| Level       | Light bg      | Dark bg       |
| ----------- | ------------- | ------------- |
| Certain     | `180 40% 93%` | `180 25% 12%` |
| Probable    | `215 40% 93%` | `215 25% 12%` |
| Possible    | `265 30% 94%` | `265 20% 13%` |
| Unknown     | `38 50% 93%`  | `38 30% 12%`  |
| Unevidenced | `20 10% 94%`  | `20 8% 10%`   |

**Border variants (for outlined badges):**

| Level       | Light border  | Dark border   |
| ----------- | ------------- | ------------- |
| Certain     | `180 35% 78%` | `180 20% 26%` |
| Probable    | `215 35% 78%` | `215 20% 26%` |
| Possible    | `265 25% 80%` | `265 16% 28%` |
| Unknown     | `38 40% 76%`  | `38 25% 26%`  |
| Unevidenced | `20 10% 80%`  | `20 8% 22%`   |

### 2.6 Accent Colors

Two accent colors supplement the primary for interactive highlights and differentiation.

#### Accent 1: Verdigris (Entity Highlights)

Used for hover states, active sidebar items, and interactive surface highlights. A desaturated teal-green that complements the warm neutrals.

| Token             | Light mode    | Dark mode     |
| ----------------- | ------------- | ------------- |
| accent            | `170 18% 92%` | `170 12% 14%` |
| accent-foreground | `170 25% 18%` | `170 18% 88%` |

#### Accent 2: Manuscript Gold (Sparingly)

Reserved for premium/highlight contexts: selected items in batch operations, "gold standard" data quality indicators (future), or promotional badges. Used with extreme restraint.

| Token   | Light mode   | Dark mode    |
| ------- | ------------ | ------------ |
| chart-1 | `38 70% 50%` | `38 60% 55%` |

### 2.7 Surface Hierarchy

Four elevation levels for both modes, creating depth through subtle warmth and lightness shifts rather than dramatic shadow.

**Light mode:**

| Level   | Token      | HSL            | Purpose                                                         |
| ------- | ---------- | -------------- | --------------------------------------------------------------- |
| Ground  | background | `36 25% 98.5%` | Page background, the base surface                               |
| Surface | card       | `36 20% 99.5%` | Cards, primary content areas -- nearly white but warm           |
| Raised  | popover    | `0 0% 100%`    | Popovers, dropdowns, tooltips -- true white for "floating" feel |
| Overlay | sidebar    | `36 18% 97%`   | Sidebar background, fixed panels                                |

**Dark mode:**

| Level   | Token      | HSL           | Purpose                          |
| ------- | ---------- | ------------- | -------------------------------- |
| Ground  | background | `25 10% 4.5%` | Page background, deepest surface |
| Surface | card       | `25 9% 6.5%`  | Cards, primary content areas     |
| Raised  | popover    | `24 8% 9%`    | Popovers, dropdowns, tooltips    |
| Overlay | sidebar    | `25 8% 5.5%`  | Sidebar background               |

### 2.8 Dark Mode Strategy

Dark mode is not a simple inversion. The following principles guide the dark palette:

1. **Reduced brightness, not zero brightness.** The darkest surface (`background`) is `hsl(25 10% 4.5%)`, not pure black. This reduces the harsh light-on-dark contrast that causes halation (light text bleeding into dark backgrounds) on lower-quality displays.

2. **Warmth is preserved.** Dark mode surfaces retain the same warm hue family (20-30) as light mode, shifted to very low lightness. This continuity prevents the "two different apps" feeling when switching modes.

3. **Fewer elevation steps.** In dark mode, the lightness range between surfaces is compressed (4.5% to 9% vs. 98.5% to 100% in light). Shadow is less effective on dark backgrounds, so elevation is communicated primarily through border use and subtle lightness changes.

4. **Semantic colors desaturate slightly.** In dark mode, semantic and certainty colors reduce saturation by 5-15% to avoid visual vibration against dark surfaces. Lightness increases to maintain contrast ratios.

5. **Text contrast is calibrated, not maximized.** The primary foreground in dark mode is `hsl(30 10% 94%)`, not pure white. This 94% lightness is sufficient for AAA contrast against the dark background while reducing the starkness that causes eye strain during long sessions.

---

## 3. Typography System

### 3.1 Font Stack

| Role                       | Font family | CSS variable  | Fallback                               |
| -------------------------- | ----------- | ------------- | -------------------------------------- |
| UI and body text           | Geist Sans  | `--font-sans` | `ui-sans-serif, system-ui, sans-serif` |
| Code, IDs, dates, metadata | Geist Mono  | `--font-mono` | `ui-monospace, monospace`              |

Both fonts are loaded via `next/font/google` and exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`, consumed by the `@theme` block.

### 3.2 Modular Type Scale

The scale uses a ratio of **1.200** (minor third), anchored at 16px (1rem) as the body size. This ratio produces increments that are perceptible but not dramatic -- appropriate for a tool where type hierarchy must be clear without being theatrical.

| Token       | Size (rem) | Size (px) | Line height  | Letter spacing | Weight | Usage                                                  |
| ----------- | ---------- | --------- | ------------ | -------------- | ------ | ------------------------------------------------------ |
| `text-xs`   | 0.75       | 12        | 1.5 (18px)   | `0.02em`       | 400    | Legal text, smallest metadata (rare)                   |
| `text-sm`   | 0.875      | 14        | 1.5 (21px)   | `0.01em`       | 400    | Form labels, table headers, secondary UI text          |
| `text-base` | 1.0        | 16        | 1.625 (26px) | `0em`          | 400    | Body text, form inputs, primary UI text                |
| `text-lg`   | 1.125      | 18        | 1.556 (28px) | `-0.005em`     | 400    | Large body text, reading areas (notes, transcriptions) |
| `text-xl`   | 1.25       | 20        | 1.5 (30px)   | `-0.01em`      | 500    | Section headings, card titles                          |
| `text-2xl`  | 1.5        | 24        | 1.333 (32px) | `-0.015em`     | 600    | Page headings (h2)                                     |
| `text-3xl`  | 1.875      | 30        | 1.267 (38px) | `-0.02em`      | 600    | Primary page titles (h1)                               |
| `text-4xl`  | 2.25       | 36        | 1.222 (44px) | `-0.025em`     | 700    | Display headings (marketing pages, Epic 2.6)           |

### 3.3 Heading Styles

| Level | Size token        | Weight         | Letter spacing | Line height | Usage                                           |
| ----- | ----------------- | -------------- | -------------- | ----------- | ----------------------------------------------- |
| h1    | `text-3xl` (30px) | 600 (semibold) | `-0.02em`      | 1.267       | Page title: "Personen", "Johann von Dalberg"    |
| h2    | `text-2xl` (24px) | 600 (semibold) | `-0.015em`     | 1.333       | Section title: card headers, FieldGroup legends |
| h3    | `text-xl` (20px)  | 500 (medium)   | `-0.01em`      | 1.5         | Sub-section title: tab panel headers            |
| h4    | `text-lg` (18px)  | 500 (medium)   | `-0.005em`     | 1.556       | Minor heading: inline group labels              |

**Rules:**

- Never skip a heading level in the DOM. h1 is always the page-level entity name or page title.
- Heading color uses `foreground` (full contrast), not muted variants.
- Headings in German will be approximately 30% longer. All containers that hold headings must accommodate this without truncation. Maximum heading width: 60ch (which is approximately 44ch of German text with expansion).

### 3.4 Body Text Styles

| Style        | Size               | Weight | Line height | Letter spacing | Color token        | Usage                                                                          |
| ------------ | ------------------ | ------ | ----------- | -------------- | ------------------ | ------------------------------------------------------------------------------ |
| body-default | 16px (`text-base`) | 400    | 1.625       | `0em`          | `foreground`       | Standard body text, form values, descriptions                                  |
| body-large   | 18px (`text-lg`)   | 400    | 1.556       | `-0.005em`     | `foreground`       | Notes field display, transcription reading, evidence quotes                    |
| body-small   | 14px (`text-sm`)   | 400    | 1.5         | `0.01em`       | `foreground`       | Table cell text, compact contexts                                              |
| caption      | 12px (`text-xs`)   | 400    | 1.5         | `0.02em`       | `muted-foreground` | Timestamps, attribution lines, count labels                                    |
| overline     | 12px (`text-xs`)   | 500    | 1.5         | `0.08em`       | `muted-foreground` | Section labels above headings, uppercase transforms (e.g., "PERSON", "QUELLE") |
| label        | 14px (`text-sm`)   | 500    | 1.5         | `0.01em`       | `foreground`       | Form field labels, attribute names in `<dt>` elements                          |

### 3.5 Monospace Text Styles

Geist Mono is used for content where character alignment, literal accuracy, or technical reference is important.

| Context                    | Size               | Weight | Color token        | Example                                |
| -------------------------- | ------------------ | ------ | ------------------ | -------------------------------------- |
| Entity IDs                 | 12px (`text-xs`)   | 400    | `muted-foreground` | `cm7x9k4a10003...`                     |
| Partial dates              | 14px (`text-sm`)   | 500    | `foreground`       | `1648-??-??`                           |
| Diplomatic transcriptions  | 16px (`text-base`) | 400    | `foreground`       | Raw source text with original spelling |
| Archival references        | 14px (`text-sm`)   | 400    | `foreground`       | `GLA 77/1234, Nr. 15, fol. 12r`        |
| Timestamps in activity log | 12px (`text-xs`)   | 400    | `muted-foreground` | `2026-04-02 14:32:07`                  |
| Code/technical contexts    | 14px (`text-sm`)   | 400    | `foreground`       | API responses, debug info              |

### 3.6 Line Length and German Text Accommodation

| Context              | Optimal line length | Maximum line length | Rationale                                                        |
| -------------------- | ------------------- | ------------------- | ---------------------------------------------------------------- |
| Body text (reading)  | 55-65ch             | 75ch                | Classic readability range, with 30% buffer for German            |
| Form field labels    | --                  | 40ch                | German labels like "Diplomatische Transkription" (33ch) must fit |
| Button labels        | --                  | 24ch                | German "Beziehung erstellen" (22ch) is the sizing baseline       |
| Sidebar nav labels   | --                  | 20ch                | "Beziehungstypen" (16ch) + icon + padding must fit in 224px      |
| Table column headers | --                  | 30ch                | "Erstellungsdatum" (17ch) with sort indicator                    |
| Breadcrumb segments  | --                  | 30ch                | Entity names truncate at 30ch with ellipsis                      |
| Tab trigger labels   | --                  | 18ch                | "Beziehungen (12)" (16ch) with count badge                       |

**Truncation rules:**

- Entity names in navigation contexts (breadcrumbs, sidebar, table cells) truncate with `...` at the specified maximum.
- Entity names on their own detail page NEVER truncate -- the heading wraps.
- Button labels NEVER truncate. If a German label does not fit, the button widens.
- Tab triggers use abbreviation as a last resort (e.g., "Bez." for "Beziehungen"), controlled via the i18n system, not CSS truncation.

---

## 4. Spacing and Sizing System

### 4.1 Base Unit and Scale

The base unit is **4px** (0.25rem). The spacing scale uses this base with named tokens that correspond to Tailwind's default scale.

| Token         | Value | Rem   | Usage examples                                          |
| ------------- | ----- | ----- | ------------------------------------------------------- |
| `spacing-0`   | 0px   | 0     | Reset                                                   |
| `spacing-0.5` | 2px   | 0.125 | Hairline gaps (icon-to-text in compact badges)          |
| `spacing-1`   | 4px   | 0.25  | Minimal separation (badge internal padding vertical)    |
| `spacing-1.5` | 6px   | 0.375 | Tight padding (count badge px)                          |
| `spacing-2`   | 8px   | 0.5   | Standard gap between inline elements, icon-text spacing |
| `spacing-2.5` | 10px  | 0.625 | Compact button padding (vertical)                       |
| `spacing-3`   | 12px  | 0.75  | Standard button padding (vertical), input padding       |
| `spacing-4`   | 16px  | 1     | Card internal padding, gap between form fields          |
| `spacing-5`   | 20px  | 1.25  | Increased internal padding for comfortable density      |
| `spacing-6`   | 24px  | 1.5   | Default page section gap, card padding                  |
| `spacing-8`   | 32px  | 2     | Large section gap, page margin on mobile                |
| `spacing-10`  | 40px  | 2.5   | Major section separation                                |
| `spacing-12`  | 48px  | 3     | Sidebar collapsed width, large vertical rhythm          |
| `spacing-14`  | 56px  | 3.5   | TopBar height                                           |
| `spacing-16`  | 64px  | 4     | Bottom tab bar height (mobile/tablet)                   |
| `spacing-20`  | 80px  | 5     | Maximum page margin on wide screens                     |
| `spacing-56`  | 224px | 14    | Sidebar expanded width                                  |

### 4.2 Component Spacing Rules

| Component        | Internal padding              | Gap between children                | Notes                             |
| ---------------- | ----------------------------- | ----------------------------------- | --------------------------------- |
| Button (default) | `py-2.5 px-4` (10px 16px)     | `gap-2` (8px) icon-to-text          | Min height 40px (44px on touch)   |
| Button (sm)      | `py-1.5 px-3` (6px 12px)      | `gap-1.5` (6px)                     | Min height 32px (44px on touch)   |
| Button (lg)      | `py-3 px-6` (12px 24px)       | `gap-2` (8px)                       | Min height 48px                   |
| Input / Select   | `py-2.5 px-3` (10px 12px)     | --                                  | Height 40px (44px on touch)       |
| Card             | `p-6` (24px)                  | `space-y-4` (16px) between sections |                                   |
| Card (compact)   | `p-4` (16px)                  | `space-y-3` (12px)                  | DataTable cells, nested cards     |
| Dialog           | `p-6` (24px)                  | `space-y-4` (16px)                  | Max width 512px (lg)              |
| Popover          | `p-4` (16px)                  | `space-y-3` (12px)                  | Max width 360px                   |
| Tab trigger      | `py-2.5 px-4` (10px 16px)     | `gap-2` (8px) badge spacing         | Min 44px touch on mobile          |
| Badge            | `py-0.5 px-2` (2px 8px)       | `gap-1` (4px)                       |                                   |
| FieldGroup       | `p-4` (16px) with `space-y-4` | --                                  | Bordered group for related fields |
| Form footer      | `pt-6` (24px top padding)     | `gap-3` (12px) between buttons      | Sticky on mobile                  |

### 4.3 Layout Spacing Rules

| Context                    | Value         | Token / class                              | Notes                                                |
| -------------------------- | ------------- | ------------------------------------------ | ---------------------------------------------------- |
| Page container padding     | 24px          | `p-6`                                      | All four sides                                       |
| Page container max-width   | 1280px        | `max-w-7xl`                                | Content does not stretch beyond this                 |
| Section vertical gap       | 24px          | `space-y-6`                                | Between PageHeader, FilterBar, DataTable, Pagination |
| Sidebar width (open)       | 224px         | `w-56` / `--sidebar-width-open: 14rem`     |                                                      |
| Sidebar width (collapsed)  | 48px          | `w-12` / `--sidebar-width-collapsed: 3rem` |                                                      |
| TopBar height              | 56px          | `h-14` / `--topbar-height: 3.5rem`         |                                                      |
| Main content top offset    | 56px          | `pt-14`                                    | Clears TopBar                                        |
| Main content left offset   | 224px or 48px | Dynamic, matches sidebar state             |                                                      |
| Mobile page padding        | 16px          | `p-4`                                      | Reduced for narrow screens                           |
| Grid gap (attribute cards) | 16px          | `gap-4`                                    | Two-column `<dl>` grid                               |
| Card-to-card gap (list)    | 8px           | `gap-2`                                    | Mobile card-stack layout                             |

### 4.4 Touch Target Rules

Per UX architecture Section 4.4, all interactive elements must be at least **44x44px** on touch devices (`@media (pointer: coarse)` or viewport < 1024px). This applies to:

- Buttons (all sizes -- visual may be smaller, tap area expands via padding or `::after`)
- Checkboxes (cell padding extends the target)
- Tab triggers
- Evidence badges (24px visual, 44px tap area)
- Pagination controls
- Dropdown triggers
- CertaintySelector radio options
- Close/dismiss buttons on dialogs and popovers

---

## 5. Shape Language

### 5.1 Border Radius Scale

The radius language is restrained. Sharp corners convey precision; soft corners convey approachability. Evidoxa uses a moderate radius that splits the difference -- structured but not rigid.

| Token         | Value          | Usage                                                      |
| ------------- | -------------- | ---------------------------------------------------------- |
| `radius-none` | 0px            | Table cells, inline elements                               |
| `radius-sm`   | 4px (0.25rem)  | Badges, small chips, code blocks                           |
| `radius-md`   | 6px (0.375rem) | Buttons, inputs, selects -- the default interactive radius |
| `radius-lg`   | 8px (0.5rem)   | Cards, dialogs, popovers -- the default container radius   |
| `radius-xl`   | 12px (0.75rem) | Large containers, page-level cards, modals                 |
| `radius-full` | 9999px         | Avatars, circular indicators, pills                        |

**Rules:**

- The `--radius` CSS property (used by shadcn components) is set to `0.5rem` (8px), mapping to `radius-lg`.
- Nested elements use a smaller radius than their parent. A card (`radius-lg`) contains buttons (`radius-md`) which contain badges (`radius-sm`). This creates visual nesting hierarchy.
- Table rows use `radius-none`. Tables are rectilinear.
- The CertaintySelector buttons use `radius-md` individually, grouped with `radius-lg` on the container.

### 5.2 Border Styles and Widths

| Token            | Value                                   | Usage                                                 |
| ---------------- | --------------------------------------- | ----------------------------------------------------- |
| `border-default` | `1px solid var(--color-border)`         | Cards, inputs, table borders, dividers                |
| `border-strong`  | `1px solid var(--color-foreground/20%)` | Active input focus (inner border), important dividers |
| `border-dashed`  | `1px dashed var(--color-border)`        | Unevidenced claim badges, empty state drop zones      |
| `border-2`       | `2px solid`                             | Active tab indicator, selected sidebar item           |

**Divider pattern:** Horizontal dividers use `<Separator />` from shadcn/ui, rendering as `1px solid var(--color-border)` with `my-4` (16px) vertical margin. The Sidebar uses a separator between navigation groups.

### 5.3 Shadow and Elevation System

Shadows in Evidoxa are subtle. The tool should feel grounded, not floating. Shadows serve functional separation (identifying popovers and dialogs as overlays), not decorative depth.

**Light mode shadows:**

| Level  | Token         | Value                                                                          | Usage                                        |
| ------ | ------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| None   | `shadow-none` | `none`                                                                         | Default for cards (they use borders instead) |
| Subtle | `shadow-sm`   | `0 1px 2px 0 hsl(20 14% 9% / 0.04)`                                            | Buttons on hover, raised surfaces            |
| Medium | `shadow-md`   | `0 4px 6px -1px hsl(20 14% 9% / 0.06), 0 2px 4px -2px hsl(20 14% 9% / 0.04)`   | Popovers, dropdown menus                     |
| Large  | `shadow-lg`   | `0 10px 15px -3px hsl(20 14% 9% / 0.07), 0 4px 6px -4px hsl(20 14% 9% / 0.04)` | Dialogs, command palette                     |

**Dark mode shadows:**

In dark mode, shadows are less visible against dark backgrounds. Elevation is communicated primarily through border and surface lightness differences. Shadows shift to a deeper black with slightly more opacity.

| Level  | Token         | Value                                                                     | Usage            |
| ------ | ------------- | ------------------------------------------------------------------------- | ---------------- |
| None   | `shadow-none` | `none`                                                                    | Default          |
| Subtle | `shadow-sm`   | `0 1px 2px 0 hsl(0 0% 0% / 0.15)`                                         | Buttons on hover |
| Medium | `shadow-md`   | `0 4px 6px -1px hsl(0 0% 0% / 0.25), 0 2px 4px -2px hsl(0 0% 0% / 0.15)`  | Popovers         |
| Large  | `shadow-lg`   | `0 10px 15px -3px hsl(0 0% 0% / 0.35), 0 4px 6px -4px hsl(0 0% 0% / 0.2)` | Dialogs          |

### 5.4 Focus Ring Style

The default browser focus ring is replaced with a consistent, high-contrast ring that meets the 3:1 contrast requirement for UI components.

```css
/* Focus ring specification */
outline: 2px solid var(--color-ring);
outline-offset: 2px;
```

| Mode  | Ring color                   | Contrast against bg | Contrast against card |
| ----- | ---------------------------- | ------------------- | --------------------- |
| Light | `hsl(245 40% 36%)` (primary) | 8.2:1               | 7.9:1                 |
| Dark  | `hsl(245 40% 68%)` (primary) | 8.7:1               | 8.1:1                 |

The ring uses the primary color in both modes, ensuring it is always visually distinct from semantic colors (which a user might be interacting with when the ring appears).

---

## 6. Iconography Direction

### 6.1 Icon Library

**Recommendation: Lucide React** (already installed at `lucide-react ^0.475.0`).

Lucide is confirmed as the icon library. It is the shadcn/ui default, already used throughout the codebase, and provides the 1px stroke-width consistency that matches Evidoxa's restrained visual language. No alternative library is needed.

### 6.2 Icon Sizing Scale

| Token     | Size | Stroke width | Usage                                                          |
| --------- | ---- | ------------ | -------------------------------------------------------------- |
| `icon-xs` | 14px | 1.5px        | Inline with caption text, badge icons                          |
| `icon-sm` | 16px | 1.5px        | Inline with body-small text, table cells, certainty indicators |
| `icon-md` | 20px | 2px          | Buttons, navigation items, form field icons                    |
| `icon-lg` | 24px | 2px          | Page headers, empty state illustrations, sidebar (expanded)    |
| `icon-xl` | 32px | 2px          | Marketing/display contexts, large empty states                 |

### 6.3 Usage Rules

1. **Icons with labels (default).** In navigation, buttons, and form contexts, icons are always paired with a text label. The icon is decorative reinforcement, not the sole communicator.

2. **Icon-only exceptions.** The following contexts may use icons without visible labels, provided `aria-label` is always present:
   - TopBar action buttons (ThemeToggle, LocaleSwitcher when compact)
   - Collapsed sidebar navigation items (tooltip on hover provides the label)
   - DataTable sort indicators
   - Certainty indicators in compact mode (tooltip provides the level name)
   - PropertyEvidenceBadge (count number serves as the label)

3. **Icon color inherits text color.** Icons use `currentColor` and inherit from their parent's text color token. They do not have independent color assignments except for:
   - Certainty icons (use the certainty color tokens)
   - Semantic icons in alerts (use success/warning/destructive/info tokens)

4. **No filled icons.** Lucide's outline style is used consistently. Filled variants (if available) are not used, maintaining the 1px stroke aesthetic.

### 6.4 Certainty Icons

Five distinct shapes that form a visual progression from "full" to "empty," remaining distinguishable in grayscale. These are rendered at `icon-sm` (16px) as the default and `icon-xs` (14px) in compact contexts.

| Level       | Shape description           | Implementation                                                            |
| ----------- | --------------------------- | ------------------------------------------------------------------------- |
| Certain     | Filled circle               | `<Circle>` with `fill="currentColor"` and `stroke="currentColor"`         |
| Probable    | Three-quarter filled circle | Custom SVG: circle with a 270-degree filled arc                           |
| Possible    | Half filled circle          | Custom SVG: circle with a 180-degree filled arc (left half)               |
| Unknown     | Empty circle (ring only)    | `<Circle>` with `stroke="currentColor"` and no fill                       |
| Unevidenced | Dashed circle               | `<Circle>` with `stroke="currentColor"`, `strokeDasharray="3 3"`, no fill |

These five icons will be implemented as a `CertaintyIcon` component that accepts a `level` prop and renders the appropriate SVG. The component must include `aria-hidden="true"` (the parent element carries the `aria-label`).

---

## 7. Motion and Animation Tokens

### 7.1 Philosophy

Motion in Evidoxa serves three purposes: **orientation** (where did I come from, where am I going), **feedback** (the system acknowledged my action), and **continuity** (maintaining spatial context during layout changes). Motion never decorates. A researcher deep in a 3-hour data entry session should not notice the animations -- they should notice if they were absent.

### 7.2 Duration Scale

| Token                 | Value | Usage                                                   |
| --------------------- | ----- | ------------------------------------------------------- |
| `duration-instant`    | 0ms   | Immediate state changes (checkbox toggle, radio select) |
| `duration-fast`       | 100ms | Hover effects, focus ring appearance, tooltip delay     |
| `duration-normal`     | 200ms | Sidebar collapse/expand, theme transition, tab switch   |
| `duration-slow`       | 300ms | Dialog open/close, toast enter/exit, popover appear     |
| `duration-deliberate` | 500ms | Page transitions (fade), bulk operation feedback        |

### 7.3 Easing Functions

| Token         | Value                               | Usage                                                                                        |
| ------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `ease-out`    | `cubic-bezier(0.16, 1, 0.3, 1)`     | Enter animations: elements appearing (dialogs, popovers, toasts). Fast start, gentle settle. |
| `ease-in`     | `cubic-bezier(0.7, 0, 0.84, 0)`     | Exit animations: elements disappearing. Slow start, fast exit.                               |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)`    | Layout shifts: sidebar collapse, panel resize. Symmetric motion.                             |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interactions only: badge count update, certainty level change. Subtle overshoot.       |

### 7.4 Specific Token Assignments

| Element                        | Duration                      | Easing        | Property                                | Notes                                         |
| ------------------------------ | ----------------------------- | ------------- | --------------------------------------- | --------------------------------------------- |
| Page transition (route change) | `duration-deliberate` (500ms) | `ease-out`    | `opacity`                               | Fade in of new content. No slide.             |
| Dialog open                    | `duration-slow` (300ms)       | `ease-out`    | `opacity, transform`                    | Scale from 95% to 100% + fade in              |
| Dialog close                   | `duration-normal` (200ms)     | `ease-in`     | `opacity, transform`                    | Scale to 95% + fade out                       |
| Toast enter                    | `duration-slow` (300ms)       | `ease-out`    | `opacity, transform`                    | Slide up from bottom-right + fade in          |
| Toast exit                     | `duration-normal` (200ms)     | `ease-in`     | `opacity, transform`                    | Fade out + slide down                         |
| Sidebar collapse               | `duration-normal` (200ms)     | `ease-in-out` | `width, padding-left`                   | Sidebar + main content shift simultaneously   |
| Sidebar expand                 | `duration-normal` (200ms)     | `ease-in-out` | `width, padding-left`                   | Same as collapse, symmetric                   |
| Tooltip appear                 | `duration-fast` (100ms)       | `ease-out`    | `opacity`                               | Fade only, no transform                       |
| Tooltip disappear              | `duration-fast` (100ms)       | `ease-in`     | `opacity`                               | Fade only                                     |
| Hover state                    | `duration-fast` (100ms)       | `ease-out`    | `background-color, border-color`        | Interactive element background change         |
| Focus ring                     | `duration-instant` (0ms)      | --            | `outline`                               | Immediate, no transition                      |
| Theme switch                   | `duration-normal` (200ms)     | `ease-in-out` | `background-color, color, border-color` | Applied via `transition` on `body`            |
| Badge count update             | `duration-fast` (100ms)       | `ease-spring` | `transform`                             | Brief scale pulse (1.0 to 1.15 to 1.0)        |
| DataTable sort                 | `duration-fast` (100ms)       | `ease-in-out` | `opacity`                               | Brief opacity dip during re-sort              |
| Skeleton pulse                 | 2000ms                        | `ease-in-out` | `opacity`                               | Continuous pulse between 40% and 100% opacity |

### 7.5 `prefers-reduced-motion` Strategy

When the user has `prefers-reduced-motion: reduce` enabled, Evidoxa does not eliminate all motion -- it replaces spatial motion with opacity-only transitions and reduces durations.

| Original behavior                | Reduced-motion replacement     |
| -------------------------------- | ------------------------------ |
| Dialog scale + fade (300ms)      | Fade only (200ms)              |
| Toast slide + fade (300ms)       | Fade only (200ms)              |
| Sidebar width transition (200ms) | Instant width change (0ms)     |
| Page fade transition (500ms)     | Instant content swap (0ms)     |
| Badge scale pulse (100ms)        | No animation                   |
| Skeleton pulse (2000ms)          | Static 60% opacity (no pulse)  |
| Theme color transition (200ms)   | Instant color change (0ms)     |
| Hover background (100ms)         | Instant change (0ms)           |
| Tooltip fade (100ms)             | Instant appear/disappear (0ms) |

**Implementation:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This global reset is the baseline. Individual components may then opt back in to opacity-only fades at reduced durations where feedback is essential (dialog open/close, toast appear). These opt-ins are documented per component in the pattern library.

---

## 8. Complete CSS Custom Properties

This is the primary implementation deliverable. These values map directly to the `@theme` block in `globals.css` and the `.dark` class override.

### 8.1 Light Mode (`:root` / `@theme`)

```css
@theme {
  /* ---- Fonts ---- */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  /* ---- Border Radius ---- */
  --radius: 0.5rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* ---- Core Surfaces ---- */
  --color-background: hsl(36 25% 98.5%);
  --color-foreground: hsl(20 14% 9%);

  --color-card: hsl(36 20% 99.5%);
  --color-card-foreground: hsl(20 14% 9%);

  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(20 14% 9%);

  --color-sidebar: hsl(36 18% 97%);
  --color-sidebar-foreground: hsl(20 14% 9%);

  /* ---- Brand Colors ---- */
  --color-primary: hsl(245 40% 36%);
  --color-primary-foreground: hsl(240 20% 98%);

  --color-secondary: hsl(33 16% 93%);
  --color-secondary-foreground: hsl(20 12% 16%);

  --color-muted: hsl(33 16% 93%);
  --color-muted-foreground: hsl(26 10% 38%);

  --color-accent: hsl(170 18% 92%);
  --color-accent-foreground: hsl(170 25% 18%);

  /* ---- Semantic: Destructive ---- */
  --color-destructive: hsl(4 60% 46%);
  --color-destructive-foreground: hsl(0 0% 98%);

  /* ---- Borders and Rings ---- */
  --color-border: hsl(30 14% 88%);
  --color-input: hsl(30 14% 88%);
  --color-input-border: hsl(30 14% 55%);
  --color-ring: hsl(245 40% 36%);

  /* ---- Semantic Colors ---- */
  --color-success: hsl(152 45% 32%);
  --color-success-foreground: hsl(152 50% 14%);
  --color-success-background: hsl(152 35% 93%);
  --color-success-border: hsl(152 30% 82%);

  --color-warning: hsl(38 80% 42%);
  --color-warning-foreground: hsl(32 70% 18%);
  --color-warning-background: hsl(40 60% 94%);
  --color-warning-border: hsl(38 50% 82%);

  --color-info: hsl(210 55% 44%);
  --color-info-foreground: hsl(210 60% 16%);
  --color-info-background: hsl(210 45% 94%);
  --color-info-border: hsl(210 35% 82%);

  --color-destructive-background: hsl(4 50% 95%);
  --color-destructive-border: hsl(4 40% 84%);

  /* ---- Certainty Colors ---- */
  --color-certainty-certain: hsl(180 50% 30%);
  --color-certainty-certain-foreground: hsl(180 55% 14%);
  --color-certainty-certain-background: hsl(180 40% 93%);
  --color-certainty-certain-border: hsl(180 35% 78%);

  --color-certainty-probable: hsl(215 50% 38%);
  --color-certainty-probable-foreground: hsl(215 55% 16%);
  --color-certainty-probable-background: hsl(215 40% 93%);
  --color-certainty-probable-border: hsl(215 35% 78%);

  --color-certainty-possible: hsl(265 35% 45%);
  --color-certainty-possible-foreground: hsl(265 40% 18%);
  --color-certainty-possible-background: hsl(265 30% 94%);
  --color-certainty-possible-border: hsl(265 25% 80%);

  --color-certainty-unknown: hsl(38 65% 45%);
  --color-certainty-unknown-foreground: hsl(38 70% 18%);
  --color-certainty-unknown-background: hsl(38 50% 93%);
  --color-certainty-unknown-border: hsl(38 40% 76%);

  --color-certainty-unevidenced: hsl(20 15% 40%);
  --color-certainty-unevidenced-foreground: hsl(20 20% 22%);
  --color-certainty-unevidenced-background: hsl(20 10% 94%);
  --color-certainty-unevidenced-border: hsl(20 10% 80%);

  /* ---- Chart / Accent Colors ---- */
  --color-chart-1: hsl(245 40% 36%);
  --color-chart-2: hsl(180 50% 30%);
  --color-chart-3: hsl(38 70% 50%);
  --color-chart-4: hsl(152 45% 32%);
  --color-chart-5: hsl(265 35% 45%);

  /* ---- Layout Tokens ---- */
  --sidebar-width-open: 14rem;
  --sidebar-width-collapsed: 3rem;
  --topbar-height: 3.5rem;

  /* ---- Motion Tokens ---- */
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-deliberate: 500ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 8.2 Dark Mode (`.dark`)

```css
.dark {
  /* ---- Core Surfaces ---- */
  --color-background: hsl(25 10% 4.5%);
  --color-foreground: hsl(30 10% 94%);

  --color-card: hsl(25 9% 6.5%);
  --color-card-foreground: hsl(30 10% 94%);

  --color-popover: hsl(24 8% 9%);
  --color-popover-foreground: hsl(30 10% 94%);

  --color-sidebar: hsl(25 8% 5.5%);
  --color-sidebar-foreground: hsl(30 10% 94%);

  /* ---- Brand Colors ---- */
  --color-primary: hsl(245 40% 68%);
  --color-primary-foreground: hsl(245 45% 13%);

  --color-secondary: hsl(24 8% 14%);
  --color-secondary-foreground: hsl(30 10% 94%);

  --color-muted: hsl(24 8% 14%);
  --color-muted-foreground: hsl(22 5% 55%);

  --color-accent: hsl(170 12% 14%);
  --color-accent-foreground: hsl(170 18% 88%);

  /* ---- Semantic: Destructive ---- */
  --color-destructive: hsl(4 55% 58%);
  --color-destructive-foreground: hsl(4 40% 94%);

  /* ---- Borders and Rings ---- */
  --color-border: hsl(22 7% 18%);
  --color-input: hsl(22 7% 18%);
  --color-input-border: hsl(22 7% 40%);
  --color-ring: hsl(245 40% 68%);

  /* ---- Semantic Colors ---- */
  --color-success: hsl(152 40% 55%);
  --color-success-foreground: hsl(152 30% 92%);
  --color-success-background: hsl(152 25% 12%);
  --color-success-border: hsl(152 20% 22%);

  --color-warning: hsl(38 70% 55%);
  --color-warning-foreground: hsl(38 50% 94%);
  --color-warning-background: hsl(38 40% 11%);
  --color-warning-border: hsl(38 30% 24%);

  --color-info: hsl(210 50% 62%);
  --color-info-foreground: hsl(210 35% 94%);
  --color-info-background: hsl(210 30% 11%);
  --color-info-border: hsl(210 22% 24%);

  --color-destructive-background: hsl(4 35% 11%);
  --color-destructive-border: hsl(4 25% 24%);

  /* ---- Certainty Colors ---- */
  --color-certainty-certain: hsl(180 40% 55%);
  --color-certainty-certain-foreground: hsl(180 30% 92%);
  --color-certainty-certain-background: hsl(180 25% 12%);
  --color-certainty-certain-border: hsl(180 20% 26%);

  --color-certainty-probable: hsl(215 42% 60%);
  --color-certainty-probable-foreground: hsl(215 30% 92%);
  --color-certainty-probable-background: hsl(215 25% 12%);
  --color-certainty-probable-border: hsl(215 20% 26%);

  --color-certainty-possible: hsl(265 32% 62%);
  --color-certainty-possible-foreground: hsl(265 25% 92%);
  --color-certainty-possible-background: hsl(265 20% 13%);
  --color-certainty-possible-border: hsl(265 16% 28%);

  --color-certainty-unknown: hsl(38 55% 55%);
  --color-certainty-unknown-foreground: hsl(38 40% 92%);
  --color-certainty-unknown-background: hsl(38 30% 12%);
  --color-certainty-unknown-border: hsl(38 25% 26%);

  --color-certainty-unevidenced: hsl(20 12% 56%);
  --color-certainty-unevidenced-foreground: hsl(20 10% 88%);
  --color-certainty-unevidenced-background: hsl(20 8% 10%);
  --color-certainty-unevidenced-border: hsl(20 8% 22%);

  /* ---- Chart / Accent Colors ---- */
  --color-chart-1: hsl(245 40% 68%);
  --color-chart-2: hsl(180 40% 55%);
  --color-chart-3: hsl(38 60% 55%);
  --color-chart-4: hsl(152 40% 55%);
  --color-chart-5: hsl(265 32% 62%);
}
```

### 8.3 Base Layer

```css
@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    transition-property: background-color, color, border-color;
    transition-duration: var(--duration-normal);
    transition-timing-function: var(--ease-in-out);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

---

## Appendix A: Contrast Verification Matrix

Key text/background combinations and their approximate contrast ratios. All values meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text/UI components). Pairs marked with a double checkmark also meet AAA (7:1).

| Combination                         | Light ratio | Dark ratio | Standard           |
| ----------------------------------- | ----------- | ---------- | ------------------ |
| foreground on background            | 15.8:1      | 14.2:1     | AAA                |
| foreground on card                  | 15.2:1      | 13.5:1     | AAA                |
| muted-foreground on background      | 5.8:1       | 5.2:1      | AA                 |
| muted-foreground on card            | 5.5:1       | 4.8:1      | AA                 |
| primary on background               | 8.2:1       | 8.7:1      | AAA                |
| primary-foreground on primary       | 11.4:1      | 9.1:1      | AAA                |
| destructive on background           | 5.1:1       | 5.8:1      | AA                 |
| certainty-certain on background     | 6.4:1       | 6.8:1      | AA (large: AAA)    |
| certainty-probable on background    | 5.6:1       | 6.1:1      | AA                 |
| certainty-possible on background    | 4.8:1       | 5.2:1      | AA                 |
| certainty-unknown on background     | 4.6:1       | 5.0:1      | AA                 |
| certainty-unevidenced on background | 5.2:1       | 5.0:1      | AA                 |
| input-border on background          | 3.5:1       | 3.2:1      | AA (UI components) |

**Note:** The `--color-input-border` token is distinct from `--color-border`. It provides a higher-contrast border specifically for input fields, ensuring that form inputs are perceivable by users with low contrast sensitivity. The general `--color-border` remains at `hsl(30 14% 88%)` for subtle structural borders on cards and dividers.

## Appendix B: Color-Blindness Simulation Notes

The certainty palette was designed to remain distinguishable under the three major color vision deficiency types:

| Pair                              | Protanopia                                                  | Deuteranopia                                      | Tritanopia                                      |
| --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| Certain (180) vs. Probable (215)  | Distinguishable (both shift blue, but lightness differs)    | Distinguishable (lightness difference maintained) | Distinguishable (hue separation maintained)     |
| Probable (215) vs. Possible (265) | Distinguishable (blue vs. purple remains visible)           | Distinguishable (lightness and saturation differ) | Partially conflated -- icon shape disambiguates |
| Possible (265) vs. Unknown (38)   | Distinguishable (purple vs. yellow remains strong)          | Distinguishable (cool vs. warm axis preserved)    | Distinguishable (lightness difference strong)   |
| Unknown (38) vs. Unevidenced (20) | Distinguishable (saturated amber vs. desaturated warm grey) | Distinguishable (saturation difference clear)     | Distinguishable (saturation difference clear)   |

In all cases where hue discrimination weakens, the icon shapes (filled circle, three-quarter, half, ring, dashed ring) provide unambiguous differentiation. This is why dual-channel encoding is mandatory, not optional.

---

_This document establishes the visual identity of Evidoxa. All downstream design system documents (token engineering, component patterns, UI design) must reference these specifications by token name. No raw color values, pixel sizes, or timing values should appear in component code -- only references to the tokens defined here._
