# Tabs Component Specification

**Component:** `src/components/ui/tabs.tsx`
**Radix primitive:** `@radix-ui/react-tabs`
**Last updated:** 2026-04-03

---

## 1. Visual Spec

### 1.1 Variants

#### Pill variant (default) — general use

Used for in-page content switching where background context differentiation is needed.

| Part                   | Token                      | Tailwind class                        |
| ---------------------- | -------------------------- | ------------------------------------- |
| TabsList container     | `--color-muted`            | `bg-muted`                            |
| TabsList padding/shape | —                          | `rounded-lg p-1 h-10`                 |
| Inactive trigger text  | `--color-muted-foreground` | `text-muted-foreground`               |
| Inactive trigger hover | `--color-foreground`       | `hover:text-foreground`               |
| Active trigger bg      | `--color-background`       | `data-[state=active]:bg-background`   |
| Active trigger text    | `--color-foreground`       | `data-[state=active]:text-foreground` |
| Active trigger shadow  | `--shadow-sm`              | `data-[state=active]:shadow-sm`       |
| Trigger typography     | —                          | `text-sm font-medium`                 |
| Trigger shape          | —                          | `rounded-md px-3 py-1.5`              |
| Transition             | `--duration-fast`          | `transition-all`                      |

#### Underline variant — entity detail pages

Used for primary entity detail navigation (Attributes, Names, Relations, Evidence, Activity tabs).

| Part                     | Token                      | Tailwind class                                                      |
| ------------------------ | -------------------------- | ------------------------------------------------------------------- |
| TabsList                 | —                          | `inline-flex w-full items-end border-b border-border` (no bg)       |
| Inactive trigger         | `--color-muted-foreground` | `text-muted-foreground border-b-2 border-transparent py-2.5 px-4`   |
| Active trigger text      | `--color-foreground`       | `data-[state=active]:text-foreground`                               |
| Active trigger indicator | `--color-primary`          | `data-[state=active]:border-b-2 data-[state=active]:border-primary` |
| Hover                    | `--color-foreground`       | `hover:text-foreground`                                             |
| Typography               | —                          | `text-sm font-medium`                                               |

##### Overflow behaviour (issue #70)

At narrow viewports an entity detail page renders up to eight triggers, more
than fit the screen. The strip scrolls within its own box; the page must never
widen to accommodate it.

**The scroll container is a wrapper element, not `TabsList` itself.** This is
load-bearing, not incidental. `overflow-x: auto` forces the computed
`overflow-y` to `auto` as well (CSS overflow computed-value rule) — one axis
cannot be clipped without the other. Scrolling `TabsList` directly therefore
clipped every trigger's focus ring, which is drawn _outside_ the trigger's box
(`ring-2` + `ring-offset-2`): a keyboard user saw a 2px sliver at one edge
instead of a ring, failing WCAG 2.4.7.

Measured at a 390px viewport with focus on the first tab: the clip box was
212→252, the trigger spans 211→253 (it is 42px tall against the 40px row, so it
is 1px proud on each edge before the ring is considered), and the ring extends
to roughly 207→257.

| Part                            | Token | Tailwind class                                                       |
| ------------------------------- | ----- | -------------------------------------------------------------------- |
| Scroll wrapper (parent of list) | —     | `max-w-full overflow-x-auto overscroll-x-contain`                    |
| Scroll wrapper focus headroom   | —     | `-my-2 py-2` (8px of clip headroom; margin cancels the layout shift) |
| Scroll wrapper scrollbar chrome | —     | `scrollbar-none` (utility, globals.css)                              |
| TabsList sizing                 | —     | `w-full min-w-max` (fills the wrapper, outgrows it when needed)      |
| TabsTrigger sizing              | —     | `shrink-0` (never compressed to fit)                                 |

Do not move the overflow classes onto `TabsList` — that is the implementation
this section replaced, and it reintroduces the focus-ring clipping.

`border-b` stays on `TabsList` rather than the wrapper: the list is
`w-full min-w-max`, so its border spans the full scrolled content width and the
strip's underline is continuous at any scroll position.

#### Count badge (inside trigger)

| State    | Tailwind class                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------- |
| Non-zero | `ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums font-mono text-muted-foreground` |
| Zero     | add `opacity-60`                                                                                  |

### 1.2 States — TabsTrigger

| State                        | Visual                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Default (inactive)           | `text-muted-foreground`                                                                                     |
| Hover                        | `text-foreground` transition via `transition-all`                                                           |
| Active (`data-state=active`) | Pill: `bg-background text-foreground shadow-sm`; Underline: `text-foreground` + `border-b-2 border-primary` |
| Focus-visible                | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`       |
| Disabled                     | `disabled:pointer-events-none disabled:opacity-50`                                                          |

### 1.3 TabsContent

| Token        | Tailwind class                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Top margin   | `mt-2`                                                                                                |
| Focus ring   | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| Focus offset | `ring-offset-background`                                                                              |

### 1.4 Both themes

Light: `--color-muted` = `hsl(33 16% 93%)`, `--color-background` = `hsl(36 25% 98.5%)`, `--color-foreground` = `hsl(20 14% 9%)`.
Dark: `--color-muted` = `hsl(24 8% 14%)`, `--color-background` = `hsl(25 10% 4.5%)`, `--color-foreground` = `hsl(30 10% 94%)`.
All semantic Tailwind classes resolve correctly in both themes via CSS custom properties.

### 1.5 Transition

All interactive state changes use `transition-all` with `--duration-fast` (100ms). Respects `prefers-reduced-motion` via Tailwind's `motion-safe:` variant where applicable.

---

## 2. Behavioral Spec

### 2.1 Keyboard interaction

| Key               | Behavior                                             |
| ----------------- | ---------------------------------------------------- |
| `ArrowRight`      | Focus moves to next tab trigger (wraps)              |
| `ArrowLeft`       | Focus moves to previous tab trigger (wraps)          |
| `Home`            | Focus moves to first tab trigger                     |
| `End`             | Focus moves to last tab trigger                      |
| `Tab`             | Moves focus out of tablist into active panel content |
| `Enter` / `Space` | Activates focused tab trigger                        |

### 2.2 Screen reader announcements

- Active tab: `aria-selected="true"`.
- Inactive tabs: `aria-selected="false"`.
- Count badge: trigger carries `aria-label="Relations, 12 items"` when count is present.
- Panel labelled by its trigger via `aria-labelledby`.

### 2.3 Focus management

- Focus ring visible on keyboard focus (`focus-visible:ring-2 focus-visible:ring-ring`).
- `Tab` key moves into the active panel, not to the next tab trigger.
- `ring-offset-background` ensures ring contrast on both light and dark backgrounds.

---

## 3. Integration Spec

### 3.1 Composition

```tsx
<Tabs defaultValue="attributes">
  <TabsList>
    <TabsTrigger value="attributes">Attributes</TabsTrigger>
    <TabsTrigger value="relations">
      Relations
      <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums">
        12
      </span>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="attributes">…</TabsContent>
  <TabsContent value="relations">…</TabsContent>
</Tabs>
```

### 3.2 Underline variant usage

Apply `variant="underline"` (or a className override) to `TabsList` and matching classes to `TabsTrigger` for entity detail pages. The underline variant is the canonical form on all entity detail pages per the design system.

### 3.3 CSS class API

- `TabsList` accepts `className` — merged with `cn()`.
- `TabsTrigger` accepts `className` — merged with `cn()`.
- `TabsContent` accepts `className` — merged with `cn()`.

---

## 4. Acceptance Criteria

| ID         | Criterion                                                                                  | Testable |
| ---------- | ------------------------------------------------------------------------------------------ | -------- |
| AC-TABS-01 | `TabsList` has `bg-muted` class                                                            | Unit     |
| AC-TABS-02 | `TabsList` has `rounded-lg` class                                                          | Unit     |
| AC-TABS-03 | `TabsList` has `p-1` class                                                                 | Unit     |
| AC-TABS-04 | `TabsList` has `h-10` class                                                                | Unit     |
| AC-TABS-05 | Inactive `TabsTrigger` has `text-muted-foreground` class                                   | Unit     |
| AC-TABS-06 | Active `TabsTrigger` (`data-state=active`) has `bg-background` class                       | Unit     |
| AC-TABS-07 | Active `TabsTrigger` has `text-foreground` class via `data-[state=active]:text-foreground` | Unit     |
| AC-TABS-08 | Active `TabsTrigger` has `shadow-sm` via `data-[state=active]:shadow-sm`                   | Unit     |
| AC-TABS-09 | `TabsTrigger` has `text-sm` class                                                          | Unit     |
| AC-TABS-10 | `TabsTrigger` has `font-medium` class                                                      | Unit     |
| AC-TABS-11 | `TabsTrigger` has `transition-all` class                                                   | Unit     |
| AC-TABS-12 | `TabsTrigger` has `focus-visible:ring-2` class                                             | Unit     |
| AC-TABS-13 | `TabsTrigger` has `focus-visible:ring-ring` class                                          | Unit     |
| AC-TABS-14 | `TabsTrigger` has `disabled:pointer-events-none` class                                     | Unit     |
| AC-TABS-15 | `TabsTrigger` has `disabled:opacity-50` class                                              | Unit     |
| AC-TABS-16 | `TabsList` carries `role="tablist"`                                                        | Unit     |
| AC-TABS-17 | `TabsTrigger` carries `role="tab"`                                                         | Unit     |
| AC-TABS-18 | `TabsContent` carries `role="tabpanel"`                                                    | Unit     |
| AC-TABS-19 | Active trigger has `aria-selected="true"`                                                  | Unit     |
| AC-TABS-20 | Inactive trigger has `aria-selected="false"`                                               | Unit     |
| AC-TABS-21 | `ArrowRight` moves focus to next tab                                                       | Unit     |
| AC-TABS-22 | `ArrowLeft` moves focus to previous tab                                                    | Unit     |
| AC-TABS-23 | Disabled trigger cannot be activated                                                       | Unit     |
| AC-TABS-24 | Full Tabs structure passes axe-core with no violations                                     | Unit     |
| AC-TABS-25 | `TabsContent` has `mt-2` class                                                             | Unit     |
| AC-TABS-26 | `TabsTrigger` has `py-1.5` class                                                           | Unit     |
| AC-TABS-27 | `TabsTrigger` has `px-3` class                                                             | Unit     |
| AC-TABS-28 | `TabsTrigger` has `rounded-md` class                                                       | Unit     |
| AC-TABS-29 | The tablist's scroll **wrapper** has `overflow-x-auto` (the strip scrolls, not the page)   | Unit     |
| AC-TABS-30 | `TabsTrigger` has `shrink-0` class (never compressed to fit the strip)                     | Unit     |
| AC-TABS-31 | At a 390px viewport, the page does not scroll horizontally while the tab strip does        | E2E      |
| AC-TABS-32 | The scroll wrapper has `-my-2 py-2`, leaving clip headroom for a trigger's focus ring      | Unit     |
| AC-TABS-33 | `TabsList` has `w-full min-w-max`, so it fills the wrapper and can outgrow it              | Unit     |
