import * as React from "react";

import { cn } from "@/lib/utils";

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native select styled to match Input/Textarea (audit F-M9).
 *
 * Distinct from ui/select.tsx, which is the design system's Radix listbox.
 * Epic 2.5 converted SourceTable and RelationsDataTable to that; the three
 * call sites still using a native element share this instead of re-deriving
 * the class string. Converting them is a deliberate UX decision, not a
 * side effect of a merge.
 *
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
