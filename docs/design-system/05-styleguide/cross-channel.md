# Evidoxa Cross-Channel Brand Styleguide

**Version:** 1.0
**Date:** 2026-04-02
**Audience:** Designers, communicators, and institutional partners producing Evidoxa-branded material across digital and print channels.
**Upstream dependencies:** `02-brand/identity.md`, `04-design-system/tokens.md`

---

## Table of Contents

1. [One-Page Brand Summary](#1-one-page-brand-summary)
2. [Social Media](#2-social-media)
3. [Print: Flyers and Posters](#3-print-flyers-and-posters)
4. [Email and Mailings](#4-email-and-mailings)
5. [Business Cards](#5-business-cards)
6. [Presentation Slides](#6-presentation-slides)
7. [Universal Brand Rules](#7-universal-brand-rules)

---

## 1. One-Page Brand Summary

### Brand Identity Quick Reference

---

**BRAND NAME:** Evidoxa

**TAGLINE:** Evidenz trifft Interpretation. / Where evidence meets interpretation.
_(Use the German tagline as primary in DE-language contexts; English for international/conference contexts.)_

---

### Five Brand Attributes

| Attribute       | Core Meaning                                                                 | Visual Signal                                                                 |
| --------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Rigorous**    | Every datum requires justification; absence of evidence is visible           | Certainty indicators always present; structured fields; no decorative voids   |
| **Lucid**       | Complex material rendered clearly; interface recedes                         | Clear scan path; progressive disclosure; low-fatigue warm temperatures        |
| **Enduring**    | Built to last; no trend-chasing; the aesthetic lineage of a research library | Restrained animation; warm neutrals; typography that prioritizes legibility   |
| **Collegial**   | Trusted colleague; respects domain expertise; never patronizing              | Prominent attribution; anticipatory review states; direct, calm copy          |
| **Resourceful** | Adapts to language, century, and institutional boundary                      | German sizing baseline; partial dates and certainty levels as native features |

---

### Primary Color Palette

All HSL values are the canonical source. Hex values are for contexts where HSL is not available (print previews, third-party tools). CMYK values are for offset print; see Section 3 for full print specifications.

| Name                  | Token                           | HSL                 | Hex       | CMYK (coated)      | Role                                         |
| --------------------- | ------------------------------- | ------------------- | --------- | ------------------ | -------------------------------------------- |
| Archival Indigo       | `--color-primary`               | `hsl(245 40% 36%)`  | `#3D3580` | C:70 M:68 Y:0 K:37 | Primary buttons, active states, brand accent |
| Warm Off-White        | `--color-background`            | `hsl(36 25% 98.5%)` | `#FAF8F5` | C:0 M:1 Y:2 K:2    | Page/document background                     |
| Deep Warm Charcoal    | `--color-foreground`            | `hsl(20 14% 9%)`    | `#1A1614` | C:0 M:8 Y:12 K:90  | Primary text, headings                       |
| Certain Teal          | `--color-certainty-certain`     | `hsl(180 50% 30%)`  | `#267373` | C:67 M:0 Y:1 K:55  | Certainty: Certain                           |
| Probable Blue         | `--color-certainty-probable`    | `hsl(215 50% 38%)`  | `#325A91` | C:65 M:38 Y:0 K:43 | Certainty: Probable                          |
| Possible Violet       | `--color-certainty-possible`    | `hsl(265 35% 45%)`  | `#6B529E` | C:32 M:49 Y:0 K:38 | Certainty: Possible                          |
| Unknown Amber         | `--color-certainty-unknown`     | `hsl(38 65% 45%)`   | `#BD7B24` | C:0 M:35 Y:81 K:26 | Certainty: Unknown                           |
| Unevidenced Warm Grey | `--color-certainty-unevidenced` | `hsl(20 15% 40%)`   | `#796A62` | C:0 M:13 Y:21 K:53 | Certainty: Unevidenced                       |

---

### Primary Typeface

| Role                                   | Family     | Fallback                               |
| -------------------------------------- | ---------- | -------------------------------------- |
| UI, body, headings                     | Geist Sans | `ui-sans-serif, system-ui, sans-serif` |
| IDs, dates, codes, archival references | Geist Mono | `ui-monospace, monospace`              |

**Scale anchor:** 16px body, minor-third ratio (×1.200). Headings at weight 600 (semibold). Body at weight 400 (regular).

---

### Logo Clear Space Rule

Minimum clear space around the Evidoxa logotype equals the cap-height of the wordmark on all four sides. No other visual element — text, image, border, or competing logotype — may enter this zone.

**Minimum reproduction size:** 80px wide (digital); 25mm wide (print). Below this size, use the monogram mark only.

---

### The Single Most Important Brand Rule

**Certainty indicators are non-negotiable.** Every data point that carries a certainty level must display it. In any channel where the certainty color system cannot render correctly (e.g., greyscale print, low-fidelity reproduction), replace color with the paired icon shape (filled circle / three-quarter / half / ring / dashed) plus a text label. The certainty vocabulary is the intellectual contract with the user; never omit it.

---

---

## 2. Social Media

### 2.1 Platform Overview

Evidoxa's primary social presence targets the German-speaking academic community. Tone across all platforms is collegial and professional: a trusted colleague sharing relevant findings, not a startup announcing features. Caption language defaults to German; English is used for international conferences, open-source announcements, and English-language academic communities.

---

### 2.2 X / Twitter

#### Profile Assets

| Asset           | Dimensions                        | Format               | Treatment                                                                                                                                                                                           |
| --------------- | --------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile image   | 400×400px (displays at 200×200px) | PNG, no transparency | Logotype centered on Archival Indigo background (`#3D3580`). 15% padding. No circular crop applied by designer — platform does this automatically.                                                  |
| Header / banner | 1500×500px                        | JPG or PNG           | Warm off-white background (`#FAF8F5`). Full wordmark left-aligned at vertical center. Right half: a subtle archival texture or ruled-line pattern in stone-200 (`hsl(30 14% 88%)`). No photography. |

#### Post Template Patterns

**Announcement (new feature or release):**

- Lead with a single declarative statement in German or English (not both in the same post).
- Follow with one sentence of context (what problem it solves, for whom).
- Close with a URL or call to action. No hashtag stuffing — maximum 2 hashtags.
- No exclamation marks. No emoji beyond a single neutral one if needed for visual scanning.
- Example: "Evidoxa 2.1: Personenverwaltung mit partiellen Datumsangaben und Gewissheitsstufen. Für Forschungsprojekte, die mit unvollständigen Quellen arbeiten. [link] #Digitalhistory #Archivarbeit"

**Feature highlight (demonstrating a specific capability):**

- Begin with a concrete research scenario, not a product claim.
- Two to three sentences maximum.
- Attach a screenshot showing the feature in context. Screenshot must use the light-mode UI at 1280×800px, exported at 2× resolution. No mock-ups with unrealistic data; use the standard demo dataset.
- Example: "Eine Quelle aus dem 17. Jahrhundert mit unsicherem Entstehungsdatum? In Evidoxa lässt sich das Jahr als '1648-??-??' erfassen — mit Gewissheitsstufe 'Möglich'. [screenshot]"

**Research tip (methodological or domain guidance):**

- Framed as practical advice from a colleague, not as product documentation.
- No product branding in the first sentence.
- Example: "Tipp für die Quellenarbeit: Bei diplomatischen Transkriptionen sollte der Originalwortlaut separat von der modernen Übertragung gespeichert werden. Evidoxa hält beide Felder getrennt und durchsuchbar."

#### Caption Tone and Length

- Maximum 220 characters for the main statement (leaves room for URL and hashtags within the 280-character limit).
- Direct and precise. No rhetorical questions.
- German compound nouns are expected and appropriate; do not simplify for casual reading.
- No "we're excited to announce" framing.

#### Hashtag Strategy

Use 1–2 hashtags maximum per post. Recommended pool:
`#Digitalhistory` `#Geschichtswissenschaft` `#Archivarbeit` `#Historische Forschung` `#DigitalHumanities` `#OpenSource`

Do not use trending general hashtags unrelated to the academic domain.

#### What NOT to Do on X

- No GIF reactions, meme formats, or informal internet culture references.
- Do not engage in platform controversies or ratio threads.
- Do not post UI mockups using CSS gradients, glassmorphism, or dark-mode-only screenshots as the first visual impression — always lead with light mode.
- Do not repost compliments without adding substantive context.
- Do not post at cadences that suggest automated marketing (multiple posts per day, identical structures).

---

### 2.3 LinkedIn

#### Profile Assets

| Asset        | Dimensions                              | Format     | Treatment                                                                                                            |
| ------------ | --------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Company logo | 300×300px (displays at 60×60px in feed) | PNG        | Same as X profile image: logotype on Archival Indigo.                                                                |
| Cover image  | 1128×191px                              | JPG or PNG | Wider format than X. Full wordmark on Warm Off-White. Tagline set in Geist Sans 18px below the wordmark. No imagery. |

#### Post Template Patterns

LinkedIn posts reach faculty decision-makers, archivists, and institutional IT contacts. Posts here have longer form tolerance and should lean toward professional depth.

**Announcement:**

- Two to four paragraphs. First paragraph states the news and the audience it serves. Second paragraph provides context (why this matters for scholarly work). Third paragraph optional: technical detail for interested readers. Close with a link.
- Headline format: write the first sentence as a standalone declaration — LinkedIn often shows only the first line before truncation.
- Example opening: "Evidoxa 2.4 bringt ein universelles Beziehungssystem für historische Entitäten. Historiker und Archivar:innen können jetzt beliebige Beziehungstypen zwischen Personen, Ereignissen und Quellen definieren — mit Quellenbelegen pro Beziehungsfeld."

**Feature highlight:**

- Screenshot or brief screen recording (max 30 seconds, no audio required, captions mandatory).
- Caption explains the research value, not the technical implementation.
- Tag relevant institutions or collaborators where appropriate.

**Research tip / thought leadership:**

- Longer form (400–600 words) is appropriate on LinkedIn.
- Begin with a challenge in the research workflow, not with Evidoxa.
- Introduce the approach that addresses the challenge, then mention how Evidoxa implements it.
- End with a question to invite professional discussion.

#### Caption Tone and Length

- Professional and substantive. LinkedIn's algorithm rewards engagement, but quality > volume.
- No listicle formatting with bullet emojis; use short paragraphs instead.
- German or English depending on the target audience for the specific post.

#### Hashtag Strategy

3–5 hashtags at end of post. Recommended:
`#Geschichtswissenschaft` `#DigitalHumanities` `#Archivwissenschaft` `#Forschungsdaten` `#OpenSource` `#Wissenschaft`

#### What NOT to Do on LinkedIn

- No personal-growth content, motivational quotes, or "hustle culture" framing.
- Do not post the same content on the same day as X; adapt register and length for the platform.
- Do not use carousel posts with heavily stylized slides that deviate from brand colors.
- Avoid "tagging for reach" posts that tag people who have no relationship to the content.

---

### 2.4 Mastodon

Evidoxa's presence on Mastodon (recommended instance: `scholar.social` or `hcommons.social`) reaches the digital humanities and open-source academic community — a technically sophisticated audience that values transparency, openness, and methodological rigor.

#### Profile Assets

| Asset         | Dimensions | Format | Treatment                             |
| ------------- | ---------- | ------ | ------------------------------------- |
| Profile image | 400×400px  | PNG    | Same logotype treatment as X/Twitter. |
| Header image  | 1500×500px | PNG    | Identical to X banner.                |

#### Post Template Patterns

**Announcement:**

- Use content warnings (CW) for long posts (over 300 words) with the summary in the CW field.
- Link to a blog post or changelog for detail rather than cramming everything into the toot.
- Acknowledge the open-source nature of the project where relevant.

**Feature highlight:**

- Screenshots welcomed. Always include ALT text on images describing the interface shown in sufficient detail for screen-reader users. This is both a legal requirement and aligned with Evidoxa's accessibility commitments.
- Example ALT text: "Evidoxa Detailansicht einer Person mit fünf Gewissheitsstufen-Badges, farblich von Teal (Gesichert) bis Warmgrau (Unbelegt) unterschieden."

**Research tip:**

- Same collegial framing as X, but slightly longer form is acceptable.
- Link to primary sources or methodology papers where possible.

#### Caption Tone and Length

- Mastodon's default character limit (500 characters on most instances) allows more nuance than X.
- Tone is the most informal of the three platforms, but still professional. Abbreviations and domain shorthand are expected.
- Boosting and responding to relevant community posts is valued; lurking brand accounts are viewed negatively on this platform.

#### Hashtag Strategy

Mastodon hashtag discovery is more important than on other platforms (no algorithmic amplification). Use 3–5 descriptive hashtags:
`#DigitalHumanities` `#Geschichtswissenschaft` `#OpenSource` `#Archivwissenschaft` `#EvidenzbasierteForschung`

#### What NOT to Do on Mastodon

- Do not post images without ALT text. Ever.
- Do not automate posts with a bot without clearly labeling the account as automated.
- Do not cross-post without platform adaptation (especially avoiding Twitter-specific formatting like "RT:").
- Do not use Mastodon purely as a broadcast channel; engage with replies.

---

### 2.5 Image Treatment for Social Media

All UI screenshots used in social posts must follow these specifications:

- **Source:** Light mode at 1280×800px, exported at 2× (2560×1600px final).
- **Content:** Use the standard demo dataset only. No production data, no invented research data with real person names.
- **Browser chrome:** Crop out browser chrome unless showing the URL is purposeful.
- **Annotation:** If adding callout arrows or highlights, use Archival Indigo (`#3D3580`) at 2px stroke, `radius-sm` (4px) for highlight boxes. Do not use red, yellow, or any certainty-palette color for annotations — those colors carry semantic meaning within the UI.
- **No filter or color grading:** Screenshots must show true brand colors.
- **Photography (non-UI imagery):** See Section 7.3 for photography style guidelines.

---

---

## 3. Print: Flyers and Posters

### 3.1 CMYK Color Conversions

Print color values are derived from the brand HSL tokens via the sRGB color space. These CMYK values are calibrated for **coated paper stock** using a standard CMYK profile (Fogra39 / ISO Coated v2). On uncoated stock, increase K by 3–5% and reduce CMY slightly to compensate for dot gain. Always request a press proof for colors critical to brand identity (Archival Indigo, in particular).

#### Primary Brand Colors

| Color Name                      | HSL                 | Hex       | CMYK (coated)      | CMYK (uncoated, approx.) |
| ------------------------------- | ------------------- | --------- | ------------------ | ------------------------ |
| Archival Indigo (primary)       | `hsl(245 40% 36%)`  | `#3D3580` | C:70 M:68 Y:0 K:37 | C:65 M:63 Y:0 K:42       |
| Warm Off-White (background)     | `hsl(36 25% 98.5%)` | `#FAF8F5` | C:0 M:1 Y:2 K:2    | C:0 M:0 Y:1 K:4          |
| Deep Warm Charcoal (foreground) | `hsl(20 14% 9%)`    | `#1A1614` | C:0 M:8 Y:12 K:90  | C:0 M:5 Y:8 K:93         |
| Muted Warm Grey (muted text)    | `hsl(26 10% 38%)`   | `#6A6259` | C:0 M:8 Y:14 K:58  | C:0 M:5 Y:11 K:62        |
| Warm Stone Border               | `hsl(30 14% 88%)`   | `#E3DDD7` | C:0 M:2 Y:4 K:11   | C:0 M:1 Y:3 K:15         |

#### Certainty Colors

| Level                   | HSL                | Hex       | CMYK (coated)      |
| ----------------------- | ------------------ | --------- | ------------------ |
| Certain — Teal          | `hsl(180 50% 30%)` | `#267373` | C:67 M:0 Y:1 K:55  |
| Probable — Blue         | `hsl(215 50% 38%)` | `#325A91` | C:65 M:38 Y:0 K:43 |
| Possible — Violet       | `hsl(265 35% 45%)` | `#6B529E` | C:32 M:49 Y:0 K:38 |
| Unknown — Amber         | `hsl(38 65% 45%)`  | `#BD7B24` | C:0 M:35 Y:81 K:26 |
| Unevidenced — Warm Grey | `hsl(20 15% 40%)`  | `#796A62` | C:0 M:13 Y:21 K:53 |

#### Semantic Colors

| Color Name               | HSL                | Hex       | CMYK (coated)      |
| ------------------------ | ------------------ | --------- | ------------------ |
| Success (Muted Sage)     | `hsl(152 45% 32%)` | `#2D7D57` | C:64 M:0 Y:31 K:51 |
| Warning (Archival Amber) | `hsl(38 80% 42%)`  | `#C07820` | C:0 M:38 Y:83 K:25 |
| Danger (Iron Oxide)      | `hsl(4 60% 46%)`   | `#BE3D2E` | C:0 M:67 Y:75 K:25 |

**Important:** Do not reproduce the certainty badge colors as background fills on large print areas. On large uncoated surfaces, amber and teal shift significantly from their intended digital appearance. Use them only in small badge-scale elements (no larger than 20mm wide), and always pair with the icon shape and text label.

---

### 3.2 Print Typography

Geist Sans is available as a downloadable web font (geist.vercel.app). For print production, embed the font at the PDF creation stage. If Geist Sans is not available in the print workflow, substitute **Inter** (identical optical metrics) as a secondary fallback, then **Helvetica Neue**.

#### Minimum Print Sizes

| Element                | Screen equivalent | Minimum print size | Notes                                |
| ---------------------- | ----------------- | ------------------ | ------------------------------------ |
| Body text              | 16px              | 9pt (3.2mm)        | Long-form body in academic flyers    |
| Caption / metadata     | 12px              | 7pt (2.5mm)        | Dates, attribution, sources cited    |
| Label / form header    | 14px              | 8pt (2.8mm)        | Section labels                       |
| Section heading (h3)   | 20px              | 12pt (4.2mm)       | Card titles on posters               |
| Page heading (h2)      | 24px              | 14pt (4.9mm)       | Section titles on posters            |
| Primary title (h1)     | 30px              | 18pt (6.4mm)       | Main poster headline                 |
| Display / large poster | 36px              | 24pt+ (8.5mm+)     | Scaled proportionally by poster size |

#### Weight Recommendations for Print

- **Semibold (600):** All headings. Geist Sans 600 reproduces cleanly on coated stock at any of the above sizes.
- **Medium (500):** Section labels, overlines. Use sparingly on uncoated stock below 8pt.
- **Regular (400):** All body text. Do not use weight below 400 (Geist Thin / Light) for body in print; hairline weights disappear on uncoated stock.
- **Bold (700) and above:** Reserve for pull quotes and display contexts only. Evidoxa does not use heavy weight as a default heading weight.

---

### 3.3 A4 Layout Grid

**Page size:** 210 × 297mm (A4 portrait)
**Bleed:** 3mm on all four edges (page expands to 216 × 303mm with bleed)
**Trim marks:** 5mm outside the bleed edge
**Safe zone (live area):** 10mm from each trimmed edge (inner from bleed: 13mm)

| Zone                | Measurement from trim edge |
| ------------------- | -------------------------- |
| Top margin          | 20mm                       |
| Bottom margin       | 20mm                       |
| Left margin         | 18mm                       |
| Right margin        | 18mm                       |
| Live content width  | 210 − 36 = 174mm           |
| Live content height | 297 − 40 = 257mm           |

**Column grid (standard two-column):**

- Column count: 2
- Column width: 83mm each
- Gutter: 8mm
- Total: 83 + 8 + 83 = 174mm (matches live content width)

**Column grid (three-column, for data-dense flyers):**

- Column count: 3
- Column width: 54mm each
- Gutter: 6mm
- Total: 54 + 6 + 54 + 6 + 54 = 174mm

**Baseline grid:** 4mm (14pt equivalent at 96 DPI). All text elements should align to this grid. The 9pt body size sits on a 14pt leading, which aligns cleanly to a 4mm baseline grid at print scale.

**Header zone:** Top 40mm of live area. Contains logotype (left-aligned, 25mm wide minimum) and optional tagline. Bottom of header zone defined by a 0.25pt rule in stone-200 (`hsl(30 14% 88%)` — CMYK C:0 M:2 Y:4 K:11).

**Footer zone:** Bottom 15mm of live area. URL, version, institution, date. Set in caption style (7pt Geist Sans 400, warm grey).

---

### 3.4 US Letter Layout Grid

**Page size:** 8.5 × 11 inches (215.9 × 279.4mm)
**Bleed:** 0.125in (3.175mm) on all four edges
**Safe zone:** 0.375in (9.525mm) from each trim edge

| Zone                | Measurement from trim edge  |
| ------------------- | --------------------------- |
| Top margin          | 0.75in (19mm)               |
| Bottom margin       | 0.75in (19mm)               |
| Left margin         | 0.7in (17.8mm)              |
| Right margin        | 0.7in (17.8mm)              |
| Live content width  | 8.5 − 1.4 = 7.1in (180.3mm) |
| Live content height | 11 − 1.5 = 9.5in (241.3mm)  |

**Column grid (two-column):**

- Column width: 3.4in (86.4mm) each
- Gutter: 0.3in (7.6mm)

**Baseline grid:** 0.167in (4.24mm / ~12pt). Use 0.5pt rule weight for dividers.

The US Letter layout is marginally wider relative to height than A4. When adapting A4 designs: increase body text line length by approximately 8%, reduce heading sizes by 1pt to maintain proportion, and adjust footer zone to 0.55in from trim edge.

---

### 3.5 Paper Stock Recommendations

| Document type              | Weight      | Finish                        | Notes                                                                                                             |
| -------------------------- | ----------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Conference flyer           | 150–170 gsm | Silk coated                   | Best color reproduction. Geist Sans at 9pt is legible without dot gain distortion.                                |
| Event poster (A1/A0)       | 135–150 gsm | Gloss coated                  | Archival Indigo reproduces with maximum richness. Avoid matte for large-format indigo fills.                      |
| Academic brochure          | 120–135 gsm | Uncoated offset               | Preferred for institutions with sustainable procurement policies. Adjust CMYK values per Section 3.1.             |
| Institutional leave-behind | 250 gsm     | Silk with soft-touch laminate | Card weight. Tactile quality aligned with "Enduring" brand attribute.                                             |
| Low-budget handout         | 90–100 gsm  | Uncoated                      | Acceptable if certainty palette is reduced to Archival Indigo + black + white only. Full palette not recommended. |

---

---

## 4. Email and Mailings

### 4.1 HTML Email Color Palette

CSS custom properties (`var(--color-primary)`) do not render in most email clients. Use these hardcoded hex fallback values throughout email HTML.

#### Light / Default Theme (the safe baseline)

| Purpose                                       | Token reference                 | Email hex |
| --------------------------------------------- | ------------------------------- | --------- |
| Email background (outer)                      | `--color-background`            | `#FAF8F5` |
| Content container background                  | `--color-card`                  | `#FDFCFB` |
| Primary text                                  | `--color-foreground`            | `#1A1614` |
| Muted / secondary text                        | `--color-muted-foreground`      | `#6A6259` |
| Primary brand (buttons, links)                | `--color-primary`               | `#3D3580` |
| Primary button text                           | `--color-primary-foreground`    | `#F7F6FC` |
| Divider / border                              | `--color-border`                | `#E3DDD7` |
| Input border                                  | `--color-input-border`          | `#8C8278` |
| Success accent                                | `--color-success`               | `#2D7D57` |
| Warning accent                                | `--color-warning`               | `#C07820` |
| Danger accent                                 | `--color-destructive`           | `#BE3D2E` |
| Muted background (table headers, shaded rows) | `--color-muted`                 | `#EDE9E4` |
| Certain teal (badge)                          | `--color-certainty-certain`     | `#267373` |
| Probable blue (badge)                         | `--color-certainty-probable`    | `#325A91` |
| Possible violet (badge)                       | `--color-certainty-possible`    | `#6B529E` |
| Unknown amber (badge)                         | `--color-certainty-unknown`     | `#BD7B24` |
| Unevidenced warm grey (badge)                 | `--color-certainty-unevidenced` | `#796A62` |

All certainty badge colors in email must be paired with a text label (e.g., "Gesichert", "Wahrscheinlich") since email clients may strip background colors from `<td>` elements. Never rely on color alone.

---

### 4.2 Email Typography Stack

Geist Sans and Geist Mono will not be available in most email clients. Use the following stacks:

**Sans-serif body and headings:**

```
font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
```

**Monospace (IDs, dates, code):**

```
font-family: "Geist Mono", "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
```

**Email type scale (pt values for desktop clients, px for web clients):**

| Role                   | Size | Weight | Line height | Color     |
| ---------------------- | ---- | ------ | ----------- | --------- |
| H1 / email headline    | 24px | 600    | 1.3         | `#1A1614` |
| H2 / section title     | 18px | 600    | 1.4         | `#1A1614` |
| H3 / sub-section       | 16px | 500    | 1.4         | `#1A1614` |
| Body                   | 15px | 400    | 1.65        | `#1A1614` |
| Caption / metadata     | 12px | 400    | 1.5         | `#6A6259` |
| CTA button             | 14px | 600    | 1           | `#F7F6FC` |
| Monospace (IDs, dates) | 13px | 400    | 1.5         | `#6A6259` |

Note: 15px rather than 16px for email body because most desktop email clients render at slightly larger default font sizes. This correction keeps the rendered size consistent with the 16px brand baseline.

---

### 4.3 Layout Patterns

#### Single-Column Newsletter

Suitable for research updates, changelog announcements, and release notes.

```
[Outer background: #FAF8F5]
┌────────────────────────────────┐  ← max-width: 600px, centered
│ HEADER                         │  ← 60px height; logotype left; bg: #3D3580; text: #F7F6FC
├────────────────────────────────┤
│ HERO / HEADLINE                │  ← padding: 32px 24px; bg: #FDFCFB
│  H1 (24px, 600)                │
│  Subtitle (16px, 400, muted)   │
├────────────────────────────────┤
│ BODY SECTIONS                  │  ← padding: 24px; bg: #FDFCFB
│  H2 + body copy blocks         │
│  Dividers: 1px solid #E3DDD7   │
│  Between sections: 24px gap    │
├────────────────────────────────┤
│ CTA BLOCK                      │  ← centered button; padding: 24px; bg: #FAF8F5
│  [Primary Button]              │  ← bg: #3D3580; text: #F7F6FC; radius: 6px; px: 20px; py: 12px
├────────────────────────────────┤
│ FOOTER                         │  ← padding: 20px 24px; bg: #EDE9E4; 12px caption text
│  Evidoxa · University/Org      │
│  Unsubscribe · Privacy Policy  │
│  © 2026                        │
└────────────────────────────────┘
```

#### Two-Column Announcement

For feature announcements with a screenshot or icon alongside text. Maximum width 600px; columns collapse to single on mobile.

```
┌─────────────────────────────────────────┐
│ HEADER                                  │
├──────────────────────┬──────────────────┤
│ LEFT (55%)           │ RIGHT (45%)      │
│ H2 heading           │ Screenshot / img │
│ Body copy (2–3 lines)│ (max-height 180) │
│ [CTA link/button]    │                  │
├──────────────────────┴──────────────────┤
│ FOOTER                                  │
└─────────────────────────────────────────┘
```

On mobile (max-width: 480px): right column stacks below left. Image appears above text.

#### Transactional Email

For account verification, password reset, access requests, and notifications.

- Header: logotype on Archival Indigo, no tagline.
- Body: single column, max-width 480px. One clear action per email.
- Subject lines: declarative, no marketing language. "Ihre E-Mail-Adresse bestätigen" not "Willkommen bei Evidoxa! Bestätigen Sie jetzt Ihren Account!"
- CTA button: centered, with a fallback plain-text URL below it in 12px muted text for clients that strip buttons.
- No decorative imagery. No newsletter-style content sections.
- Footer: minimal — application name, support link, mandatory legal identifiers.

---

### 4.4 Call-to-Action Button Specs

| Property            | Value                                       |
| ------------------- | ------------------------------------------- |
| Background          | `#3D3580`                                   |
| Text color          | `#F7F6FC`                                   |
| Font size           | 14px                                        |
| Font weight         | 600                                         |
| Padding             | 12px top/bottom, 20px left/right            |
| Border radius       | 6px (`mso-border-radius` for Outlook)       |
| Border              | none                                        |
| Min width           | 160px                                       |
| Alignment           | centered (or left-aligned in transactional) |
| Hover (web clients) | background `#2E2866` (darken 8%)            |

For Outlook compatibility, wrap the button in a VML conditional comment:

```html
<!--[if mso]>
  <v:roundrect
    xmlns:v="urn:schemas-microsoft-com:vml"
    href="[URL]"
    style="height:42px;v-text-anchor:middle;width:200px;"
    arcsize="14%"
    strokecolor="#3D3580"
    fillcolor="#3D3580"
  >
    <w:anchorlock />
    <center style="color:#F7F6FC;font-family:sans-serif;font-size:14px;font-weight:600;">
      [Button label]
    </center>
  </v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="[URL]" style="...">Button label</a>
<!--<![endif]-->
```

---

### 4.5 Dark Mode in Email Clients

Supported email clients that apply dark mode (as of 2026): Apple Mail (iOS and macOS), Outlook 2019+ on Windows, Gmail (Android), Samsung Mail.

**Strategy:** Declare explicit dark mode styles using `@media (prefers-color-scheme: dark)` within a `<style>` block. Email clients that support it will apply the overrides; those that do not will ignore them.

**Minimum dark mode overrides to declare:**

```css
@media (prefers-color-scheme: dark) {
  .email-body {
    background-color: #1a1614 !important;
  }
  .email-wrapper {
    background-color: #201e1b !important;
  }
  .email-content {
    background-color: #252220 !important;
  }
  .email-text {
    color: #f0ede9 !important;
  }
  .email-muted {
    color: #9a9189 !important;
  }
  .email-divider {
    border-color: #3a3530 !important;
  }
  .email-btn {
    background-color: #6b64c0 !important;
  }
  /* Certainty badges: keep background colors, override text to light */
  .badge-certain {
    color: #267373 !important;
  }
  .badge-probable {
    color: #325a91 !important;
  }
}
```

**What to let clients override:** Email clients aggressively remap background and text colors in auto dark mode. Rather than fighting every override with `!important` everywhere, focus on protecting:

1. The primary CTA button (must remain legible).
2. Any certainty badge text (semantic meaning relies on correct color rendering).
3. The header block color (brand identity).

Images (including screenshots) will not automatically invert; ensure screenshots read acceptably on both light and dark backgrounds, or serve separate assets per media query using `<picture>` elements where supported.

---

### 4.6 Email Footer Structure

Every Evidoxa email footer must contain, in this order:

1. **Logotype** (text version acceptable: "Evidoxa" in Geist Sans or system sans-serif, 13px, muted grey).
2. **Sending organisation** (name and address on two lines).
3. **Legal identifiers** required by jurisdiction (Impressum, Datenschutzerklärung, VAT number if applicable).
4. **Unsubscribe link** (mandatory for newsletters and non-transactional mailings; DSGVO-compliant).
5. **Privacy policy link.**
6. **Copyright line:** "© 2026 Evidoxa. Alle Rechte vorbehalten." (or English equivalent for EN sends).

Font: 11px, `#6A6259`, line-height 1.6. Padding: 20px horizontal, 16px vertical. Background: `#EDE9E4`.

---

---

## 5. Business Cards

### 5.1 Dimensions

| Region            | Standard                  | Size                                              |
| ----------------- | ------------------------- | ------------------------------------------------- |
| EU (DIN)          | 85 × 55mm                 | Most German-speaking institutions use this format |
| US Standard       | 3.5 × 2in (88.9 × 50.8mm) | For international conferences and US partners     |
| Square (optional) | 65 × 65mm                 | Premium/conference variant; higher unit cost      |

**All formats:** 3mm bleed on all edges. 3mm safe zone inset from trim. Final artwork includes trim marks and bleed marks.

---

### 5.2 Front Layout

**Background:** Warm Off-White (`#FAF8F5` / CMYK C:0 M:1 Y:2 K:2). Printed on uncoated stock this appears as a clean warm white, not bright white.

**Left edge accent strip (optional):** 4mm wide strip in Archival Indigo (`#3D3580`) running the full height of the card on the left edge. This is the only large print area where Archival Indigo is used as a fill.

**Content layout (EU 85 × 55mm, portrait-equivalent zones, actually landscape):**

```
[4mm indigo strip] │ [content area: 71mm wide × 49mm tall within safe zone]
                   │
                   │  [Logotype: top-left of content area, 28mm wide]
                   │
                   │  [Name: 10pt Geist Sans 600]
                   │  [Title / Role: 8pt Geist Sans 400, muted grey]
                   │  [Institution: 8pt Geist Sans 400, muted grey]
                   │
                   │  [Contact block: bottom-right aligned]
                   │  [Email: 7.5pt Geist Mono 400]
                   │  [URL: 7.5pt Geist Mono 400]
                   │  [ORCID (optional): 7.5pt Geist Mono 400]
```

**Typography hierarchy:**

| Element                     | Size  | Weight | Font       | Color     |
| --------------------------- | ----- | ------ | ---------- | --------- |
| Name                        | 10pt  | 600    | Geist Sans | `#1A1614` |
| Academic title (Dr., Prof.) | 10pt  | 400    | Geist Sans | `#1A1614` |
| Role / position             | 8pt   | 400    | Geist Sans | `#6A6259` |
| Institution                 | 8pt   | 400    | Geist Sans | `#6A6259` |
| Email                       | 7.5pt | 400    | Geist Mono | `#1A1614` |
| URL                         | 7.5pt | 400    | Geist Mono | `#1A1614` |
| ORCID                       | 7.5pt | 400    | Geist Mono | `#6A6259` |

**German name and title length:** Academic titles in German contexts are long ("Prof. Dr. habil." can reach 16 characters before the name begins). Do not abbreviate titles; instead, allow the name line to wrap to two lines. The layout grid accommodates this.

---

### 5.3 Back Layout

The back is optional but recommended for conference networking.

**Option A — Plain:** Archival Indigo full bleed (`#3D3580`) with the Evidoxa logotype centered in Warm Off-White (`#FAF8F5`), 30mm wide. Minimal. Clean. Memorable.

**Option B — QR code:** Warm Off-White background. Centered QR code (20mm × 20mm) linking to the person's institutional profile or ORCID. Below the QR code: "evidoxa.app" in 7pt Geist Mono, muted grey. This option is practical for archive and library contexts where digital handoff is common.

**Option C — Project-specific:** For a specific research project or grant. Project name in H3 weight (9pt, 600), tagline or description in 7.5pt, 400. Use the project's entity within Evidoxa as context. Same color scheme as front.

---

### 5.4 Print Specifications for Business Cards

| Specification              | Requirement                                           |
| -------------------------- | ----------------------------------------------------- |
| Resolution                 | 300 DPI minimum at final print size                   |
| Color mode                 | CMYK (do not submit RGB files)                        |
| Bleed                      | 3mm on all edges                                      |
| Safe zone                  | 3mm from trim edge (live content within this zone)    |
| File format                | Print-ready PDF/X-4 or PDF/X-1a                       |
| Paper weight (standard)    | 350–400 gsm                                           |
| Paper finish (preferred)   | Uncoated with soft-touch matte laminate on front only |
| Paper finish (alternative) | Silk coated, double-sided (for Option A back)         |
| Special finish (optional)  | Spot UV on logotype for premium variant               |
| Font embedding             | All fonts must be embedded or converted to outlines   |

**Soft-touch matte laminate** on the front surface is the preferred finish: it is tactile, resistant to fingerprints, and consistent with the "Enduring" brand attribute — a quality that ages with dignity.

---

---

## 6. Presentation Slides

### 6.1 Slide Master Layouts

The following five master layouts form the complete presentation template. All layouts use a 16:9 aspect ratio at 1920×1080px (full HD). A 4:3 variant is available for legacy projector setups at 1024×768px.

**Margin/safe zone:** 80px from all edges. No content enters the outer 80px zone. This protects against projector overscan and display cropping.

**Baseline grid:** 8px.

---

#### Layout 1: Title Slide

```
[Background: Archival Indigo #3D3580, full bleed]
[Top-left: Evidoxa logotype in Warm Off-White, 120px from left, 80px from top, 160px wide]
[Vertical center-left area:]
  Presentation Title
  (Geist Sans 600, 48px, Warm Off-White #FAF8F5, max 40ch, wraps)
  Subtitle or conference name
  (Geist Sans 400, 24px, hsl(245 40% 80%) ≈ #BDB9E3, max 55ch)
[Bottom-left: presenter name, institution, date]
  (Geist Sans 400, 16px, #BDB9E3, bottom 80px)
[Bottom-right: optional project logo or institution logo, 80px from bottom/right]
```

The title slide uses Archival Indigo as a full-bleed background — the one place where large-area color is appropriate because it functions as a strong visual anchor. The warm off-white text achieves 11:1 contrast against the indigo background.

---

#### Layout 2: Section Divider

```
[Background: Warm Off-White #FAF8F5]
[Left edge: 8px vertical rule in Archival Indigo, full height]
[Left-center:]
  Section number (Geist Sans 400, 14px, muted grey #6A6259, uppercase, tracked 0.08em)
  Section title (Geist Sans 600, 40px, #1A1614, max 35ch)
[Bottom-left: current slide number / total]
  (12px, Geist Mono, muted grey)
```

Section dividers provide breathing room between major content blocks. They are not title slides and should not reuse the full-bleed indigo treatment.

---

#### Layout 3: Standard Content Slide

```
[Background: Warm Off-White #FAF8F5]
[Top area: 120px high]
  Slide title: Geist Sans 600, 28px, #1A1614, top 80px, left 80px
  Thin rule below title: 1px, #E3DDD7, full width minus margins
[Content area: 120px from top to 80px from bottom]
  Body text: Geist Sans 400, 18px, #1A1614, line-height 1.6
  Bullets: use en-dash (–) not bullet disc; 4px left-border in #3D3580 for emphasis
  Max 5 bullet points; max 15 words per bullet
[Footer bar: 40px high, bottom 0]
  Left: "Evidoxa" logotype (40px tall) + presentation title (12px, muted)
  Right: slide number / total (12px, Geist Mono)
  Background: #EDE9E4
```

The content slide is the workhorse. Never fill more than 60% of the content area with text; visual breathing room is part of the "Lucid" brand attribute.

---

#### Layout 4: Two-Column Comparison

```
[Background: Warm Off-White #FAF8F5]
[Title zone: same as content slide]
[Left column (50% width, minus margins):]
  Column header: 16px, 600, #1A1614
  Content: body copy or image
[Vertical divider: 1px rule, #E3DDD7, full content area height]
[Right column (50% width, minus margins):]
  Column header: 16px, 600, #1A1614
  Content: body copy or image
[Footer: same as content slide]
```

Comparison columns headers may carry a small certainty-level badge or semantic color accent to distinguish the two sides (e.g., "documented" vs. "inferred").

---

#### Layout 5: Full-Bleed Image

```
[Background: full-bleed photograph or screenshot, 1920×1080px]
[Caption bar: bottom 120px, background rgba(26, 22, 20, 0.75) — warm dark scrim]
  Caption text: Geist Sans 400, 18px, #FAF8F5
  Attribution: Geist Sans 400, 12px, #BFB9B4 (below caption)
[Top-right: slide number in #FAF8F5, opacity 0.7]
```

Used sparingly — no more than 1–2 per presentation. The image must meet the photography guidelines in Section 7.3. No stock photography of "historians looking at computers." Use archival document photographs, architectural details of archives, or high-quality UI screenshots.

---

### 6.2 Chart and Data Visualization Styling

Use the chart token sequence for data series. Apply them in order; do not skip tokens.

| Series   | Token             | Light hex                   | Dark hex  | Typical use                         |
| -------- | ----------------- | --------------------------- | --------- | ----------------------------------- |
| Series 1 | `--color-chart-1` | `#3D3580` (Archival Indigo) | `#8C87D4` | Primary data, most important series |
| Series 2 | `--color-chart-2` | `#267373` (Teal)            | `#5BB5B5` | Secondary data                      |
| Series 3 | `--color-chart-3` | `#C07820` (Gold)            | `#C89040` | Tertiary data                       |
| Series 4 | `--color-chart-4` | `#2D7D57` (Sage)            | `#5DAF87` | Quaternary data                     |
| Series 5 | `--color-chart-5` | `#6B529E` (Violet)          | `#9E82CF` | Quinary data                        |

**Chart typography:**

- Axis labels: Geist Sans 400, 12px, muted grey `#6A6259`
- Chart title: Geist Sans 600, 14px, `#1A1614`
- Data labels (on bars, lines): Geist Sans 500, 11px, matching series color or `#1A1614` on light fills
- Legend: Geist Sans 400, 12px, 12px color swatch square, 8px gap

**Chart rules:**

- Use a warm off-white chart background (`#FAF8F5`), not white.
- Gridlines: 1px, `#E3DDD7`, horizontal only (vertical gridlines add visual noise for time-series data).
- No 3D charts, pie charts with more than 5 slices, or charts with drop shadows.
- Bar charts: rounded top corners at 2px radius only on the outermost (top) corner of each bar.
- If using a certainty-level breakdown in a chart (e.g., distribution of certainty across a dataset), use the certainty colors in their canonical order: Teal → Blue → Violet → Amber → Warm Grey.

---

### 6.3 Table Styling on Slides

| Property                     | Value                           |
| ---------------------------- | ------------------------------- |
| Header row background        | `#3D3580` (Archival Indigo)     |
| Header row text              | `#F7F6FC` (Primary foreground)  |
| Header font                  | Geist Sans 600, 14px            |
| Body row (even)              | `#FAF8F5`                       |
| Body row (odd)               | `#F2EFE9`                       |
| Body font                    | Geist Sans 400, 13px, `#1A1614` |
| Row height                   | 32px minimum                    |
| Cell padding                 | 8px horizontal, 6px vertical    |
| Border                       | 1px `#E3DDD7` horizontal only   |
| Monospace cells (IDs, dates) | Geist Mono 400, 12px, `#6A6259` |

Maximum 8–10 rows before the table should be paginated or summarized. Tables with more than 6 columns should use the full-bleed layout with landscape orientation.

---

### 6.4 Code Slide Styling

For technical presentations (API documentation, data model explanation, implementation examples):

```
[Background: #252220 (warm near-black)]
[Code block:]
  font-family: Geist Mono, Cascadia Code, monospace
  font-size: 16px
  line-height: 1.7
  padding: 32px
  background: #1A1614
  border: 1px solid #3A3530
  border-radius: 8px

[Syntax highlighting (minimal palette):]
  Keywords:    #BDB9E3  (light indigo)
  Strings:     #5BB5B5  (light teal)
  Comments:    #6A6259  (muted warm grey)
  Numbers:     #C89040  (manuscript gold)
  Default:     #F0EDE9  (warm near-white)
```

Code slides use the dark background as a deliberate contrast from content slides. This signifies a shift in register (from concept to implementation) and provides a strong visual break. Do not mix code and prose on the same slide.

---

### 6.5 Speaker Notes Formatting

Speaker notes are plain text (no markdown, no special formatting). Structure:

1. **Sentence 1:** The core point of the slide (what the audience should take away).
2. **Sentences 2–3:** Supporting context or elaboration not on the slide.
3. **[Transition]:** One sentence beginning with "Transition:" describing the logical bridge to the next slide.
4. **[Time]:** Estimated time for the slide in minutes, e.g., "[Time: 2 min]".

Example:

> The certainty system is the intellectual core of Evidoxa. Unlike confidence scores (a single number), a five-level vocabulary forces researchers to articulate the epistemic basis for their claims. Transition: Now that we have the vocabulary, let's see how it maps to the user interface. [Time: 1.5 min]

---

---

## 7. Universal Brand Rules

### 7.1 Logo and Wordmark Clear Space

**Clear space definition:** The minimum clear space equals one cap-height of the wordmark's capital "E" measured at the current reproduction size. At 100mm width, the cap-height is approximately 14mm; the clear space zone is therefore 14mm on all four sides.

**Practical rule:** Do not position any visual element — text, image border, competing logo, decorative line — closer than one "E" cap-height to any edge of the Evidoxa wordmark.

**On busy backgrounds (photography, dark surfaces):** Place the wordmark on a white or Archival Indigo rectangular shield. Shield padding equals the clear space requirement. The shield must have a minimum width of wordmark + 2× padding.

---

### 7.2 Minimum Reproduction Sizes

| Context                 | Minimum width | Notes                                       |
| ----------------------- | ------------- | ------------------------------------------- |
| Full wordmark (digital) | 80px          | Below this, letterform detail is lost       |
| Full wordmark (print)   | 25mm          | At this size, use 600 weight only (not 400) |
| Monogram mark (digital) | 24px          | Use when wordmark cannot fit                |
| Monogram mark (print)   | 8mm           | Minimum for legible mark                    |
| Favicon                 | 16×16px       | Monogram only; simplified single-color      |

---

### 7.3 Approved Color Pairings

The following pairings meet WCAG 2.1 AA minimum (4.5:1 for body text, 3:1 for large text and UI components). Pairings marked AAA meet 7:1 and are preferred for extended reading contexts.

| Foreground                   | Background                           | Ratio (approx.) | Rating | Use                        |
| ---------------------------- | ------------------------------------ | --------------- | ------ | -------------------------- |
| Deep Warm Charcoal `#1A1614` | Warm Off-White `#FAF8F5`             | 15.8:1          | AAA    | Body text, headings        |
| Deep Warm Charcoal `#1A1614` | Card `#FDFCFB`                       | 15.5:1          | AAA    | Text on card surfaces      |
| Primary Foreground `#F7F6FC` | Archival Indigo `#3D3580`            | 11.4:1          | AAA    | Buttons, header text       |
| Deep Warm Charcoal `#1A1614` | Muted `#EDE9E4`                      | 11.2:1          | AAA    | Table headers, muted areas |
| Muted Warm Grey `#6A6259`    | Warm Off-White `#FAF8F5`             | 5.8:1           | AA     | Captions, secondary labels |
| Archival Indigo `#3D3580`    | Warm Off-White `#FAF8F5`             | 8.2:1           | AAA    | Inline links, accent text  |
| Certain Teal `#267373`       | Teal Background `hsl(180 40% 93%)`   | 4.8:1           | AA     | Certainty badge            |
| Probable Blue `#325A91`      | Blue Background `hsl(215 40% 93%)`   | 5.2:1           | AA     | Certainty badge            |
| Possible Violet `#6B529E`    | Violet Background `hsl(265 30% 94%)` | 4.6:1           | AA     | Certainty badge            |
| Unknown Amber `#BD7B24`      | Amber Background `hsl(38 50% 93%)`   | 4.5:1           | AA     | Certainty badge            |

---

### 7.4 Forbidden Color Combinations

The following pairings are prohibited. They fail accessibility requirements, violate semantic intent, or destroy the coherence of the certainty system.

| Pairing                                                              | Reason                                                                                                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Any certainty color on white (`#FFFFFF`)                             | The system is calibrated for Warm Off-White backgrounds. On pure white, contrast ratios for amber and warm-grey drop below 4.5:1.              |
| Red-green combination for certainty "high vs. low"                   | Red-green ambiguity is a CVD failure mode that the entire certainty palette is designed to avoid. Never create a scale using these two colors. |
| Archival Indigo `#3D3580` on Probable Blue `#325A91`                 | Insufficient contrast (< 2:1) and semantic confusion (brand color vs. certainty color).                                                        |
| Archival Indigo fill on large print areas with uncoated stock        | Dot gain on uncoated makes dense indigo fills appear muddy and dark. Use as accent only.                                                       |
| Warning Amber `#C07820` as a headline or primary text color          | Amber has insufficient contrast on Warm Off-White (approx. 3.2:1) for body-sized text. It is a badge/indicator color only.                     |
| Pure black (`#000000`) or pure white (`#FFFFFF`) as primary surfaces | These are excluded from the brand palette. Use `#1A1614` and `#FAF8F5` respectively.                                                           |
| Certainty badge colors on Archival Indigo background                 | Insufficient contrast for teal, blue, and violet badges on the indigo primary.                                                                 |
| Gradients using two brand colors                                     | No gradients. Ever. This is an explicit brand anti-pattern.                                                                                    |
| Drop shadows with pure black (`rgba(0,0,0,X)`) on light surfaces     | Use warm shadow color `hsl(20 14% 9% / opacity)`. Pure black shadows create visual coldness inconsistent with the brand.                       |

---

### 7.5 Photography and Image Style Guidelines

Evidoxa is not a consumer product. The photography and image vocabulary must feel like it belongs in an academic monograph, not a SaaS marketing site.

**Appropriate image subjects:**

- Archival documents: manuscripts, typed documents, correspondence, maps, ledgers, seals. Shot on neutral backgrounds; warm-toned but not artificially sepia. Focus on texture, ink, and handwriting detail.
- Architectural detail: archive buildings, library reading rooms, university halls. Emphasize stone, wood, and historical materiality. Avoid anything that reads as "corporate campus" or "tech office."
- Research work in context: a researcher's hands holding a document or a notebook (not a laptop, not a phone). Shot from above or oblique angle; no posed smiling.
- Data and structure: when illustrating a concept from the application (entity relationships, source networks), use clean schematic diagrams on Warm Off-White backgrounds with Archival Indigo line work.

**Inappropriate image subjects:**

- Stock photography of people at computers grinning.
- Abstract technology imagery (circuit boards, glowing code, blue network spheres).
- Heavily filtered, color-graded, or stylised photography.
- Modern office environments.
- Any photograph that includes visible brand names or logos of competitors.
- Photographs that rely on saturated red or green as dominant tones (conflicts with certainty palette semantics in context).

**Image treatment:**

- No filters, color grading, or saturation adjustments beyond neutral exposure correction.
- Crop ratios: 16:9 for full-width banner images; 4:3 for content images; 1:1 for social media avatars.
- If a photograph has a dominant cool tone, a subtle warm-bias correction (adding approximately +5 warmth on a standard color temperature scale) is acceptable to maintain visual harmony with the warm neutral palette.
- No image overlays using certainty or semantic colors. Overlay/scrim colors: Archival Indigo or Deep Warm Charcoal only, at maximum 75% opacity.

---

### 7.6 Anti-Pattern List: What Evidoxa Never Does

The following are absolute prohibitions across all channels and materials:

| Anti-pattern                                                                               | Rationale                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gradients                                                                                  | No brand gradient exists. Gradients imply fluidity and imprecision, contrary to "Rigorous."                                                                                 |
| Glassmorphism (frosted glass effects)                                                      | Decorative, trend-driven, short-lived. Contrary to "Enduring."                                                                                                              |
| Animated backgrounds or particle effects                                                   | Distracting; demeans the academic material being presented.                                                                                                                 |
| Dark blue/navy as a "safer" primary color                                                  | The brand primary is warm indigo, not navy. Do not substitute.                                                                                                              |
| Pure black or pure white as primary surfaces                                               | Excluded from the palette. Use the warm variants.                                                                                                                           |
| Comic Sans, Papyrus, or any novelty typeface                                               | Obvious. Document it anyway because it has happened.                                                                                                                        |
| Compressed or stretched type                                                               | Never scale a typeface non-proportionally.                                                                                                                                  |
| Bold all-caps body text                                                                    | Use the overline utility (`text-xs, uppercase, tracking-wide, muted`) for overlines. All-caps bold text is not a component in this system.                                  |
| Exclamation marks in system messages or academic copy                                      | Inconsistent with "Collegial." Direct statements do not need exclamation.                                                                                                   |
| Onboarding carousels, achievement badges, or gamification elements in any branded material | The audience is domain experts. This would be patronizing.                                                                                                                  |
| Marketing superlatives ("best", "most powerful", "revolutionary")                          | Scholars evaluate claims with evidence. Superlatives without evidence are noise.                                                                                            |
| Reproducing certainty colors without paired icon shapes                                    | Certainty uses dual-channel encoding. Never rely on color alone.                                                                                                            |
| Truncating button labels with ellipsis                                                     | Buttons must display their full label, including expanded German compound words.                                                                                            |
| Using the brand in contexts that contradict the mission                                    | Evidoxa's identity is tied to rigorous, evidence-based historical research. Licensing the brand for use in entertainment, political, or speculative contexts is prohibited. |

---

## Appendix A: Quick HSL-to-Hex Conversion Reference

| Token                           | HSL                 | Hex       |
| ------------------------------- | ------------------- | --------- |
| `--color-primary`               | `hsl(245 40% 36%)`  | `#3D3580` |
| `--color-primary-foreground`    | `hsl(240 20% 98%)`  | `#F7F6FC` |
| `--color-background`            | `hsl(36 25% 98.5%)` | `#FAF8F5` |
| `--color-foreground`            | `hsl(20 14% 9%)`    | `#1A1614` |
| `--color-card`                  | `hsl(36 20% 99.5%)` | `#FDFCFB` |
| `--color-muted`                 | `hsl(33 16% 93%)`   | `#EDE9E4` |
| `--color-muted-foreground`      | `hsl(26 10% 38%)`   | `#6A6259` |
| `--color-border`                | `hsl(30 14% 88%)`   | `#E3DDD7` |
| `--color-input-border`          | `hsl(30 14% 55%)`   | `#8C8278` |
| `--color-accent`                | `hsl(170 18% 92%)`  | `#E3EFEE` |
| `--color-accent-foreground`     | `hsl(170 25% 18%)`  | `#233D3A` |
| `--color-destructive`           | `hsl(4 60% 46%)`    | `#BE3D2E` |
| `--color-success`               | `hsl(152 45% 32%)`  | `#2D7D57` |
| `--color-warning`               | `hsl(38 80% 42%)`   | `#C07820` |
| `--color-info`                  | `hsl(210 55% 44%)`  | `#3278BE` |
| `--color-certainty-certain`     | `hsl(180 50% 30%)`  | `#267373` |
| `--color-certainty-probable`    | `hsl(215 50% 38%)`  | `#325A91` |
| `--color-certainty-possible`    | `hsl(265 35% 45%)`  | `#6B529E` |
| `--color-certainty-unknown`     | `hsl(38 65% 45%)`   | `#BD7B24` |
| `--color-certainty-unevidenced` | `hsl(20 15% 40%)`   | `#796A62` |
| `--color-chart-1`               | `hsl(245 40% 36%)`  | `#3D3580` |
| `--color-chart-2`               | `hsl(180 50% 30%)`  | `#267373` |
| `--color-chart-3`               | `hsl(38 70% 50%)`   | `#C98422` |
| `--color-chart-4`               | `hsl(152 45% 32%)`  | `#2D7D57` |
| `--color-chart-5`               | `hsl(265 35% 45%)`  | `#6B529E` |

---

## Appendix B: Certainty Level Quick Reference

| Level                     | Icon                 | Color     | Hex       | Meaning                                                               |
| ------------------------- | -------------------- | --------- | --------- | --------------------------------------------------------------------- |
| Gesichert / Certain       | Filled circle        | Teal      | `#267373` | Documented; no reasonable alternative interpretation                  |
| Wahrscheinlich / Probable | Three-quarter circle | Blue      | `#325A91` | Strong evidence; minor ambiguity remains                              |
| Moeglich / Possible       | Half circle          | Violet    | `#6B529E` | Plausible inference; multiple interpretations viable                  |
| Unbekannt / Unknown       | Empty circle (ring)  | Amber     | `#BD7B24` | Insufficient evidence to assess; not yet investigated                 |
| Unbelegt / Unevidenced    | Dashed circle        | Warm Grey | `#796A62` | Claim exists in scholarly literature but lacks primary source support |

Color alone is never sufficient. Always pair the color with the icon shape and a text label in any branded material.
