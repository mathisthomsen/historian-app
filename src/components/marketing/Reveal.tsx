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

type WindowWithRevealWatchdog = Window & {
  __revealWatchdog?: ReturnType<typeof setTimeout>;
};

export function Reveal({ children, className }: RevealProps) {
  // Reduced motion is resolved during the first render, not in an effect, so
  // the element never flashes a hidden state at users who asked for stillness.
  const [revealed, setRevealed] = useState(() => prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  // Cancel the marketing layout's watchdog (see layout.tsx): its inline
  // script strips the .js class after a grace period in case the bundle
  // never loads. Once any Reveal has actually mounted, React is running and
  // the watchdog's job is done — leaving it armed would strip .js under a
  // visitor's feet on a slow-but-successful load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as WindowWithRevealWatchdog;
    if (win.__revealWatchdog !== undefined) {
      clearTimeout(win.__revealWatchdog);
      delete win.__revealWatchdog;
    }
  }, []);

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    // An element the visitor scrolled past without it ever intersecting
    // would otherwise never receive an IntersectionObserver callback and
    // stay opacity: 0 forever — isIntersecting only fires on a threshold
    // *crossing*, so an element that goes straight from below the viewport
    // to above it (never true in between) produces no callback at all.
    // Two distinct moments need this check, not one:
    //  - at mount, for scroll position already restored above the fold
    //    (e.g. back-navigation landing mid-page before this effect runs);
    //  - on every subsequent scroll, for a same-page anchor jump that
    //    happens *after* mount (e.g. the hero's "#highlights" CTA), which a
    //    mount-only check cannot see because the element was still below
    //    the viewport — not yet past it — when the effect first ran.
    const revealIfAboveViewport = () => {
      if (node.getBoundingClientRect().bottom <= 0) {
        setRevealed(true);
        return true;
      }
      return false;
    };
    if (revealIfAboveViewport()) return;
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
    window.addEventListener("scroll", revealIfAboveViewport, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", revealIfAboveViewport);
    };
  }, [revealed]);

  return (
    <div ref={ref} data-revealed={revealed} className={cn("reveal", className)}>
      {children}
    </div>
  );
}
