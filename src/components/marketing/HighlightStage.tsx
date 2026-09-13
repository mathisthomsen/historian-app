"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { HighlightPanel } from "@/components/marketing/HighlightPanel";

export interface StageStep {
  /** Slug; becomes the scroll target id `#highlight-<id>`. */
  id: string;
  kicker: string;
  title: string;
  body: string;
  specimen: React.ReactNode;
}

interface HighlightStageProps {
  steps: StageStep[];
}

/**
 * Band 3 — four highlights, one in focus at a time.
 *
 * This replaces a horizontal scroll-snap rail. The rail's problem was that its
 * own sizing argued against it: at `lg` the panels were 30% wide, so a laptop
 * showed three and a bit of four cards at once. A carousel that reveals almost
 * everything it is hiding is a widget with no job, and four simultaneous
 * contexts is exactly the burden the band is supposed to remove.
 *
 * ## Two layouts, one markup
 *
 * - **Fallback** — four spreads stacked in normal flow, one per screen, and no
 *   step navigation. This is what the server renders, and therefore what a
 *   crawler, a no-JS visitor, a failed bundle, a narrow viewport and anyone who
 *   asked for reduced motion all get. It needs no JavaScript to be correct.
 * - **Enhanced** — a wide viewport with motion allowed upgrades to a stage that
 *   pins while four viewport-tall sentinels scroll past beneath it; the panels
 *   cross-fade in place as each sentinel crosses the middle of the screen.
 *
 * `enhanced` starts false and can only become true inside an effect, so every
 * path that never reaches a mounted React tree keeps the fallback. That is a
 * stronger gate than the marketing layout's `.js` class, which proves only that
 * the inline script ran (see MarketingLayout and Reveal.tsx) — it does not need
 * the watchdog, because nothing here hides content in CSS ahead of JS.
 *
 * ## Scrolling is observed, never driven
 *
 * Spec §8.2 forbids scroll hijacking. Nothing here calls `scrollTo` or consumes
 * a wheel event: the pinning is `position: sticky` and the step tracking is an
 * IntersectionObserver. The step links are ordinary in-page anchors, so the
 * browser's own smooth-scroll and focus handling apply.
 *
 * ## Why no live region
 *
 * The rail announced "Panel 2 of 4" into an `aria-live` region on every paddle
 * press. Driven by scroll instead of by a click, the same region would fire on
 * every step a visitor scrolls past — noise, not information. `aria-current` on
 * the step links carries the same fact discretely, and only when a screen
 * reader user actually visits the navigation.
 */
export function HighlightStage({ steps }: HighlightStageProps) {
  const t = useTranslations("marketing.stage");
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(0);
  const sentinelsRef = useRef<Array<HTMLDivElement | null>>([]);
  const panelsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    // 64rem matches the `lg` breakpoint the spreads already switch on. A pinned
    // stage on a short phone viewport is worse than the thing it replaced: the
    // specimen and the prose cannot both be legible in what is left after the
    // browser chrome.
    // Height matters as much as width: the pinned viewport clips anything
    // taller than the screen, and a 1440x650 window is wide enough for the
    // `lg` breakpoint while being too short for a spread to fit inside it.
    const wide = window.matchMedia("(min-width: 64rem) and (min-height: 44rem)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // IntersectionObserver belongs in the gate, not only in the effect that
    // uses it. Without it the observer effect returns early while `enhanced`
    // stays true, so the CSS hides every panel but the first and nothing can
    // ever move `active` — highlights 2-4 become unreachable. `Reveal` guards
    // the same way for the same reason.
    const observable = typeof IntersectionObserver !== "undefined";
    const update = () => setEnhanced(observable && wide.matches && !reduced.matches);
    update();
    wide.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  // Honour a deep link once the stage exists.
  //
  // The step links put `#highlight-<id>` in the address bar, so those URLs get
  // shared and reloaded. The fallback layout needs no help — the id is on the
  // panel and the browser jumps to it before any JavaScript runs. The enhanced
  // layout does: the id only moves to the sentinel after `enhanced` flips, by
  // which point the browser has already resolved the hash against a document
  // that did not contain it.
  //
  // This is not scroll hijacking (spec §8.2): it performs exactly the jump the
  // browser itself would have made had the layout existed a moment earlier, and
  // only for a hash naming one of this stage's own steps. The ref keeps it to
  // once per page load, so a later resize across the breakpoint cannot yank a
  // reading visitor back to the hash.
  const honouredDeepLink = useRef(false);

  /**
   * Scroll the enhanced stage to a step and put the reader at its content.
   *
   * The anchor names the panel, but in this layout all four panels occupy one
   * sticky cell, so the browser's own jump would land on whichever of them
   * happens to be painted. The scroll offset lives on the sentinel; the reading
   * position lives on the panel. Both have to move, which is why this is a
   * function rather than a plain href.
   *
   * `preventScroll` on the focus call matters: focusing an element scrolls it
   * into view by default, which would immediately undo the sentinel scroll.
   */
  const goToStep = useCallback((index: number, focus: boolean) => {
    sentinelsRef.current[index]?.scrollIntoView({ block: "start", behavior: "auto" });
    if (focus) panelsRef.current[index]?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!enhanced || honouredDeepLink.current) return;
    honouredDeepLink.current = true;
    const id = window.location.hash.slice(1);
    const index = steps.findIndex((step) => `highlight-${step.id}` === id);
    if (index === -1) return;
    // No focus on load: the visitor did not activate anything, and stealing
    // focus on arrival is its own accessibility problem.
    goToStep(index, false);
  }, [enhanced, steps, goToStep]);

  useEffect(() => {
    if (!enhanced || typeof IntersectionObserver === "undefined") return;
    const sentinels = sentinelsRef.current.filter((node): node is HTMLDivElement => node !== null);
    if (sentinels.length === 0) return;

    // A 1px band across the middle of the viewport: whichever sentinel is
    // crossing it owns the stage. Measuring against the centre rather than an
    // edge means the panel changes when the new section is genuinely the one
    // being looked at, and it behaves the same scrolling up as scrolling down.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sentinels.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) setActive(index);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    for (const sentinel of sentinels) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enhanced, steps.length]);

  return (
    <section
      id="highlights"
      aria-labelledby="highlights-heading"
      data-enhanced={enhanced}
      className="stage"
    >
      {/*
        Visually-hidden heading rather than aria-label: the section has no
        visible heading of its own, which left the panel <h3>s skipping a level
        in the document's heading outline (axe: heading-order).
      */}
      <h2 id="highlights-heading" className="sr-only">
        {t("label")}
      </h2>

      <div className="stage-track" style={{ "--stage-steps": steps.length } as React.CSSProperties}>
        <div className="stage-viewport">
          {enhanced ? (
            <nav aria-label={t("steps")} className="stage-steps">
              {/* Explicit roles: Tailwind's preflight strips the implicit
                  list/listitem roles in WebKit (issue #90). */}
              <ol role="list">
                {steps.map((step, index) => (
                  <li key={step.id} role="listitem">
                    <a
                      href={`#highlight-${step.id}`}
                      aria-current={index === active ? "true" : undefined}
                      onClick={(event) => {
                        // Only the enhanced layout needs the interception; the
                        // nav is not rendered in the fallback, where the plain
                        // anchor already does the right thing.
                        event.preventDefault();
                        goToStep(index, true);
                        // Keep the address bar honest so the URL stays
                        // shareable, without the navigation the browser would
                        // otherwise perform.
                        window.history.replaceState(null, "", `#highlight-${step.id}`);
                      }}
                    >
                      <span aria-hidden="true" className="stage-steps-tick" />
                      {step.kicker}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="stage-panels">
            {steps.map((step, index) => (
              <div
                key={step.id}
                // The anchor target is always the panel, in both layouts.
                //
                // It has to be an element that exists: in the fallback the
                // sentinels are `display: none`, so an id parked on one
                // resolved to nothing and a shared `#highlight-…` link left the
                // visitor at the top — measured at 390px, scrollY 0 with the
                // panel 3675px away. It also has to be an element in the
                // accessibility tree: the sentinels live in an `aria-hidden`
                // subtree, so a fragment pointing at one has no destination for
                // a screen reader, which left the user on the link instead of
                // at the content they asked for.
                //
                // The panel satisfies both. In the fallback the browser honours
                // the link with no JavaScript at all; in the enhanced layout
                // the panels share one sticky cell and have no distinct scroll
                // positions, so `goToStep` below translates the same target
                // into the right scroll offset and moves focus here.
                id={`highlight-${step.id}`}
                ref={(node) => {
                  panelsRef.current[index] = node;
                }}
                tabIndex={-1}
                data-slot="stage-panel"
                data-active={index === active}
                className="stage-panel"
              >
                <HighlightPanel
                  kicker={step.kicker}
                  title={step.title}
                  body={step.body}
                  specimen={step.specimen}
                />
              </div>
            ))}
          </div>
        </div>

        {/*
          Scroll spacers, and the anchor targets the step links point at. They
          carry no content — the panels above are the content, and they stay in
          the accessibility tree in both layouts. In the fallback the whole
          block is display:none, which takes the now-unreachable anchors out of
          the accessibility tree with it.
        */}
        <div aria-hidden="true" className="stage-sentinels">
          {steps.map((step, index) => (
            <div
              key={step.id}
              // No id: these carry scroll extent, not identity. They sit in an
              // `aria-hidden` subtree, so an anchor pointing here would have no
              // destination in the accessibility tree.
              ref={(node) => {
                sentinelsRef.current[index] = node;
              }}
              className="stage-sentinel"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
