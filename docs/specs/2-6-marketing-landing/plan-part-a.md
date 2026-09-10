# Epic 2.6 Part A — Public Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public, bilingual, pre-login landing page at `/[locale]`, plus a changelog page and two legal pages, replacing today's redirect-to-login.

**Architecture:** A new `(marketing)` route group under `src/app/[locale]/` with its own layout (no AppShell). The page composes marketing-only presentational shells around three verified-pure app components, so the certainty visual language cannot drift. A display type tier is added to `@theme`; the app's existing scale is untouched.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript strict · Tailwind v4 (CSS-first, tokens in `globals.css @theme`) · next-intl · next-themes · Vitest + RTL · Playwright · `next-mdx-remote` (new)

**Spec:** `docs/specs/2-6-marketing-landing/specification.md` — sections §3, §6, §7, §8; acceptance criteria 1–4 and 9–13. Read the spec alongside this plan.

**Issue:** #82

## Global Constraints

- **pnpm only.** Never `npm` or `yarn`.
- **No `tailwind.config.js`.** All tokens live in `src/styles/globals.css` under `@theme`.
- **Locales are always prefixed:** `/de/...`, `/en/...`. `de` is default; `localeDetection: false`.
- **No copy may claim behaviour absent from `prisma/schema.prisma`** (spec §6.1). Specifically forbidden: circa dates, decades, date ranges, _terminus ante quem_. Date support is nullable `year`/`month`/`day` triples only.
- **Brand anti-values hold** (`docs/design-system/02-brand/identity.md`): no gradients, no glassmorphism, no animated backgrounds, **no autoplay or auto-advance anywhere**.
- **`prefers-reduced-motion: reduce` must produce no transitions.** This is a tested branch.
- **German is the sizing baseline.** Every display string is checked against its longest German compound at 320 px.
- **Touch targets:** 44 × 44 minimum on coarse pointers, for the rail paddles (see #33).
- **ESLint import order:** external imports alphabetical by package base name (`lucide-react` → `next/*` → `next-intl` → `next-themes` → `react` → `zod`), then internal `@/...`, then relative.
- **Band 5 is a plain CTA in Part A**, pointing at `/[locale]/auth/register`. No form, no `AccessRequest` table, and **no mention of a closed alpha** — registration is genuinely open until Part B (#29) lands.
- **Commit after every task.** `--no-verify` only during active implementation, never on the final commit of a task.
- **Local Playwright is red on `main`** (issue #61) — 24 Chromium specs fail identically because no client JS runs. Judge E2E in CI. A red local run is a known baseline, not a regression.

---

## File Structure

**Create**

| Path                                                | Responsibility                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/app/[locale]/(marketing)/layout.tsx`           | Marketing shell: reads session, renders `PublicNav` + `<main>` + `PublicFooter` |
| `src/app/[locale]/(marketing)/page.tsx`             | The one-pager; composes bands 1–5                                               |
| `src/app/[locale]/(marketing)/changelog/page.tsx`   | Release list from MDX + "coming next"                                           |
| `src/app/[locale]/(marketing)/impressum/page.tsx`   | Legal scaffold                                                                  |
| `src/app/[locale]/(marketing)/datenschutz/page.tsx` | Legal scaffold                                                                  |
| `src/components/marketing/PublicNav.tsx`            | Session-aware public nav                                                        |
| `src/components/marketing/PublicFooter.tsx`         | Footer with legal links                                                         |
| `src/components/marketing/Hero.tsx`                 | Band 1 — display statement + CTA pair                                           |
| `src/components/marketing/HeroAppFrame.tsx`         | Cropped app frame; composes `CertaintyMarker`                                   |
| `src/components/marketing/EditorialPassage.tsx`     | Band 2                                                                          |
| `src/components/marketing/HighlightRail.tsx`        | Band 3 — scroll-snap rail, paddles, live region                                 |
| `src/components/marketing/HighlightPanel.tsx`       | One rail panel                                                                  |
| `src/components/marketing/EvidenceCitation.tsx`     | Static citation chip for panel 3                                                |
| `src/components/marketing/RelationDiagram.tsx`      | Inline SVG for panel 4                                                          |
| `src/components/marketing/OpenDevelopment.tsx`      | Band 4 — status + co-development claim                                          |
| `src/components/marketing/CtaBand.tsx`              | Band 5 — Part A CTA (Part B replaces this)                                      |
| `src/components/marketing/Reveal.tsx`               | Scroll-reveal wrapper, reduced-motion aware                                     |
| `src/lib/changelog.ts`                              | Reads and compiles `content/changelog/*.mdx`                                    |
| `src/app/sitemap.ts`, `src/app/robots.ts`           | SEO                                                                             |
| `content/changelog/*.mdx`                           | Release entries                                                                 |

**Modify:** `src/styles/globals.css` (display tokens, reveal utilities) · `src/test/tokens.ts` (required-token lists) · `src/test/design-system-smoke.test.ts` · `src/auth.config.ts:5` (`PUBLIC_PATHS`) · `messages/de.json`, `messages/en.json` (`marketing.*`, `changelog.*`) · `next.config.ts` (MDX, if needed)

**Delete:** `src/app/[locale]/page.tsx` — the redirect-to-login. Route groups do not change URLs, so leaving it alongside `(marketing)/page.tsx` is a **build-time route conflict**.

---

## Task 1: Display type and section-rhythm tokens

**Files:**

- Modify: `src/test/tokens.ts`
- Modify: `src/test/design-system-smoke.test.ts`
- Modify: `src/styles/globals.css` (inside the existing `@theme` block)

**Interfaces:**

- Consumes: `parseTokens()`, `getTokenValue()`, `getDarkTokenValue()`, `ALL_REQUIRED_TOKENS` — all already exported from `src/test/tokens.ts`.
- Produces: `REQUIRED_DISPLAY_TOKENS`, `REQUIRED_SECTION_TOKENS` (both `readonly string[]`), and the CSS custom properties `--text-display-{sm,md,lg,xl}`, `--leading-display`, `--tracking-display-{sm,md,lg,xl}`, `--section-gap-{sm,md,lg}`.

- [ ] **Step 1: Write the failing test**

Add to `src/test/tokens.ts`, immediately after the existing `REQUIRED_TYPOGRAPHY_TOKENS` block:

```ts
/**
 * Marketing-tier display typography (Epic 2.6, spec §8.1).
 *
 * Deliberately separate from REQUIRED_TYPOGRAPHY_TOKENS: the app's scale is
 * capped at --text-4xl and is NOT modified by the marketing surface. These
 * tokens exist only for the public pages.
 */
export const REQUIRED_DISPLAY_TOKENS = [
  "--text-display-sm",
  "--text-display-md",
  "--text-display-lg",
  "--text-display-xl",
  "--leading-display",
  "--tracking-display-sm",
  "--tracking-display-md",
  "--tracking-display-lg",
  "--tracking-display-xl",
] as const;

/** Vertical rhythm between marketing page bands. */
export const REQUIRED_SECTION_TOKENS = [
  "--section-gap-sm",
  "--section-gap-md",
  "--section-gap-lg",
] as const;
```

Then extend the `ALL_REQUIRED_TOKENS` array (around line 325) by adding these two spreads to the existing list:

```ts
  ...REQUIRED_DISPLAY_TOKENS,
  ...REQUIRED_SECTION_TOKENS,
```

Add to `src/test/design-system-smoke.test.ts`:

```ts
describe("marketing display tier (Epic 2.6 §8.1)", () => {
  it("defines every display and section-rhythm token", () => {
    // parseTokens() returns { light: Map<string, string>; dark: Map<string, string> }
    // — a Map, not a plain object. Index access would be undefined for every key.
    const { light } = parseTokens();
    for (const token of [...REQUIRED_DISPLAY_TOKENS, ...REQUIRED_SECTION_TOKENS]) {
      expect(light.get(token), `${token} missing from globals.css @theme`).toBeTruthy();
    }
  });

  it("sizes every display step with clamp() so it is fluid", () => {
    for (const token of [
      "--text-display-sm",
      "--text-display-md",
      "--text-display-lg",
      "--text-display-xl",
    ]) {
      expect(getTokenValue(token)).toMatch(/^clamp\(/);
    }
  });

  it("does not lower the app's existing --text-4xl ceiling", () => {
    expect(getTokenValue("--text-4xl")).toBe("2.25rem");
  });

  it("tightens tracking as display size grows", () => {
    const track = (t: string) => parseFloat(getTokenValue(t));
    expect(track("--tracking-display-xl")).toBeLessThan(track("--tracking-display-sm"));
  });
});
```

Update that file's import from `./tokens` to include `REQUIRED_DISPLAY_TOKENS` and `REQUIRED_SECTION_TOKENS`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/design-system-smoke.test.ts`
Expected: FAIL — `--text-display-sm missing from globals.css @theme`.

- [ ] **Step 3: Add the tokens**

In `src/styles/globals.css`, inside the existing `@theme { ... }` block, directly after the `TYPOGRAPHY SCALE` section:

```css
/* --------------------------------------------------------------------------
     MARKETING DISPLAY TIER (Epic 2.6, spec §8.1)
     Public marketing pages only. The app's scale is capped at --text-4xl and
     is deliberately NOT modified here — identity.md's "enduring, not flashy"
     applies to the product surface; the marketing surface gets a wider range
     of the same brand, not a different brand.

     Fluid via clamp() because German compounds set the sizing floor: every
     display string must survive its longest German compound at 320px.
     -------------------------------------------------------------------------- */
--text-display-sm: clamp(2rem, 1.6rem + 2vw, 2.75rem);
--text-display-md: clamp(2.5rem, 1.9rem + 3vw, 3.75rem);
--text-display-lg: clamp(3rem, 2.1rem + 4.5vw, 5rem);
--text-display-xl: clamp(3.5rem, 2.2rem + 6vw, 6.5rem);

--leading-display: 1.08;

--tracking-display-sm: -0.025em;
--tracking-display-md: -0.03em;
--tracking-display-lg: -0.035em;
--tracking-display-xl: -0.04em;

/* Vertical rhythm between marketing bands. */
--section-gap-sm: clamp(3rem, 2rem + 5vw, 5rem);
--section-gap-md: clamp(4rem, 2.5rem + 7vw, 7.5rem);
--section-gap-lg: clamp(5rem, 3rem + 9vw, 10rem);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/test/design-system-smoke.test.ts && pnpm test:tokens`
Expected: PASS, and no previously-passing token assertion breaks.

- [ ] **Step 5: Commit**

```bash
git add src/styles/globals.css src/test/tokens.ts src/test/design-system-smoke.test.ts
git commit -m "feat(marketing): add display type and section rhythm tokens

Marketing-tier only. The app's --text-4xl ceiling is unchanged and a test
asserts it stays that way."
```

---

## Task 2: Marketing route group, shell, and the routing-contract change

This is the task that makes `/` stop redirecting to login. It must land as one commit so the repo is never in a state with two files claiming `/[locale]`.

**Files:**

- Create: `src/app/[locale]/(marketing)/layout.tsx`, `src/app/[locale]/(marketing)/page.tsx`
- Create: `src/components/marketing/PublicNav.tsx`, `src/components/marketing/PublicFooter.tsx`
- Delete: `src/app/[locale]/page.tsx`
- Modify: `src/auth.config.ts:5`, `messages/de.json`, `messages/en.json`
- Test: `src/test/components/PublicNav.test.tsx`

**Interfaces:**

- Produces: `PublicNav({ isSignedIn, locale }: { isSignedIn: boolean; locale: string })`, `PublicFooter({ locale }: { locale: string })`. Every later band component is imported by `(marketing)/page.tsx`.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/PublicNav.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicNav } from "@/components/marketing/PublicNav";

import { renderWithProviders } from "../render";

describe("PublicNav", () => {
  it("offers sign-in and registration to a guest", () => {
    renderWithProviders(<PublicNav isSignedIn={false} locale="de" />);
    expect(screen.getByRole("link", { name: /anmelden/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /zur app/i })).not.toBeInTheDocument();
  });

  it("offers the app instead of signup to a signed-in visitor", () => {
    renderWithProviders(<PublicNav isSignedIn locale="de" />);
    const toApp = screen.getByRole("link", { name: /zur app/i });
    expect(toApp).toHaveAttribute("href", "/de/dashboard");
    expect(screen.queryByRole("link", { name: /anmelden/i })).not.toBeInTheDocument();
  });

  it("exposes a navigation landmark", () => {
    renderWithProviders(<PublicNav isSignedIn={false} locale="de" />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/components/PublicNav.test.tsx`
Expected: FAIL — cannot resolve `@/components/marketing/PublicNav`.

- [ ] **Step 3: Add messages**

In `messages/de.json`, add a top-level `marketing` key:

```json
"marketing": {
  "nav": {
    "features": "Funktionen",
    "changelog": "Changelog",
    "signIn": "Anmelden",
    "register": "Konto erstellen",
    "toApp": "Zur App",
    "label": "Hauptnavigation"
  },
  "footer": {
    "imprint": "Impressum",
    "privacy": "Datenschutz",
    "changelog": "Changelog",
    "github": "GitHub",
    "label": "Fußzeile"
  }
}
```

In `messages/en.json`, the same keys with: `"Features"`, `"Changelog"`, `"Sign in"`, `"Create account"`, `"Open app"`, `"Main navigation"`, `"Imprint"`, `"Privacy"`, `"Changelog"`, `"GitHub"`, `"Footer"`.

- [ ] **Step 4: Implement PublicNav**

Create `src/components/marketing/PublicNav.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { Button } from "@/components/ui/button";

interface PublicNavProps {
  isSignedIn: boolean;
  locale: string;
}

export function PublicNav({ isSignedIn, locale }: PublicNavProps) {
  const t = useTranslations("marketing.nav");

  return (
    <nav
      aria-label={t("label")}
      className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-[var(--content-max-width)] items-center gap-6 px-4 sm:px-6">
        <Link href={`/${locale}`} className="font-semibold tracking-tight no-underline">
          Evidoxa
        </Link>
        <Link href={`/${locale}/changelog`} className="text-muted-foreground text-sm no-underline">
          {t("changelog")}
        </Link>
        <div className="flex-1" />
        <LocaleSwitcher />
        <ThemeToggle />
        {isSignedIn ? (
          <Button asChild size="sm">
            <Link href={`/${locale}/dashboard`}>{t("toApp")}</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/auth/login`}>{t("signIn")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/${locale}/auth/register`}>{t("register")}</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
```

> **File naming differs by directory in this repo.** `src/components/shell/` is kebab-case
> (`locale-switcher.tsx`, `theme-toggle.tsx`, `top-bar.tsx`), while `src/components/research/`
> and `src/components/relations/` are PascalCase. Import the shell components from their real
> kebab-case paths. New `src/components/marketing/` files are PascalCase, matching the majority.
>
> If `LocaleSwitcher` or `ThemeToggle` need props or context they do not get here, read
> `src/components/shell/top-bar.tsx` for how the app passes them and mirror it. Do not fork
> copies of those components.
>
> `LocaleSwitcher` uses `next/navigation`, which must be mocked in any test that renders
> `PublicNav`. Follow the existing mock pattern in `src/components/shell/locale-switcher.test.tsx`.

- [ ] **Step 5: Implement PublicFooter**

Create `src/components/marketing/PublicFooter.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

interface PublicFooterProps {
  locale: string;
}

export function PublicFooter({ locale }: PublicFooterProps) {
  const t = useTranslations("marketing.footer");

  return (
    <footer
      aria-label={t("label")}
      className="border-border text-muted-foreground border-t py-10 text-sm"
    >
      <div className="mx-auto flex max-w-[var(--content-max-width)] flex-wrap items-center gap-x-6 gap-y-3 px-4 sm:px-6">
        <span className="text-foreground font-semibold">Evidoxa</span>
        <Link href={`/${locale}/impressum`}>{t("imprint")}</Link>
        <Link href={`/${locale}/datenschutz`}>{t("privacy")}</Link>
        <Link href={`/${locale}/changelog`}>{t("changelog")}</Link>
        <a href="https://github.com/mathisthomsen/historian-app">{t("github")}</a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Create the layout and a minimal page, and delete the old route**

Create `src/app/[locale]/(marketing)/layout.tsx`:

```tsx
import { auth } from "@/auth";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { PublicNav } from "@/components/marketing/PublicNav";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicNav isSignedIn={!!session?.user} locale={locale} />
      <main className="flex-1">{children}</main>
      <PublicFooter locale={locale} />
    </div>
  );
}
```

Create `src/app/[locale]/(marketing)/page.tsx` as a placeholder that later tasks fill in:

```tsx
export default function LandingPage() {
  return <h1 className="sr-only">Evidoxa</h1>;
}
```

Delete the old redirect route:

```bash
git rm src/app/[locale]/page.tsx
```

- [ ] **Step 7: Open the new public paths**

In `src/auth.config.ts`, extend `PUBLIC_PATHS` (line 5) to include the three new routes:

```ts
const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/changelog",
  "/impressum",
  "/datenschutz",
  "/",
]);
```

- [ ] **Step 8: Run tests and the build**

Run: `pnpm vitest run src/test/components/PublicNav.test.tsx && pnpm typecheck && pnpm build`
Expected: tests PASS; build succeeds with **no route conflict** for `/[locale]`.

- [ ] **Step 9: Verify the routing contract changed, by measurement not assumption**

```bash
pnpm build && pnpm start &
sleep 5
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/de
```

Expected: `200` with an empty redirect URL — **not** a 307 to `/de/auth/login`.
If port 3000 is occupied by another project (see the local-dev notes), use `PORT=3100 pnpm start` and adjust the URL.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(marketing): add (marketing) route group and public shell

/[locale] now renders a public page instead of redirecting to login.
Deletes src/app/[locale]/page.tsx, which would otherwise conflict with
(marketing)/page.tsx for the same URL."
```

---

## Task 3: Hero band

**Files:**

- Create: `src/components/marketing/Hero.tsx`, `src/components/marketing/HeroAppFrame.tsx`
- Test: `src/test/components/Hero.test.tsx`
- Modify: `messages/de.json`, `messages/en.json`, `src/app/[locale]/(marketing)/page.tsx`

**Interfaces:**

- Consumes: `CertaintyMarker` from `@/components/research/CertaintyMarker` — props `{ certainty: Certainty; className?: string }`, where `Certainty` is `"CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN"` from `@prisma/client`. It is `"use client"` and calls `useTranslations("common")`, needing `common.certaintyLabel` and `common.certainty.{LEVEL}` — both already present in both message files.
- Produces: `Hero({ locale }: { locale: string })`.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/Hero.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "@/components/marketing/Hero";

import { renderWithProviders } from "../render";

describe("Hero", () => {
  it("renders exactly one h1", () => {
    renderWithProviders(<Hero locale="de" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("points its primary CTA at registration", () => {
    renderWithProviders(<Hero locale="de" />);
    expect(screen.getByRole("link", { name: /konto erstellen/i })).toHaveAttribute(
      "href",
      "/de/auth/register",
    );
  });

  it("uses the marketing display tier, not the app's text scale", () => {
    renderWithProviders(<Hero locale="de" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.className).toMatch(/text-\[var\(--text-display-/);
  });

  it("hides the decorative app frame from assistive technology", () => {
    const { container } = renderWithProviders(<Hero locale="de" />);
    expect(container.querySelector('[data-testid="hero-app-frame"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/components/Hero.test.tsx`
Expected: FAIL — cannot resolve `@/components/marketing/Hero`.

- [ ] **Step 3: Add hero messages**

`messages/de.json`, inside `marketing`:

```json
"hero": {
  "headline": "Für alles, was die Quelle nicht sagt.",
  "sub": "Eine Forschungsdatenbank, in der Ungewissheit ein Feld ist — kein Kompromiss.",
  "primary": "Konto erstellen",
  "secondary": "Ansehen"
}
```

`messages/en.json`:

```json
"hero": {
  "headline": "For everything the source does not say.",
  "sub": "A research database where uncertainty is a field, not a compromise.",
  "primary": "Create account",
  "secondary": "Take a look"
}
```

- [ ] **Step 4: Implement HeroAppFrame**

Create `src/components/marketing/HeroAppFrame.tsx`. It is decorative — the claims it illustrates are made in text elsewhere — so it is `aria-hidden`:

```tsx
import type { Certainty } from "@prisma/client";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";

/** Row widths are arbitrary; they stand in for record text without inventing data. */
const ROWS: { width: string; certainty: Certainty }[] = [
  { width: "58%", certainty: "PROBABLE" },
  { width: "76%", certainty: "CERTAIN" },
  { width: "44%", certainty: "UNKNOWN" },
  { width: "66%", certainty: "POSSIBLE" },
  { width: "82%", certainty: "CERTAIN" },
];

export function HeroAppFrame() {
  return (
    <div
      data-testid="hero-app-frame"
      aria-hidden="true"
      className="border-border bg-card mx-auto w-full max-w-4xl overflow-hidden rounded-t-xl border shadow-lg"
    >
      <div className="border-border flex gap-1.5 border-b px-4 py-3">
        <span className="bg-border h-2 w-2 rounded-full" />
        <span className="bg-border h-2 w-2 rounded-full" />
        <span className="bg-border h-2 w-2 rounded-full" />
      </div>
      <div className="grid grid-cols-[7rem_1fr] sm:grid-cols-[10rem_1fr]">
        <div className="border-border flex flex-col gap-2 border-r p-4">
          {["70%", "88%", "60%", "76%"].map((w, i) => (
            <span
              key={w}
              className="h-2 rounded-sm"
              style={{
                width: w,
                background: i === 1 ? "var(--color-primary)" : "var(--color-muted)",
                opacity: i === 1 ? 0.2 : 1,
              }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3 p-4">
          {ROWS.map((row) => (
            <div key={row.width} className="flex items-center gap-3">
              <span className="bg-muted h-2 rounded-sm" style={{ width: row.width }} />
              <CertaintyMarker certainty={row.certainty} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement Hero**

Create `src/components/marketing/Hero.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

import { HeroAppFrame } from "@/components/marketing/HeroAppFrame";
import { Button } from "@/components/ui/button";

interface HeroProps {
  locale: string;
}

export function Hero({ locale }: HeroProps) {
  const t = useTranslations("marketing.hero");

  return (
    <section className="overflow-hidden px-4 pt-[var(--section-gap-md)] text-center sm:px-6">
      <h1 className="mx-auto max-w-[16ch] leading-[var(--leading-display)] font-semibold tracking-[var(--tracking-display-lg)] text-balance text-[var(--text-display-lg)]">
        {t("headline")}
      </h1>
      <p className="text-muted-foreground mx-auto mt-6 max-w-[46ch] text-lg text-pretty">
        {t("sub")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href={`/${locale}/auth/register`}>{t("primary")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="#highlights">{t("secondary")}</Link>
        </Button>
      </div>
      <div className="mt-[var(--section-gap-sm)]">
        <HeroAppFrame />
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Mount it on the page**

Replace the body of `src/app/[locale]/(marketing)/page.tsx`:

```tsx
import { Hero } from "@/components/marketing/Hero";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Hero locale={locale} />;
}
```

- [ ] **Step 7: Run tests**

Run: `pnpm vitest run src/test/components/Hero.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 8: Check the German sizing floor**

Run `pnpm dev`, open `/de` at a 320 px viewport, and confirm the headline does not overflow horizontally and does not break mid-compound. If it does, lower the `clamp()` minimum for `--text-display-lg` in `globals.css` — **do not** shorten the German copy to fit a token.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(marketing): add hero band with cropped app frame

The frame composes the real CertaintyMarker rather than a marketing copy of
it, so the certainty visual language cannot drift out of sync (spec 7.1)."
```

---

## Task 4: Highlight rail

The accessibility-critical task. Read spec §7.2 before starting.

**Files:**

- Create: `src/components/marketing/HighlightRail.tsx`, `src/components/marketing/HighlightPanel.tsx`
- Test: `src/test/components/HighlightRail.test.tsx`
- Modify: `messages/de.json`, `messages/en.json`

**Interfaces:**

- Produces: `HighlightRail({ children }: { children: React.ReactNode })` — each child is one panel and is wrapped in an `<li>` by the rail. `HighlightPanel({ kicker, title, body, children }: { kicker: string; title: string; body: string; children?: React.ReactNode })` — `children` is the panel's demo visual.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/HighlightRail.test.tsx`:

```tsx
import { act, fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HighlightPanel } from "@/components/marketing/HighlightPanel";
import { HighlightRail } from "@/components/marketing/HighlightRail";

import { renderWithProviders } from "../render";

function renderRail() {
  return renderWithProviders(
    <HighlightRail>
      {["A", "B", "C", "D"].map((id) => (
        <HighlightPanel key={id} kicker={`K${id}`} title={`T${id}`} body={`B${id}`} />
      ))}
    </HighlightRail>,
  );
}

describe("HighlightRail", () => {
  it("renders every panel in the DOM, none hidden from assistive tech", () => {
    renderRail();
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    for (const item of items) {
      expect(item).not.toHaveAttribute("aria-hidden");
    }
  });

  it("gives both paddles accessible names", () => {
    renderRail();
    expect(screen.getByRole("button", { name: /zurück|vorher/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /weiter/i })).toBeInTheDocument();
  });

  it("disables the previous paddle at the start", () => {
    renderRail();
    expect(screen.getByRole("button", { name: /zurück|vorher/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /weiter/i })).toBeEnabled();
  });

  it("announces position in a polite live region", () => {
    const { container } = renderRail();
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeInTheDocument();
    expect(live).toHaveTextContent("1");
    expect(live).toHaveTextContent("4");
  });

  it("advances the announced position when the next paddle is pressed", () => {
    const { container } = renderRail();
    fireEvent.click(screen.getByRole("button", { name: /weiter/i }));
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("2");
  });

  it("never auto-advances", () => {
    // Fake timers are essential. Reading textContent twice synchronously would
    // pass even against a component containing
    // setInterval(() => setActive((a) => a + 1), 3000), because no macrotask
    // ever runs during a synchronous test body. Time must actually advance.
    vi.useFakeTimers();
    try {
      const { container } = renderRail();
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("1");
    } finally {
      vi.useRealTimers();
    }
  });
});
```

> **Note on jsdom:** `scrollTo` and layout are not implemented. The rail therefore keeps its active index in React state and treats `scrollTo` as best-effort, which is why these tests assert on the live region rather than on scroll position. Real scroll behaviour is covered by the Playwright test in Task 9.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/components/HighlightRail.test.tsx`
Expected: FAIL — cannot resolve `@/components/marketing/HighlightRail`.

- [ ] **Step 3: Add rail messages**

`messages/de.json`, inside `marketing`:

```json
"rail": {
  "previous": "Zurück",
  "next": "Weiter",
  "position": "Panel {current} von {total}",
  "label": "Was Evidoxa anders macht"
}
```

`messages/en.json`: `"Previous"`, `"Next"`, `"Panel {current} of {total}"`, `"What Evidoxa does differently"`.

- [ ] **Step 4: Implement HighlightPanel**

Create `src/components/marketing/HighlightPanel.tsx`:

```tsx
interface HighlightPanelProps {
  kicker: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}

export function HighlightPanel({ kicker, title, body, children }: HighlightPanelProps) {
  return (
    <article className="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
      <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">{kicker}</p>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      {children ? <div className="mt-auto pt-4">{children}</div> : null}
    </article>
  );
}
```

- [ ] **Step 5: Implement HighlightRail**

Create `src/components/marketing/HighlightRail.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Children, useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface HighlightRailProps {
  children: React.ReactNode;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HighlightRail({ children }: HighlightRailProps) {
  const t = useTranslations("marketing.rail");
  const railRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const panels = Children.toArray(children);
  const total = panels.length;

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(total - 1, index));
      setActive(next);
      const rail = railRef.current;
      const item = rail?.children[next] as HTMLElement | undefined;
      if (!rail || !item || typeof rail.scrollTo !== "function") return;
      rail.scrollTo({
        left: item.offsetLeft - rail.offsetLeft,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [total],
  );

  // Keeps the announced position honest when the user swipes or drags the
  // native scroller instead of using the paddles.
  const syncFromScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const items = Array.from(rail.children) as HTMLElement[];
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    items.forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft - rail.offsetLeft - rail.scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    setActive(best);
  }, []);

  return (
    <section id="highlights" aria-label={t("label")} className="px-4 sm:px-6">
      {/*
        Explicit role="list" / role="listitem" are NOT redundant — do not remove.
        Tailwind v4 preflight sets `ul, ol, menu { list-style: none }`
        unconditionally, and WebKit strips a list's implicit accessibility roles
        when list-style is removed, so VoiceOver users lose the "list, 4 items"
        context. jsdom cannot catch this: it derives roles from tag names, never
        from applied CSS, so getByRole("list") passes either way.
      */}
      <ul
        ref={railRef}
        onScroll={syncFromScroll}
        role="list"
        className="grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto pb-4 [scrollbar-width:thin] sm:auto-cols-[52%] lg:auto-cols-[30%]"
      >
        {panels.map((panel, index) => (
          <li key={index} role="listitem" className="snap-start">
            {panel}
          </li>
        ))}
      </ul>

      <p aria-live="polite" className="sr-only">
        {t("position", { current: active + 1, total })}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("previous")}
          disabled={active === 0}
          onClick={() => goTo(active - 1)}
          className="min-h-11 min-w-11 rounded-full"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("next")}
          disabled={active === total - 1}
          onClick={() => goTo(active + 1)}
          className="min-h-11 min-w-11 rounded-full"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
```

`auto-cols-[86%]` on mobile and `lg:auto-cols-[30%]` on desktop both leave the next card partly visible — that peek is the spec's mitigation for the fourth panel going undiscovered. Do not raise these to `100%`/`33%`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run src/test/components/HighlightRail.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Prove the paddle guard is real (mutation check)**

Temporarily change `disabled={active === 0}` to `disabled={false}` and re-run the suite. The "disables the previous paddle at the start" test **must** fail. Revert the change. A guard whose test passes without it is not a guard.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(marketing): add accessible highlight rail

Native scroll-snap with real paddle buttons, 44x44 targets, a polite live
region, and no autoplay. Peek of the next card is deliberate: it is what
makes the fourth panel discoverable."
```

---

## Task 5: Panel content — EvidenceCitation and RelationDiagram

**Files:**

- Create: `src/components/marketing/EvidenceCitation.tsx`, `src/components/marketing/RelationDiagram.tsx`
- Test: `src/test/components/marketing-panels.test.tsx`
- Modify: `messages/de.json`, `messages/en.json`, `src/app/[locale]/(marketing)/page.tsx`

**Interfaces:**

- Consumes: `Badge` from `@/components/ui/badge` — `variant` accepts `certain | probable | possible | unknown | unevidenced`. `CertaintyMarker` as in Task 3.
- Produces: `EvidenceCitation({ count, sourceLabel }: { count: number; sourceLabel: string })`, `RelationDiagram({ labels }: { labels: { person: string; event: string; place: string; source: string; relation: string } })`.

> **Why not `PropertyEvidenceBadge`:** it calls `useEffect` + `fetch` against an authenticated evidence-count endpoint and owns popover state. On a public page it would fire an authenticated request from a logged-out visitor and render its failure state. See the correction note in spec §7.1.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/marketing-panels.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvidenceCitation } from "@/components/marketing/EvidenceCitation";
import { RelationDiagram } from "@/components/marketing/RelationDiagram";

import { renderWithProviders } from "../render";

const LABELS = {
  person: "Person",
  event: "Ereignis",
  place: "Ort",
  source: "Quelle",
  relation: "bezeugt",
};

describe("EvidenceCitation", () => {
  it("renders the count and the source label as text", () => {
    renderWithProviders(<EvidenceCitation count={3} sourceLabel="Nürnberger Polizeiakte, 1828" />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/Nürnberger Polizeiakte, 1828/)).toBeInTheDocument();
  });

  it("issues no network request", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<EvidenceCitation count={3} sourceLabel="x" />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("RelationDiagram", () => {
  it("exposes an accessible description rather than bare decorative SVG", () => {
    renderWithProviders(<RelationDiagram labels={LABELS} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/person/i);
  });

  it("labels all four entity nodes", () => {
    renderWithProviders(<RelationDiagram labels={LABELS} />);
    for (const label of ["Person", "Ereignis", "Ort", "Quelle"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/components/marketing-panels.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement EvidenceCitation**

Create `src/components/marketing/EvidenceCitation.tsx`:

```tsx
import { FileText } from "lucide-react";

interface EvidenceCitationProps {
  count: number;
  sourceLabel: string;
}

/**
 * Static citation chip for the marketing surface.
 *
 * Deliberately NOT PropertyEvidenceBadge: that component fetches an evidence
 * count from an authenticated endpoint and owns popover state, so on a public
 * page it would fire an authenticated request from a logged-out visitor.
 */
export function EvidenceCitation({ count, sourceLabel }: EvidenceCitationProps) {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="text-foreground font-medium">{count}</span>
      <span>·</span>
      <span>{sourceLabel}</span>
    </p>
  );
}
```

- [ ] **Step 4: Implement RelationDiagram**

Create `src/components/marketing/RelationDiagram.tsx`:

```tsx
interface RelationDiagramProps {
  labels: {
    person: string;
    event: string;
    place: string;
    source: string;
    relation: string;
  };
}

/**
 * Four entity nodes and the edges between them. Colours come from the certainty
 * token family so the diagram reads as part of the same visual language, and
 * every stroke resolves through a CSS variable so both themes work with no
 * second copy of the SVG.
 */
export function RelationDiagram({ labels }: RelationDiagramProps) {
  const description = `${labels.person} → ${labels.event} → ${labels.source}`;

  return (
    <svg role="img" aria-label={description} viewBox="0 0 400 130" className="h-auto w-full">
      <g stroke="var(--color-border)" strokeWidth="1" fill="none">
        <path d="M110 65 L200 38" />
        <path d="M110 65 L200 94" />
        <path d="M200 38 L292 65" />
        <path d="M200 94 L292 65" />
        <path d="M200 38 L200 94" strokeDasharray="3 3" />
      </g>
      <g fontSize="9" fill="var(--color-muted-foreground)" textAnchor="middle">
        <circle
          cx="110"
          cy="65"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-certain-border)"
          strokeWidth="1.5"
        />
        <text x="110" y="68">
          {labels.person}
        </text>
        <circle
          cx="200"
          cy="38"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-probable-border)"
          strokeWidth="1.5"
        />
        <text x="200" y="41">
          {labels.event}
        </text>
        <circle
          cx="200"
          cy="94"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-possible-border)"
          strokeWidth="1.5"
        />
        <text x="200" y="97">
          {labels.place}
        </text>
        <circle
          cx="292"
          cy="65"
          r="17"
          fill="var(--color-card)"
          stroke="var(--color-certainty-unknown-border)"
          strokeWidth="1.5"
        />
        <text x="292" y="68">
          {labels.source}
        </text>
        <text x="152" y="42" fontSize="8">
          {labels.relation}
        </text>
      </g>
    </svg>
  );
}
```

- [ ] **Step 5: Add the four panels' copy**

`messages/de.json`, inside `marketing`. **Every claim here is verified against `prisma/schema.prisma`** — see spec §6.1. Do not add claims about circa dates, decades or ranges.

```json
"panels": {
  "certainty": {
    "kicker": "Gewissheit",
    "title": "Vier Stufen statt einer Behauptung.",
    "body": "Gesichert, wahrscheinlich, möglich, unbekannt — pro Feld, nicht pro Datensatz."
  },
  "dates": {
    "kicker": "Datierung",
    "title": "Ein Jahr ohne Monat ist eine vollständige Antwort.",
    "body": "Jahr, Monat und Tag werden getrennt gespeichert. Was Sie nicht wissen, müssen Sie nicht erfinden."
  },
  "evidence": {
    "kicker": "Belege",
    "title": "Jede Aussage zeigt auf ihre Quelle.",
    "body": "Belege hängen am einzelnen Feld — mit Fundstelle, Zitat und diplomatischer Transkription."
  },
  "relations": {
    "kicker": "Beziehungen",
    "title": "Alles kann mit allem verbunden sein.",
    "body": "Beziehungstypen definieren Sie selbst. Jede Beziehung trägt ihre eigene Gewissheit.",
    "nodes": {
      "person": "Person",
      "event": "Ereignis",
      "place": "Ort",
      "source": "Quelle",
      "relation": "bezeugt"
    }
  }
}
```

`messages/en.json`, same shape:

```json
"panels": {
  "certainty": {
    "kicker": "Certainty",
    "title": "Four levels, not one assertion.",
    "body": "Certain, probable, possible, unknown — per field, not per record."
  },
  "dates": {
    "kicker": "Dating",
    "title": "A year without a month is a complete answer.",
    "body": "Year, month and day are stored separately. What you do not know, you need not invent."
  },
  "evidence": {
    "kicker": "Evidence",
    "title": "Every claim points at its source.",
    "body": "Evidence attaches to the individual field — with page reference, quotation and diplomatic transcription."
  },
  "relations": {
    "kicker": "Relations",
    "title": "Anything can connect to anything.",
    "body": "You define the relation types. Every relation carries its own certainty.",
    "nodes": {
      "person": "Person",
      "event": "Event",
      "place": "Place",
      "source": "Source",
      "relation": "attests"
    }
  }
}
```

- [ ] **Step 6: Compose the rail into the page**

Update `src/app/[locale]/(marketing)/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

import { EvidenceCitation } from "@/components/marketing/EvidenceCitation";
import { Hero } from "@/components/marketing/Hero";
import { HighlightPanel } from "@/components/marketing/HighlightPanel";
import { HighlightRail } from "@/components/marketing/HighlightRail";
import { RelationDiagram } from "@/components/marketing/RelationDiagram";
import { Badge } from "@/components/ui/badge";
import { CertaintyMarker } from "@/components/research/CertaintyMarker";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("marketing.panels");

  return (
    <>
      <Hero locale={locale} />

      <div className="mt-[var(--section-gap-lg)]">
        <HighlightRail>
          <HighlightPanel
            kicker={t("certainty.kicker")}
            title={t("certainty.title")}
            body={t("certainty.body")}
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant="certain">{t("certainty.kicker")}</Badge>
              <CertaintyMarker certainty="PROBABLE" />
              <CertaintyMarker certainty="POSSIBLE" />
              <CertaintyMarker certainty="UNKNOWN" />
            </div>
          </HighlightPanel>

          <HighlightPanel
            kicker={t("dates.kicker")}
            title={t("dates.title")}
            body={t("dates.body")}
          >
            <p className="flex items-center gap-2 font-mono text-sm">
              1740 <CertaintyMarker certainty="POSSIBLE" />
            </p>
          </HighlightPanel>

          <HighlightPanel
            kicker={t("evidence.kicker")}
            title={t("evidence.title")}
            body={t("evidence.body")}
          >
            <EvidenceCitation count={3} sourceLabel="Nürnberger Polizeiakte, 1828" />
          </HighlightPanel>

          <HighlightPanel
            kicker={t("relations.kicker")}
            title={t("relations.title")}
            body={t("relations.body")}
          >
            <RelationDiagram
              labels={{
                person: t("relations.nodes.person"),
                event: t("relations.nodes.event"),
                place: t("relations.nodes.place"),
                source: t("relations.nodes.source"),
                relation: t("relations.nodes.relation"),
              }}
            />
          </HighlightPanel>
        </HighlightRail>
      </div>
    </>
  );
}
```

- [ ] **Step 7: Run tests**

Run: `pnpm vitest run src/test/components/ && pnpm typecheck && pnpm lint`
Expected: PASS. If lint complains about import order, the rule is alphabetical by package base name for externals, then `@/...` internals — `@/components/marketing/*` sorts before `@/components/research/*` before `@/components/ui/*`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(marketing): add highlight panel content

All four panel claims verified against prisma/schema.prisma. No claim about
circa dates, decades or ranges: the model stores nullable y/m/d triples only."
```

---

## Task 6: Editorial passage, open-development band, CTA band

**Files:**

- Create: `src/components/marketing/EditorialPassage.tsx`, `src/components/marketing/OpenDevelopment.tsx`, `src/components/marketing/CtaBand.tsx`
- Test: `src/test/components/marketing-bands.test.tsx`
- Modify: `messages/de.json`, `messages/en.json`, `src/app/[locale]/(marketing)/page.tsx`

**Interfaces:**

- Produces: `EditorialPassage()`, `OpenDevelopment({ locale }: { locale: string })`, `CtaBand({ locale }: { locale: string })`.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/marketing-bands.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaBand } from "@/components/marketing/CtaBand";
import { OpenDevelopment } from "@/components/marketing/OpenDevelopment";

import { renderWithProviders } from "../render";

describe("CtaBand (Part A)", () => {
  it("sends visitors to open registration", () => {
    renderWithProviders(<CtaBand locale="de" />);
    expect(screen.getByRole("link", { name: /konto erstellen/i })).toHaveAttribute(
      "href",
      "/de/auth/register",
    );
  });

  it("does not claim a closed alpha, because registration is open in Part A", () => {
    const { container } = renderWithProviders(<CtaBand locale="de" />);
    expect(container.textContent?.toLowerCase()).not.toMatch(/geschlossen|closed alpha|warteliste/);
  });
});

describe("OpenDevelopment", () => {
  it("links to the changelog", () => {
    renderWithProviders(<OpenDevelopment locale="de" />);
    expect(screen.getByRole("link", { name: /changelog/i })).toHaveAttribute(
      "href",
      "/de/changelog",
    );
  });

  it("lists three status lines", () => {
    renderWithProviders(<OpenDevelopment locale="de" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/components/marketing-bands.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Add band messages**

`messages/de.json`, inside `marketing`:

```json
"editorial": {
  "body": "Jede Datenbank zwingt Sie irgendwann zu einer Angabe, die Sie nicht belegen können. Ein Datumsfeld will einen Tag. Ein Ortsfeld will einen Ort. Die Fußnote, die das relativiert, steht am Ende in Ihrem Kopf — nicht in Ihren Daten."
},
"openDev": {
  "kicker": "Stand der Dinge",
  "title": "Evidoxa wird an Dissertationen entwickelt, nicht an Personas.",
  "body": "Was als Nächstes gebaut wird, entscheiden die Historikerinnen und Historiker, die damit arbeiten.",
  "shipped": "Personen, Ereignisse, Quellen und Beziehungen — nutzbar",
  "next": "Import und Export — als Nächstes",
  "planned": "Zusammenarbeit im Team — geplant",
  "changelogLink": "Vollständiges Changelog"
},
"cta": {
  "title": "Fangen Sie mit einer Quelle an.",
  "body": "Ein Konto genügt. Ihr erstes Projekt wird automatisch angelegt.",
  "action": "Konto erstellen"
}
```

`messages/en.json`:

```json
"editorial": {
  "body": "Every database eventually forces you into a statement you cannot evidence. A date field wants a day. A place field wants a place. The footnote that qualifies it ends up in your head — not in your data."
},
"openDev": {
  "kicker": "Where this stands",
  "title": "Evidoxa is built against dissertations, not personas.",
  "body": "What gets built next is decided by the historians doing the work.",
  "shipped": "People, events, sources and relations — usable",
  "next": "Import and export — next",
  "planned": "Team collaboration — planned",
  "changelogLink": "Full changelog"
},
"cta": {
  "title": "Start with one source.",
  "body": "An account is all it takes. Your first project is created automatically.",
  "action": "Create account"
}
```

- [ ] **Step 4: Implement the three bands**

`src/components/marketing/EditorialPassage.tsx`:

```tsx
import { useTranslations } from "next-intl";

export function EditorialPassage() {
  const t = useTranslations("marketing.editorial");

  return (
    <section className="px-4 sm:px-6">
      <p className="mx-auto max-w-[34ch] leading-snug font-medium tracking-[var(--tracking-display-sm)] text-balance text-[var(--text-display-sm)]">
        {t("body")}
      </p>
    </section>
  );
}
```

`src/components/marketing/OpenDevelopment.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

import { CertaintyMarker } from "@/components/research/CertaintyMarker";

interface OpenDevelopmentProps {
  locale: string;
}

export function OpenDevelopment({ locale }: OpenDevelopmentProps) {
  const t = useTranslations("marketing.openDev");

  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto max-w-[var(--content-max-width)]">
        <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">{t("kicker")}</p>
        <h2 className="mt-3 max-w-[24ch] leading-tight font-semibold tracking-[var(--tracking-display-sm)] text-balance text-[var(--text-display-sm)]">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-4 max-w-[52ch]">{t("body")}</p>
        <ul className="mt-8 space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <CertaintyMarker certainty="CERTAIN" />
            {t("shipped")}
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CertaintyMarker certainty="PROBABLE" />
            {t("next")}
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CertaintyMarker certainty="UNKNOWN" />
            {t("planned")}
          </li>
        </ul>
        <Link href={`/${locale}/changelog`} className="mt-6 inline-block text-sm">
          {t("changelogLink")} →
        </Link>
      </div>
    </section>
  );
}
```

`src/components/marketing/CtaBand.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface CtaBandProps {
  locale: string;
}

/**
 * Part A only. Registration is still open at this point, so this band is an
 * honest signup CTA and must NOT mention a closed alpha or a waitlist.
 * Part B (#29) replaces this component with the access-request form and flips
 * the copy in the same PR that closes registration.
 */
export function CtaBand({ locale }: CtaBandProps) {
  const t = useTranslations("marketing.cta");

  return (
    <section className="px-4 sm:px-6">
      <div className="border-border bg-card mx-auto max-w-[var(--content-max-width)] rounded-xl border p-8 text-center sm:p-12">
        <h2 className="mx-auto max-w-[20ch] leading-tight font-semibold tracking-[var(--tracking-display-sm)] text-balance text-[var(--text-display-sm)]">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-[46ch]">{t("body")}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href={`/${locale}/auth/register`}>{t("action")}</Link>
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Compose all bands into the page**

In `src/app/[locale]/(marketing)/page.tsx`, add three imports:

```tsx
import { CtaBand } from "@/components/marketing/CtaBand";
import { EditorialPassage } from "@/components/marketing/EditorialPassage";
import { OpenDevelopment } from "@/components/marketing/OpenDevelopment";
```

Then change the returned fragment so the bands appear in order, each separated by the rhythm token. The `<HighlightRail>` block below is the same one already in the file from the previous task — leave its four `<HighlightPanel>` children exactly as they are and only wrap it in the spacing `div`:

```tsx
<>
  <Hero locale={locale} />

  <div className="mt-[var(--section-gap-lg)]">
    <EditorialPassage />
  </div>

  <div className="mt-[var(--section-gap-lg)]">
    <HighlightRail>
      {/* The four HighlightPanel children already present in this file stay
              unchanged: certainty, dates, evidence, relations — in that order. */}
    </HighlightRail>
  </div>

  <div className="mt-[var(--section-gap-lg)]">
    <OpenDevelopment locale={locale} />
  </div>

  <div className="my-[var(--section-gap-lg)]">
    <CtaBand locale={locale} />
  </div>
</>
```

**Band order is load-bearing**, not cosmetic. The open-development band must come _after_ the rail: "the users decide what gets built next" reads as an invitation after four panels of demonstrated rigour, and as an excuse before them. Do not reorder these.

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run && pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(marketing): add editorial, open-development and CTA bands

CtaBand is Part A only and is asserted not to claim a closed alpha, since
registration stays open until Part B closes it."
```

---

## Task 7: Scroll-reveal motion with a tested reduced-motion branch

**Files:**

- Create: `src/components/marketing/Reveal.tsx`
- Test: `src/test/components/Reveal.test.tsx`
- Modify: `src/styles/globals.css`, `src/app/[locale]/(marketing)/page.tsx`

**Interfaces:**

- Produces: `Reveal({ children, className }: { children: React.ReactNode; className?: string })`.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/Reveal.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";

import { Reveal } from "@/components/marketing/Reveal";

import { renderWithProviders } from "../render";

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reduce : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

describe("Reveal", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
    );
  });

  it("starts hidden and observes when motion is allowed", () => {
    mockReducedMotion(false);
    const { container } = renderWithProviders(<Reveal>content</Reveal>);
    expect(container.firstElementChild).toHaveAttribute("data-revealed", "false");
  });

  it("renders already revealed when reduced motion is requested", () => {
    mockReducedMotion(true);
    const { container } = renderWithProviders(<Reveal>content</Reveal>);
    expect(container.firstElementChild).toHaveAttribute("data-revealed", "true");
  });

  it("never creates an observer under reduced motion", () => {
    mockReducedMotion(true);
    renderWithProviders(<Reveal>content</Reveal>);
    expect(IntersectionObserver).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/components/Reveal.test.tsx`
Expected: FAIL — cannot resolve `@/components/marketing/Reveal`.

- [ ] **Step 3: Implement Reveal**

Create `src/components/marketing/Reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Reveal({ children, className }: RevealProps) {
  // Reduced motion is resolved during the first render, not in an effect, so
  // the element never flashes a hidden state at users who asked for stillness.
  const [revealed, setRevealed] = useState(() => prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <div ref={ref} data-revealed={revealed} className={cn("reveal", className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Add the reveal CSS**

In `src/styles/globals.css`, inside the existing `@layer components` block:

```css
/* Marketing scroll-reveal (Epic 2.6, spec §8.2).
     The reduced-motion branch is not merely a shorter transition — it is no
     transition and no transform at all. */
.reveal {
  opacity: 0;
  transform: translateY(0.75rem);
  transition:
    opacity var(--duration-slow) var(--ease-out),
    transform var(--duration-slow) var(--ease-out);
}

.reveal[data-revealed="true"] {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal[data-revealed="true"] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

> Confirm `--duration-slow` and `--ease-out` exist in `@theme` before using them — `src/test/tokens.ts` lists the real names in `REQUIRED_DURATION_TOKENS` and `REQUIRED_EASING_TOKENS`. Use whatever names are actually defined; do not invent new ones.

- [ ] **Step 5: Wrap the bands**

In `src/app/[locale]/(marketing)/page.tsx`, wrap `EditorialPassage`, the rail, `OpenDevelopment` and `CtaBand` in `<Reveal>`. **Do not wrap `Hero`** — it is above the fold and must never start hidden.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run src/test/components/Reveal.test.tsx && pnpm test:ds`
Expected: PASS.

- [ ] **Step 7: Mutation check on the reduced-motion branch**

Temporarily change the initial state to `useState(false)` and re-run. The "renders already revealed when reduced motion is requested" test **must** fail. Revert.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(marketing): add scroll-reveal with a real reduced-motion branch

Reduced motion is resolved in the first render rather than an effect, so the
element never flashes hidden at users who asked for stillness."
```

---

## Task 8: Changelog page

**Files:**

- Create: `src/lib/changelog.ts`, `src/app/[locale]/(marketing)/changelog/page.tsx`, `content/changelog/0.1.0.de.mdx`, `content/changelog/0.1.0.en.mdx`
- Test: `src/test/changelog.test.ts`
- Modify: `package.json` (add `next-mdx-remote`), `messages/de.json`, `messages/en.json`

**Interfaces:**

- Produces: `listReleases(locale: string): Promise<Release[]>` where `Release = { version: string; date: string; title: string; body: ReactElement }` (`ReactElement` imported as a type from `react`).

- [ ] **Step 1: Spike the MDX toolchain before building on it**

Run:

```bash
pnpm add next-mdx-remote
```

Then create a throwaway `src/app/[locale]/dev/mdx-probe/page.tsx` that calls `compileMDX` from `next-mdx-remote/rsc` on a literal string, and run `pnpm dev` and `pnpm build`.

**This step exists because the combination of Turbopack and `next-mdx-remote/rsc` is not verified in this repo.** If either the dev server or the build fails, stop and report it rather than fighting it — the fallback is plain Markdown compiled with `remark`/`remark-html`, or a typed TS data module, and that is a decision for the user, not a workaround to improvise. Delete the probe route before committing.

- [ ] **Step 2: Write the failing test**

Create `src/test/changelog.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { listReleases } from "@/lib/changelog";

describe("listReleases", () => {
  it("returns releases newest first", async () => {
    const releases = await listReleases("de");
    expect(releases.length).toBeGreaterThan(0);
    const versions = releases.map((r) => r.version);
    expect([...versions].sort().reverse()).toEqual(versions);
  });

  it("parses version, date and title from frontmatter", async () => {
    const [first] = await listReleases("de");
    expect(first.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(first.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(first.title).toBeTruthy();
  });

  it("falls back to the German entry when a locale file is missing", async () => {
    const releases = await listReleases("en");
    expect(releases.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/test/changelog.test.ts`
Expected: FAIL — cannot resolve `@/lib/changelog`.

- [ ] **Step 4: Write the first changelog entries**

`content/changelog/0.1.0.de.mdx`:

```mdx
---
version: "0.1.0"
date: "2026-09-10"
title: "Öffentliche Seite und Changelog"
---

Evidoxa hat eine öffentliche Startseite. Vorher führte jeder Aufruf direkt zum
Login — es gab keine Möglichkeit, das Werkzeug zu zeigen, ohne ein Konto zu haben.

Ausserdem neu: diese Seite. Jede Veröffentlichung bekommt hier einen Eintrag.
```

`content/changelog/0.1.0.en.mdx`: the same frontmatter with `title: "Public page and changelog"` and an English body.

- [ ] **Step 5: Implement the loader**

Create `src/lib/changelog.ts`:

```ts
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";

const CONTENT_DIR = join(process.cwd(), "content", "changelog");

export interface Release {
  version: string;
  date: string;
  title: string;
  body: ReactElement;
}

interface Frontmatter {
  version: string;
  date: string;
  title: string;
}

/**
 * Reads content/changelog/{version}.{locale}.mdx, newest first.
 *
 * A release missing the requested locale falls back to the German file rather
 * than being dropped: a missing translation must never silently shorten the
 * release history.
 */
export async function listReleases(locale: string): Promise<Release[]> {
  const files = await readdir(CONTENT_DIR);
  const versions = [...new Set(files.map((f) => f.split(".").slice(0, 3).join(".")))];

  const releases = await Promise.all(
    versions.map(async (version) => {
      const preferred = join(CONTENT_DIR, `${version}.${locale}.mdx`);
      const fallback = join(CONTENT_DIR, `${version}.de.mdx`);
      const raw = await readFile(preferred, "utf8").catch(() => readFile(fallback, "utf8"));

      const { content, frontmatter } = await compileMDX<Frontmatter>({
        source: raw,
        options: { parseFrontmatter: true },
      });

      return {
        version: frontmatter.version,
        date: frontmatter.date,
        title: frontmatter.title,
        body: content,
      };
    }),
  );

  return releases.sort((a, b) => b.version.localeCompare(a.version));
}
```

- [ ] **Step 6: Build the page**

Add to `messages/de.json` under `marketing`: `"changelogPage": { "title": "Changelog", "comingNext": "Als Nächstes", "theme1": "Import und Export — Daten sollen so leicht herauskommen wie hinein.", "theme2": "Zusammenarbeit — mehrere Personen an einem Projekt, mit sichtbarer Zuschreibung.", "theme3": "Historische Ortsnamen — ein Ort, der im Lauf der Zeit mehrere Namen trägt." }`. Add the English equivalents to `messages/en.json`.

Create `src/app/[locale]/(marketing)/changelog/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

import { listReleases } from "@/lib/changelog";

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("marketing.changelogPage");
  const releases = await listReleases(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--section-gap-md)] sm:px-6">
      <h1 className="font-semibold tracking-[var(--tracking-display-sm)] text-[var(--text-display-sm)]">
        {t("title")}
      </h1>

      <section className="mt-12">
        <h2 className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          {t("comingNext")}
        </h2>
        <ul className="text-muted-foreground mt-4 space-y-3">
          <li>{t("theme1")}</li>
          <li>{t("theme2")}</li>
          <li>{t("theme3")}</li>
        </ul>
      </section>

      <div className="mt-16 space-y-12">
        {releases.map((release) => (
          <article key={release.version}>
            <p className="text-muted-foreground font-mono text-sm">
              {release.version} · {release.date}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{release.title}</h2>
            <div className="text-muted-foreground mt-4 space-y-4">{release.body}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run tests and build**

Run: `pnpm vitest run src/test/changelog.test.ts && pnpm build`
Expected: PASS, and `/de/changelog` and `/en/changelog` build.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(marketing): add MDX-backed changelog page

A release missing the requested locale falls back to German rather than
vanishing, so a missing translation cannot silently shorten the history."
```

---

## Task 9: Legal pages and SEO

**Files:**

- Create: `src/app/[locale]/(marketing)/impressum/page.tsx`, `src/app/[locale]/(marketing)/datenschutz/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/[locale]/(marketing)/page.tsx` (metadata + JSON-LD), `messages/de.json`, `messages/en.json`
- Test: `src/test/pages/marketing-seo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/test/pages/marketing-seo.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("lists both locales of every public route", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const path of ["", "/changelog", "/impressum", "/datenschutz"]) {
      expect(urls.some((u) => u.endsWith(`/de${path}`))).toBe(true);
      expect(urls.some((u) => u.endsWith(`/en${path}`))).toBe(true);
    }
  });

  it("does not expose authenticated routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((u) => u.includes("/dashboard"))).toBe(false);
    expect(urls.some((u) => u.includes("/persons"))).toBe(false);
  });
});

describe("robots", () => {
  it("disallows the authenticated app and the API", () => {
    const rules = robots().rules;
    const disallow = Array.isArray(rules)
      ? rules.flatMap((r) => r.disallow ?? [])
      : (rules.disallow ?? []);
    expect(disallow).toEqual(expect.arrayContaining(["/api/"]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/test/pages/marketing-seo.test.ts`
Expected: FAIL — cannot resolve `@/app/sitemap`.

- [ ] **Step 3: Implement sitemap and robots**

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";

const PUBLIC_PATHS = ["", "/changelog", "/impressum", "/datenschutz"] as const;
const LOCALES = ["de", "en"] as const;

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://evidoxa.com";
}

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${baseUrl()}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.6,
    })),
  );
}
```

> Confirm the real production hostname before merging and replace the fallback. Do not guess it into production.

`src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://evidoxa.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/de/dashboard", "/en/dashboard", "/de/persons", "/en/persons"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Add the legal scaffolds**

Both pages follow the same shape. `src/app/[locale]/(marketing)/impressum/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function ImpressumPage() {
  const t = await getTranslations("marketing.legal");

  return (
    <div className="mx-auto max-w-2xl px-4 py-[var(--section-gap-md)] sm:px-6">
      <h1 className="font-semibold tracking-[var(--tracking-display-sm)] text-[var(--text-display-sm)]">
        {t("imprintTitle")}
      </h1>
      <div className="text-muted-foreground mt-8 space-y-4">
        <p>{t("imprintBody")}</p>
      </div>
    </div>
  );
}
```

`datenschutz/page.tsx` is identical with `privacyTitle` / `privacyBody`.

Add to both message files under `marketing.legal`. **Claude does not draft legal text.** Use a clearly-marked stand-in that is obviously not final, e.g. DE `"imprintBody": "Angaben gemäß § 5 DDG folgen."` and `"privacyBody": "Die Datenschutzerklärung folgt."`, with the English equivalents. The real text is the user's to supply (spec §11.2).

- [ ] **Step 5: Add metadata and JSON-LD to the landing page**

In `src/app/[locale]/(marketing)/page.tsx`:

```tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.hero" });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://evidoxa.com";

  return {
    title: `Evidoxa — ${t("headline")}`,
    description: t("sub"),
    alternates: {
      canonical: `${base}/${locale}`,
      languages: { de: `${base}/de`, en: `${base}/en` },
    },
    openGraph: {
      title: `Evidoxa — ${t("headline")}`,
      description: t("sub"),
      url: `${base}/${locale}`,
      type: "website",
    },
  };
}
```

And inside the page body, before the closing fragment:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Evidoxa",
      applicationCategory: "ResearchApplication",
      operatingSystem: "Web",
      inLanguage: ["de", "en"],
    }),
  }}
/>
```

- [ ] **Step 6: Add the generated OG image**

Spec §8.4 requires OG images from `next/og`, not a raster file — this is what keeps decision D3 (no image asset pipeline) intact for social previews.

Create `src/app/[locale]/(marketing)/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Evidoxa";

export default async function OpengraphImage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "marketing.hero" });

  // Token values are inlined rather than referenced: ImageResponse renders in
  // Satori, which has no access to the stylesheet and no CSS custom properties.
  // If globals.css changes these colours, change them here too.
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "hsl(36, 25%, 98.5%)",
        color: "hsl(20, 14%, 9%)",
      }}
    >
      <div
        style={{
          fontSize: 28,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "hsl(26, 10%, 38%)",
        }}
      >
        Evidoxa
      </div>
      <div style={{ fontSize: 76, lineHeight: 1.1, marginTop: 32, maxWidth: 900 }}>
        {t("headline")}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 48 }}>
        {["hsl(180,50%,30%)", "hsl(215,50%,38%)", "hsl(265,35%,45%)", "hsl(38,65%,45%)"].map(
          (c) => (
            <div key={c} style={{ width: 120, height: 10, borderRadius: 999, background: c }} />
          ),
        )}
      </div>
    </div>,
    size,
  );
}
```

- [ ] **Step 7: Run tests and build**

Run: `pnpm vitest run && pnpm typecheck && pnpm build`
Expected: PASS. Then confirm the image actually renders:

```bash
pnpm start &
sleep 5
curl -s -o /tmp/og.png -w "%{http_code} %{content_type}\n" http://localhost:3000/de/opengraph-image
```

Expected: `200 image/png`. A 500 here usually means Satori hit an unsupported CSS property — simplify the offending style rather than adding a font or asset.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(marketing): add legal scaffolds, sitemap, robots, metadata and OG image

Legal bodies are explicit placeholders, not drafted legal text. The OG image
is generated by next/og rather than committed as a raster, which is what keeps
the no-asset-pipeline decision intact for social previews."
```

---

## Task 10: E2E coverage and the Lighthouse measurement

**Files:**

- Create: `e2e/marketing.spec.ts`
- Modify: `docs/specs/2-6-marketing-landing/progress.md` (create it)

- [ ] **Step 1: Write the E2E spec**

Create `e2e/marketing.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("marketing landing page", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("renders the landing page at /de instead of redirecting to login", async ({ page }) => {
    await page.goto("/de");
    await expect(page).toHaveURL(/\/de$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("renders the English landing page", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("advances the rail with the next paddle and announces position", async ({ page }) => {
    await page.goto("/de");
    const next = page.getByRole("button", { name: "Weiter" });
    await expect(page.getByRole("button", { name: "Zurück" })).toBeDisabled();
    await next.click();
    await expect(page.locator('[aria-live="polite"]')).toContainText("2");
  });

  test("reaches the fourth panel and disables the next paddle there", async ({ page }) => {
    await page.goto("/de");
    const next = page.getByRole("button", { name: "Weiter" });
    await next.click();
    await next.click();
    await next.click();
    await expect(next).toBeDisabled();
  });

  test("hero CTA goes to registration", async ({ page }) => {
    await page.goto("/de");
    await page.getByRole("link", { name: "Konto erstellen" }).first().click();
    await expect(page).toHaveURL(/\/de\/auth\/register$/);
  });

  test("footer legal links resolve", async ({ page }) => {
    await page.goto("/de");
    for (const [name, path] of [
      ["Impressum", "/de/impressum"],
      ["Datenschutz", "/de/datenschutz"],
    ] as const) {
      await page.goto("/de");
      await page.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });

  test("changelog lists at least one release", async ({ page }) => {
    await page.goto("/de/changelog");
    await expect(page.getByText(/0\.1\.0/)).toBeVisible();
  });

  test("respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/de");
    const reveal = page.locator(".reveal").first();
    await expect(reveal).toHaveCSS("opacity", "1");
  });

  test("page does not scroll horizontally at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/de");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
```

The last test is the one that catches display-tier `clamp()` minimums that are too large for German compounds. It is not decorative.

- [ ] **Step 2: Run E2E**

Run: `pnpm playwright test e2e/marketing.spec.ts --project=chromium`

**Expected, and this matters:** issue #61 records that the local Playwright suite fails on `main` because no client JS runs locally. If these tests fail in the same way the existing suite does, that is the known baseline — confirm by running `pnpm playwright test e2e/smoke.spec.ts --project=chromium` and comparing. Judge these tests in CI. Do not "fix" #61 inside this PR.

- [ ] **Step 3: Run the accessibility check**

Run: `pnpm test:a11y`
Expected: no new violations. Investigate every violation that names a `marketing` component.

- [ ] **Step 4: Measure Lighthouse — this is an acceptance criterion, not a formality**

```bash
pnpm build && pnpm start &
sleep 5
npx lighthouse http://localhost:3000/de --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless" --output=json --output-path=/tmp/lh-de.json
node -e "const r=require('/tmp/lh-de.json');for(const [k,v] of Object.entries(r.categories))console.log(k, Math.round(v.score*100))"
```

Record the four numbers in `progress.md`. **If any category is below 90**, spec §3.1 names the fallback: make the page static and move the session-aware nav CTA to the client. Do not silently accept a failing budget, and do not claim the number without running this.

- [ ] **Step 5: Write progress.md**

Create `docs/specs/2-6-marketing-landing/progress.md` recording: which acceptance criteria from spec §10 are met (1–4, 9–13), the four measured Lighthouse scores, the resolution of the open question in §11.1 (whether the editorial passage stayed after the hero or moved before it), and anything deferred.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(marketing): add E2E coverage and record measured Lighthouse scores"
```

---

## Task 11: Copy review pass and PR

- [ ] **Step 1: Sweep for claims the schema does not support**

```bash
grep -rniE "circa|ca\.|um [0-9]{4}|jahrzehnt|decade|zeitraum|range|terminus|ante quem" messages/ content/ src/components/marketing/
```

Read every hit and decide explicitly: supported by `prisma/schema.prisma`, or removed. Spec §6.1 forbids all of the above.

- [ ] **Step 2: Sweep for untranslated strings**

```bash
grep -rnE '>[A-ZÄÖÜ][a-zäöüß]{3,}' src/components/marketing/ | grep -v "t(" | grep -v "Evidoxa"
```

Every user-visible string must come from `t()`. This is open issue #40's failure mode; do not add to it.

- [ ] **Step 3: Confirm both message files have the same shape**

```bash
node -e "
const de=require('./messages/de.json'), en=require('./messages/en.json');
const keys=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&&v?keys(v,p+k+'.'):[p+k]);
const d=keys(de.marketing).sort(), e=keys(en.marketing).sort();
console.log('only in de:', d.filter(k=>!e.includes(k)));
console.log('only in en:', e.filter(k=>!d.includes(k)));
"
```

Both arrays must be empty.

- [ ] **Step 4: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
All four must pass. Report the actual output — do not assert success without it.

- [ ] **Step 5: Open the PR**

```bash
git push -u origin feat/2-6-marketing-landing
gh pr create --title "feat: Epic 2.6 Part A — public landing page, changelog and legal pages" --body "Closes #82. Implements docs/specs/2-6-marketing-landing/specification.md sections 3, 6, 7, 8.

Part B (#29) follows: access requests and invite-gated registration. Band 5 is deliberately a plain signup CTA here, because registration is still open until #29 lands.

Measured Lighthouse scores are recorded in progress.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 6: Update the backlog**

Move #82 to In Progress on the board when work starts, and comment on it with the measured Lighthouse numbers and the §11.1 resolution when the PR opens.

---

## Notes for the executor

- **The two review rounds are bounded.** After the second round of review-driven fixes, remaining findings get filed as issues, not implemented here (CLAUDE.md, "Responding to code review"). Correctness, security, data integrity and accessibility findings are the exception and always get fixed.
- **If a fix wants to be big, file it instead.** A review fix should be the smallest change that removes the defect.
- **Do not fix #61, #33, or #40 in this branch.** Comment on them if this work touches their surface.
- **Do not add analytics, trackers or third-party scripts.** Spec §8.4 and §13.
