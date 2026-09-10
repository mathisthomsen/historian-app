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
      <ul
        ref={railRef}
        onScroll={syncFromScroll}
        className="grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto pb-4 [scrollbar-width:thin] sm:auto-cols-[52%] lg:auto-cols-[30%]"
      >
        {panels.map((panel, index) => (
          <li key={index} className="snap-start">
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
