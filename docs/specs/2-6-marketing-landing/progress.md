# Epic 2.6 Part A — Progress

## Task 10: E2E coverage and the Lighthouse measurement

Date: 2026-09-11. Branch: `feat/2-6-marketing-landing`.

### Acceptance criteria (spec §10, Part A takes 1–4 and 9–13)

| #   | Criterion                                                                                       | Status                                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/de` and `/en` render the landing page; `src/app/[locale]/page.tsx` is gone, no route conflict | **Met**                                     | `e2e/marketing.spec.ts` "renders the landing page at /de..." and "renders the English landing page" pass. `pnpm build` shows `[locale]` resolving through `(marketing)/page.tsx` with no duplicate route error.                                                                                                                                                                                                                                                                                                  |
| 2   | Signed-in visitor sees _Zur App_; guest sees _Anmelden_ and _Zugang anfragen_                   | **Partially met, as scoped by §11.3**       | Part A ships the plain-CTA nav (`Anmelden` + `Konto erstellen`, no "Zugang anfragen" — that copy belongs to Part B/#29, which does not exist yet). Guest nav strings verified via `messages/de.json` (`marketing.nav.signIn` = "Anmelden", `marketing.nav.register` = "Konto erstellen") and the English-nav E2E test. Signed-in `Zur App` (`marketing.nav.toApp`) not covered by a dedicated E2E test in this task (would require a seeded session); code path exists in `PublicNav.tsx` (`isSignedIn` branch). |
| 3   | All four highlight panels reachable by scroll, paddle, keyboard; live region announces position | **Met, with one caveat filed as issue #86** | Paddle navigation + live-region announcement verified one click at a time (`e2e/marketing.spec.ts` "advances the rail..." passes: `Panel 2 von 4`). Reaching panel 4 via three rapid, unpaced clicks is flaky — traced to a real race between the paddle's `goTo()` and the rail's scroll-sync `syncFromScroll()`, filed as **#86** (not fixed here, out of scope for this task). Keyboard reachability (Tab + Enter) not separately exercised by an E2E test in this task.                                      |
| 4   | `prefers-reduced-motion: reduce` produces no transitions                                        | **Met**                                     | "respects reduced motion" test passes: `.reveal` computes `opacity: 1` under `reducedMotion: "reduce"`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| 9   | `/de/changelog` renders every MDX release plus three "coming next" themes                       | **Partially covered**                       | Test confirms the one existing release (`0.1.0`) renders. "Coming next" themes not asserted by E2E in this task (deferred — no test written for that content).                                                                                                                                                                                                                                                                                                                                                   |
| 10  | `/de/impressum` and `/de/datenschutz` resolve and are linked from the footer                    | **Met**                                     | "footer legal links resolve" test passes for both.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 11  | Every string renders in DE and EN; no hardcoded literals                                        | **Not independently re-verified this task** | Not re-audited; relies on prior tasks' i18n work. Out of scope here.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 12  | Lighthouse ≥ 90 on `/de`, measured and recorded                                                 | **Met — measured, see below**               | performance 97, accessibility 98, best-practices 96, seo 91. All four ≥ 90; spec §3.1's static-fallback trigger does not apply.                                                                                                                                                                                                                                                                                                                                                                                  |
| 13  | No copy on the page claims behaviour absent from `prisma/schema.prisma`                         | **Not independently re-verified this task** | Not re-audited; no new copy was written in this task.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### Lighthouse measurement (measured, not inferred)

Built and started the production server (`pnpm build && pnpm start`, port 3000, confirmed listening and returning `200` on `/de` via `curl` before measuring), then ran:

```
npx lighthouse http://localhost:3000/de --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless" --output=json --output-path=<scratch>/lh-de.json
```

Lighthouse 12.8.2, against a locally built production `next start` server (Next.js 15.5.23), one run, default (simulated) throttling.

| Category       | Score  |
| -------------- | ------ |
| Performance    | **97** |
| Accessibility  | **98** |
| Best Practices | **96** |
| SEO            | **91** |

All four ≥ 90 — the spec §3.1 fallback (drop dynamic rendering, move the session-aware CTA to the client) is **not** triggered.

Non-blocking findings from the same run, recorded for completeness, not acted on (all four categories already clear the ≥90 bar):

- `accessibility`: `heading-order` audit fails (heading elements not in sequential descending order) — worth checking against the `h1 → h3 → h2` pattern visible in the rendered page (rail panels are `h3`, the editorial/CTA bands are `h2`, appearing after the rail's `h3`s).
- `seo`: `meta-description` audit reports the page as missing a meta description, even though `curl`-fetched HTML _does_ contain `<meta name="description" content="...">` — this looks like a timing artifact of Next.js's streamed/deferred metadata injection (the async `generateMetadata` calls `getTranslations`, so Next renders the shell first and patches `<head>` in via a streamed script). Tested the throttling-timing hypothesis directly: re-ran SEO-only with `--throttling-method=provided` (no simulated throttling) and got the identical result (score 0), so it is not simply a throttling artifact — root cause not identified further; out of scope to chase since the SEO score already clears 90.
- `best-practices`: `errors-in-console` — not investigated further (score already 96).

### §11.1 — placement of the editorial passage

**Resolved: the editorial passage stayed after the hero**, not before it. Confirmed by reading the live band order in `src/app/[locale]/(marketing)/page.tsx`: Hero → `EditorialPassage` → `HighlightRail` → `OpenDevelopment` → `CtaBand`. This matches the "arrives at the problem after the hero" option the open question left unsettled at spec-writing time; no further copy-pass decision was needed in this task since the placement was already implemented by an earlier task.

### E2E run and the #61 determination

Ran `pnpm playwright test e2e/marketing.spec.ts --project=chromium`: **7 passed, 2 failed** (of 9).

Compared against the required baseline, `pnpm playwright test e2e/smoke.spec.ts --project=chromium`: **12/12 passed**, including tests that exercise client JS directly (TC-04/05 locale switcher, TC-08 dialog open/close, TC-09 theme toggle, TC-11 login + sidebar).

**Conclusion: issue #61 ("no client JS runs locally") does not reproduce in this checkout.** This matches #61's own latest comment (post-#73: "the reported blanket local hydration failure is not reproducible in this checkout"). The task brief's framing of #61 as an active, unconditional local baseline was stale; corrected via a comment on #61 recording this measurement, so future tasks don't inherit the stale assumption unchecked.

Because #61 does not apply, **both marketing.spec.ts failures are real product defects**, not environment noise:

1. **"reaches the fourth panel and disables the next paddle there"** — flaky (measured 2 pass / 1 fail across 3 identical runs). Root-caused to a race between `HighlightRail`'s paddle-driven `goTo()` and its scroll-sync `syncFromScroll()` handler when clicks land faster than the smooth-scroll animation settles. Filed as **issue #86** (`priority: medium`, `area: frontend` + `area: accessibility`). Not fixed — out of scope for this task; the test itself is left as specified (matches the plan's given code) since forcing it to pass with artificial waits would hide the underlying race rather than surface it.
2. **"page does not scroll horizontally at 320px"** — deterministic failure. Traced (by filtering out elements clipped by a legitimate `overflow-x: auto` ancestor, which rules out `HighlightRail`'s intentional carousel) to `PublicNav`: its single unwrapped flex row (logo, changelog link, locale switcher, theme toggle, `Anmelden` + `Konto erstellen`) doesn't fit at 320 CSS px, producing genuine page-wide horizontal scroll — a WCAG 1.4.10 Reflow (AA) failure. Filed as **issue #85** (`priority: high`, `area: accessibility` + `area: frontend`). Not fixed — out of scope for this task.

One test-authoring bug was fixed in-branch (not a product defect): the brief's rail-position test used an unscoped `[aria-live="polite"]` selector, which is a strict-mode violation because the root layout's Sonner `<Toaster>` also renders an `aria-live="polite"` region on every page. Scoped the selector to `#highlights [aria-live="polite"]` in `e2e/marketing.spec.ts`.

### Accessibility check (`pnpm test:a11y`)

**Could not run — the script is broken and pre-existing.** `package.json`'s `test:a11y` runs `playwright test e2e/design-system/a11y.spec.ts`, but that file does not exist and has never existed in this repo's git history. The axe-core helper it presumably targets (`e2e/helpers/a11y.ts`) is unused by any spec in the repo. Result: `Error: No tests found.` No marketing-component a11y violations could be surfaced through this script because it does not run anything. Filed as **issue #87** (`priority: medium`, `area: ci` + `area: accessibility`). Not fixed — pre-existing, out of scope, and not something this task's file list touches. `pnpm test:ds` remains separately broken and out of scope per existing project memory; this is a different, previously untracked script.

### Deviations from the brief

- Scoped the `[aria-live="polite"]` selector in one test (see above) — a minimal, justified test fix, not a scope expansion.
- Did not fix either real defect the new tests exposed (#85, #86) or the broken `test:a11y` script (#87) — filed as issues per CLAUDE.md's backlog discipline instead of widening this task.
- Left `e2e/marketing.spec.ts` matching the brief's code exactly otherwise, including the flaky rapid-click test, so it continues to surface #86 rather than being quietly stabilized.

### Issues filed this task

- **#85** — `PublicNav` overflows horizontally at 320px (WCAG 1.4.10 Reflow failure). `priority: high`.
- **#86** — `HighlightRail` rapid-click race can desync active panel / announcement. `priority: medium`.
- **#87** — `pnpm test:a11y` references a spec file that has never existed; no a11y scanning currently runs. `priority: medium`.
- Commented on **#61** with fresh measured evidence that the local no-client-JS baseline does not reproduce in this checkout.

All three new issues are on the Evidoxa Backlog project board with Status `Todo`.
