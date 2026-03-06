"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const t = useTranslations("shell.topbar");

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4"
      role="banner"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={t("toggleSidebar")}
        data-testid="sidebar-toggle"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="text-lg font-semibold">Evidoxa</div>

      {/* Project switcher stub */}
      <Button variant="outline" size="sm" className="ml-2 hidden sm:flex" disabled>
        <span className="text-muted-foreground">{t("selectProject")}</span>
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
