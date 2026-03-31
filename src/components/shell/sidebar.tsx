"use client";

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
import { useParams } from "next/navigation";
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

  function navLink(key: string, icon: React.ElementType, label: string, disabled = false) {
    const href = `/${locale}/${key === "dashboard" ? "" : key}`;
    const Icon = icon;

    if (disabled) {
      return (
        <span
          key={key}
          className={cn(
            "flex cursor-not-allowed items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground opacity-50 pointer-events-none",
            !isOpen && "justify-center",
          )}
          title={!isOpen ? label : undefined}
          aria-label={label}
          aria-disabled="true"
        >
          <Icon className="h-4 w-4 shrink-0" />
          {isOpen && <span className="truncate">{label}</span>}
        </span>
      );
    }

    return (
      <Link
        key={key}
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          !isOpen && "justify-center",
        )}
        title={!isOpen ? label : undefined}
        aria-label={label}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {isOpen && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-14 z-30 flex flex-col border-r bg-background transition-all duration-200",
        isOpen ? "w-56" : "w-12",
      )}
      aria-label="Main navigation"
    >
      <nav className="flex h-full flex-col p-2" role="navigation">
        <div className="flex-1 space-y-1">
          {primaryNavItems.map(({ key, icon, label, disabled }) => navLink(key, icon, label, disabled))}
        </div>
        <div className="mt-auto">
          <Separator className="mb-2" />
          {settingsNavItems.map(({ key, icon, label }) => navLink(key, icon, label))}
        </div>
      </nav>
    </aside>
  );
}
