"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  // The scroll container is a wrapper, not the tablist itself.
  //
  // `overflow-x: auto` forces the computed `overflow-y` to `auto` as well —
  // there is no way to clip one axis and not the other. Scrolling the tablist
  // directly therefore clipped every trigger's focus ring, which is drawn
  // OUTSIDE the trigger box (`ring-2` + `ring-offset-2`): a keyboard user saw a
  // stray 2px line at one edge instead of a ring (WCAG 2.4.7).
  //
  // `-my-2 py-2` moves the clip boundary 8px beyond the strip on each side, so
  // a 4px ring sits comfortably inside it, while the negative margin cancels
  // the padding's effect on layout. The tablist keeps `w-full min-w-max` so it
  // fills the wrapper when the triggers fit and overflows it when they do not
  // (issue #70).
  <div className="scrollbar-none -my-2 max-w-full overflow-x-auto overscroll-x-contain py-2">
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "border-border text-muted-foreground inline-flex h-10 w-full min-w-max items-center justify-start border-b",
        className,
      )}
      {...props}
    />
  </div>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // `shrink-0` keeps every trigger at its natural width inside the now-
      // scrollable TabsList — without it, flex would compress triggers to fit
      // the container instead of letting the strip overflow and scroll.
      "text-muted-foreground hover:text-foreground focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:text-foreground -mb-px inline-flex shrink-0 items-center justify-center border-b-2 border-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
