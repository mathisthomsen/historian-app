"use client";

/* DS: components.md Section 15 — Sidebar (Tasks 4.2, 4.3, 4.4, 4.5, 4.6) */

import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Link2,
  ListFilter,
  MapPin,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const t = useTranslations("shell.nav");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";
  const pathname = usePathname();

  const primaryNavItems = [
    { key: "dashboard", icon: LayoutDashboard, label: t("dashboard"), disabled: false },
    { key: "persons", icon: Users, label: t("persons"), disabled: false },
    { key: "events", icon: Zap, label: t("events"), disabled: false },
    { key: "sources", icon: FileText, label: t("sources"), disabled: false },
    { key: "relations", icon: Link2, label: t("relations"), disabled: false },
    { key: "locations", icon: MapPin, label: t("locations"), disabled: true },
    { key: "literature", icon: BookOpen, label: t("literature"), disabled: true },
    { key: "settings", icon: Settings, label: t("settings"), disabled: true },
  ] as const;

  const settingsNavItems = [
    { key: "settings/event-types", icon: ListFilter, label: t("event_types") },
    { key: "settings/relation-types", icon: Link2, label: t("relation_types") },
  ] as const;

  function isActive(key: string): boolean {
    if (key === "dashboard") {
      return (
        pathname === `/${locale}` ||
        pathname === `/${locale}/` ||
        pathname === `/${locale}/dashboard`
      );
    }
    return pathname.startsWith(`/${locale}/${key}`);
  }

  function navLink(key: string, icon: React.ElementType, label: string, disabled = false) {
    const href = `/${locale}/${key === "dashboard" ? "" : key}`;
    const Icon = icon;
    const active = isActive(key);

    if (disabled) {
      return (
        <span
          key={key}
          className={cn(
            "text-muted-foreground pointer-events-none relative flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium opacity-50",
            !isOpen && "justify-center",
          )}
          aria-label={label}
          aria-disabled="true"
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {isOpen && <span>{label}</span>}
        </span>
      );
    }

    return (
      <Link
        key={key}
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "text-muted-foreground relative flex items-center gap-2 rounded-r-md px-3 py-2.5 text-sm font-medium transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          "focus-visible:ring-sidebar-ring focus-visible:ring-2 focus-visible:outline-none",
          !isOpen && "justify-center",
          active && "bg-sidebar-accent text-sidebar-accent-foreground border-primary border-l-2",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {isOpen && <span>{label}</span>}
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar fixed top-14 bottom-0 left-0 z-40 hidden flex-col border-r",
        "overflow-hidden transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-move)]",
        "lg:flex",
        isOpen ? "w-56" : "w-12",
      )}
      aria-label="Primary navigation"
    >
      <nav className="flex h-full flex-col p-2" role="navigation">
        <div className="flex-1 space-y-1">
          {primaryNavItems.map(({ key, icon, label, disabled }) =>
            navLink(key, icon, label, disabled),
          )}
        </div>
        <div className="mt-auto">
          <Separator className="mb-2" />
          {settingsNavItems.map(({ key, icon, label }) => navLink(key, icon, label))}
        </div>
      </nav>
    </aside>
  );
}
