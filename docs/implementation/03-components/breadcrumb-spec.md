# Breadcrumb — Component Specification

**Source:** `docs/design-system/04-design-system/components.md` §17
**Component file:** `src/components/ui/breadcrumb.tsx`
**Category:** Navigation / Wayfinding

---

## 1. Visual Specification

### Anatomy

| Part            | Element                               | Notes                                              |
| --------------- | ------------------------------------- | -------------------------------------------------- |
| Container       | `<nav aria-label="Breadcrumb">`       | Wraps the entire list                              |
| List            | `<ol>`                                | Flex row, gap-1.5                                  |
| Link segment    | `<li>` → `<a>`                        | All segments preceding the current                 |
| Separator       | `<li aria-hidden="true">`             | ChevronRight icon, `text-muted-foreground/60 mx-1` |
| Current segment | `<li>` → `<span aria-current="page">` | Not a link                                         |
| Ellipsis        | `<li>` → `<span>`                     | Mobile truncation indicator                        |

### Token usage

| Part                 | CSS variable                      | Tailwind class                                      |
| -------------------- | --------------------------------- | --------------------------------------------------- |
| Container typography | —                                 | `text-sm`                                           |
| Link text            | `--color-muted-foreground`        | `text-muted-foreground`                             |
| Link hover           | `--color-foreground`              | `hover:text-foreground`                             |
| Link transition      | `--duration-fast` (100ms)         | `transition-colors duration-[var(--duration-fast)]` |
| Separator icon       | `--color-muted-foreground` at 60% | `text-muted-foreground/60`                          |
| Current segment      | `--color-foreground`              | `text-foreground font-medium`                       |
| Current max-width    | —                                 | `max-w-[30ch] truncate`                             |

### Class recipe

```
// BreadcrumbList (nav + ol wrapper)
"mb-4 flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5"

// BreadcrumbItem (li)
"inline-flex items-center gap-1.5"

// BreadcrumbLink (a)
"text-muted-foreground hover:text-foreground transition-colors duration-[var(--duration-fast)]"

// BreadcrumbSeparator (li[aria-hidden])
"[&>svg]:w-3.5 [&>svg]:h-3.5 text-muted-foreground/60"

// BreadcrumbPage (span, current)
"font-medium text-foreground max-w-[30ch] truncate"

// BreadcrumbEllipsis (span)
"flex h-9 w-9 items-center justify-center"
```

### Variants / Patterns

| Pattern           | Breadcrumb trail                           |
| ----------------- | ------------------------------------------ |
| Entity detail     | Persons > {entity name (≤30 chars)}        |
| Entity edit       | Persons > {entity name (≤30 chars)} > Edit |
| Entity new        | Persons > New Person                       |
| Settings sub-page | Settings > Event Types                     |

### States

| State          | Appearance                                       |
| -------------- | ------------------------------------------------ |
| Default        | `text-muted-foreground` link                     |
| Hover          | `text-foreground`, no underline by default       |
| Focus-visible  | Ring via browser default / focus-visible utility |
| Current page   | `text-foreground font-medium`, not a link        |
| Truncated name | Trailing `…` via CSS truncate at 30ch            |

### Mobile behaviour

- At `<768px` (mobile), replace full breadcrumb with a back-arrow button per spec.
- The component itself renders the trail; the consuming page decides whether to show breadcrumb or back-button.

### Both themes

- Light: `--color-muted-foreground` (26 10% 38%), `--color-foreground` (20 14% 9%)
- Dark: `--color-muted-foreground` (22 5% 55%), `--color-foreground` (30 10% 94%)
- Token references remain identical; CSS variables handle theme switching automatically.

---

## 2. Behavioral Specification

### Keyboard interaction

| Key           | Behaviour                                      |
| ------------- | ---------------------------------------------- |
| Tab           | Focus moves between link segments in DOM order |
| Enter / Space | Activates focused link                         |
| No key closes | Not a menu; no Escape handling needed          |

### Screen reader

- `<nav aria-label="Breadcrumb">` announces landmark as "Breadcrumb navigation".
- Each `<a>` read by its text content.
- Separator `<li aria-hidden="true">` is hidden from screen reader.
- Current page `<span aria-current="page">` announces "page" alongside its text.
- Entity name truncation is CSS-only; `title` attribute or full text in `aria-label` is NOT required (truncation is purely visual).

### Focus management

- No focus trapping; standard tab order through links.
- Focus ring must be visible on `focus-visible` for each link (relies on global ring style).

---

## 3. Integration Specification

### Composition

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/de/persons">Persons</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Johann Wolfgang von Goethe</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Slot / children API

- `BreadcrumbSeparator` defaults to `<ChevronRight>` icon; override via `children` prop.
- `BreadcrumbEllipsis` for collapsed middle segments on mobile.
- `BreadcrumbLink` accepts `asChild` for custom link rendering (e.g., Next.js `<Link>`).

### CSS class API

All sub-components accept `className` for override. Merging is via `cn()` (clsx + tailwind-merge).

---

## 4. Acceptance Criteria

| ID       | Criterion                                                               |
| -------- | ----------------------------------------------------------------------- |
| AC-BC-01 | Container renders `<nav>` element with `aria-label="Breadcrumb"`        |
| AC-BC-02 | `BreadcrumbList` renders `<ol>` element                                 |
| AC-BC-03 | Link segments carry class `text-muted-foreground`                       |
| AC-BC-04 | Link segments carry class `hover:text-foreground`                       |
| AC-BC-05 | Link segments carry `transition-colors` class                           |
| AC-BC-06 | `BreadcrumbPage` (current) carries `aria-current="page"`                |
| AC-BC-07 | `BreadcrumbPage` carries class `text-foreground`                        |
| AC-BC-08 | `BreadcrumbPage` carries class `font-medium`                            |
| AC-BC-09 | `BreadcrumbSeparator` has `aria-hidden="true"`                          |
| AC-BC-10 | `BreadcrumbSeparator` default child is a `<svg>` (ChevronRight)         |
| AC-BC-11 | Separator wrapper carries `text-muted-foreground/60` (opacity modifier) |
| AC-BC-12 | `BreadcrumbEllipsis` renders an accessible ellipsis indicator           |
| AC-BC-13 | All interactive links are keyboard-focusable (tabIndex not -1)          |
| AC-BC-14 | Component passes axe-core accessibility audit                           |
