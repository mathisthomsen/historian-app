/* DS: concept.md Section 4.1 — Page Navigation Transitions (Layer 6, Task 6.7)
   Re-mounted on every route change by Next.js App Router (unlike layout.tsx).
   Applies a fade-in animation on each navigation using the deliberate duration
   token (500ms). Spatial motion is intentionally absent — opacity only.
   prefers-reduced-motion: animation-duration is zeroed by the global reset in
   globals.css @layer base, making this an instant content swap. */

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in fill-mode-both duration-[var(--duration-deliberate)]">
      {children}
    </div>
  );
}
