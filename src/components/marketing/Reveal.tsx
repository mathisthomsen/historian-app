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
