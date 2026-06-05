# UX Architecture -- Evidoxa

**Date:** 2026-04-02 (revised 2026-04-02)
**Author:** Principal UX Architect
**Status:** Revised -- addressing review round 1 feedback (B1, B2, M1, M2, M3)
**Upstream dependencies:** `00-discovery/codebase-analysis.md`, `01-ux/research.md`

---

## Table of Contents

1. [UX Principles](#1-ux-principles)
2. [Information Architecture](#2-information-architecture)
3. [Interaction Design Patterns](#3-interaction-design-patterns)
   - 3.8 [Certainty Visual Encoding Constraints](#38-certainty-visual-encoding-constraints)
   - 3.9 [Claim Without Evidence Warning Pattern](#39-claim-without-evidence-warning-pattern)
   - 3.10 [Network Resilience Strategy](#310-network-resilience-strategy)
4. [Layout System](#4-layout-system)
   - 4.4 [Mobile and Tablet Experience](#44-mobile-and-tablet-experience)
5. [Workflow Optimization](#5-workflow-optimization)
   - 5.5 [Source-First Creation Path](#55-source-first-creation-path)
6. [Accessibility Architecture](#6-accessibility-architecture)

---

## 1. UX Principles

Seven principles, ranked by priority. Each is actionable, testable, and grounded in the research personas and codebase reality.

### Principle 1: Evidence First, Always

**Statement:** Every data point must visibly declare its epistemic status and provenance. The absence of evidence should feel like a gap, not a neutral default.

**Rationale:** Prof. Engel needs to spot-check student work and verify that certainty levels match the underlying sources (Research 2.1). Lukas annotates proactively to demonstrate methodological rigor (Research 2.2). The four-state certainty system and PropertyEvidenceBadge pattern are the core differentiators of Evidoxa.

**Concrete example:** On a PersonDetailCard, the birth_year field currently shows a PropertyEvidenceBadge with a count. When count is 0, the badge should render in a warning style (muted-foreground with a dashed outline) rather than simply absent. When certainty is "Certain" but evidence count is 0, the badge should escalate to a cautionary visual -- a claim without evidence is a red flag in historical scholarship.

**Test:** Load any entity detail page. Without clicking or hovering, a user must be able to identify (a) which fields have evidence and which do not, and (b) the certainty level of date fields. Measure: 100% of certainty states and evidence gaps are visible without interaction.

---

### Principle 2: Keyboard-Driven Fluency

**Statement:** Every primary workflow must be completable without a mouse. Power users should reach any entity or action within three keystrokes from the command palette.

**Rationale:** Lukas spends 2-4 hour post-archive sessions entering data from photographed sources (Research 2.2). During these sessions, context switching between keyboard and mouse breaks concentration. Linear and Obsidian demonstrate that keyboard-first design is the standard for professional tools (Research 5.5, 5.7). Prof. Engel has RSI from decades of keyboard use (Research 2.1) -- reducing mouse travel is an accessibility need, not just a convenience.

**Concrete example:** After creating a person record, the user presses `Cmd+K`, types "rel", selects "New Relation", and the RelationFormDialog opens with the current entity pre-filled. The entire flow from person creation to relation creation takes zero mouse movements.

**Test:** Define the top 10 workflows (Section 5). Each must be completable via keyboard alone. Measure the keystroke count. Target: no workflow exceeds 12 keystrokes from the command palette.

---

### Principle 3: Long-Session Ergonomics

**Statement:** The interface must support sustained cognitive work over 2-4 hour sessions without visual fatigue. Color temperature, contrast, typography, and density must be calibrated for extended scholarly reading, not quick transactional interactions.

**Rationale:** The primary productive workflow -- post-archive data entry -- is a multi-hour session (Research 2.2, Principle 3.3). Pure white backgrounds cause eye strain; small body text causes squinting over transcription excerpts; insufficient contrast compounds with progressive lenses (Research 2.1).

**Concrete example:** The light-mode background shifts from pure white `hsl(0 0% 100%)` to a warm off-white `hsl(40 15% 98.5%)`. Body text in content areas (notes, transcriptions, evidence quotes) renders at 16px minimum. The dark mode background remains at `hsl(240 10% 3.9%)` -- already appropriate.

**Test:** Conduct a simulated 2-hour data entry session with 3 participants. Measure self-reported eye fatigue on a 1-5 scale at 30-minute intervals. Target: no participant reports fatigue above 2/5 at the 2-hour mark.

---

### Principle 4: Consistent Entity Grammar

**Statement:** All entity types (Person, Event, Source, Relation) must follow an identical interaction grammar. The user learns one pattern and applies it everywhere.

**Rationale:** The codebase already achieves route-level consistency (`/{entity}/`, `/{entity}/new`, `/{entity}/[id]`, `/{entity}/[id]/edit`) but the forms and detail cards have layout inconsistencies (codebase analysis Findings 6, 7, 8). Prof. Engel's low tolerance for complexity (Research 2.4) means she cannot afford to re-learn patterns per entity type.

**Concrete example:** Every entity detail page follows the same layout: PageHeader (title + action buttons) then a primary AttributesCard followed by a tabbed panel. Every list page follows: PageHeader (title + "New" button) then DataTableSearch then DataTable then DataTablePagination. The tab order on detail pages is always: Attributes, then entity-specific tabs, then Relations, Evidence, Activity (in that fixed order).

**Test:** Screenshot all four entity detail pages and all four entity list pages. Overlay them at 50% opacity. Structural elements (header position, card position, tab bar position, action button position) must align within 4px.

---

### Principle 5: Progressive Disclosure Without Hiding

**Statement:** Secondary fields and actions must be accessible in one click or keystroke, but must not compete for attention with primary fields. Nothing is hidden behind more than one level of disclosure.

**Rationale:** The RelationFormDialog already uses collapsible sections for temporal validity and evidence (codebase analysis). PersonForm groups date fields in bordered sections. These patterns work. But deep nesting -- a popover inside a dialog inside a tab -- creates disorientation (Research Journey 4.2, Phase 8). Dr. Mertens needs structured reference sub-fields without them cluttering every source form (Research 2.3).

**Concrete example:** On the SourceForm, the archive reference fields (archive, fond, series, item, folio) are grouped in a collapsible FieldGroup labeled "Archival Reference." The group is expanded by default when creating a new source (because it is the archivist's primary concern) and collapsed when editing (because existing data is already visible in the detail card). One click to toggle.

**Test:** For every collapsible section in the application, measure the maximum nesting depth. Target: no interaction requires expanding more than one disclosure level to reach the target content.

---

### Principle 6: Bilingual-Ready Sizing

**Statement:** All interactive elements must be sized for German string lengths as the baseline. English strings will fit comfortably; German strings must never truncate in primary navigation or action buttons.

**Rationale:** German text is 20-30% longer than English (codebase analysis). The current sidebar uses `truncate` on nav items -- this is a symptom of English-first sizing (Research Principle 3.6). Tab triggers, buttons, and breadcrumbs must accommodate "Beziehungstypen" (18 chars) as comfortably as "Relation Types" (14 chars).

**Concrete example:** The Sidebar nav items use a minimum width calculated from the longest German label ("Beziehungstypen" at ~140px in text-sm). The collapsed sidebar shows icons only. The expanded sidebar never truncates any navigation label.

**Test:** Switch the locale to German. Audit every navigation item, button label, tab trigger, and breadcrumb segment. Target: zero instances of text truncation (`...`) or overflow in the German locale at the minimum supported viewport width (1024px).

---

### Principle 7: Recoverability Over Prevention

**Statement:** Prefer undo over confirmation dialogs for non-destructive actions. Reserve confirmation friction for irreversible operations only.

**Rationale:** During rapid data entry, confirmation dialogs interrupt flow (Research Journey 4.1). Soft-delete exists in the data model for Person, Event, Source, and Relation. Bulk delete already uses a confirmation dialog (BulkDeleteDialog) -- this is appropriate for a multi-item destructive action. But single-field edits, relation creation, and evidence addition should use optimistic UI with undo.

**Concrete example:** When a user changes a CertaintySelector value on a relation, the change applies immediately (optimistic update) and a Sonner toast appears: "Certainty updated to Probable. Undo." The undo action reverts the value within a 5-second window. No confirmation dialog is shown.

**Test:** Categorize every user action as destructive-irreversible, destructive-reversible, or non-destructive. Destructive-irreversible actions (hard delete, account deletion) must show a confirmation dialog. Destructive-reversible actions (soft-delete) must show a confirmation dialog with a recovery path mentioned. Non-destructive actions must use optimistic UI with undo toast. Target: zero confirmation dialogs on non-destructive actions.

---

## 2. Information Architecture

### 2.1 Site Map

```
Evidoxa
|
+-- / (root redirect -> /{default-locale})
|
+-- /{locale}/
|   +-- auth/                          [Auth layout: centered card, no AppShell]
|   |   +-- login
|   |   +-- register
|   |   +-- verify
|   |   +-- forgot-password
|   |   +-- reset-password
|   |
|   +-- (app)/                         [App layout: AppShell with Sidebar + TopBar]
|   |   +-- dashboard                  [Home/landing after login]
|   |   +-- persons/                   [Entity: Person]
|   |   |   +-- (list)                 [DataTable with search, sort, pagination, bulk actions]
|   |   |   +-- new                    [PersonForm in create mode]
|   |   |   +-- [id]/                  [PersonDetailCard + PersonDetailTabs]
|   |   |       +-- edit               [PersonForm in edit mode]
|   |   |
|   |   +-- events/                    [Entity: Event]
|   |   |   +-- (list)                 [DataTable with filters, sort, pagination]
|   |   |   +-- new                    [EventForm in create mode]
|   |   |   +-- [id]/                  [EventDetailCard + EventDetailTabs]
|   |   |       +-- edit               [EventForm in edit mode]
|   |   |
|   |   +-- sources/                   [Entity: Source]
|   |   |   +-- (list)                 [SourceTable with reliability filter]
|   |   |   +-- new                    [SourceForm in create mode]
|   |   |   +-- [id]/                  [SourceDetailCard + SourceDetailTabs]
|   |   |       +-- edit               [SourceForm in edit mode]
|   |   |
|   |   +-- relations/                 [Global relation list -- cross-entity]
|   |   |   +-- (list)                 [RelationsDataTable with type/certainty filters]
|   |   |
|   |   +-- settings/                  [Project-level configuration]
|   |       +-- event-types            [EventTypeSettingsTable -- inline CRUD]
|   |       +-- relation-types         [RelationTypesTable + RelationTypeFormDialog]
|   |
|   +-- dev/
|       +-- showcase                   [Component reference -- no AppShell]
|
+-- api/
    +-- health                         [System health endpoint]
    +-- auth/                          [next-auth API routes]
    +-- (entity CRUD endpoints)        [Server actions and API routes]
```

### 2.2 Navigation Patterns

#### Primary Navigation: Sidebar

The Sidebar (`src/components/shell/sidebar.tsx`) is the primary navigation surface. It is always visible in the app layout (collapsed or expanded) and provides direct access to all top-level entity sections.

**Structure (top to bottom):**

| Position | Item           | Icon              | Route                               | Badge                |
| -------- | -------------- | ----------------- | ----------------------------------- | -------------------- |
| 1        | Dashboard      | `LayoutDashboard` | `/{locale}/dashboard`               | --                   |
| 2        | Persons        | `Users`           | `/{locale}/persons`                 | Total count (future) |
| 3        | Events         | `Calendar`        | `/{locale}/events`                  | Total count (future) |
| 4        | Sources        | `BookOpen`        | `/{locale}/sources`                 | Total count (future) |
| 5        | Relations      | `Link`            | `/{locale}/relations`               | Total count (future) |
| --       | Separator      | --                | --                                  | --                   |
| 6        | Event Types    | `Tag`             | `/{locale}/settings/event-types`    | --                   |
| 7        | Relation Types | `GitBranch`       | `/{locale}/settings/relation-types` | --                   |

**States:**

- Expanded (w-56 / 224px): Icon + label + optional badge. Active item highlighted with `bg-accent text-accent-foreground`.
- Collapsed (w-12 / 48px): Icon only with tooltip on hover showing the label. Active item indicated by icon color change.
- Mobile (<1024px): Sidebar becomes an overlay drawer, triggered by a hamburger button in TopBar.

**Keyboard:** `Cmd+B` / `Ctrl+B` toggles sidebar open/collapsed. Arrow keys navigate between items when sidebar has focus. Enter activates the focused item.

#### Secondary Navigation: TopBar

The TopBar (`src/components/shell/top-bar.tsx`) provides global controls that are always accessible regardless of the current page.

**Structure (left to right):**

| Position | Element                                 | Behavior                           |
| -------- | --------------------------------------- | ---------------------------------- |
| Left     | Sidebar toggle button                   | Toggles sidebar expanded/collapsed |
| Left     | Brand name "Evidoxa"                    | Links to dashboard                 |
| Center   | (Reserved for breadcrumbs -- see below) | --                                 |
| Right    | Command palette trigger                 | `Cmd+K` / `Ctrl+K`                 |
| Right    | LocaleSwitcher                          | DE/EN toggle                       |
| Right    | ThemeToggle                             | Light/Dark/System cycle            |
| Right    | Notification bell                       | (Future: count badge)              |
| Right    | User avatar + dropdown                  | Profile, settings, logout          |

#### Contextual Navigation: Breadcrumbs

Breadcrumbs appear below the TopBar (or integrated into the page header area) on all pages deeper than the top-level list.

**Pattern:**

```
Dashboard                                    [top-level, no breadcrumb]
Persons                                      [top-level, no breadcrumb]
Persons > Johann von Dalberg                 [detail page]
Persons > Johann von Dalberg > Edit          [edit page]
Persons > New Person                         [create page]
Relations                                    [top-level, no breadcrumb]
Settings > Event Types                       [settings sub-page]
```

**Rules:**

- The current page segment is plain text (not a link).
- All preceding segments are links.
- Entity names are truncated at 30 characters with ellipsis in the breadcrumb.
- Breadcrumbs use `aria-label="Breadcrumb"` and `<nav>` element with `<ol>` list structure.

#### Contextual Navigation: Entity Detail Tabs

Tabs on entity detail pages provide intra-page navigation. Tab order is standardized across all entity types.

**Canonical tab order:**

| Position | Tab        | Person | Event | Source | Content                                  |
| -------- | ---------- | ------ | ----- | ------ | ---------------------------------------- |
| 1        | Attributes | Yes    | Yes   | Yes    | Primary fields in detail card format     |
| 2        | Names      | Yes    | --    | --     | PersonNameList variants                  |
| 3        | Sub-events | --     | Yes   | --     | Child events hierarchy                   |
| 4        | Persons    | --     | Yes   | Yes    | Linked persons via relations             |
| 5        | Events     | Yes    | --    | Yes    | Linked events via relations              |
| 6        | Sources    | Yes    | Yes   | --     | Linked sources via relations             |
| 7        | Relations  | Yes    | Yes   | Yes    | Full RelationsTab (outgoing + incoming)  |
| 8        | Evidence   | Yes    | Yes   | Yes    | EntityEvidenceTab (all PropertyEvidence) |
| 9        | Activity   | Yes    | Yes   | Yes    | ActivityLog feed                         |

**Rules:**

- Each tab trigger shows a CountBadge with the number of items in that tab.
- CountBadge renders as `rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums`.
- Tabs with zero items still appear (not hidden) but the CountBadge shows "0" in muted style.
- The active tab is persisted in the URL hash (`#relations`) so that direct links to a specific tab work.
- Keyboard: Arrow left/right moves between tab triggers. Tab key moves into the tab content.

### 2.3 Content Hierarchy

The content hierarchy follows a consistent three-level structure across all entity types.

**Level 1 -- Collection (List Page):**
The highest level shows all entities of a given type within the current project. Users scan, search, filter, sort, and select for bulk operations.

- Primary content: DataTable rows with key identifying columns
- Secondary content: Search input, filter controls, pagination
- Actions: New entity, bulk delete, column visibility toggle
- Information scent: Total count, filtered count, sort indicator

**Level 2 -- Entity (Detail Page):**
A single entity with all its attributes, relationships, and evidence. This is the most data-dense screen in the application.

- Primary content: AttributesCard with key fields (name, dates, certainty, type)
- Secondary content: Tabbed panel with relations, evidence, activity
- Actions: Edit, delete, create relation, add evidence
- Information scent: Tab count badges, evidence badges on fields, certainty indicators

**Level 3 -- Annotation (Popover / Dialog):**
Evidence annotations, relation details, and inline editing surfaces. These are contextual overlays that do not require full page navigation.

- Primary content: Evidence fields (source, page reference, quote, transcription)
- Secondary content: Certainty, temporal validity
- Actions: Save, cancel, delete evidence entry
- Information scent: Source name, evidence count update

### 2.4 Progressive Disclosure Strategy

| Layer         | Default state                       | Disclosure trigger              | Content revealed                   | Example                                                |
| ------------- | ----------------------------------- | ------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Page-level    | List view shows table rows          | Row click                       | Entity detail page                 | Click a person row to navigate to PersonDetailCard     |
| Tab-level     | First tab (Attributes) active       | Tab click or arrow key          | Tab content panel                  | Click "Relations" tab to see RelationsTab              |
| Section-level | Primary fields visible              | Click section header or chevron | Secondary fields                   | Expand "Archival Reference" FieldGroup in SourceForm   |
| Field-level   | Value displayed with evidence badge | Click evidence badge            | PropertyEvidencePanel popover      | Click badge next to birth_year to see source citations |
| Row-level     | Relation summary row                | Click expand chevron            | Relation detail with evidence list | Expand a RelationRow to see EvidenceList inline        |
| Dialog-level  | --                                  | Button click or Cmd+K action    | Full form in modal overlay         | Click "New Relation" to open RelationFormDialog        |

**Maximum nesting depth:** Two layers. A user never encounters a popover inside a dialog inside a tab. If the content requires that depth, it escalates to a full-page route instead.

### 2.5 Search and Filter UX

#### Global Search (Command Palette)

Triggered by `Cmd+K` / `Ctrl+K` or clicking the search icon in TopBar. Uses the installed `cmdk` library.

**Behavior:**

- Opens a centered modal overlay with a text input at top.
- Results are grouped by entity type: Persons, Events, Sources, Relations, Pages (navigation), Actions.
- Each result shows: entity type icon, primary name/title, disambiguating metadata (dates for persons, type for events, reliability for sources).
- Selecting a result navigates to the entity detail page.
- Results update as the user types (debounced at 200ms).
- Recent searches are persisted in localStorage and shown when the palette opens with an empty query.
- Action results include: "New Person", "New Event", "New Source", "New Relation", "Settings: Event Types", "Settings: Relation Types".

**Keyboard model:**

- `Cmd+K` / `Ctrl+K`: Open palette
- Type to filter
- `ArrowUp` / `ArrowDown`: Navigate results
- `Enter`: Select result
- `Escape`: Close palette
- `Cmd+Enter`: Open result in new tab (future)

#### Entity List Search (DataTableSearch)

Available on all list pages. Currently implemented as a debounced text input that filters the server-side query.

**Behavior:**

- Searches across: primary name fields (first_name, last_name for persons; title for events and sources), and all name variants for persons.
- Search is case-insensitive and accent-insensitive.
- Results update after a 300ms debounce (matches current implementation).
- The search query is reflected in the URL (`?search=`) so searches are bookmarkable and shareable.
- Clear button (X icon) appears when text is present; clicking it clears the search and resets to the full list.

#### Entity List Filters

Filters are specific to each entity type and appear as controls above the DataTable.

| Entity    | Filter controls                                   | Implementation              |
| --------- | ------------------------------------------------- | --------------------------- |
| Persons   | Search only (currently)                           | DataTableSearch             |
| Events    | Event type dropdown, date range (from/to), search | EventFilters component      |
| Sources   | Reliability tier dropdown, search                 | SourceTable internal        |
| Relations | Entity type, relation type, certainty             | RelationsDataTable internal |

**Filter interaction pattern:**

- Filters use native-equivalent styled Select components (replacing current raw `<select>` elements per codebase Finding 6).
- Active filters show as removable chips below the filter bar, with a "Clear all" action.
- Filter state is persisted in URL search params (`?type=letter&reliability=HIGH`).
- The count text updates to show "12 of 47 Sources" when filters are active.

### 2.6 Breadcrumb Logic

Breadcrumbs are generated from the route path using a deterministic mapping.

**Rules:**

1. Route segments map to breadcrumb segments: `/{locale}/persons/[id]/edit` produces `Persons > {person.displayName} > Edit`.
2. The `[locale]` segment is never shown in breadcrumbs.
3. Layout group segments (`(app)`, `(auth)`) are never shown.
4. Dynamic segments (`[id]`) resolve to the entity's display name via the page's server-side data fetch.
5. The `settings` prefix produces "Settings" as a breadcrumb segment: `settings/event-types` becomes `Settings > Event Types`.
6. Top-level list pages (persons, events, sources, relations, dashboard) do not show breadcrumbs -- they are navigation roots.
7. The `new` segment renders as the translated string for "New {EntityType}" (e.g., "Neue Person" in German).

---

## 3. Interaction Design Patterns

### 3.1 Entity List Interactions (DataTable)

**Pattern:** Server-side paginated, sortable, searchable table with row selection for bulk actions.

**Rationale:** Entity lists may contain hundreds of items (Prof. Engel's 400+ person project -- Research 2.1). Client-side pagination would be slow. Server-side pagination with URL-param state enables bookmarking and sharing.

**Keyboard interaction model:**

- `Tab` moves focus into the table body from surrounding controls.
- `ArrowUp` / `ArrowDown` moves between rows.
- `Space` toggles row selection (checkbox).
- `Enter` navigates to the entity detail page (equivalent to row click).
- `Shift+ArrowDown` / `Shift+ArrowUp` extends selection range.
- `Cmd+A` / `Ctrl+A` selects all visible rows.
- Column headers are focusable; `Enter` or `Space` triggers sort.

**Screen reader behavior:**

- Table uses `role="table"` with `aria-label="Persons"` (entity type).
- Column headers use `aria-sort="ascending"` / `"descending"` / `"none"`.
- Row selection state is announced via `aria-selected="true"` on `<tr>`.
- Bulk action bar (appears when rows are selected) uses `role="toolbar"` with `aria-label="Bulk actions"`.
- Pagination announces current state: "Page 3 of 12, showing items 21 to 30 of 120."

**Error states:**

- Network error loading list: Full-width error card within the page container. Message: "Could not load {entity type}. Check your connection and try again." Retry button.
- Search returns no results: Empty state with the search query echoed back: "No persons matching '{query}'. Try a different search or create a new person." Links to clear search and to create new entity.
- Filter combination returns no results: Same empty state pattern but with: "No results for these filters. Clear filters."

**Loading states:**

- Initial page load: `PageSkeleton` variant "list" -- mimics table rows with animated pulse bars for each column.
- Pagination/sort/search navigation: The DataTable body area shows a subtle opacity reduction (opacity-60) on the current content while the new page loads. No skeleton replacement -- content stays visible to maintain spatial context.

**Empty states:**

- No entities of this type exist: Illustration (abstract archival motif), heading "No persons yet", body text "Create your first person record to begin building your research network.", primary action button "New Person". Secondary text: "Persons represent historical individuals in your research project."
- This pattern repeats for events, sources, and relations with entity-appropriate copy.

### 3.2 Entity Detail Interactions

**Pattern:** Single-page detail view with attribute card and tabbed secondary content.

**Keyboard interaction model:**

- `E` (when not in a text input): Navigate to edit page for this entity.
- `Backspace` or `Alt+Left`: Navigate back to the entity list.
- `Tab` cycles through interactive elements: action buttons, evidence badges, tab triggers, tab content.
- Tab panel content follows the keyboard model of its specific component (table, list, form).

**Screen reader behavior:**

- Page title is an `<h1>` announced on page load.
- The AttributesCard uses `<dl>` markup with `<dt>` for labels and `<dd>` for values (enforced across all entity types, resolving codebase Finding 8).
- Tab panel uses `role="tablist"`, `role="tab"`, `role="tabpanel"` per WAI-ARIA Tabs pattern.
- CountBadges on tabs include `aria-label`: "Relations, 12 items".
- PropertyEvidenceBadges include `aria-label`: "Evidence for birth year, 2 citations".

**Error states:**

- Entity not found (404): Not-found page with message "This {entity type} does not exist or has been deleted." Back to list link.
- Entity load failure (500): Error card with retry button within the page layout (AppShell remains intact).
- Evidence save failure: Toast error "Could not save evidence. Your changes have been preserved -- try again." The form content is not cleared.

**Loading states:**

- `PageSkeleton` variant "detail" -- mimics the attribute card shape with pulse bars for label-value pairs, plus tab bar skeleton with inactive tabs.

### 3.3 Form Interactions (Create / Edit)

**Pattern:** Full-page form with field groups, validation on blur, and submit with redirect.

**Keyboard interaction model:**

- `Tab` moves through fields in logical order (not DOM order where it differs): Name fields first, then dates, then certainty, then notes.
- `Shift+Tab` moves backward.
- `Enter` in single-line inputs moves to the next field (not submit). Only the submit button triggers form submission on Enter.
- CertaintySelector: `ArrowLeft` / `ArrowRight` cycles between the four states. `Space` or `Enter` confirms the hovered state.
- PartialDateInput: `Tab` moves between year, month, day sub-fields within the fieldset.
- PersonNameList: `Tab` to the "Add name variant" button. `Enter` adds a new row and focuses the first field of the new row.

**Text direction:** All user-content text fields (notes, raw_transcription, quote, description) must include `dir="auto"` so that mixed-direction content (e.g., Ottoman Turkish, Arabic, or Hebrew primary source excerpts common in early modern German history) renders correctly without layout breakage. This is a per-field attribute, not a page-level setting.

**Screen reader behavior:**

- Form uses `<form>` element with `aria-label="Create person"` or `"Edit person"`.
- FieldGroups use `<fieldset>` and `<legend>` for grouping (date fields, name variants).
- Validation errors are linked to fields via `aria-describedby` pointing to the error message element.
- Error messages are wrapped in a `role="alert"` container that is populated on validation failure (triggering screen reader announcement).
- Required fields use `aria-required="true"`.
- CertaintySelector uses `role="radiogroup"` with `role="radio"` on each option, `aria-checked` for active state.

**Error states:**

- Field-level validation (Zod): Error message appears below the field in `text-xs text-destructive`. The field's border changes to `border-destructive`.
- Form-level validation (server): Error alert appears at the top of the form with a summary. Each error links to the offending field (focus moves on click).
- Submission failure (network): Toast error "Could not save. Your changes are preserved." The form state is not reset. A "Try again" button appears in the form footer alongside the original submit button.
- Concurrent edit conflict (future): Warning alert "This record was modified by {user} at {time}. Review changes before saving." Show a diff view.

**Loading states:**

- Form submission: The submit button shows a spinner icon and becomes disabled. Label changes to "Saving..." The rest of the form remains visible but inputs become `disabled`.
- Initial data load (edit mode): Form skeleton with pulse bars matching the field layout.

### 3.4 Relation Creation Interactions (RelationFormDialog)

**Pattern:** Modal dialog with contextual pre-fill, entity search, and optional inline evidence.

**Keyboard interaction model:**

- Dialog opens with focus on the first interactive element (RelationTypeSelector or entity search, depending on pre-fill state).
- `Tab` cycles through: relation type, from-entity, to-entity, certainty, notes, temporal validity toggle, evidence toggle, action buttons.
- `Escape` closes the dialog (with confirmation if form is dirty).
- EntitySelector within the dialog: `ArrowDown` opens the combobox dropdown, typing filters results, `Enter` selects.
- Evidence section: collapsible via `Enter` or `Space` on the toggle. When expanded, `Tab` moves into evidence fields.

**Screen reader behavior:**

- Dialog uses `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the dialog title.
- EntitySelector uses `role="combobox"` with `aria-expanded`, `aria-controls`, and `aria-activedescendant` per WAI-ARIA Combobox pattern.
- When evidence section expands, `aria-expanded="true"` is set on the toggle button.

**Optimistic UI:**

- On successful submission, the dialog closes immediately and the relation appears in the RelationsTab list. A Sonner toast confirms: "Relation created." with an "Undo" action.
- If the server request fails, the relation is removed from the list and a toast error appears: "Could not create relation. Try again." with a "Retry" action that re-opens the dialog with the previous form state preserved.

### 3.5 Evidence Annotation Interactions (PropertyEvidenceBadge / Panel)

**Pattern:** Click-to-expand popover on entity detail fields showing evidence citations and an inline add form.

**Keyboard interaction model:**

- Evidence badge is a `<button>` in the tab order.
- `Enter` or `Space` opens the popover.
- `Escape` closes the popover and returns focus to the badge button.
- Within the popover, `Tab` moves through: existing evidence items (each with edit/delete actions), then the "Add evidence" form fields (source selector, page reference, quote, transcription, certainty), then the save button.
- Source selector within the popover uses the same combobox keyboard model as EntitySelector.

**Screen reader behavior:**

- Badge button: `aria-haspopup="dialog"`, `aria-expanded="true/false"`.
- Popover: `role="dialog"`, `aria-label="Evidence for {field name}"`.
- Evidence list within popover: `role="list"` with `role="listitem"` for each entry.
- When evidence is added, a live region announces: "Evidence added. {field name} now has {count} citations."

**Error states:**

- Source not found in search: "No matching source. Create a new source first." (In the future, inline source creation will be available from this context -- Research Journey 4.1, step 9.)
- Save failure: Inline error below the form within the popover. Form state preserved.

### 3.6 Bulk Operations

**Pattern:** Multi-select via checkboxes in DataTable, action toolbar appears on selection.

**Interaction sequence:**

1. User selects rows via checkbox clicks or `Shift+Click` for range selection.
2. A floating toolbar appears at the bottom of the viewport (or above the table on mobile): "{n} selected -- Delete | Export (future) | Clear selection".
3. "Delete" opens BulkDeleteDialog (AlertDialog pattern).
4. Confirmation text: "Delete {n} {entity type}? This action can be undone within 30 days." (Soft-delete is recoverable.)
5. On confirmation, selected rows are removed from the table with a fade-out animation and a toast: "{n} {entity type} deleted. Undo."

**Keyboard:** `Cmd+A` / `Ctrl+A` selects all visible rows. `Escape` clears selection. `Delete` or `Backspace` with selection active opens the bulk delete dialog.

### 3.7 Undo/Redo Strategy

**Scope:** Undo is available for single-step operations via Sonner toasts. No multi-step undo stack.

| Action                       | Undo mechanism                                   | Time window |
| ---------------------------- | ------------------------------------------------ | ----------- |
| Certainty change             | Toast with "Undo" button; reverts server-side    | 5 seconds   |
| Relation created             | Toast with "Undo"; deletes the relation          | 5 seconds   |
| Evidence added               | Toast with "Undo"; deletes the evidence entry    | 5 seconds   |
| Entity soft-deleted (single) | Toast with "Undo"; restores `deleted_at` to null | 8 seconds   |
| Bulk soft-delete             | Toast with "Undo"; restores all deleted entities | 8 seconds   |
| Entity edited (form save)    | No undo toast; user navigates back to edit page  | --          |
| Entity created               | No undo; user deletes manually if needed         | --          |

**Implementation:** The undo toast uses Sonner's `action` callback. The callback sends a compensating server action (e.g., `restoreEntity` or `deleteRelation`). If the undo window expires, the toast auto-dismisses and the action is final.

### 3.8 Certainty Visual Encoding Constraints

**Purpose:** Define constraints that prevent accessibility failures in the certainty visualization system. The brand strategist and UI designer must work within these bounds. Exact color values are deferred to the brand strategy phase; this section defines the structural requirements.

**Rationale:** Research Principle 3.1 establishes that certainty is Evidoxa's core differentiator. Prof. Engel uses progressive lenses (Research 2.1). Red-green color blindness affects approximately 8% of men (relevant for Lukas and male collaborators). Certainty must be unambiguous under all viewing conditions.

#### The Five Certainty Levels

Evidoxa uses five certainty levels (four explicit states plus the absence-of-evidence state). Each level has a semantic token name that downstream documents must reference instead of raw color values.

| Level       | Semantic token            | Meaning                                               | Visual channels required                           | ARIA label             |
| ----------- | ------------------------- | ----------------------------------------------------- | -------------------------------------------------- | ---------------------- |
| Certain     | `--certainty-certain`     | Confirmed by strong primary evidence                  | Color + filled circle icon + text label            | "Certainty: Certain"   |
| Probable    | `--certainty-probable`    | Supported by evidence but not conclusive              | Color + three-quarter circle icon + text label     | "Certainty: Probable"  |
| Possible    | `--certainty-possible`    | Plausible but weakly evidenced                        | Color + half circle icon + text label              | "Certainty: Possible"  |
| Unknown     | `--certainty-unknown`     | No evidence or insufficient evidence to assess        | Color + empty circle icon (ring only) + text label | "Certainty: Unknown"   |
| Unevidenced | `--certainty-unevidenced` | A claim exists but zero evidence entries are attached | Color + dashed circle icon + text label            | "No evidence attached" |

#### Encoding Rules

1. **Dual-channel minimum:** Certainty must NEVER rely on color alone. Every certainty indicator must use at minimum two visual channels: color AND a distinct icon shape. The icon shapes above (filled circle, three-quarter, half, ring, dashed ring) are the canonical set. They form a visual progression from "full" to "empty" that remains distinguishable in grayscale.

2. **Color direction:** The palette must progress from a "confident" hue (cool or neutral) to an "attention-seeking" hue for Unknown/Unevidenced. Specifically:
   - A green-to-red spectrum is EXCLUDED because it fails under protanopia and deuteranopia.
   - Recommended direction: blue/teal (Certain) to amber/gold (Unknown) to a desaturated warm tone (Unevidenced). The brand strategist may choose alternative hues provided the contrast and simulation requirements below are met.

3. **Contrast requirements:** Every certainty indicator (icon + optional background chip) must achieve a minimum 3:1 contrast ratio against its background surface in both light and dark modes. This applies to the icon fill color against `--background`, `--card`, and `--muted` surfaces.

4. **Color-blindness simulation:** The final palette must be tested under protanopia, deuteranopia, and tritanopia simulation (tools: Stark, Color Oracle, or Chrome DevTools). All five levels must remain visually distinguishable -- meaning a user cannot confuse any two levels based on color alone, because the icon shape disambiguates.

5. **Unknown as attention-seeking:** The "Unknown" state must NOT be visually neutral or invisible. Per Research Principle 3.1, "the absence of evidence should feel like a gap." Unknown should draw mild attention (warm hue, visible ring icon) while Unevidenced should draw strong attention (dashed outline, cautionary tone). This ensures scholars notice when they have made a claim without supporting it.

6. **Compact rendering:** In contexts where space is limited (DataTable cells, tab badges), certainty may render as icon-only (no text label). In this case, the icon must be at least 16x16px and the tooltip must provide the text label. The `aria-label` is always present regardless of visual rendering mode.

### 3.9 Claim Without Evidence Warning Pattern

**Purpose:** Define a single canonical pattern for warning users when a field carries a certainty claim but has zero evidence entries attached. This is referenced by Principle 1, Research Principle 3.1, and Research Journey 4.2 Phase 3.

#### Trigger Conditions

The warning activates when ALL of the following are true:

- The field has a certainty value of Certain, Probable, or Possible (NOT Unknown).
- The field has zero PropertyEvidence entries linked to it.
- The entity is in "view" mode (detail page), not "edit" mode (form page -- where the user is actively working).

The warning does NOT activate for:

- Fields with certainty "Unknown" and zero evidence (this is the expected default state -- there is nothing to warn about).
- Fields that do not participate in the certainty system (e.g., notes, description).

#### Visual Treatment

**Position:** The warning renders on the PropertyEvidenceBadge itself, replacing the normal badge appearance. It is co-located with the field value, not in a separate location.

**Icon:** The Unevidenced dashed-circle icon (from Section 3.8) rendered at 16x16px, using the `--certainty-unevidenced` color token.

**Badge style:** The badge switches from its normal `bg-muted text-muted-foreground` to `bg-warning/10 text-warning border border-dashed border-warning`. The exact `--warning` token value is defined in the brand strategy phase but must be in the amber/gold family per Section 3.8.

**Text:** The badge shows "0" (the evidence count) with the dashed-circle icon. No additional tooltip text is needed beyond the standard evidence badge tooltip pattern: "No evidence for {field name}. Click to add."

**No banner or toast:** The warning is purely a badge-level visual change. It does not produce a banner, toast, or page-level alert. The rationale is that multiple fields may trigger the warning simultaneously (e.g., a newly created person with certainty set but no evidence yet), and per-field banners would be overwhelming.

#### Screen Reader Announcement

The badge's `aria-label` changes from "Evidence for {field name}, 0 citations" to: "Warning: {field name} is marked {certainty level} but has no evidence. Activate to add evidence."

This uses the existing `aria-live="polite"` region on the PropertyEvidenceBadge (Section 6.3). The warning label is set on initial page render -- it is not a dynamic announcement (which would be disruptive if five fields all triggered simultaneously).

#### Dismiss Behavior

The warning cannot be manually dismissed. It resolves automatically when:

- The user adds at least one PropertyEvidence entry to the field, OR
- The user changes the field's certainty to "Unknown" (via inline edit or the edit form).

There is no "acknowledge" or "ignore" action. The warning is informational, not blocking.

#### Interaction with Inline Editing

When a user changes a field's certainty via inline editing (Section 5.3):

- If the new certainty is Certain/Probable/Possible AND evidence count is 0, the warning badge appears immediately after the inline edit saves.
- A Sonner toast provides a nudge: "Certainty set to {level}. Add evidence?" with an action button that opens the PropertyEvidencePanel for that field. This toast appears only for certainty changes (not on page load), and only when the change creates a new warning state.
- If evidence already exists, no nudge toast appears.

### 3.10 Network Resilience Strategy

**Purpose:** Define how the application behaves under degraded or absent network connectivity. This is critical because the primary persona (Lukas) works in archives where connectivity may be unreliable (Research 2.2, Research 5.5 Obsidian analysis), and Prof. Engel uses institutional networks that may have restrictive proxies.

**Scope decision:** Full offline mode (local-first with sync) is deferred to Phase 4+. The architecture defined here covers online and degraded-network states. The design decisions below do not preclude a future local-first migration -- specifically, all write operations use discrete server actions (not long-lived WebSocket connections), making them compatible with a future offline queue.

#### Network States

| State    | Detection method                                                                                    | User signal                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Online   | `navigator.onLine === true` AND last server response within 30 seconds                              | No indicator (normal state)                                                                                                                                                        |
| Degraded | `navigator.onLine === true` BUT a server request has timed out or failed within the last 60 seconds | Amber status dot in TopBar, next to the user avatar. Tooltip: "Connection unstable. Some actions may be slow."                                                                     |
| Offline  | `navigator.onLine === false` OR three consecutive request failures within 60 seconds                | Persistent banner below TopBar: "You are offline. Changes cannot be saved until your connection is restored." Banner uses `bg-destructive/10 text-destructive border-destructive`. |

**Detection implementation:** A `useNetworkStatus` hook monitors `navigator.onLine`, the `online`/`offline` window events, and wraps all server action calls to track failure counts and response times. The hook exposes `status: "online" | "degraded" | "offline"` and `lastSuccessfulRequest: Date`.

#### Behavior by Action Type

| Action type                        | Online behavior                                         | Degraded behavior                                                                                                                                                                     | Offline behavior                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page navigation / data read**    | Normal server fetch                                     | Normal fetch; if timeout (8s), show inline error card with retry button. Stale data from React cache is shown if available.                                                           | Show last-rendered content if still in memory (React cache). If no cache, show error card: "This page is not available offline."                                        |
| **Form submit (create/edit)**      | Optimistic redirect on submit; server action executes   | Same as online. If server action fails, form state is preserved (not cleared). Toast: "Save failed. Your changes are preserved. Try again." with a "Retry" button in the form footer. | Submit button is disabled. Tooltip: "Cannot save while offline." Form state is preserved in component state. An "unsaved changes" indicator appears in the page header. |
| **Inline edit (certainty, notes)** | Optimistic UI update + server action                    | Optimistic UI update. If server action fails within 5s, the edit reverts and a toast shows: "Change could not be saved. Try again." The field returns to its previous value.          | Inline edit controls are disabled. A lock icon replaces the edit affordance.                                                                                            |
| **Relation create (dialog)**       | Optimistic list update + server action                  | Same as online. If fails, relation is removed from list and dialog re-opens with state preserved (existing Section 3.4 pattern).                                                      | "New Relation" button is disabled with tooltip: "Cannot create relations while offline."                                                                                |
| **Bulk delete**                    | Confirmation dialog -> server action -> toast with undo | Same as online. If server action fails, deleted rows reappear in the table. Toast: "Delete failed. Items have been restored."                                                         | Bulk delete button is disabled.                                                                                                                                         |
| **Evidence add**                   | Optimistic badge update + server action                 | Same as online. If fails, badge count reverts. Toast: "Evidence could not be saved. Try again." Form state preserved in popover.                                                      | Evidence "Save" button disabled. Form remains open with content preserved.                                                                                              |

#### Retry Pattern

When a server action fails (regardless of network state):

1. **Immediate feedback:** A Sonner toast appears within 500ms of failure detection. The toast is `variant="error"` with a "Retry" action button.
2. **Retry action:** Clicking "Retry" re-executes the exact same server action with the same payload. No form re-entry required.
3. **Timeout:** Server actions have an 8-second timeout. If the server does not respond within 8 seconds, the action is treated as failed.
4. **No automatic retry:** The application does not automatically retry failed actions. The user must explicitly trigger a retry. Rationale: automatic retries risk duplicate writes (especially for create operations), and the user should remain in control.
5. **Toast persistence:** Error toasts with retry actions remain visible for 15 seconds (longer than the standard 5-second undo toasts) to give users time to notice and act.

#### Data Loss Prevention

1. **Unsaved changes warning:** All form pages (create and edit) register a `beforeunload` event listener when the form is dirty (any field has been modified from its initial value). The browser's native "Leave page?" dialog is triggered on navigation away. Additionally, Next.js route changes are intercepted via `router.events` (or a `useBlocker`-style hook) to show a custom confirmation dialog: "You have unsaved changes. Leave without saving?"

2. **Form draft persistence:** For long forms (SourceForm with archival reference fields, PersonForm with multiple name variants), form state is periodically saved to `localStorage` every 30 seconds while the form is dirty. The key format is `draft:{entityType}:{entityId|"new"}`. On returning to the form, if a draft exists that is newer than the server data, a banner appears: "You have an unsaved draft from {timestamp}. Restore draft? | Discard." Drafts are deleted on successful form submission.

3. **Evidence popover state:** If the user has typed content into the evidence add form (quote, transcription) and clicks outside the popover or presses Escape, a confirmation micro-dialog appears: "Discard unsaved evidence?" with "Discard" and "Keep editing" buttons. This prevents accidental loss of transcription text, which may be lengthy.

4. **Auto-save intervals:** Inline edits save immediately (no interval). Form drafts save every 30 seconds to localStorage. There is no server-side auto-save for forms -- the user must explicitly submit. Rationale: scholarly data entry often involves partial or tentative entries that the user does not want committed until reviewed.

---

## 4. Layout System

### 4.1 Page Layout Templates

Five canonical page templates cover the entire application.

#### Template 1: Entity List Page

```
+--------------------------------------------------+
| PageHeader                                        |
|   h1: "Persons"              [+ New Person]       |
+--------------------------------------------------+
| FilterBar (optional)                              |
|   [Search input]  [Type filter]  [Date range]     |
+--------------------------------------------------+
| FilterChips (when filters active)                 |
|   [Type: Letter x]  [Reliability: HIGH x]  Clear  |
+--------------------------------------------------+
| DataTable                                         |
|   [x] | Name          | Birth | Death | Certainty|
|   [ ] | Johann Dalberg | 1455  | 1503  | Certain  |
|   ...                                             |
+--------------------------------------------------+
| DataTablePagination                               |
|   < Prev   Page 1 of 12   Next >                 |
+--------------------------------------------------+
```

Used by: `/persons`, `/events`, `/sources`, `/relations`

#### Template 2: Entity Detail Page

```
+--------------------------------------------------+
| PageHeader                                        |
|   h1: "Johann von Dalberg"    [Edit] [Delete]     |
|   Breadcrumb: Persons > Johann von Dalberg        |
+--------------------------------------------------+
| AttributesCard                                    |
|   Birth: 1455 (Certain) [E:2]  | Death: 1503 ... |
|   Notes: "Bishop of Worms..."                     |
+--------------------------------------------------+
| TabBar                                            |
|   [Attributes(6)] [Names(3)] [Events(5)] ...      |
+--------------------------------------------------+
| TabContent                                        |
|   (depends on active tab)                         |
+--------------------------------------------------+
```

Used by: `/persons/[id]`, `/events/[id]`, `/sources/[id]`

On wide screens (>=1280px), consider a two-column variant where the AttributesCard occupies the left column and the tabbed panel occupies the right column, reducing vertical scrolling for data-dense entities (Research Principle 3.7).

#### Template 3: Entity Form Page

```
+--------------------------------------------------+
| PageHeader                                        |
|   h1: "New Person"                                |
|   Breadcrumb: Persons > New Person                |
+--------------------------------------------------+
| FormCard                                          |
|   FieldGroup: Basic Information                   |
|     [First Name] [Last Name]                      |
|     [Notes textarea]                              |
|   FieldGroup: Birth Date                          |
|     [Year] [Month] [Day] [Certainty: O O O O]    |
|   FieldGroup: Death Date                          |
|     [Year] [Month] [Day] [Certainty: O O O O]    |
|   FieldGroup: Name Variants (collapsible)         |
|     [+ Add variant]                               |
|   FormFooter                                      |
|     [Cancel]              [Create Person]         |
+--------------------------------------------------+
```

Used by: `/persons/new`, `/persons/[id]/edit`, `/events/new`, `/events/[id]/edit`, `/sources/new`, `/sources/[id]/edit`

#### Template 4: Dashboard Page

```
+--------------------------------------------------+
| PageHeader                                        |
|   h1: "Dashboard"                                 |
+--------------------------------------------------+
| StatCards (row of 3-4 summary cards)              |
|   [Persons: 47] [Events: 23] [Sources: 31] ...   |
+--------------------------------------------------+
| Two-column layout                                 |
|   RecentActivity feed  |  QuickActions panel      |
|   (scrollable list)    |  [+ New Person]           |
|                        |  [+ New Source]            |
|                        |  [+ New Relation]          |
+--------------------------------------------------+
| DataQuality cards (future)                        |
|   [Unlinked entities: 5] [Missing evidence: 12]   |
+--------------------------------------------------+
```

Used by: `/dashboard`. StatCards and activity feed are placeholder-ready containers whose content will be populated in Epic 4.4. The layout is established now.

#### Template 5: Settings Page

```
+--------------------------------------------------+
| PageHeader                                        |
|   h1: "Event Types"                               |
|   Breadcrumb: Settings > Event Types              |
+--------------------------------------------------+
| InlineEditTable                                   |
|   [Color] | Name       | [Edit] [Delete]         |
|   [#3B82] | Battle     | [...]  [...]            |
|   [#EF44] | Marriage   | [...]  [...]            |
|   [+ Add Event Type]                              |
+--------------------------------------------------+
```

Used by: `/settings/event-types`, `/settings/relation-types`

### 4.2 Responsive Strategy

#### Breakpoints

| Name    | Width            | Layout behavior                                                                                                                              |
| ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile  | < 768px          | Single column. Sidebar becomes overlay drawer. TopBar hamburger button. Tables switch to card-stack layout. Forms go full-width.             |
| Tablet  | 768px -- 1023px  | Single column with wider content area. Sidebar is overlay drawer (not persistent). Tables remain tabular but may hide non-essential columns. |
| Desktop | 1024px -- 1279px | Two-column with persistent sidebar (collapsed by default, expandable). Full table columns.                                                   |
| Wide    | >= 1280px        | Two-column with persistent sidebar (expanded by default). Entity detail pages may use side-by-side AttributesCard + TabPanel layout.         |

#### Reflow Rules

1. **Sidebar:** Persistent on desktop+. Overlay on mobile/tablet. Toggle state persisted in localStorage (existing `useSidebar` hook).
2. **DataTable:** On mobile, each table row becomes a stacked card with label-value pairs. Column visibility is automatically reduced: only the primary identifier column and one metadata column are shown. The full table is available via horizontal scroll as a secondary option.
3. **Entity forms:** Fields stack vertically on mobile. On desktop, date field groups (year + month + day + certainty) remain on a single row.
4. **Detail page AttributesCard:** Two-column `<dl>` grid on desktop (`grid-cols-2`), single-column on mobile (`grid-cols-1`). This matches the existing implementation.
5. **Dialog widths:** `max-w-lg` on desktop. Full-width minus 16px margin on mobile.
6. **TopBar:** Height remains `h-14` at all breakpoints. On mobile, breadcrumbs move below the TopBar into the page header area.

#### Content Density Options

Three density levels, selectable from a user preference control (accessible via the command palette or a density toggle in the DataTable toolbar).

| Level       | Row height     | Font size                         | Spacing                                    | Use case                                                                     |
| ----------- | -------------- | --------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Compact     | 36px           | text-sm (14px)                    | `gap-2`, `p-3` page container, `space-y-3` | Power users in extended data entry. Max information per screen.              |
| Comfortable | 44px (default) | text-sm (14px) body, 16px content | `gap-4`, `p-6` page container, `space-y-6` | Default for most users. Matches current spacing.                             |
| Spacious    | 52px           | text-base (16px)                  | `gap-6`, `p-8` page container, `space-y-8` | Users with vision needs (Prof. Engel's progressive lenses). Reduced density. |

Density preference is stored in localStorage and applied as a CSS class on `<body>`: `density-compact`, `density-comfortable` (default, no class), `density-spacious`. CSS custom properties adjust the spacing scale accordingly.

### 4.3 Panel and Sidebar Patterns

#### Evidence Panel (PropertyEvidencePanel)

Currently implemented as a Popover. For fields that require substantial evidence entry (quotes and transcriptions), the popover may be too constrained.

**Proposed enhancement:** A resizable side panel (slide-in from the right) as an alternative to the popover for evidence entry on screens >= 1024px. The panel overlays the tab content area without obscuring the entity detail card, maintaining context. On narrower screens, the popover pattern is retained.

- Panel width: 400px default, resizable to 600px max.
- Panel content: Evidence list + add form.
- Dismissal: Click outside, Escape key, or explicit close button.
- Focus: Trapped within the panel while open.

#### Sidebar (Existing)

Width tokens to be defined as CSS custom properties, replacing the inline-style fragility (codebase Finding 10):

```css
@theme {
  --sidebar-width-open: 14rem; /* 224px */
  --sidebar-width-collapsed: 3rem; /* 48px */
}
```

The AppShell main area uses `padding-left: var(--sidebar-width-open)` or `var(--sidebar-width-collapsed)` based on state, driven by a CSS class toggle rather than inline style.

Sidebar transition: `transition: width 200ms ease-out` on the aside element, `transition: padding-left 200ms ease-out` on the main element. Both respect `prefers-reduced-motion` (see Section 6.6).

### 4.4 Mobile and Tablet Experience

**Purpose:** Define how the application adapts for tablet and mobile use cases. This is not a theoretical concern -- Prof. Engel uses an iPad at conferences and archives (Research 2.1), and Lukas uses a smartphone and archive reading room PCs with varying screen sizes (Research 2.2).

#### Tablet Workflow: Archive-Based Data Entry (768px -- 1023px)

The Archivist persona's primary tablet use case is reviewing and entering data while physically in an archive, with a source document visible alongside the application. The tablet layout must optimize for this context.

**Sidebar behavior at tablet breakpoint:**

- The sidebar is hidden by default (overlay drawer mode, same as mobile).
- A persistent bottom tab bar replaces the sidebar as the primary navigation surface. It contains the five main navigation items (Dashboard, Persons, Events, Sources, Relations) as icon-only tabs with labels below each icon. This avoids requiring the user to open a drawer for every navigation action.
- The bottom tab bar height is 64px. Active tab uses `text-accent-foreground` with a 2px top border indicator.
- Settings pages are accessible via the hamburger menu (overlay drawer) but not the bottom tab bar, as they are infrequently accessed.

**DataTable adaptation at tablet breakpoint:**

- Tables remain tabular (not card-stack) at 768px+. Columns are prioritized:
  - Priority 1 (always visible): Primary identifier (name/title), primary action column (checkbox).
  - Priority 2 (visible at 768px+): One date column, certainty indicator.
  - Priority 3 (hidden below 1024px, available via horizontal scroll or column toggle): Secondary dates, notes preview, evidence count.
- Row height increases to 48px minimum (from the default 44px) to accommodate touch targets.
- The "select all" checkbox and bulk action toolbar remain functional.

**Entity detail page tab reflow at tablet breakpoint:**

- The tab bar switches from a horizontal scrollable row to a horizontally scrollable pill-style strip. Tabs that overflow the viewport width are accessible by swiping left/right.
- Tab triggers are sized at minimum 44x44px touch targets (see touch target rules below).
- The AttributesCard remains single-column (`grid-cols-1`).
- The evidence side panel (Section 4.3) is not available at tablet width. Evidence interaction uses the popover pattern exclusively.

**Entity form layout at tablet breakpoint:**

- Forms use a two-column layout for short fields (first name + last name side by side, year + month + day on one row) but stack long fields (notes textarea, description) to full width.
- FieldGroup headers span full width. The collapsible toggle area is sized at 44x44px minimum.
- The form footer (Cancel + Submit buttons) sticks to the bottom of the viewport as a fixed bar, ensuring the submit action is always reachable without scrolling.

#### Touch Target Requirements

Per WCAG 2.5.5 (Target Size Enhanced, AAA) and practical usability on touch devices, the following minimum sizes apply to ALL interactive elements when rendered on a touch device (detected via `pointer: coarse` media query or viewport width < 1024px):

| Element type                              | Minimum touch target | Implementation                                                                                                                             |
| ----------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Buttons (all variants)                    | 44x44px              | `min-h-11 min-w-11` (Tailwind). If the visual button is smaller, padding expands the tap area.                                             |
| Checkbox (DataTable row select)           | 44x44px              | The tap target includes the cell padding around the checkbox, not just the 16x16px checkbox itself.                                        |
| Tab triggers                              | 44x44px              | `min-h-11 px-4` on each tab trigger.                                                                                                       |
| Evidence badges (PropertyEvidenceBadge)   | 44x44px              | Badge visual remains compact (24x24px) but a transparent tap-area extension of 44x44px is applied via `::after` pseudo-element or padding. |
| Dropdown/select triggers                  | 44x44px height       | Full-width select with 44px height.                                                                                                        |
| CertaintySelector radio buttons           | 44x44px per option   | Each certainty option in the radiogroup is at least 44x44px.                                                                               |
| Pagination controls (prev/next)           | 44x44px              | Icon buttons with 44px min dimension.                                                                                                      |
| Sidebar nav items (in drawer)             | 48x44px minimum      | Full-width items with 48px height.                                                                                                         |
| Close/dismiss buttons (dialogs, popovers) | 44x44px              | Including the "X" close button on dialogs.                                                                                                 |

**Implementation strategy:** A `@media (pointer: coarse)` block in `globals.css` increases minimum sizes for all interactive elements. This targets touch devices without affecting mouse/trackpad users on desktop. As a fallback, the `< 1024px` breakpoint also applies these sizes.

#### Mobile Navigation Pattern (< 768px)

On mobile, entity-to-entity navigation is the primary challenge. Users cannot rely on the sidebar being visible.

**Bottom tab bar:** Same as tablet (see above), but with the addition of a central "+" FAB (Floating Action Button) that opens a quick-create menu. The menu offers: New Person, New Event, New Source. This provides the most common creation actions without navigating to a list page first.

**Entity detail page navigation:**

- The page header includes a "Back" button (left arrow) that returns to the entity list. This supplements the breadcrumb (which is hidden on mobile to save vertical space).
- Within an entity's tabs, the Relations tab shows related entities as tappable cards. Tapping a related entity navigates to its detail page. A "Back" button on that page returns to the previous entity (browser history stack).
- The command palette (`Cmd+K`) remains the fastest cross-entity navigation method. On mobile, the palette trigger is a search icon in the TopBar.

**Card-stack DataTable on mobile (< 768px):**
Each entity renders as a card with the following structure:

```
+----------------------------------------------+
| [Checkbox]  Johann von Dalberg          [>]  |
|             Birth: 1455  Certainty: Certain   |
+----------------------------------------------+
```

- Card height: auto (content-dependent) with minimum 64px.
- The entire card is tappable (navigates to detail). The checkbox has its own 44x44px tap target in the left region.
- Swipe-left on a card reveals a "Delete" action (red background). This is a convenience gesture, not the only delete path.
- Cards have 8px vertical spacing between them.

#### Form Input Adaptations for Touch

- **Date inputs:** On touch devices (`pointer: coarse`), the PartialDateInput year/month/day fields use `inputmode="numeric"` to trigger the numeric keyboard. Month and day fields also offer a native picker as an alternative (a small calendar icon that opens the platform's native date picker). The custom PartialDateInput remains the primary input for historians who enter partial dates (year-only), but native pickers are available for complete dates.
- **Textarea fields:** Notes and transcription textareas have a minimum height of 120px on touch devices (vs. 80px on desktop) to reduce the need for scrolling within the field.
- **Combobox/EntitySelector:** On touch devices, the dropdown list items are spaced at 44px height with 8px padding. The search input within the combobox is 44px tall.
- **CertaintySelector:** The four radio options render as a horizontal strip of 44x44px touch targets with clear visual separation (2px gap).

#### Tablet-Specific Two-Column Detail Layout (~768px)

At the tablet breakpoint, entity detail pages can use a modified two-column layout when the device is in landscape orientation (detected via `orientation: landscape` media query AND `min-width: 768px`):

```
+---------------------------+---------------------+
| AttributesCard            | TabBar              |
|   Birth: 1455 (Certain)   |   [Rel] [Ev] [Act] |
|   Death: 1503 (Probable)  +---------------------+
|   Notes: "Bishop..."      | TabContent          |
|                           |   (scrollable)      |
+---------------------------+---------------------+
```

- Left column: 45% width, fixed (does not scroll independently).
- Right column: 55% width, scrollable tab content.
- In portrait orientation, the layout reverts to single-column stacked (AttributesCard above TabBar above TabContent).

This layout serves Prof. Engel's iPad use case: she can see the entity's key attributes while browsing relations or evidence in the adjacent panel.

---

## 5. Workflow Optimization

### 5.1 Top 5 Most Frequent Tasks

Ranked by frequency based on persona analysis.

#### Task 1: Create Person with Evidence (Lukas, post-archive session)

**Current path:** Sidebar "Persons" (click) -> "New Person" button (click) -> Fill form (type) -> "Create" (click) -> Detail page loads -> Evidence badge (click) -> Source search (type) -> Fill evidence (type) -> "Save" (click).

**Step count:** 9 interactions, 3 page navigations.

**Optimized path with shortcuts:**

1. `Cmd+K` -> type "np" -> select "New Person" (3 keystrokes + Enter)
2. Fill form with Tab-through (keyboard only)
3. `Cmd+Enter` to submit (saves and navigates to detail)
4. `Cmd+E` opens evidence panel for the first unevidenced field
5. Fill evidence with Tab-through
6. `Cmd+Enter` to save evidence

**Optimized step count:** 6 interactions, 2 page navigations. Net savings: 33%.

**Quick-create variant:** A "Quick Person" mode accessible from the command palette that shows a minimal form (first name, last name, birth year, certainty) in a dialog without leaving the current page. Saves and returns focus. Full details can be added later.

#### Task 2: Create Relation Between Entities (Lukas/Prof. Engel)

**Current path:** Navigate to entity detail -> "Relations" tab (click) -> "New Relation" button (click) -> Fill RelationFormDialog -> "Save" (click).

**Optimized path:**

1. On any entity detail page, press `R` to open RelationFormDialog with current entity pre-filled.
2. Tab to RelationTypeSelector, type to filter.
3. Tab to EntitySelector, type to search target entity.
4. `Cmd+Enter` to save.

**Optimized step count:** 4 interactions, 0 page navigations.

#### Task 3: Search and Navigate to Entity (all personas)

**Current path:** Sidebar click -> List page loads -> Search field (click) -> Type query -> Wait for results -> Click row.

**Optimized path:**

1. `Cmd+K` -> Type entity name (any entity type) -> `Enter` on result.

**Optimized step count:** 3 interactions, 1 page navigation. Net savings: 50%.

#### Task 4: Review Entity Evidence Status (Prof. Engel)

**Current path:** Navigate to entity detail -> Scan attributes card for evidence badges -> Click each badge individually to check quality.

**Optimized path:**

1. Navigate to entity detail (via `Cmd+K`).
2. An evidence coverage summary is visible at the top of the AttributesCard: "4/6 fields evidenced" with a visual progress indicator.
3. Unevidenced fields are highlighted with the warning badge style (Principle 1).
4. `Cmd+E` opens a sequential evidence review mode that cycles through unevidenced fields.

**Optimized step count:** 2 interactions to assess overall status (was 6+).

#### Task 5: Bulk Source Creation from Archive Visit (Lukas/Dr. Mertens)

**Current path:** Navigate to sources -> "New Source" -> Fill form -> Save -> Navigate back to sources -> "New Source" -> Fill form (re-entering shared fields like archive name) -> Save -> Repeat.

**Optimized path:**

1. Navigate to `/sources/new`.
2. Fill form including archive reference fields.
3. "Save and Create Another" button (alongside "Save"): saves the current source and reloads the form with archive reference fields pre-filled (carry-forward of common fields).
4. User only fills the differing fields (title, item reference, reliability).

**Optimized step count:** Per additional source: 1 interaction + field entry (was 3 interactions + full field re-entry). Net savings: ~60% per source after the first.

### 5.2 Keyboard Shortcut Vocabulary

All shortcuts require no modifier when focus is outside a text input. Inside text inputs, modifier keys are required.

| Shortcut                   | Context                                                            | Action                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Cmd+K` / `Ctrl+K`         | Global                                                             | Open command palette                                                                                                                   |
| `Cmd+B` / `Ctrl+B`         | Global                                                             | Toggle sidebar                                                                                                                         |
| `/`                        | Outside text input                                                 | Focus search on current list page                                                                                                      |
| `N`                        | List page, outside text input                                      | Navigate to "New {Entity}"                                                                                                             |
| `E`                        | Detail page, outside text input                                    | Navigate to edit page                                                                                                                  |
| `R`                        | Detail page, outside text input                                    | Open "New Relation" dialog with current entity pre-filled                                                                              |
| `Cmd+E` / `Ctrl+E`         | Detail page                                                        | Open evidence panel for first unevidenced field                                                                                        |
| `Cmd+Enter` / `Ctrl+Enter` | Any form or dialog                                                 | Submit form                                                                                                                            |
| `Escape`                   | Dialog or popover open                                             | Close overlay, restore focus                                                                                                           |
| `Escape`                   | No overlay open                                                    | Clear current selection or search                                                                                                      |
| `Delete` / `Backspace`     | List page with selection, outside text input                       | Open bulk delete dialog                                                                                                                |
| `Cmd+Z` / `Ctrl+Z`         | After an undoable action (toast visible, focus outside text input) | Trigger undo (equivalent to clicking the toast undo button). Does NOT intercept browser-native undo when focus is inside a text input. |
| `?`                        | Outside text input                                                 | Open keyboard shortcuts help overlay                                                                                                   |

### 5.3 Inline Editing

For single-value fields on entity detail pages, double-click (or pressing `Enter` when the field value is focused) activates inline editing mode. The value becomes an editable input. `Enter` saves; `Escape` cancels.

**Eligible fields for inline editing:**

- Notes/description (textarea)
- Certainty (CertaintySelector replaces the static badge)
- Event type (combobox replaces the static text)
- Source reliability (selector replaces the static badge)

**Non-eligible fields (require full edit form):**

- Names (involves name variant list management)
- Dates (involves three sub-fields + certainty)
- Core identifiers (first_name, last_name, title)

### 5.4 Power-User Paths

**Consecutive entity creation:** After saving a new entity, a "Create Another" option persists the form with cleared identity fields but retained common fields (project_id, default certainty, archive reference for sources).

**Template-based creation (future):** Save the current form state as a named template. Apply a template when creating a new entity to pre-fill all template fields. Accessible via the command palette: `Cmd+K` -> "New Person from template: Archive Visitor".

**Quick-link from command palette:** Type an entity name in the command palette, then press `Cmd+R` to create a relation to that entity from the current detail page context without navigating away.

### 5.5 Source-First Creation Path

**Purpose:** Support the "source-first data extraction" workflow identified in Lukas's mental model (Research 2.2) and Dr. Mertens's journey (Research 4.3). In this workflow, the researcher reads a primary source and creates entities from it, rather than creating entities first and linking sources afterward. This is the second-most-important workflow for two of three personas and must have first-class architectural support.

#### Entry Point

The source-first workflow begins on a Source detail page (`/sources/[id]`). A new tab is added to the Source detail page's canonical tab order:

| Position | Tab            | Content                                                        |
| -------- | -------------- | -------------------------------------------------------------- |
| 4 (new)  | Cited Entities | Entities that have PropertyEvidence entries citing this source |

The "Cited Entities" tab shows a list of all entities (persons, events) that have at least one PropertyEvidence entry referencing this source, grouped by entity type. Each row shows: entity name, field name, certainty, and a link to the entity detail page.

At the top of the "Cited Entities" tab, a prominent action bar provides:

- "Add Person from This Source" button
- "Add Event from This Source" button

These buttons initiate the inline entity creation flow described below.

#### Inline Entity Creation from Source Context

When the user clicks "Add Person from This Source" (or "Add Event from This Source"):

1. A **dialog** opens (not a page navigation) containing a compact entity creation form. The dialog title is "New Person from {Source Title}" (truncated at 40 characters).

2. The form is a minimal version of the full entity form:
   - Person: first_name, last_name, birth_year (optional), certainty.
   - Event: title, event_type, date (optional), certainty.
   - Notes field is available but collapsed by default.

3. Below the entity fields, an **evidence pre-fill section** is visible and pre-populated:
   - Source: pre-filled and read-only (locked to the current source).
   - Page reference: empty, focused by default (this is the most likely first field the user needs to fill).
   - Quote: empty (optional).
   - Transcription: empty (optional).
   - Certainty: defaults to "Probable" (a reasonable default for source-extracted data; the user can change it).

4. On submit, the system executes two server actions atomically (or in sequence with rollback):
   - Creates the entity (Person or Event).
   - Creates a PropertyEvidence entry linking the new entity's primary field (e.g., `birth_year` for Person, `date` for Event) to the current source with the provided page reference, quote, and certainty.

5. **Post-creation behavior:** The dialog closes. The new entity appears in the "Cited Entities" tab list. A Sonner toast confirms: "Person created with evidence from {Source Title}." The toast includes two actions:
   - "View" -- navigates to the new entity's detail page.
   - "Add Another" -- re-opens the creation dialog with the source pre-filled (same as step 1).

   Focus returns to the "Cited Entities" tab. The "Add Another" pattern enables rapid data extraction from a single source without leaving the source context.

#### Evidence Pre-Population from Source Context

When creating entities from a source context, evidence fields are pre-populated as follows:

| Evidence field    | Pre-fill value                                                           | Editable?                                         |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Source            | Current source (locked)                                                  | No (read-only, visually indicated with lock icon) |
| Page reference    | Empty (focused)                                                          | Yes                                               |
| Quote             | Empty                                                                    | Yes                                               |
| Raw transcription | Empty                                                                    | Yes                                               |
| Certainty         | "Probable"                                                               | Yes                                               |
| Field reference   | Primary field of the entity type (birth_year for Person, date for Event) | Yes (dropdown to select a different field)        |

The "Field reference" dropdown allows the user to choose which field of the new entity this evidence applies to. For example, if the source mentions both a birth year and a death year for a person, the user can create one evidence entry for `birth_year` and then (after the first save) add another for `death_year` via the "Add Another" flow.

#### Navigation After Source-Context Creation

After creating an entity from a source context, the user has three navigation options:

1. **Stay on source page (default):** The dialog closes, focus returns to the "Cited Entities" tab. The user continues extracting data from the same source.
2. **View the created entity:** Click "View" in the toast. This navigates to the new entity's detail page. The breadcrumb shows `Sources > {Source Title} > {Entity Name}` (a non-standard breadcrumb that preserves the source context). The "Back" button returns to the source detail page.
3. **Add another entity from this source:** Click "Add Another" in the toast. The creation dialog re-opens immediately.

This flow ensures that the source-first researcher (Lukas's post-archive session, Dr. Mertens's source cataloging) can process a source document sequentially, creating all entities and evidence it references without losing context.

#### Command Palette Integration

The source-first workflow is also accessible from the command palette:

- `Cmd+K` -> "Add person from source" -> Source search -> Select source -> Creation dialog opens with source pre-filled.
- On a source detail page: `Cmd+K` -> "Add person from this source" (contextual action, source auto-detected).

---

## 6. Accessibility Architecture

### 6.1 Focus Management Strategy

**Page navigation:** On route change (Next.js App Router navigation), focus moves to the `<h1>` of the new page. The `<h1>` has `tabIndex={-1}` and receives programmatic focus. This ensures screen readers announce the new page context.

**Dialog open:** Focus moves to the first interactive element within the dialog (per WAI-ARIA Dialog pattern). The RelationFormDialog focuses the RelationTypeSelector. The BulkDeleteDialog focuses the cancel button (safer default for destructive actions).

**Dialog close:** Focus returns to the element that triggered the dialog (the button that opened it). This is stored in a ref before the dialog opens.

**Popover open (PropertyEvidenceBadge):** Focus moves to the first interactive element within the popover. On close, focus returns to the badge button.

**Tab switching:** When a tab trigger is activated, focus moves to the tab trigger itself (not the panel content). The user must press `Tab` to enter the panel. This prevents accidental navigation past tab content.

**Form submission success with redirect:** Focus moves to the `<h1>` of the destination page (typically the entity detail page after creation).

**Form submission error:** Focus moves to the first field with a validation error. If the error is form-level (server error), focus moves to the error summary at the top of the form.

**Bulk action toolbar appearance:** When the toolbar appears (on first row selection), a screen reader announcement fires: "{n} items selected. Bulk actions available." Focus does not move (user may still be selecting).

### 6.2 Landmark Structure

Every page in the app layout shares this landmark structure:

```html
<body>
  <a class="sr-only focus:not-sr-only" href="#main-content">Skip to main content</a>
  <a class="sr-only focus:not-sr-only" href="#sidebar-nav">Skip to navigation</a>

  <header role="banner">
    <!-- TopBar -->
    <nav aria-label="Breadcrumb">
      <!-- Breadcrumbs (when present) -->
      <ol>
        ...
      </ol>
    </nav>
    <div role="search">
      <!-- Command palette trigger area -->
      ...
    </div>
  </header>

  <aside role="navigation" aria-label="Main navigation" id="sidebar-nav">
    <!-- Sidebar -->
    <nav>
      <ul role="list">
        <li><a href="...">Dashboard</a></li>
        <li><a href="..." aria-current="page">Persons</a></li>
        ...
      </ul>
    </nav>
  </aside>

  <main id="main-content">
    <h1 tabindex="-1">...</h1>
    <!-- Page title, receives focus on navigation -->
    <!-- Page content -->
  </main>

  <div role="status" aria-live="polite"><!-- Toast notification region (Sonner) --></div>
</body>
```

**Auth layout** replaces the sidebar and topbar with a simpler structure:

```html
<body>
  <a class="sr-only focus:not-sr-only" href="#main-content">Skip to main content</a>
  <header role="banner">
    <span>Evidoxa</span>
    <nav aria-label="User preferences">
      <!-- LocaleSwitcher + ThemeToggle -->
      ...
    </nav>
  </header>
  <main id="main-content">
    <h1 tabindex="-1">...</h1>
    <!-- Auth form card -->
  </main>
</body>
```

### 6.3 Live Region Strategy

| Region                | Purpose                                  | `aria-live` | `aria-atomic` | Location                                |
| --------------------- | ---------------------------------------- | ----------- | ------------- | --------------------------------------- |
| Toast container       | Success/error/undo notifications         | `polite`    | `true`        | Root layout, Sonner container           |
| Form error summary    | Form-level validation errors             | `assertive` | `true`        | Top of each form                        |
| Field-level errors    | Individual field validation messages     | `polite`    | `true`        | Below each form field                   |
| Evidence count update | Announces when evidence is added/removed | `polite`    | `true`        | Within PropertyEvidenceBadge            |
| Bulk selection count  | Announces selection changes              | `polite`    | `true`        | Bulk action toolbar                     |
| Search result count   | Announces filtered result count          | `polite`    | `true`        | Below DataTableSearch                   |
| Loading status        | Announces when content is loading/loaded | `polite`    | `true`        | Page-level, visually hidden             |
| Network status        | Announces connectivity changes           | `assertive` | `true`        | TopBar network indicator (Section 3.10) |

**Implementation:** A shared `LiveRegion` component wraps text updates. It uses `role="status"` for polite announcements and `role="alert"` for assertive ones. Content is injected via React state changes to trigger announcements.

### 6.4 Skip Navigation

Two skip links appear at the very top of the document, visible only on focus:

1. **"Skip to main content"** -- focuses `<main id="main-content">` and scrolls to it.
2. **"Skip to navigation"** -- focuses the sidebar `<nav>` element. Useful when the user wants to navigate to a different section without tabbing through the TopBar.

**Styling:** `sr-only` by default. On `:focus`, becomes a fixed-position element at the top-left of the viewport with `bg-background text-foreground p-2 rounded-md shadow-lg z-[100]`.

### 6.5 ARIA Patterns for Custom Components

| Component                 | WAI-ARIA Pattern                           | Key ARIA attributes                                                                                                          |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| CertaintySelector         | Radiogroup                                 | `role="radiogroup"`, `aria-label="Certainty"`, each button: `role="radio"`, `aria-checked`                                   |
| EntitySelector            | Combobox with Listbox                      | `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; list: `role="listbox"`, items: `role="option"` |
| EventTypeCombobox         | Combobox with Listbox                      | Same as EntitySelector                                                                                                       |
| RelationTypeSelector      | Listbox (should replace native `<select>`) | `role="listbox"`, `aria-label="Relation type"`, options: `role="option"`, `aria-selected`                                    |
| DataTable                 | Table                                      | `role="table"`, `aria-label`, headers: `aria-sort`; rows: `aria-selected` for checked rows                                   |
| RelationFormDialog        | Dialog (modal)                             | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`                                                  |
| BulkDeleteDialog          | Alert Dialog                               | `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`                                             |
| PropertyEvidenceBadge     | Dialog trigger + Dialog                    | Badge: `aria-haspopup="dialog"`, `aria-expanded`; Popover: `role="dialog"`, `aria-label`                                     |
| Sidebar (collapsed)       | Navigation with tooltips                   | `aria-label` on each nav item; tooltip: `role="tooltip"`, trigger: `aria-describedby`                                        |
| CountBadge (on tabs)      | Supplementary description                  | Included in tab trigger's `aria-label`: "Relations, 12 items"                                                                |
| LocaleSwitcher            | Radiogroup (two options)                   | `role="radiogroup"`, `aria-label="Language"`, each: `role="radio"`, `aria-checked`                                           |
| ThemeToggle               | Button with state                          | `aria-label="Toggle theme"`, `aria-pressed` (cycles through light/dark/system)                                               |
| PasswordStrengthIndicator | Meter                                      | `role="meter"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="4"`, `aria-label="Password strength"`                  |
| ReliabilityBadge          | Status                                     | `role="status"`, `aria-label="Source reliability: High"`                                                                     |
| NetworkStatusIndicator    | Status                                     | `role="status"`, `aria-live="assertive"`, `aria-label` dynamically set to current network state description                  |

### 6.6 Reduced Motion Catalog

Every animation in the application must have a `prefers-reduced-motion: reduce` fallback. The following is the complete catalog of animations that need fallbacks.

| Animation                  | Component                                   | Normal behavior                                   | Reduced motion behavior                    |
| -------------------------- | ------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| Sidebar collapse/expand    | AppShell, Sidebar                           | `transition: width 200ms ease-out`                | Instant width change (no transition)       |
| Main content padding shift | AppShell                                    | `transition: padding-left 200ms ease-out`         | Instant padding change                     |
| Theme transition           | Root `<html>`                               | `transition: background-color 300ms, color 300ms` | Instant color change                       |
| Page transition (planned)  | App Router layout                           | Fade or slide (150ms)                             | Instant content swap                       |
| Dialog open/close          | Dialog, AlertDialog                         | Scale + fade (150ms)                              | Instant show/hide (opacity only, no scale) |
| Popover open/close         | Popover (PropertyEvidence, EntitySelector)  | Fade + slide-down (100ms)                         | Instant show/hide                          |
| Toast enter/exit           | Sonner                                      | Slide-in from bottom (200ms)                      | Instant show/hide                          |
| Skeleton pulse             | PageSkeleton, Skeleton                      | `animate-pulse` (continuous)                      | Static background, no animation            |
| Dropdown menu open         | DropdownMenu (TopBar user menu)             | Fade + scale (100ms)                              | Instant show/hide                          |
| Button hover state         | Button (all variants)                       | `transition: background-color 100ms`              | Instant color change                       |
| Focus ring appearance      | All focusable elements                      | `transition: box-shadow 100ms`                    | Instant ring appearance                    |
| ThemeToggle icon rotation  | ThemeToggle                                 | Rotate Sun/Moon icons (200ms)                     | Instant icon swap (no rotation)            |
| Tab indicator slide        | Tabs                                        | Active indicator slides between tabs (150ms)      | Instant position jump                      |
| Row selection highlight    | DataTable                                   | `transition: background-color 100ms`              | Instant background change                  |
| Relation row expand        | RelationRow                                 | Height transition (200ms)                         | Instant height change                      |
| Evidence panel slide-in    | PropertyEvidencePanel (proposed side panel) | Slide-in from right (200ms)                       | Instant appearance                         |

**Implementation:** A global CSS rule disables transitions:

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

This blanket rule is supplemented by component-specific overrides where reduced-motion behavior differs from "no animation" (e.g., the skeleton uses a static background color instead of pulse, not a 0.01ms pulse).

---

_This document defines the complete UX architecture for Evidoxa. Every pattern traces to a user need from the research document or a codebase finding from the analysis. Downstream documents (UI design, brand strategy, component specifications) should reference specific section numbers when justifying design decisions._
