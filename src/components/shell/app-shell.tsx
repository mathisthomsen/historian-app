"use client";

/* DS: components.md Section 15–16 — AppShell layout (Task 4.1) */

import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

import { BottomTabBar } from "./bottom-tab-bar";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="bg-background min-h-screen">
      <TopBar onToggleSidebar={toggle} />
      <Sidebar isOpen={isOpen} />
      <main
        aria-label="Main content"
        className={cn(
          "topbar-inset transition-[padding-left] duration-[var(--duration-normal)]",
          isOpen ? "sidebar-inset" : "sidebar-inset-collapsed",
        )}
      >
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
