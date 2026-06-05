import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // ---- Standard shadcn variants ----
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",

        // ---- Semantic variants ----
        success:
          "bg-[var(--color-success-background)] text-[var(--color-success-foreground)] border-[var(--color-success-border)]",
        warning:
          "bg-[var(--color-warning-background)] text-[var(--color-warning-foreground)] border-[var(--color-warning-border)]",
        info: "bg-[var(--color-info-background)] text-[var(--color-info-foreground)] border-[var(--color-info-border)]",

        // ---- Certainty variants ----
        // Colors are fully managed by the .certainty-* utility classes in
        // globals.css @layer components (background, border-color, color).
        // .certainty-unevidenced also applies border-style: dashed.
        certain: "certainty-certain",
        probable: "certainty-probable",
        possible: "certainty-possible",
        unknown: "certainty-unknown",
        unevidenced: "certainty-unevidenced",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
