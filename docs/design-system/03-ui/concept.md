# UI Concept -- Evidoxa

**Date:** 2026-04-02
**Author:** Principal UI Designer
**Status:** Complete -- ready for token engineering and implementation phases
**Upstream dependencies:** `00-discovery/codebase-analysis.md`, `01-ux/research.md`, `01-ux/architecture.md`, `02-brand/identity.md`

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Component Patterns](#2-component-patterns)
3. [Page Templates](#3-page-templates)
4. [Micro-Interactions and Transitions](#4-micro-interactions-and-transitions)
5. [Dark Mode Detailed Design](#5-dark-mode-detailed-design)
6. [Responsive Design Details](#6-responsive-design-details)
7. [shadcn/ui Customization Map](#7-shadcnui-customization-map)

---

## 1. Design Philosophy

Evidoxa's UI follows a single governing principle: **quiet competence**. The interface should feel like a well-lit reading room in a modern research library -- warm, organized, unhurried, and entirely in service of the material. Nothing competes for attention with the historical data itself.

Three constraints shape every decision in this document:

1. **Token-first.** Every color, spacing value, radius, shadow, and duration references a CSS custom property from the brand identity. No raw values in component code.
2. **Extend shadcn, don't replace it.** The installed shadcn/ui components are the foundation. Customization happens through CSS custom properties and Tailwind utilities, not by forking component internals.
3. **Warm Stone palette as the visual ground.** The shift from the default zinc/slate to the warm stone neutral scale (hue 20-36) is the single most important visual change. It affects every surface, border, and shadow in the application.

---

## 2. Component Patterns

### 2.1 Navigation

#### Sidebar

The sidebar is the primary navigation surface. It exists in two states with a smooth transition between them.

**Expanded state (w-56 / 224px):**

- Background: `var(--color-sidebar)` -- light mode `hsl(36 18% 97%)`, a slightly cooler surface than the page background to create subtle separation without a hard edge.
- Nav items render as full-width rows: icon (20px, `icon-md`) + label (`text-sm font-medium`) + optional CountBadge.
- Active item: `bg-accent text-accent-foreground` with a `2px` left border in `var(--color-primary)`. The left border is the primary active indicator, not background color alone.
- Hover (non-active): `bg-accent/50` background transition over `var(--duration-fast)` with `var(--ease-out)`.
- Item height: 40px desktop, 48px touch. Internal padding: `py-2.5 px-3` with `gap-2` between icon and label.
- A `<Separator />` divides the entity navigation group (Dashboard through Relations) from the settings group (Event Types, Relation Types).
- Sidebar footer (bottom-pinned): collapsed user info or project selector (future).

**Collapsed state (w-12 / 48px):**

- Icons only, centered. Each icon is 20px with a 44px minimum tap target.
- Active item indicated by `text-primary` color on the icon (no background, to save space).
- Tooltip on hover shows the full label, appearing after `var(--duration-fast)` delay.
- The left border indicator for the active item remains visible as a 2px line.
- **Accessibility:** Every `<a>` and `<button>` in the collapsed sidebar MUST have an explicit `aria-label="{nav item label}"` attribute (e.g., `aria-label="Dashboard"`, `aria-label="Personen"`). The icon alone is `aria-hidden="true"` and the visually-hidden text label is removed from the DOM during collapse, so the `aria-label` on the interactive element is the only accessible name available to screen readers.

**States:**

| State                 | Visual treatment                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Default               | `text-muted-foreground`, icon inherits                                                              |
| Hover                 | `bg-accent/50`, `text-accent-foreground`                                                            |
| Active (current page) | `bg-accent`, `text-accent-foreground`, `border-l-2 border-primary`                                  |
| Focus                 | `outline: 2px solid var(--color-ring)`, `outline-offset: -2px` (inset, within the sidebar boundary) |
| Disabled              | Not applicable (nav items are never disabled)                                                       |

**Dark mode differences:**

- `var(--color-sidebar)` becomes `hsl(25 8% 5.5%)` -- marginally lighter than the page background to maintain separation.
- The active item's `bg-accent` in dark mode is `hsl(170 12% 14%)` -- a dark verdigris tint that remains visible without glowing.
- The 2px left border uses the dark-mode primary `hsl(245 40% 68%)`, which is lighter and more visible against the dark sidebar.

**Responsive behavior:**

- Desktop (>=1024px): persistent, toggle via `Cmd+B`.
- Tablet (768-1023px): overlay drawer, triggered by hamburger in TopBar. A bottom tab bar provides the five main nav items.
- Mobile (<768px): overlay drawer. Bottom tab bar + central FAB for quick-create.

#### TopBar

Fixed at the top, `h-14` (56px). Background: `var(--color-card)` with `border-b border-border`.

**Layout (left to right):**

- Sidebar toggle (hamburger icon, 44px tap target)
- Brand name "Evidoxa" (`text-lg font-semibold tracking-tight text-foreground`)
- Spacer
- Command palette trigger (Search icon, `Cmd+K` label in `text-xs text-muted-foreground font-mono` on desktop, icon-only on mobile)
- LocaleSwitcher (DE/EN pill toggle)
- ThemeToggle (Sun/Moon icon button)
- User avatar (32px, `rounded-full`)

**States:**

- Default: `bg-card border-b border-border`
- Scrolled (page content beneath): no visual change (TopBar is always the same -- no scroll shadow). Rationale: adding a shadow on scroll creates visual noise during long sessions.

**Dark mode:** `bg-card` becomes the dark card surface. Border becomes `var(--color-border)` dark value, which is subtly lighter than the background -- creating a hairline separation.

#### Breadcrumbs

Rendered below the TopBar, inside the page content area (not the TopBar itself), on all pages deeper than top-level lists.

- Separator: `/` character in `text-muted-foreground`
- Segments: `text-sm text-muted-foreground` for links, `text-sm text-foreground font-medium` for the current page
- Entity names truncated at 30 characters
- `<nav aria-label="Breadcrumb">` with `<ol>` structure
- Hidden on mobile (<768px) -- replaced by a back arrow button

#### Tabs (Entity Detail)

Horizontal tab bar using shadcn `Tabs` component.

- Tab triggers: `text-sm font-medium`, `py-2.5 px-4`
- Inactive: `text-muted-foreground`
- Active: `text-foreground` with a `2px` bottom border in `var(--color-primary)`
- Hover (inactive): `text-foreground` transition over `var(--duration-fast)`
- Focus: standard focus ring
- CountBadge inline with each tab label: `rounded-full bg-muted text-muted-foreground px-1.5 py-0.5 text-xs tabular-nums font-mono`
- CountBadge with zero items: same styling but `opacity-60` to subtly de-emphasize empty tabs without hiding them
- Tab content area: `mt-4` below the tab bar

**Responsive:** On tablet (<1024px), tabs become a horizontally scrollable strip. Touch targets expand to 44px height. On mobile (<768px), tabs may wrap to a second line or become a dropdown selector for entity types with 6+ tabs.

#### Bottom Tab Bar (Mobile/Tablet)

A fixed bottom bar (`h-16`, 64px) appearing on viewports <1024px.

- Five items: Dashboard, Persons, Events, Sources, Relations
- Each item: icon (20px) + label (`text-[10px]`) stacked vertically, centered
- Active: `text-primary` with a `2px` top border on the item
- Inactive: `text-muted-foreground`
- Background: `var(--color-card)` with `border-t border-border`
- Mobile only: central FAB (40px, `rounded-full bg-primary text-primary-foreground`) with a `+` icon, opening a quick-create menu

---

### 2.2 Data Display

#### DataTable

The DataTable is the most frequently seen component. It must handle 10-500+ rows with bulk selection, sorting, and pagination.

**Visual treatment:**

- Outer container: no border, no shadow. The table floats on the page background with `rounded-lg overflow-hidden` and a `border border-border`.
- Header row: `bg-muted/50 text-muted-foreground text-sm font-medium`. Header cells use `py-3 px-4`.
- Body rows: `bg-card text-foreground text-sm`. Row cells use `py-3 px-4`.
- Alternating row stripes: not used. Evidoxa favors separation through spacing and border, not zebra striping, to keep the visual field calm.
- Row separator: `border-b border-border` (1px) between rows. The last row has no bottom border (the container border handles it).

**States:**

| State                       | Visual treatment                                                          |
| --------------------------- | ------------------------------------------------------------------------- |
| Default                     | `bg-card`                                                                 |
| Hover                       | `bg-accent/30` transition over `var(--duration-fast)`                     |
| Selected (checkbox)         | `bg-accent/50` with checkbox filled                                       |
| Focus (keyboard navigation) | `outline: 2px solid var(--color-ring)` on the row, `outline-offset: -2px` |
| Loading (pagination/sort)   | Current content stays visible at `opacity-60`. No skeleton replacement.   |
| Empty                       | Centered empty state illustration (see Feedback section)                  |
| Error                       | Full-width error card within the table container area                     |

**Sorting indicators:** Up/down chevron icons (14px) in the column header, using `text-muted-foreground` for the inactive direction and `text-foreground` for the active sort direction.

**Bulk selection:**

- Header checkbox: shadcn `Checkbox` (replacing the current native `<input type="checkbox">`)
- Indeterminate state: dash icon inside the checkbox
- When rows are selected, a floating toolbar appears at the bottom of the viewport: `bg-card border border-border rounded-lg shadow-md p-3` with "{n} selected", "Delete" button (`variant="destructive"`), and "Clear" button (`variant="ghost"`)

**Pagination:**

- Below the table with `mt-4`
- Layout: `flex items-center justify-between`
- Left: result count text (`text-sm text-muted-foreground`): "47 Personen" or "12 von 47 Personen" when filtered
- Right: Prev/Next buttons (`variant="outline" size="sm"`) with page indicator between them (`text-sm tabular-nums`)

**Dark mode:** `bg-card` becomes the dark card surface. Row hover becomes `bg-accent/20` (reduced opacity to avoid overlighting). The border color shifts to the dark border token.

**Responsive:** On mobile (<768px), each row becomes a stacked card. See Section 6 for details.

#### Entity Cards (Detail Page AttributesCard)

A bordered card showing the entity's primary attributes in a `<dl>` grid.

- Container: `rounded-lg border border-border bg-card p-6`
- No shadow on the card (borders only, per the brand identity's "grounded, not floating" directive)
- Grid: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Each field: `<dt>` in `text-xs font-medium text-muted-foreground uppercase tracking-wider` (overline style), `<dd>` in `text-sm text-foreground`
- PropertyEvidenceBadge sits inline after the `<dd>` value, aligned to the right of the field

**Certainty display on date fields:** The certainty level renders as a compact badge after the date value: `CertaintyIcon` (16px) + level name (`text-xs`) in the certainty color. Background uses the certainty background token, border uses the certainty border token.

**Claim-without-evidence warning:** When a field has certainty Certain/Probable/Possible but zero evidence, the PropertyEvidenceBadge switches to `bg-warning-background text-warning border border-dashed border-warning`. The badge shows "0" with the dashed-circle icon.

#### Stat/Metric Displays (Dashboard)

Metric cards for the dashboard use the `Card` component with a compact layout.

- Container: `rounded-lg border border-border bg-card p-5`
- Label: `text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Value: `text-2xl font-semibold text-foreground tabular-nums font-mono`
- Trend indicator (future): small arrow icon + percentage in `text-xs`, colored with success/destructive tokens
- Grid: `grid grid-cols-2 md:grid-cols-4 gap-4`

#### Relation Badges

Relation rows in the RelationsTab display structured information.

- Row container: `rounded-md border border-border bg-card p-4 space-y-2`
- Top line: relation type name (`text-sm font-medium`) + certainty badge (icon + label in certainty colors)
- Second line: target entity name as a link (`text-sm text-primary hover:underline`) + entity type label in `text-xs text-muted-foreground bg-muted rounded-sm px-1.5 py-0.5`
- Expand chevron: right-aligned, rotates 90 degrees on expand
- Expanded content: evidence list + action buttons, indented with `pl-4 border-l-2 border-border`

#### Certainty Indicators (All 5 Levels)

Each certainty level uses a distinct icon shape and a distinct hue, providing dual-channel encoding.

| Level       | Icon                 | Color token                     | Background token                           | Border token                           |
| ----------- | -------------------- | ------------------------------- | ------------------------------------------ | -------------------------------------- |
| Certain     | Filled circle        | `--color-certainty-certain`     | `--color-certainty-certain-background`     | `--color-certainty-certain-border`     |
| Probable    | Three-quarter circle | `--color-certainty-probable`    | `--color-certainty-probable-background`    | `--color-certainty-probable-border`    |
| Possible    | Half circle          | `--color-certainty-possible`    | `--color-certainty-possible-background`    | `--color-certainty-possible-border`    |
| Unknown     | Empty circle (ring)  | `--color-certainty-unknown`     | `--color-certainty-unknown-background`     | `--color-certainty-unknown-border`     |
| Unevidenced | Dashed circle        | `--color-certainty-unevidenced` | `--color-certainty-unevidenced-background` | `--color-certainty-unevidenced-border` |

**Rendering modes:**

- **Full (detail pages, forms):** Icon (16px) + text label (`text-xs font-medium`) + optional evidence count, all wrapped in a pill: `rounded-full px-2 py-0.5 bg-{level}-background border border-{level}-border text-{level}-foreground`
- **Compact (table cells, tab badges):** Icon only (16px) with `aria-label` and tooltip on hover
- **Selector (CertaintySelector):** Four radio buttons in a group. Active button: `bg-{level}-background border-{level}-border text-{level}-foreground`. Inactive: `bg-muted text-muted-foreground border-border`. The group container has `rounded-lg border border-border overflow-hidden`, with individual buttons having `rounded-md` and `1px` gap between them.

#### PropertyEvidence Badges

The field-level evidence indicator, appearing next to each annotatable field value on detail pages.

- **Has evidence (count > 0):** `rounded-full bg-muted text-muted-foreground px-1.5 py-0.5 text-xs tabular-nums cursor-pointer hover:bg-accent hover:text-accent-foreground`. Shows the count number.
- **No evidence, no certainty claim:** Not rendered (the field has no certainty to question).
- **No evidence, has certainty claim (warning state):** `rounded-full bg-warning-background text-warning border border-dashed border-warning px-1.5 py-0.5 text-xs cursor-pointer`. Shows "0" with the dashed-circle icon.
- **Popover (on click):** PropertyEvidencePanel opens in a popover (`p-4 max-w-[360px]`). On desktop >=1024px, this can escalate to a slide-in side panel (400px default, max 600px) for fields that need transcription entry.

---

### 2.3 Data Input

#### Text Inputs

Use the shadcn `Input` component. The token changes from zinc to warm stone happen automatically through the CSS custom properties.

- Height: `h-10` (40px), `h-11` (44px) on touch
- Border: `border border-input-border rounded-md` -- uses `var(--color-input-border)` for sufficient contrast against the page background (3.5:1 in light mode), ensuring inputs are perceivable by users with low contrast sensitivity
- Background: `bg-transparent` (inherits from parent surface)
- Placeholder: `text-muted-foreground`
- Padding: `px-3 py-2.5`
- Font: `text-sm` for most inputs, `text-base font-mono` for archival references and transcriptions

**States:**

| State     | Visual treatment                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------- |
| Default   | `border-input-border bg-transparent`                                                              |
| Hover     | `border-foreground/20` -- border darkens subtly                                                   |
| Focus     | `border-ring ring-1 ring-ring` -- the ring color is the archival indigo primary                   |
| Disabled  | `opacity-50 cursor-not-allowed bg-muted/50`                                                       |
| Error     | `border-destructive ring-1 ring-destructive` -- error message below in `text-xs text-destructive` |
| Read-only | `bg-muted/30 cursor-default` -- visually flattened                                                |

**Dark mode:** `bg-transparent` continues to inherit. The border shifts to dark `--color-input-border` (`hsl(22 7% 40%)`), which provides adequate contrast against the dark background. Focus ring uses the lighter dark-mode primary.

#### Textarea

A new `Textarea` component to replace the inconsistent raw `<textarea>` elements.

- Inherits all Input styling: same border, radius, focus ring, states
- Min height: `min-h-[80px]` desktop, `min-h-[120px]` touch
- Resizable vertically: `resize-y`
- For transcription fields: `font-mono text-base` with increased line height (1.625)
- `dir="auto"` on all content-area textareas to handle mixed-direction text

#### Select / Combobox

A new `Select` component must be added (currently missing from `src/components/ui/`). Replace all native `<select>` elements.

- Trigger: same dimensions as Input (`h-10 rounded-md border border-input-border px-3`)
- Dropdown: `bg-popover border border-border rounded-md shadow-md` with `max-h-[300px] overflow-y-auto`
- Options: `py-2 px-3 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground`
- Active option: `bg-accent text-accent-foreground` with a check icon
- Search within (Combobox pattern): use the existing `Command` + `Popover` combination (already used in `EntitySelector` and `EventTypeCombobox`)

#### Date Inputs (Partial Dates)

The `PartialDateInput` component renders year, month, day as three separate fields in a `<fieldset>`.

- Year: `Input` with `w-20 text-center font-mono tabular-nums`
- Month: `Select` (replacing native `<select>`) with `w-28`
- Day: `Input` with `w-16 text-center font-mono tabular-nums`
- Layout: `flex items-end gap-2` -- fields sit side by side
- The `<legend>` is the field label (e.g., "Birth Date"), styled as `text-sm font-medium text-foreground`
- CertaintySelector sits at the end of the row on desktop, below on mobile

**Touch:** `inputmode="numeric"` on year and day fields to trigger numeric keyboard.

#### Checkbox, Radio, Toggle

- **Checkbox:** shadcn `Checkbox` (Radix). Replace native checkboxes in DataTable. Indeterminate state rendered as a dash.
- **Radio:** Currently not a separate shadcn component. CertaintySelector implements radio semantics with `role="radiogroup"`. Visual is the custom certainty button group.
- **Toggle:** Not currently used. If needed, use shadcn `Switch` (not yet installed -- install when required).

#### Form Layout

All entity forms follow an identical structural grammar.

```
FormCard (rounded-lg border border-border bg-card)
  FieldGroup: Primary Information
    Two-column grid on desktop: [First Name] [Last Name]
    Full-width: [Notes textarea]
  FieldGroup: Date Information (rounded-md border border-border p-4)
    Row: [Year] [Month] [Day] [CertaintySelector]
  FieldGroup: Additional (collapsible)
    [Variant fields, archival references, etc.]
  FormFooter (pt-6 border-t border-border)
    [Cancel (variant="outline")] ... spacer ... [Submit (variant="default")]
```

- FieldGroups use `<fieldset>` with `<legend>` for accessibility
- Vertical spacing between FieldGroups: `space-y-6`
- Vertical spacing within FieldGroups: `space-y-4`
- Labels: `text-sm font-medium text-foreground` above each field
- Label-to-input gap: `space-y-1.5`
- Error messages: `text-xs text-destructive mt-1` below the field

**Responsive:** Two-column fields stack to single column on mobile. FormFooter becomes sticky at the bottom of the viewport on mobile/tablet.

---

### 2.4 Feedback

#### Toast Notifications

Using Sonner, positioned bottom-right on desktop, bottom-center on mobile.

**Visual treatment by type:**

| Type    | Icon                 | Background                            | Border                            | Text color                            |
| ------- | -------------------- | ------------------------------------- | --------------------------------- | ------------------------------------- |
| Success | CheckCircle (16px)   | `var(--color-success-background)`     | `var(--color-success-border)`     | `var(--color-success-foreground)`     |
| Warning | AlertTriangle (16px) | `var(--color-warning-background)`     | `var(--color-warning-border)`     | `var(--color-warning-foreground)`     |
| Error   | XCircle (16px)       | `var(--color-destructive-background)` | `var(--color-destructive-border)` | `var(--color-destructive-foreground)` |
| Info    | Info (16px)          | `var(--color-info-background)`        | `var(--color-info-border)`        | `var(--color-info-foreground)`        |

- Container: `rounded-lg border p-4 shadow-md max-w-[420px]`
- Layout: icon + message text (`text-sm`) + optional action button (`text-sm font-medium text-primary underline-offset-4 hover:underline`)
- Undo toasts: action text "Undo" with 5s/8s countdown (visual progress bar at bottom of toast, 2px height, `bg-muted-foreground/20`)
- Stack: up to 3 visible toasts. Older toasts scale down slightly (`scale-95 opacity-80`) behind the newest.
- Auto-dismiss: 5s for success/info, 8s for error (when no retry action), 15s for error with retry

#### Inline Field Errors

- Text: `text-xs text-destructive` below the field
- Icon: XCircle (14px) inline before the error text
- Appear with a `var(--duration-fast)` fade-in
- Connected to the field via `aria-describedby`
- The field border simultaneously changes to `border-destructive`

#### Empty States

For each entity list and tab content when no items exist.

- Container: centered within the content area, `py-16 px-6 text-center`
- Illustration: abstract line art (archival motif -- a simplified document with magnifying glass or connection lines) rendered as a Lucide-scale SVG at 64px, in `text-muted-foreground/40`
- Heading: `text-lg font-medium text-foreground` -- e.g., "Noch keine Personen" / "No persons yet"
- Description: `text-sm text-muted-foreground mt-2 max-w-[340px] mx-auto`
- Action button: `Button variant="default" size="sm"` centered below, `mt-4` -- e.g., "Neue Person erstellen" / "Create first person"

Empty states for sub-tabs (evidence, relations) are more compact: no illustration, just the heading + description + action in `py-8`.

#### Loading Skeletons

`PageSkeleton` variants with the existing `animate-pulse bg-primary/10` pattern, but updated to use the warm stone primary.

- **List variant:** Mimics DataTable -- header row (3-4 rounded bars at different widths) + 5 body rows
- **Detail variant:** Mimics AttributesCard -- two-column grid of label/value bar pairs + tab bar skeleton
- **Card-grid variant:** 4 cards in a 2x2 grid (desktop) / stack (mobile)

The pulse animation uses `bg-muted` (which is now warm stone) at 40-100% opacity cycle, 2s duration. In dark mode, `bg-muted` is the dark warm surface -- the pulse remains subtle.

**Skeleton-to-content transition:** Content replaces skeleton with no additional animation. The page simply renders. Any enter animation on real content would delay the perception of readiness.

**`prefers-reduced-motion`:** Static `bg-muted opacity-60`, no pulse.

#### Progress Indicators

- **Button loading state:** The button icon is replaced with a rotating Loader2 icon (16px). Button text changes to the loading label (e.g., "Saving..."). Button is disabled.
- **Page-level loading:** The existing `loading.tsx` pattern (per-route) shows the `PageSkeleton` variant appropriate to the page type.
- **Inline data refresh:** DataTable body shows `opacity-60` on current content while new data loads. No spinner overlay.

#### Network Status Indicator

- **Online:** no indicator (normal state)
- **Degraded:** amber dot (8px, `bg-warning rounded-full`) next to user avatar in TopBar, with tooltip
- **Offline:** persistent banner below TopBar: `bg-destructive-background text-destructive border-b border-destructive-border py-2 px-4 text-sm`

---

### 2.5 Overlays

#### Dialog / Modal

Using shadcn `Dialog` (Radix).

- Overlay: `bg-black/40` (light mode), `bg-black/60` (dark mode). The dark mode overlay is denser because the dark content area provides less contrast.
- Content: `bg-popover rounded-xl border border-border shadow-lg max-w-lg w-full p-6`
- Title: `text-xl font-semibold text-foreground`
- Description: `text-sm text-muted-foreground mt-1`
- Close button: top-right X icon, 44px tap target
- Footer: `pt-6 flex justify-end gap-3`

**Open animation:** Scale from 95% to 100% + fade in, `var(--duration-slow)` (300ms), `var(--ease-out)`.
**Close animation:** Scale to 97% + fade out, `var(--duration-normal)` (200ms), `var(--ease-in)`.
**Reduced motion:** Instant show/hide, opacity only.

#### Command Palette (cmdk)

Triggered by `Cmd+K`. Centered modal overlay.

- Container: `bg-popover rounded-xl border border-border shadow-lg max-w-[640px] w-full overflow-hidden`
- Search input at top: `h-12 border-b border-border px-4 text-base` with magnifying glass icon. No outer border (the container border frames it).
- Result groups: "Pages", "Persons", "Events", "Sources", "Actions" -- each with a label in `text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2`
- Result items: `px-4 py-2.5 text-sm cursor-pointer` with entity type icon (16px) + name + disambiguating text (`text-muted-foreground`)
- Active item: `bg-accent text-accent-foreground`
- Empty state: `py-8 text-center text-sm text-muted-foreground` -- "No results found"
- Recent searches: shown when input is empty, with clock icon and `text-muted-foreground`

**Open/close:** Same animation as Dialog but faster: `var(--duration-normal)` (200ms).

#### Tooltips

Using shadcn `Tooltip` (Radix).

- Container: `bg-foreground text-background rounded-md px-3 py-1.5 text-xs shadow-sm`
- Inverted color scheme (dark tooltip on light background, light tooltip on dark background) for maximum visibility
- Appear delay: `var(--duration-fast)` (100ms)
- No arrow pointer (cleaner visual)
- Max width: 280px with text wrapping

#### Popovers

Using shadcn `Popover` (Radix). Used for PropertyEvidencePanel, EntitySelector dropdowns.

- Container: `bg-popover rounded-lg border border-border shadow-md p-4 max-w-[360px]`
- Appear animation: fade in + translateY(-4px), `var(--duration-slow)` (300ms), `var(--ease-out)`
- Disappear: fade out, `var(--duration-normal)` (200ms), `var(--ease-in)`
- Focus trapped within while open
- Escape closes and returns focus

#### Confirmation Dialogs

Using shadcn `AlertDialog`. For destructive operations (delete, bulk delete).

- Same visual treatment as Dialog
- Destructive action button: `Button variant="destructive"`
- Cancel button: `Button variant="outline"`, receives initial focus (safe default)
- Body text explicitly states the consequence and recovery path: "Delete {n} persons? This can be undone within 30 days."

---

### 2.6 Content

#### Entity Detail Page Layout

The primary data-dense screen. Structure follows the "Consistent Entity Grammar" principle (UX Architecture Principle 4).

**Desktop (>=1280px), potential two-column layout:**

```
+--- PageHeader (full width) ----------------------+
|  h1: "Johann von Dalberg"      [Edit] [Delete]   |
|  Breadcrumb: Persons > Johann von Dalberg         |
+--------------------------------------------------+
| AttributesCard (45%)  | TabBar + TabContent (55%) |
| Birth: 1455 [C] [E:2] | [Attr] [Names] [Events].. |
| Death: 1503 [P] [E:1] | (scrollable tab content)  |
| Notes: "Bishop..."    |                           |
+----------------------+----------------------------+
```

On screens <1280px, this collapses to single-column stacked (AttributesCard above TabBar above TabContent).

**Key spacing:**

- PageHeader: `pb-6`
- AttributesCard to TabBar gap: `gap-6` (horizontal on two-column, vertical on single)
- Tab content internal padding: `p-0` (the tab content components manage their own padding)

#### Source Annotation Layout

Evidence entries within the PropertyEvidencePanel.

- Each evidence item: `rounded-md border border-border p-3 space-y-2`
- Source reference: `text-sm font-medium text-primary` (clickable, navigates to source)
- Page reference: `text-xs font-mono text-muted-foreground`
- Quote (normalized reading): `text-sm text-foreground italic` with left border: `border-l-2 border-border pl-3`
- Raw transcription (diplomatic): `text-sm font-mono text-foreground bg-muted/50 rounded-sm p-2` -- the mono font and muted background visually distinguish it from the normalized quote
- Certainty: inline badge (compact rendering)
- Actions: Edit and Delete icon buttons (`variant="ghost" size="sm"`)

#### Relation Visualization (Current: List-Based)

Relations are currently displayed as a structured list in the RelationsTab. The list is divided into "Outgoing" and "Incoming" sections.

- Section headers: `text-xs font-medium text-muted-foreground uppercase tracking-wider` with `<Separator />` below
- Each relation: expandable row (see Relation Badges in 2.2)
- The expand/collapse on rows uses a chevron that rotates 90 degrees with `var(--duration-fast)` and `var(--ease-in-out)`

Future network graph visualization (Phase 4) will use the certainty colors for edge styling and entity type icons for nodes. The token system is designed to support this.

#### Activity Log

The activity feed on entity detail pages shows a chronological list of actions.

- Container: vertical timeline with a `1px` left border (`border-l border-border`) running down from the first to the last item
- Each entry: dot indicator on the timeline line + content
- Dot: `8px rounded-full bg-muted-foreground/30` positioned on the left border. For create actions: `bg-success`. For delete actions: `bg-destructive/60`.
- Content: `pl-6` from the timeline, `pb-4` between entries
- Actor: `text-sm font-medium` (user name)
- Action: `text-sm text-muted-foreground` ("created person", "changed certainty to Probable")
- Timestamp: `text-xs text-muted-foreground font-mono` -- relative time ("vor 2 Std" / "2 hours ago") with absolute time in tooltip
- "Load more" button at the bottom: `Button variant="ghost" size="sm"`

---

### 2.7 Collaboration (Future-Ready Patterns)

These patterns are not yet implemented but the visual language is established now for consistency when Phase 3-4 features arrive.

#### Comment Threads

- Thread container: `rounded-lg border border-border bg-card p-4`
- Individual comment: `pb-3 border-b border-border last:border-0` within the thread
- Author: `Avatar` (24px) + name (`text-sm font-medium`) + timestamp (`text-xs text-muted-foreground`)
- Body: `text-sm text-foreground mt-1`
- Reply: nested with `pl-6 border-l-2 border-accent`

#### Review Status Badges

Anticipating a future "reviewed/unreviewed" status on entity records.

- Unreviewed: `rounded-full bg-warning-background text-warning border border-warning-border px-2 py-0.5 text-xs` -- "Unreviewed"
- Reviewed: `rounded-full bg-success-background text-success border border-success-border px-2 py-0.5 text-xs` -- "Reviewed by M. Engel"
- Needs revision: `rounded-full bg-destructive-background text-destructive border border-destructive-border px-2 py-0.5 text-xs`

#### User Avatars

Using shadcn `Avatar` with `AvatarFallback`.

- Sizes: 24px (inline/compact), 32px (TopBar, comments), 40px (profile)
- Fallback: first two initials on `bg-muted text-muted-foreground font-medium text-xs`
- All avatars: `rounded-full`

---

## 3. Page Templates

### 3.1 List Page (e.g., /persons)

**Visual composition:**

```
[TopBar -----------------------------------------------]
[Sidebar] [                                              ]
[   |   ] [ h1: Personen               [+ Neue Person]  ]
[   |   ] [                                              ]
[   |   ] [ [Search ___________]  [Type v]  [Date ___]   ]
[   |   ] [ [Type: Letter x]  Clear all                  ]
[   |   ] [                                              ]
[   |   ] [ +------------------------------------------+ ]
[   |   ] [ | [] | Name        | Birth | Death | Cert  | ]
[   |   ] [ | [] | J. Dalberg  | 1455  | 1503  |  *    | ]
[   |   ] [ | [] | K. Theodor  | 1724  | 1799  |  o    | ]
[   |   ] [ | ...                                      | ]
[   |   ] [ +------------------------------------------+ ]
[   |   ] [                                              ]
[   |   ] [ 47 Personen        < Prev | 1/12 | Next >   ]
```

**Content hierarchy:**

1. PageHeader (h1 + primary action) -- highest visual weight
2. DataTable -- the data is the star, it occupies the most space
3. FilterBar -- secondary, accessed when needed
4. Pagination -- tertiary, bottom of page

**Spacing:**

- Page container: `p-6 space-y-6 max-w-7xl`
- PageHeader to FilterBar: 24px
- FilterBar to FilterChips: 8px (tight, they are logically one unit)
- FilterChips to DataTable: 16px
- DataTable to Pagination: 16px

**Responsive reflow:**

- > =1024px: full DataTable with all columns
- 768-1023px: DataTable with priority columns, others hidden (available via column toggle)
- <768px: Card stack. Each entity is a card with name + key metadata. Pagination becomes infinite scroll with "Load more" button.

### 3.2 Detail Page (e.g., /persons/[id])

**Visual composition:**

```
[TopBar -----------------------------------------------]
[Sidebar] [                                              ]
[   |   ] [ Persons > Johann von Dalberg                 ]
[   |   ] [ h1: Johann von Dalberg      [Edit] [Delete]  ]
[   |   ] [                                              ]
[   |   ] [ +--- AttributesCard -----------------------+ ]
[   |   ] [ | First: Johann      | Last: von Dalberg   | ]
[   |   ] [ | Birth: 1455 * [E2] | Death: 1503 ** [E1] | ]
[   |   ] [ | Notes: "Bishop of Worms, humanist..."     | ]
[   |   ] [ +------------------------------------------+ ]
[   |   ] [                                              ]
[   |   ] [ [Attr 6] [Names 3] [Events 5] [Rel 12] ... ]
[   |   ] [ +--- TabContent ---------------------------+ ]
[   |   ] [ | (content of active tab)                  | ]
[   |   ] [ +------------------------------------------+ ]
```

**Content hierarchy:**

1. PageHeader with entity name -- the identity anchor
2. AttributesCard -- the primary data surface, always visible
3. TabBar -- the navigation for secondary data
4. TabContent -- the detail payload

**Wide screen (>=1280px) two-column variant:**

- Left column (45%): AttributesCard, position: sticky below TopBar
- Right column (55%): TabBar + scrollable TabContent
- This reduces scrolling for data-dense entities (Prof. Engel's primary need)

**Responsive reflow:**

- > =1280px: two-column (AttributesCard | TabBar + Content)
- 768-1279px: single column stacked. On tablet landscape, potentially two-column.
- <768px: single column. Breadcrumbs hidden (back arrow only). Tabs become a scrollable horizontal strip.

### 3.3 Form Page (e.g., /persons/new)

**Visual composition:**

```
[TopBar -----------------------------------------------]
[Sidebar] [                                              ]
[   |   ] [ Persons > New Person                         ]
[   |   ] [ h1: Neue Person                              ]
[   |   ] [                                              ]
[   |   ] [ +--- FormCard (max-w-2xl mx-auto) --------+ ]
[   |   ] [ |                                          | ]
[   |   ] [ | --- Basic Information ---                | ]
[   |   ] [ | [First Name ______] [Last Name ______]   | ]
[   |   ] [ | [Notes ________________________________] | ]
[   |   ] [ |                                          | ]
[   |   ] [ | --- Birth Date --- (bordered group)      | ]
[   |   ] [ | [Year] [Month v] [Day] [Cert: O O O O]  | ]
[   |   ] [ |                                          | ]
[   |   ] [ | --- Death Date --- (bordered group)      | ]
[   |   ] [ | [Year] [Month v] [Day] [Cert: O O O O]  | ]
[   |   ] [ |                                          | ]
[   |   ] [ | > Name Variants (collapsible)            | ]
[   |   ] [ |                                          | ]
[   |   ] [ | ----- footer line -----                  | ]
[   |   ] [ | [Cancel]              [Create Person]    | ]
[   |   ] [ +------------------------------------------+ ]
```

**Content hierarchy:**

1. Form fields -- the user's primary interaction surface
2. Section headings (FieldGroup legends) -- structural orientation
3. FormFooter actions -- submit is the goal state

**Key design decisions:**

- Form card is centered with `max-w-2xl mx-auto` -- narrower than list/detail pages to reduce line lengths in text fields and create visual focus
- FieldGroups for dates use `rounded-md border border-border p-4` to visually group year + month + day + certainty
- FormFooter has `pt-6 border-t border-border` separating it from form content. Cancel is left-aligned, Submit is right-aligned.

**Responsive reflow:**

- > =768px: two-column for short field pairs (first name + last name). Date fields on one row.
- <768px: all fields stack single column. FormFooter becomes sticky at viewport bottom (`fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4`).

### 3.4 Dashboard

**Visual composition:**

```
[TopBar -----------------------------------------------]
[Sidebar] [                                              ]
[   |   ] [ h1: Dashboard                                ]
[   |   ] [                                              ]
[   |   ] [ [Persons: 47] [Events: 23] [Sources: 31]    ]
[   |   ] [ [Relations: 89]                              ]
[   |   ] [                                              ]
[   |   ] [ +--- Recent Activity ---+ +-- Quick Actions -+]
[   |   ] [ | * Lukas added Person  | | [+ Person]       |]
[   |   ] [ | * Lukas added Source  | | [+ Event]         |]
[   |   ] [ | * Engel edited Rel    | | [+ Source]        |]
[   |   ] [ | ...                   | | [+ Relation]      |]
[   |   ] [ +-----------------------+ +------------------+]
[   |   ] [                                              ]
[   |   ] [ +--- Data Quality (future) ----------------+ ]
[   |   ] [ | Unlinked: 5  |  Missing evidence: 12     | ]
[   |   ] [ +----------------------------------------------+]
```

**Content hierarchy:**

1. Stat cards row -- at-a-glance project state
2. Recent activity feed + quick actions -- the two most common next actions
3. Data quality indicators (future) -- deeper analysis

**Responsive reflow:**

- > =1024px: stat cards in a 4-column row, activity + quick actions side by side
- 768-1023px: stat cards in 2x2 grid, activity above quick actions
- <768px: stat cards in 2x2, activity above quick actions. Quick actions become a horizontal scrollable chip row.

### 3.5 Settings Page

**Visual composition:**

```
[TopBar -----------------------------------------------]
[Sidebar] [                                              ]
[   |   ] [ Settings > Event Types                       ]
[   |   ] [ h1: Ereignistypen                            ]
[   |   ] [                                              ]
[   |   ] [ +--- InlineEditTable ----------------------+ ]
[   |   ] [ | [Color] | Name       | [Edit] [Delete]  | ]
[   |   ] [ | [#3B82] | Battle     | [pen]  [trash]   | ]
[   |   ] [ | [#EF44] | Marriage   | [pen]  [trash]   | ]
[   |   ] [ | [+ Add Event Type ________________]      | ]
[   |   ] [ +------------------------------------------+ ]
```

Settings pages are simpler -- they use the same page container but with inline-editable tables rather than full CRUD pages.

**Responsive:** Table remains tabular at all breakpoints (settings have few columns). Action buttons stack vertically on mobile.

### 3.6 Auth Pages

**Visual composition:**

```
+--- full viewport, bg-background -------------------+
|                                                     |
|   [DE/EN] [theme]               (top right corner)  |
|                                                     |
|              Evidoxa                                 |
|         (text-2xl font-bold)                        |
|                                                     |
|     +--- Card (max-w-sm) ---------------------+     |
|     |                                         |     |
|     |  h1: Anmelden / Sign In                 |     |
|     |                                         |     |
|     |  [Email __________________________]     |     |
|     |  [Password ________________________]    |     |
|     |                                         |     |
|     |  [Sign In ___________button________]    |     |
|     |                                         |     |
|     |  Forgot password?     Create account    |     |
|     +-----------------------------------------+     |
|                                                     |
+-----------------------------------------------------+
```

- Background: `var(--color-background)` -- the warm off-white. No decorative patterns.
- Card: `rounded-xl border border-border bg-card p-6 shadow-sm` -- the only place a shadow is used on a card, to lift the auth form off the warm background.
- Brand name above the card: `text-2xl font-bold tracking-tight text-foreground`
- Form fields: standard Input styling with `space-y-4` between fields
- Submit button: full-width `Button variant="default"`
- Navigation links: `text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline`

---

## 4. Micro-Interactions and Transitions

Every animation maps to a motion token from the brand identity (Section 7). Each includes its `prefers-reduced-motion` fallback.

### 4.1 Page Navigation Transitions

**Normal:** New page content fades in with `opacity: 0 -> 1` over `var(--duration-deliberate)` (500ms) using `var(--ease-out)`. The outgoing page has no exit animation (it is replaced by the Next.js App Router). This is implemented via a client-side layout wrapper that applies the animation on route change.

**Reduced motion:** Instant content swap. No fade.

**Implementation note:** App Router does not have built-in page transitions. A `<TransitionProvider>` wrapper in the `(app)` layout detects route changes via `usePathname()` and applies a CSS animation class to the `<main>` content.

### 4.2 Dialog Open/Close

**Open:** `opacity: 0, scale: 0.95` to `opacity: 1, scale: 1`. Duration: `var(--duration-slow)` (300ms). Easing: `var(--ease-out)`. Overlay fades in simultaneously.

**Close:** `opacity: 1, scale: 1` to `opacity: 0, scale: 0.97`. Duration: `var(--duration-normal)` (200ms). Easing: `var(--ease-in)`. Overlay fades out.

**Reduced motion:** Instant show/hide. No scale transform. Opacity change only if the component supports it, otherwise immediate.

### 4.3 Sidebar Collapse/Expand

**Normal:** Width transitions from `var(--sidebar-width-open)` to `var(--sidebar-width-collapsed)` (or vice versa) over `var(--duration-normal)` (200ms) with `var(--ease-in-out)`. Main content `padding-left` transitions simultaneously with the same timing. Nav labels fade out (collapse) or fade in (expand) with a 50ms offset -- labels disappear slightly before the width finishes shrinking, and appear slightly after the width finishes expanding. This prevents label truncation mid-animation.

**Reduced motion:** Instant width change. No transition. Labels appear/disappear immediately.

### 4.4 Toast Enter/Exit Stack

**Enter:** Slide up from bottom (`translateY(16px) -> translateY(0)`) + fade in (`opacity: 0 -> 1`). Duration: `var(--duration-slow)` (300ms). Easing: `var(--ease-out)`. Existing toasts in the stack shift up simultaneously.

**Exit:** Fade out (`opacity: 1 -> 0`) + slight slide down (`translateY(0) -> translateY(8px)`). Duration: `var(--duration-normal)` (200ms). Easing: `var(--ease-in)`. Remaining toasts shift down to close the gap.

**Reduced motion:** Instant appear/disappear. No slide.

### 4.5 DataTable Row Selection

**Normal:** Background color transitions from `bg-card` to `bg-accent/50` over `var(--duration-fast)` (100ms) with `var(--ease-out)`. The checkbox fill animates as a scale-up from center.

**Reduced motion:** Instant background change. Checkbox fills immediately.

### 4.6 Inline Edit Activation/Deactivation

**Activation:** The static value text fades out (`opacity: 1 -> 0`, 100ms) and the editable input fades in (`opacity: 0 -> 1`, 100ms) in the same space. The field border appears around the value. Total perceived duration: `var(--duration-normal)` (200ms).

**Deactivation (save):** Input fades out, new static value fades in. A brief `var(--ease-spring)` scale pulse (1.0 -> 1.02 -> 1.0) on the value text signals "change applied."

**Deactivation (cancel):** Input fades out, original value fades in. No pulse.

**Reduced motion:** Instant swap between static and editable states. No fade, no pulse.

### 4.7 Certainty Badge Hover (Show Evidence Count)

**Normal:** On hover, the certainty badge scales up slightly (`scale: 1 -> 1.05`) over `var(--duration-fast)` (100ms) with `var(--ease-spring)` -- a subtle overshoot that makes the badge feel responsive. A tooltip with the evidence count appears after the standard tooltip delay.

**Reduced motion:** No scale change. Tooltip appears instantly.

### 4.8 Command Palette Open/Close

**Open:** Overlay fades in. Palette container enters with `opacity: 0, translateY(-16px)` to `opacity: 1, translateY(0)`. Duration: `var(--duration-normal)` (200ms). Easing: `var(--ease-out)`. Focus immediately moves to the search input.

**Close:** Palette fades out over `var(--duration-fast)` (100ms). Faster than open -- the user wants to return to their work quickly.

**Reduced motion:** Instant show/hide.

### 4.9 Loading Skeleton Shimmer to Content Reveal

**Skeleton phase:** Continuous opacity pulse between 40% and 100%, 2s cycle, `var(--ease-in-out)`.

**Content reveal:** Skeleton is replaced by real content with no additional animation. The content simply appears. Adding a fade-in here would delay the perception that data is ready.

**Reduced motion:** Skeleton is a static `opacity: 60%` rectangle. No pulse.

### 4.10 Form Validation (Field Error Appear/Disappear)

**Appear:** Error message fades in + slides down from 4px above (`opacity: 0, translateY(-4px)` to `opacity: 1, translateY(0)`). Duration: `var(--duration-fast)` (100ms). Simultaneously, the field border transitions to `border-destructive` over the same duration.

**Disappear:** Error message fades out over `var(--duration-fast)` (100ms). Border transitions back to `border-input-border`.

**Reduced motion:** Instant appear/disappear. Border change is instant.

---

## 5. Dark Mode Detailed Design

### 5.1 Surface Hierarchy in Dark Mode

Dark mode uses a compressed lightness range (4.5% to 9%) compared to light mode (97% to 100%). This means the visual difference between surface levels is smaller, and the UI relies more on borders than lightness to create hierarchy.

| Level   | Token                | HSL                | Lightness | Purpose                                        |
| ------- | -------------------- | ------------------ | --------- | ---------------------------------------------- |
| Ground  | `--color-background` | `hsl(25 10% 4.5%)` | 4.5%      | Page background, the deepest level             |
| Surface | `--color-card`       | `hsl(25 9% 6.5%)`  | 6.5%      | Cards, table rows, primary content containers  |
| Raised  | `--color-popover`    | `hsl(24 8% 9%)`    | 9%        | Popovers, dropdowns, command palette, tooltips |
| Overlay | `--color-sidebar`    | `hsl(25 8% 5.5%)`  | 5.5%      | Sidebar (slightly above ground, below surface) |

**Key principle:** In dark mode, every elevated surface gets a `1px` border in `var(--color-border)` (`hsl(22 7% 14%)`) to define its edges. This border does the work that shadows do in light mode. Cards that are borderless in light mode (relying on background + shadow difference) must gain a border in dark mode.

### 5.2 Shadow Replacement Strategy

In dark mode, shadows become nearly invisible. The strategy:

| Element         | Light mode                   | Dark mode                                                                                                       |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Card            | `shadow-none` (borders only) | `border border-border` (same)                                                                                   |
| Popover         | `shadow-md`                  | `border border-border` with `hsl(22 7% 20%)` border (brighter than default). Shadow reduced but present.        |
| Dialog          | `shadow-lg`                  | `border border-border` with `hsl(22 7% 20%)` border. The overlay (`bg-black/60`) provides the depth separation. |
| Command palette | `shadow-lg`                  | Same as Dialog treatment                                                                                        |
| Toast           | `shadow-md`                  | `border border-border`                                                                                          |

The shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) still exist in dark mode with increased opacity (black at 15-35%), but they serve as a subtle supplement to the border treatment, not the primary depth cue.

### 5.3 Certainty Colors in Dark Mode

Certainty colors undergo two adjustments in dark mode:

1. **Saturation reduction:** Each certainty hue reduces saturation by 8-15% to prevent "neon glow" against the dark background. Example: Certain shifts from `hsl(180 50% 30%)` to `hsl(180 40% 55%)` -- the saturation drops from 50% to 40% while lightness increases to maintain contrast.

2. **Lightness increase:** To maintain the WCAG 3:1 minimum contrast against the dark card surface (`hsl(25 9% 6.5%)`), all certainty indicator colors increase lightness to the 50-62% range.

3. **Background tints are darker:** Certainty badge backgrounds in dark mode use very low lightness (10-13%) with low saturation (20-30%). These are barely tinted -- almost monochrome -- to avoid creating color patches that draw undue attention.

**Meaning is preserved through the icon shapes.** Even if two colors become harder to distinguish on certain displays (especially under color vision deficiency + dark mode), the filled/three-quarter/half/ring/dashed icons remain unambiguous.

### 5.4 Image and Media Handling in Dark Mode

- **User-uploaded images (future):** Display at full brightness but with `rounded-lg` and a `1px border border-border` frame. No brightness/contrast manipulation -- altering historical document photographs would compromise scholarly integrity.
- **Empty state illustrations:** SVG line art uses `currentColor` inheriting from `text-muted-foreground`. In dark mode this automatically adapts.
- **Event type color swatches:** These are user-defined hex colors. In dark mode, the swatch renders at full color inside a small circle, but any background area using the color (e.g., EventType badges) applies the color at 20% opacity to avoid over-bright patches.
- **Avatars:** Fallback avatars use `bg-muted text-muted-foreground`, which naturally adapts. Photo avatars display at full brightness.

### 5.5 How the Warm Stone Palette Reads Differently

**Light mode (day):** The warm stone neutrals create a feeling of aged paper -- a reading room with incandescent light. The background at `hsl(36 25% 98.5%)` is barely distinguishable from white on most monitors, but the accumulated warmth across all surfaces creates a perceptible difference from a default zinc interface. It reads as "calm" rather than "clinical."

**Dark mode (night):** The warm charcoal neutrals (hue 20-30, saturation 7-10%) feel like a library after hours -- the warmth shifts from "paper" to "leather." Pure-black dark modes feel technical; the warm charcoal feels habitable. The primary text at `hsl(30 10% 94%)` is cream, not white -- reducing the harsh light-on-dark contrast that causes eye strain and halation on lower-quality displays.

The continuity of warm hue across both modes means switching between light and dark does not feel like switching applications. The personality persists.

---

## 6. Responsive Design Details

### 6.1 Breakpoint Definitions

| Name    | Range            | Rationale                                                                                                                                                |
| ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile  | < 768px          | Single-column. Target: phone in portrait, small tablet in portrait. This is where Lukas checks his data on his smartphone.                               |
| Tablet  | 768px -- 1023px  | Wider single-column or restricted two-column. Target: iPad, archive reading room PCs with constrained displays. This is Prof. Engel's conference device. |
| Desktop | 1024px -- 1279px | Full two-column with sidebar. Target: standard laptop. The persistent sidebar becomes available here.                                                    |
| Wide    | >= 1280px        | Enhanced two-column with entity detail split view. Target: external monitor, ultrawide. Prof. Engel's office setup.                                      |

These align with Tailwind's default breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`). The meaningful thresholds are `md`, `lg`, and `xl`.

### 6.2 Component Adaptation Rules

#### DataTable to Mobile Card Stack (<768px)

Each table row becomes a card:

```
+----------------------------------------------+
| [Checkbox]  Johann von Dalberg          [>]  |
|             Birth: 1455  |  Certain *        |
+----------------------------------------------+
```

- Card: `rounded-lg border border-border bg-card p-4`
- Primary identifier (name): `text-sm font-medium text-foreground`
- Metadata line: `text-xs text-muted-foreground mt-1`
- Tap target: full card (navigates to detail)
- Checkbox: 44x44px tap area on the left
- Chevron: right-aligned, indicating navigability
- Card gap: `gap-2` (8px) between cards
- Swipe-left reveals delete action (red background, destructive icon)

Sort and filter controls move above the card stack as a compact toolbar.

#### Entity Detail Tabs on Tablet (768-1023px)

- Tabs render as a horizontally scrollable pill strip
- Each tab trigger: `min-h-11 px-4` (44px touch target)
- Active indicator: bottom border, same as desktop
- Overflow: swipe left/right to access tabs beyond viewport
- A subtle fade gradient on the right edge signals more tabs are available

On tablet landscape with `orientation: landscape` AND `min-width: 768px`, the detail page attempts the two-column split (AttributesCard 45% | Tabs 55%).

### 6.3 Sidebar Adaptation

| Breakpoint | Sidebar behavior                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| >= 1024px  | Persistent. Expanded or collapsed, toggled via `Cmd+B`. State persisted in localStorage.                                                         |
| 768-1023px | Overlay drawer (slide-in from left). Triggered by hamburger in TopBar. Bottom tab bar provides persistent navigation for the five main sections. |
| < 768px    | Same overlay drawer. Bottom tab bar + central FAB for quick-create.                                                                              |

The overlay drawer uses the same visual treatment as the expanded sidebar but with a backdrop overlay (`bg-black/40`) and slide-in animation (`translateX(-100%) -> translateX(0)`, `var(--duration-normal)`, `var(--ease-out)`).

### 6.4 Touch Target Enforcement

All interactive elements must be at least 44x44px on touch devices. Detection: `@media (pointer: coarse)` or viewport < 1024px.

**Strategy:** Visual size can be smaller (e.g., a 24px evidence badge or a 32px icon button), but the tap area is enlarged via one of:

1. Increased padding (preferred)
2. A transparent `::after` pseudo-element positioned to expand the tap area
3. Negative margin compensation (when layout constraints prevent padding increase)

Specific elements and their enforcement:

| Element                   | Visual size | Touch tap area | Method                   |
| ------------------------- | ----------- | -------------- | ------------------------ |
| Evidence badge            | 24px circle | 44x44px        | `::after` pseudo-element |
| Checkbox (DataTable)      | 16x16px     | 44x44px        | Cell padding             |
| Tab trigger               | auto x 32px | auto x 44px    | Increased `py`           |
| CertaintySelector option  | 32x32px     | 44x44px        | Increased `p`            |
| Icon button (edit/delete) | 32x32px     | 44x44px        | `min-h-11 min-w-11`      |
| Pagination button         | 36x36px     | 44x44px        | Increased `p`            |

### 6.5 Content Prioritization on Smaller Screens

| Content                       | Desktop                    | Tablet                                  | Mobile                        |
| ----------------------------- | -------------------------- | --------------------------------------- | ----------------------------- |
| Breadcrumbs                   | Full path below PageHeader | Shortened (2 levels max)                | Hidden (back arrow only)      |
| DataTable columns             | All visible                | Priority 1-2 visible, others via toggle | Priority 1 only (card format) |
| Sidebar labels                | Full text when expanded    | Icon-only in bottom bar                 | Icon-only in bottom bar       |
| Command palette shortcut hint | "Cmd+K" text visible       | Hidden (icon only)                      | Hidden (icon only)            |
| Entity detail two-column      | Active (wide)              | Landscape only                          | Never                         |
| FormFooter                    | Inline at bottom of form   | Sticky bottom bar                       | Sticky bottom bar             |
| Filter chips                  | Full row                   | Horizontally scrollable                 | Horizontally scrollable       |
| TopBar brand name             | "Evidoxa" text visible     | Visible                                 | Hidden (icon or compact logo) |

---

## 7. shadcn/ui Customization Map

### 7.1 As-Is (Token Changes Only)

These components work correctly with only the CSS custom property changes from zinc to warm stone. No additional CSS or variant modifications needed.

| Component                    | Customization approach                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `Label`                      | Inherits `text-foreground` from tokens. No changes.                                               |
| `Separator`                  | Uses `bg-border` which maps to the warm stone border token. No changes.                           |
| `Avatar` / `AvatarFallback`  | Fallback uses `bg-muted text-muted-foreground`. Token change sufficient.                          |
| `Checkbox`                   | Uses `border-primary data-[state=checked]:bg-primary`. Token change gives it the archival indigo. |
| `AlertDialog` sub-components | Structural only. Button variants handle the visual treatment.                                     |
| `Tooltip` / `TooltipContent` | Background/foreground inverted. Token change adjusts warmth.                                      |

### 7.2 Extended (Token Changes + Additional CSS/Variants)

| Component                     | Extension                                                                                                                                       | CSS approach                                                                                                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                      | Add `success` and `warning` variants. Adjust focus ring to use `--color-ring` (archival indigo).                                                | CVA variants: `success: "bg-success text-success-foreground hover:bg-success/90"`, `warning: "bg-warning text-warning-foreground hover:bg-warning/90"`. Focus: `focus-visible:ring-ring`.                                                                                       |
| `Badge`                       | Add `success`, `warning`, `info`, and five certainty-level variants.                                                                            | CVA variants: `certainty-certain: "bg-certainty-certain-background text-certainty-certain-foreground border-certainty-certain-border"` (and similarly for each level).                                                                                                          |
| `Card`                        | Remove default `shadow` class. Cards use borders only (shadow only on auth card).                                                               | Override: `.card { --tw-shadow: none; }` in the base layer. Auth card applies `shadow-sm` explicitly.                                                                                                                                                                           |
| `Input`                       | Use `--color-input-border` for border color (higher contrast than `--color-border`). Add hover state (border darkens). Add error state variant. | Default border: `border-[var(--color-input-border)]`. Hover: `hover:border-foreground/20`. Error: `data-[error=true]:border-destructive data-[error=true]:ring-1 data-[error=true]:ring-destructive`.                                                                           |
| `Tabs` / `TabsTrigger`        | Active tab uses a `2px` bottom border in `--color-primary` instead of the default background change. Increase tap targets on touch.             | Override TabsTrigger: `data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground`. Touch: `@media (pointer: coarse) { .tabs-trigger { min-height: 2.75rem; } }`. |
| `Table` / `TableRow`          | Add hover state. Integrate with DataTable selection styles.                                                                                     | `TableRow`: add `hover:bg-accent/30 transition-colors duration-[var(--duration-fast)]` and `data-[state=selected]:bg-accent/50`.                                                                                                                                                |
| `Dialog` / `DialogContent`    | Adjust overlay opacity for dark mode. Add border in dark mode. Increase radius to `rounded-xl`.                                                 | Override: `.dark .dialog-overlay { --tw-bg-opacity: 0.6; }`. DialogContent: `rounded-xl`. Dark: `.dark .dialog-content { border: 1px solid var(--color-border); }`.                                                                                                             |
| `Popover` / `PopoverContent`  | Add subtle shadow. Increase dark-mode border brightness.                                                                                        | `shadow-md`. Dark: `.dark .popover-content { border-color: hsl(22 7% 18%); }`.                                                                                                                                                                                                  |
| `Skeleton`                    | Change pulse color from `bg-primary/10` to `bg-muted`.                                                                                          | Replace `bg-primary/10 animate-pulse` with `bg-muted animate-pulse`. Reduced motion: `motion-reduce:animate-none motion-reduce:opacity-60`.                                                                                                                                     |
| `DropdownMenu` sub-components | Add hover/focus consistency with other interactive elements.                                                                                    | Items: `hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground`.                                                                                                                                                                             |

### 7.3 Custom Components (Not shadcn)

| Component                     | Reason                                                          | Implementation approach                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `Textarea`                    | Not in shadcn/ui install. Needed to replace raw `<textarea>`.   | New `src/components/ui/textarea.tsx`. Copies Input styling with adjustments: `min-h-[80px] resize-y`. Use `React.forwardRef`. Register in shadcn component map.                                                                                                                                                                                                                                                                                                              |
| `Select` (native replacement) | Not in shadcn/ui install. Needed to replace raw `<select>`.     | New `src/components/ui/select.tsx`. Use `@radix-ui/react-select` (install if needed) or build on the existing `Command` + `Popover` pattern for consistency. Trigger styled identically to Input.                                                                                                                                                                                                                                                                            |
| `CertaintySelector`           | Domain-specific. No shadcn equivalent.                          | Refactor existing component. Apply `role="radiogroup"`. Each option: `rounded-md` button with certainty-level background/border/color tokens. Active state: `bg-{level}-background border-{level}-border text-{level}-foreground`. Container: `rounded-lg border border-border overflow-hidden flex`.                                                                                                                                                                        |
| `CertaintyIcon`               | Domain-specific SVG set.                                        | New `src/components/ui/certainty-icon.tsx`. Five SVG variants (filled circle, three-quarter, half, ring, dashed ring). Props: `level: CertaintyLevel`, `size?: "sm"                                                                                                                                                                                                                                                                                                          | "md"`. All icons `aria-hidden="true"`. |
| `CertaintyBadge`              | Combines CertaintyIcon + label text in a pill.                  | New `src/components/ui/certainty-badge.tsx`. Wraps CertaintyIcon + text in a `<span>` with certainty background/border tokens. Two modes: full (icon + text) and compact (icon only with tooltip).                                                                                                                                                                                                                                                                           |
| `PropertyEvidenceBadge`       | Domain-specific. Already exists, needs design system alignment. | Refactor to use Badge variants. Normal state: `Badge variant="secondary"` with count. Warning state: `Badge variant="warning"` with dashed border.                                                                                                                                                                                                                                                                                                                           |
| `PageHeader`                  | Layout pattern, not a primitive.                                | New `src/components/shell/page-header.tsx`. Encapsulates `flex items-center justify-between` + h1 + action buttons + optional breadcrumbs. Enforces spacing consistency.                                                                                                                                                                                                                                                                                                     |
| `PageContainer`               | Layout wrapper.                                                 | New `src/components/shell/page-container.tsx`. `<div className="p-6 space-y-6 max-w-7xl">`. Replaces per-page duplication.                                                                                                                                                                                                                                                                                                                                                   |
| `FieldGroup`                  | Form section with border and legend.                            | New `src/components/ui/field-group.tsx`. `<fieldset className="rounded-md border border-border p-4 space-y-4">` with `<legend className="text-sm font-medium text-foreground px-1">`. Optional `collapsible` prop.                                                                                                                                                                                                                                                           |
| `EmptyState`                  | Standardized empty state pattern.                               | New `src/components/ui/empty-state.tsx`. Props: `icon`, `heading`, `description`, `action` (button). Centered layout with the spacings defined in Section 2.4.                                                                                                                                                                                                                                                                                                               |
| `DataTableCardStack`          | Mobile card rendering of DataTable rows.                        | New `src/components/research/data-table-card-stack.tsx`. Renders on `<768px`. Each entity as a bordered card with primary identifier + key metadata.                                                                                                                                                                                                                                                                                                                         |
| `BottomTabBar`                | Mobile/tablet persistent navigation.                            | New `src/components/shell/bottom-tab-bar.tsx`. Five nav items + optional FAB. `fixed bottom-0 h-16 bg-card border-t border-border`.                                                                                                                                                                                                                                                                                                                                          |
| `NetworkStatusIndicator`      | Connection status dot/banner.                                   | New `src/components/shell/network-status.tsx`. Uses `useNetworkStatus` hook. Three states: none (online), dot (degraded), banner (offline).                                                                                                                                                                                                                                                                                                                                  |
| `Sidebar` (collapsed state)   | Collapsed sidebar links need explicit accessible names.         | In `src/components/shell/sidebar.tsx`: when the sidebar is collapsed, every `<a>` and `<button>` nav item MUST include `aria-label="{nav item label}"` (e.g., `aria-label="Dashboard"`, `aria-label="Personen"`). The icon is `aria-hidden="true"`. The visually-hidden text span is removed from the DOM during collapse, making `aria-label` on the interactive element the sole accessible name for screen readers. This is enforced at the component level, not via CSS. |

### 7.4 CSS Custom Property Additions for Component Customization

These properties are added to the `@theme` block and `.dark` override in `globals.css`:

```css
@theme {
  /* Layout tokens */
  --sidebar-width-open: 14rem;
  --sidebar-width-collapsed: 3rem;
  --topbar-height: 3.5rem;

  /* Radius scale */
  --radius: 0.5rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Motion tokens */
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

The complete color token set (warm stone neutrals, semantic colors, certainty colors) is defined in the brand identity document Section 8 and must be transcribed into `globals.css` as part of the implementation phase.

### 7.5 Base Layer Additions

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

## Summary of Visual Principles

1. **Borders over shadows.** Cards, tables, and containers are defined by their 1px warm-stone borders. Shadows are reserved for floating elements (popovers, dialogs, toasts) and only in light mode.

2. **Certainty is the primary color language.** Five hues span from teal to amber to warm grey. Everything else -- semantic states, interactive highlights -- plays a supporting role.

3. **The page background does the heavy lifting.** The warm off-white (`hsl(36 25% 98.5%)`) sets the mood for the entire application. Every surface on top of it inherits the warmth.

4. **Typography earns hierarchy through weight and color, not size.** The type scale is restrained (12px-30px for app pages). Headings use `semibold` at larger sizes. Labels use `medium` at smaller sizes. Body text is `regular`. Color differentiation (`foreground` vs `muted-foreground`) does as much work as size.

5. **Animation is invisible until it is absent.** Every transition serves orientation, feedback, or continuity. Nothing decorates. The 200ms default duration is fast enough to feel immediate but slow enough to be perceivable. All animations respect `prefers-reduced-motion`.

6. **Density is a feature.** Researchers want to see data. The default spacing is comfortable but not spacious. Future density toggles (compact/comfortable/spacious) will adjust the spacing scale via CSS custom properties on `<body>`.

---

_This document translates the brand identity tokens and UX architecture patterns into concrete visual specifications for every component, page, and interaction in Evidoxa. Implementation should reference these specifications by section number. No visual decision should be made outside this document without updating it first._
