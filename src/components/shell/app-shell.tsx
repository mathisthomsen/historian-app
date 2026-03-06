"use client";

import { useSidebar } from "@/hooks/use-sidebar";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={toggle} />
      <Sidebar isOpen={isOpen} />
      <main
        className="pt-14 transition-all duration-200"
        style={{ paddingLeft: isOpen ? "14rem" : "3rem" }}
      >
        {children}
      </main>
    </div>
  );
}
