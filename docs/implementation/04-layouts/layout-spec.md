# Layer 4 — Layout Patterns Specification

**Date:** 2026-04-03
**Author:** Layout Systems Engineer
**Branch:** `2-5_design_system`
**Status:** Approved — ready for implementation
**Upstream:** `docs/design-system/01-ux/architecture.md` §4, `docs/design-system/03-ui/concept.md` §§2.1, 3, `docs/design-system/04-design-system/components.md` §§15–17

---

## Table of Contents

1. [Token Reference](#1-token-reference)
2. [AppShell](#2-appshell)
3. [Sidebar](#3-sidebar)
4. [TopBar](#4-topbar)
5. [Breadcrumb](#5-breadcrumb)
6. [Bottom Tab Bar](#6-bottom-tab-bar)
7. [Page Container](#7-page-container)
8. [Breakpoints and Responsive Reflow](#8-breakpoints-and-responsive-reflow)
9. [Landmark Structure](#9-landmark-structure)
10. [Acceptance Criteria (per component)](#10-acceptance-criteria)

---

## 1. Token Reference

All layout components consume these tokens exclusively. No inline styles or raw pixel values are permitted in component code.

| Token                      | CSS Variable                        | Resolved Value                | Tailwind Class                      |
| -------------------------- | ----------------------------------- | ----------------------------- | ----------------------------------- |
| Sidebar width (open)       | `--sidebar-width-open`              | `14rem` / 224px               | `w-56`                              |
| Sidebar width (collapsed)  | `--sidebar-width-collapsed`         | `3rem` / 48px                 | `w-12`                              |
| TopBar height              | `--topbar-height`                   | `3.5rem` / 56px               | `h-14`                              |
| Content max-width          | `--content-max-width`               | `80rem` / 1280px              | `max-w-[var(--content-max-width)]`  |
| Sidebar background         | `--color-sidebar`                   | `hsl(25 8% 5.5%)`             | `bg-sidebar`                        |
| Sidebar border             | `--color-sidebar-border`            | `hsl(22 7% 18%)`              | `border-sidebar-border`             |
| Sidebar accent             | `--color-sidebar-accent`            | `hsl(170 12% 14%)`            | `bg-sidebar-accent`                 |
| Sidebar accent fg          | `--color-sidebar-accent-foreground` | `hsl(170 18% 88%)`            | `text-sidebar-accent-foreground`    |
| TopBar background          | `--color-card`                      | `hsl(36 20% 99.5%)`           | `bg-card`                           |
| Primary (active indicator) | `--color-primary`                   | `hsl(245 40% 36%)`            | `border-primary`                    |
| Motion normal              | `--duration-normal`                 | `200ms`                       | `duration-[var(--duration-normal)]` |
| Motion easing              | `--ease-move`                       | `cubic-bezier(0.65,0,0.35,1)` | applied via CSS transition          |

**Layout utility classes** (defined in `globals.css @layer utilities`):

| Class                      | CSS Output                                             | Usage                               |
| -------------------------- | ------------------------------------------------------ | ----------------------------------- |
| `.sidebar-inset`           | `padding-left: var(--sidebar-width-open)` + transition | Main content when sidebar open      |
| `.sidebar-inset-collapsed` | `padding-left: var(--sidebar-width-collapsed)`         | Main content when sidebar collapsed |
| `.topbar-inset`            | `padding-top: var(--topbar-height)`                    | Main content below TopBar           |
| `.page-container`          | `padding: 1.5rem; max-width: var(--content-max-width)` | Per-page content wrapper            |

---

## 2. AppShell

### 2.1 Purpose

`AppShell` is the top-level shell component wrapping all `(app)` layout pages. It provides the spatial frame: a fixed sidebar on the left, a fixed top bar, and a scrollable main content region.

### 2.2 Structure

```
<div.min-h-screen.bg-background>        ← Root: full viewport, background token
  <TopBar />                             ← Fixed, z-50, inset-x-0 top-0
  <Sidebar isOpen={isOpen} />            ← Fixed, z-40, left-0, below TopBar
  <main                                  ← Scrollable content region
    aria-label="Main content"            ← Accessible name for landmark
    class="topbar-inset sidebar-inset|sidebar-inset-collapsed transition-[padding-left]"
  >
    {children}
  </main>
</div>
```

### 2.3 Class Specification

| Element              | Classes                                                                                            | Notes                                            |
| -------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Root div             | `min-h-screen bg-background`                                                                       | Full-page floor                                  |
| `<main>` (open)      | `topbar-inset sidebar-inset transition-[padding-left] duration-[var(--duration-normal)]`           | CSS utility classes from globals.css             |
| `<main>` (collapsed) | `topbar-inset sidebar-inset-collapsed transition-[padding-left] duration-[var(--duration-normal)]` | Collapses padding to `--sidebar-width-collapsed` |

### 2.4 Migration from Current State

Current implementation uses `style={{ paddingLeft: isOpen ? "14rem" : "3rem" }}` — an inline style. This MUST be replaced with the `.sidebar-inset` / `.sidebar-inset-collapsed` CSS utility classes. The transition is already defined in `.sidebar-inset` in globals.css.

### 2.5 Acceptance Criteria

- AC-SHELL-01: `<main>` element is present with `role="main"` (implicit) and `aria-label="Main content"`.
- AC-SHELL-02: No inline `style` attribute with padding values on `<main>`.
- AC-SHELL-03: `<main>` uses CSS class `.sidebar-inset` when sidebar is open, `.sidebar-inset-collapsed` when collapsed.
- AC-SHELL-04: `<main>` always has `.topbar-inset` class regardless of sidebar state.
- AC-SHELL-05: Sidebar state persists across page loads via `useSidebar` / localStorage.

---

## 3. Sidebar

### 3.1 Purpose

Primary navigation surface. Always visible on desktop (>=1024px) in either expanded or collapsed state. On mobile/tablet (<1024px), hidden — Bottom Tab Bar takes over.

### 3.2 Structure

```
<aside
  aria-label="Primary navigation"        ← Required landmark name
  class="fixed left-0 bottom-0 top-[var(--topbar-height)] z-40 flex flex-col
         border-r border-sidebar-border bg-sidebar
         transition-[width] duration-[200ms] ease-[var(--ease-move)] overflow-hidden
         lg:flex hidden"                  ← Hidden on mobile; Bottom Tab Bar replaces it
>
  <nav role="navigation">
    <ul>                                  ← Primary nav group: Dashboard through Relations
      <li><a> or <span> per item </li>
    </ul>
    <Separator />
    <ul>                                  ← Settings nav group: Event Types, Relation Types
      <li><a> per item </li>
    </ul>
  </nav>
</aside>
```

### 3.3 Nav Item Specification

**Expanded state (isOpen=true):**

| Part                  | Classes                                                                                                                                                                                                                                                               | Notes                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Nav link `<a>`        | `relative flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring` | Default state                                             |
| Active link `<a>`     | above + `bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary`                                                                                                                                                                                  | Active indicator is 2px left border, not background alone |
| Icon                  | `h-5 w-5 shrink-0 aria-hidden="true"`                                                                                                                                                                                                                                 | 20px per spec                                             |
| Label `<span>`        | No `truncate` class — labels must NOT be truncated. German expansion must be accommodated.                                                                                                                                                                            | Critical: removes existing `truncate`                     |
| `aria-label`          | Always present on every `<a>` and `<span[aria-disabled]>`, even when expanded                                                                                                                                                                                         | Redundant but required by spec                            |
| `aria-current="page"` | On the active link only                                                                                                                                                                                                                                               | Required for screen readers                               |

**Collapsed state (isOpen=false):**

| Part              | Classes                                                                                                                                                                                                                                              | Notes                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Nav link `<a>`    | `relative flex items-center justify-center rounded-md p-2.5 text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring` | Centered icon only                          |
| Active link `<a>` | above + `text-primary border-l-2 border-primary`                                                                                                                                                                                                     | 2px left border still visible               |
| Icon              | 20px, centered                                                                                                                                                                                                                                       | Sole visual indicator                       |
| Label `<span>`    | NOT rendered in DOM when collapsed                                                                                                                                                                                                                   | aria-label on `<a>` is sole accessible name |
| `aria-label`      | MANDATORY — the only accessible name for screen readers                                                                                                                                                                                              | Populated with translated label             |

### 3.4 Token Correction

**Current bug:** `sidebar.tsx` line 88 uses `bg-background` on `<aside>`. This MUST be changed to `bg-sidebar`.

**Current bug:** Nav labels use `<span className="truncate">` — this violates the bilingual-ready sizing principle. Remove `truncate`.

### 3.5 Acceptance Criteria

- AC-SB-01: `<aside>` has `bg-sidebar` class (not `bg-background`).
- AC-SB-02: `<aside>` has `aria-label="Primary navigation"` (or equivalent locale-aware string).
- AC-SB-03: Active nav item has `border-l-2 border-primary` as the primary active indicator.
- AC-SB-04: Active nav item has `aria-current="page"`.
- AC-SB-05: No `truncate` class on nav item labels.
- AC-SB-06: Every `<a>` has `aria-label` attribute in both expanded and collapsed states.
- AC-SB-07: In collapsed state, label `<span>` is NOT rendered — icon only.
- AC-SB-08: Icon elements have `aria-hidden="true"`.
- AC-SB-09: Collapsed sidebar has `w-12`; expanded has `w-56`.
- AC-SB-10: Width transitions use `transition-[width]` with `var(--duration-normal)`.

---

## 4. TopBar

### 4.1 Purpose

Fixed application chrome at top of viewport. Provides sidebar toggle, brand name, and utility controls (locale, theme, user).

### 4.2 Structure

```
<header
  role="banner"
  class="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-card px-4"
>
  <Button aria-label="Toggle navigation sidebar" />   ← Sidebar toggle
  <a href="/{locale}/dashboard"                        ← Brand link
     aria-label="Evidoxa – Dashboard"
     class="text-lg font-semibold tracking-tight text-foreground">
    Evidoxa
  </a>
  <div class="flex-1" />                              ← Spacer
  <ThemeToggle />
  <LocaleSwitcher />
  <Avatar />
</header>
```

### 4.3 Token Correction

**Current bug:** `top-bar.tsx` line 21 uses `bg-background`. This MUST be changed to `bg-card`.

**Current class:** `h-14` — correct per token `--topbar-height: 3.5rem`.

### 4.4 Acceptance Criteria

- AC-TB-01: `<header>` has `bg-card` class (not `bg-background`).
- AC-TB-02: `<header>` has `role="banner"` (explicit for clarity, though `<header>` implies it).
- AC-TB-03: `<header>` has `border-b border-border`.
- AC-TB-04: `<header>` height is `h-14` (matches `--topbar-height` token).
- AC-TB-05: Sidebar toggle button has `aria-label` for toggle action.
- AC-TB-06: `<header>` is `z-50` (above sidebar `z-40`).

---

## 5. Breadcrumb

### 5.1 Purpose

Wayfinding component for pages deeper than top-level lists. Rendered inside the page content area (not TopBar). Hidden on mobile (<768px).

### 5.2 Structure

The `src/components/ui/breadcrumb.tsx` file (shadcn-installed) provides all sub-components. The current implementation is largely correct but the separator character should be `/` per spec (not the default Chevron icon).

```
<nav aria-label="Breadcrumb" class="hidden sm:block">   ← Hidden on mobile (<768px)
  <ol class="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
    <li>
      <a class="text-muted-foreground hover:text-foreground transition-colors">
        Personen
      </a>
    </li>
    <li aria-hidden="true" class="text-muted-foreground/60">/</li>
    <li>
      <span aria-current="page" class="font-medium text-foreground max-w-[30ch] truncate">
        Johann von Dalberg
      </span>
    </li>
  </ol>
</nav>
```

### 5.3 Current State Assessment

The existing `breadcrumb.tsx` is installed and correctly provides:

- `<nav aria-label="Breadcrumb">` wrapper via `Breadcrumb` component
- `<ol>` list structure via `BreadcrumbList`
- `aria-current="page"` on current segment via `BreadcrumbPage`
- `aria-hidden="true"` on separator via `BreadcrumbSeparator`

The separator defaults to `<ChevronRight />`. Per spec, it should default to `/` text. This is a minor update to the default child.

**Mobile hiding:** The breadcrumb must be wrapped in `hidden sm:block` in usage contexts (or the `Breadcrumb` nav itself can have this class). The spec says "hidden on mobile (<768px)". Tailwind `sm:` breakpoint = 640px; this is close enough given `768px` maps to `md:`. To be precise: use `hidden md:block` — hidden below 768px.

### 5.4 Acceptance Criteria

- AC-BC-01: `<nav>` has `aria-label="Breadcrumb"`.
- AC-BC-02: List structure uses `<ol>` with `<li>` items.
- AC-BC-03: Link segments are `<a>` elements in `text-muted-foreground`.
- AC-BC-04: Current page segment has `aria-current="page"` and `font-medium text-foreground`.
- AC-BC-05: Separator is `aria-hidden="true"` with `role="presentation"`.
- AC-BC-06: Entity names truncate at 30 characters maximum (the `max-w-[30ch] truncate` on `BreadcrumbPage`).
- AC-BC-07: Breadcrumb is hidden on mobile (below `md` breakpoint, 768px).

---

## 6. Bottom Tab Bar

### 6.1 Purpose

Mobile/tablet primary navigation (viewports <1024px). Fixed at the bottom of the viewport. Provides the five main nav items as icon+label items.

### 6.2 Structure

```
<nav
  aria-label="Bottom navigation"
  class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-border bg-card
         lg:hidden"                        ← Only visible below 1024px
>
  <!-- Five items: Dashboard, Persons, Events, Sources, Relations -->
  <a
    href="/{locale}/persons"
    aria-label="Personen"
    aria-current="page"                    ← On active item only
    class="flex flex-1 flex-col items-center justify-center gap-1
           text-muted-foreground
           [&.active]:text-primary [&.active]:border-t-2 [&.active]:border-primary"
  >
    <Icon class="h-5 w-5 aria-hidden="true"" />
    <span class="text-[10px] leading-none">Personen</span>
  </a>
</nav>
```

### 6.3 Token Usage

| Part                 | Classes                     | Token                                       |
| -------------------- | --------------------------- | ------------------------------------------- |
| Container background | `bg-card`                   | `--color-card`                              |
| Top border           | `border-t border-border`    | `--color-border`                            |
| Height               | `h-16`                      | 64px                                        |
| z-index              | `z-40`                      | Below dialogs (z-50), same level as sidebar |
| Active item text     | `text-primary`              | `--color-primary`                           |
| Active top border    | `border-t-2 border-primary` | `--color-primary`, 2px                      |
| Inactive text        | `text-muted-foreground`     | `--color-muted-foreground`                  |
| Label font size      | `text-[10px]`               | 10px per spec                               |

### 6.4 Navigation Items

| Item      | Icon              | Route                 | Label (de)  |
| --------- | ----------------- | --------------------- | ----------- |
| Dashboard | `LayoutDashboard` | `/{locale}/`          | Dashboard   |
| Persons   | `Users`           | `/{locale}/persons`   | Personen    |
| Events    | `Zap`             | `/{locale}/events`    | Ereignisse  |
| Sources   | `FileText`        | `/{locale}/sources`   | Quellen     |
| Relations | `Link2`           | `/{locale}/relations` | Beziehungen |

Settings items are NOT in the bottom tab bar — they are accessible via the overlay sidebar on mobile.

### 6.5 Keyboard Navigation

- Each item is an `<a>` — native keyboard focusable with `Tab`.
- Active item has `aria-current="page"`.
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

### 6.6 Acceptance Criteria

- AC-BTB-01: `<nav>` has `aria-label="Bottom navigation"`.
- AC-BTB-02: Component is visible only at viewports <1024px (`lg:hidden`).
- AC-BTB-03: Active item has `text-primary` and `border-t-2 border-primary`.
- AC-BTB-04: Active item has `aria-current="page"`.
- AC-BTB-05: All items have `aria-label` attributes.
- AC-BTB-06: Icons have `aria-hidden="true"`.
- AC-BTB-07: Labels are `text-[10px]` and never truncated.
- AC-BTB-08: Container has `bg-card border-t border-border h-16`.
- AC-BTB-09: Component has `lg:hidden` — not rendered on desktop.
- AC-BTB-10: Five items: Dashboard, Persons, Events, Sources, Relations.

---

## 7. Page Container

### 7.1 Purpose

Standardized content wrapper applied inside `<main>` on every page. Enforces consistent padding and max-width.

### 7.2 Specification

```
<div class="page-container mx-auto">
  {page content}
</div>
```

The `.page-container` utility class (from `globals.css @layer utilities`) provides:

- `padding: 1.5rem` (p-6, 24px)
- `max-width: var(--content-max-width)` (80rem / 1280px)

Combined with `mx-auto` (not included in the utility class itself) to center content on ultra-wide displays.

### 7.3 Acceptance Criteria

- AC-PC-01: Every app page has a `.page-container` or equivalent `p-6 max-w-[var(--content-max-width)] mx-auto` wrapper as the first child inside `<main>`.
- AC-PC-02: No horizontal overflow at any breakpoint.

---

## 8. Breakpoints and Responsive Reflow

All layout behaviors are tested at five viewport widths. The table below defines the expected state at each breakpoint.

| Viewport                   | Sidebar              | Bottom Tab Bar       | Breadcrumb                 | TopBar              |
| -------------------------- | -------------------- | -------------------- | -------------------------- | ------------------- |
| 320px (mobile)             | Hidden               | Visible              | Hidden (`hidden md:block`) | Visible, full width |
| 768px (tablet portrait)    | Hidden               | Visible              | Visible (`md:block`)       | Visible, full width |
| 1024px (desktop threshold) | Visible (persistent) | Hidden (`lg:hidden`) | Visible                    | Visible             |
| 1280px (desktop XL)        | Visible              | Hidden               | Visible                    | Visible             |
| 1536px (desktop wide)      | Visible              | Hidden               | Visible                    | Visible             |

### 8.1 Sidebar at 1024px

At exactly 1024px (`lg` breakpoint), the sidebar becomes persistent. Below 1024px, the sidebar is hidden and navigation is handled by the Bottom Tab Bar.

Implementation: `<aside>` gets `hidden lg:flex` classes so it is invisible on mobile/tablet and rendered as flex-column on desktop.

### 8.2 Content Reflow

- At >=1024px: main content offset by sidebar width (`.sidebar-inset` or `.sidebar-inset-collapsed`).
- At <1024px: no sidebar offset. The Bottom Tab Bar adds 64px to the bottom — main content should have `pb-16 lg:pb-0` to prevent overlap.

### 8.3 No Horizontal Overflow

At all five breakpoints, `overflow-x: hidden` on the body (or equivalent) must prevent scrollbar appearance. The `--content-max-width` constraint and `mx-auto` on `.page-container` handle this at the content level.

---

## 9. Landmark Structure

Every `(app)` page must render the following landmark regions in this order for screen reader navigation:

```
<header role="banner">          ← TopBar
<nav aria-label="Primary navigation">  ← Sidebar (inside <aside>)
<main aria-label="Main content">       ← AppShell main
  [<nav aria-label="Breadcrumb">]      ← Breadcrumb (optional, deep pages only)
  {page content}
</main>
<nav aria-label="Bottom navigation">  ← Bottom Tab Bar (mobile/tablet only)
```

Rules:

- Only one `<main>` per page.
- `<header role="banner">` is the sole top-level banner.
- `<nav>` elements must each have a distinct `aria-label` to differentiate them.
- The sidebar `<aside>` wraps the `<nav>` — `<aside>` carries `aria-label="Primary navigation"` (spec AC-SB-02).

---

## 10. Acceptance Criteria

Complete acceptance criteria reference for all layout components.

### AppShell

- AC-SHELL-01: `<main>` present with `aria-label="Main content"`
- AC-SHELL-02: No inline style padding on `<main>`
- AC-SHELL-03: CSS utility classes `.sidebar-inset` / `.sidebar-inset-collapsed` used
- AC-SHELL-04: `.topbar-inset` class always applied to `<main>`
- AC-SHELL-05: Sidebar state persists via localStorage

### Sidebar

- AC-SB-01: `bg-sidebar` on `<aside>` (not `bg-background`)
- AC-SB-02: `aria-label="Primary navigation"` on `<aside>`
- AC-SB-03: Active item has `border-l-2 border-primary`
- AC-SB-04: Active item has `aria-current="page"`
- AC-SB-05: No `truncate` on nav labels
- AC-SB-06: Every `<a>` has `aria-label`
- AC-SB-07: Collapsed state renders icon only (no label `<span>` in DOM)
- AC-SB-08: Icons have `aria-hidden="true"`
- AC-SB-09: Width classes `w-56` (open) and `w-12` (collapsed)
- AC-SB-10: Width transition via `transition-[width]`

### TopBar

- AC-TB-01: `bg-card` on `<header>` (not `bg-background`)
- AC-TB-02: `role="banner"` on `<header>`
- AC-TB-03: `border-b border-border`
- AC-TB-04: `h-14` height
- AC-TB-05: Sidebar toggle button has `aria-label`
- AC-TB-06: `z-50` on `<header>`

### Breadcrumb

- AC-BC-01: `<nav aria-label="Breadcrumb">`
- AC-BC-02: `<ol>` with `<li>` items
- AC-BC-03: Link segments are `<a>` in `text-muted-foreground`
- AC-BC-04: Current page has `aria-current="page"` and `text-foreground font-medium`
- AC-BC-05: Separator has `aria-hidden="true"`
- AC-BC-06: Current page text max `30ch` with truncation
- AC-BC-07: Hidden below `md` breakpoint (768px)

### Bottom Tab Bar

- AC-BTB-01: `aria-label="Bottom navigation"`
- AC-BTB-02: Visible only below 1024px (`lg:hidden`)
- AC-BTB-03: Active item `text-primary border-t-2 border-primary`
- AC-BTB-04: Active item `aria-current="page"`
- AC-BTB-05: All items have `aria-label`
- AC-BTB-06: Icons `aria-hidden="true"`
- AC-BTB-07: Labels `text-[10px]` no truncation
- AC-BTB-08: `bg-card border-t border-border h-16`
- AC-BTB-09: `lg:hidden`
- AC-BTB-10: Five items: Dashboard, Persons, Events, Sources, Relations

### Page Container

- AC-PC-01: `.page-container` (or equivalent) inside `<main>`
- AC-PC-02: No horizontal overflow at any breakpoint
