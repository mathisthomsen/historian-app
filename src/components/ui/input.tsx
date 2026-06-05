import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "border-input-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring disabled:bg-muted/50 read-only:bg-muted/30 flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors duration-[var(--duration-fast)] file:border-0 file:bg-transparent file:text-sm file:font-medium read-only:cursor-default focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
