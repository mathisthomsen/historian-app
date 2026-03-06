"use client";

import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Link2,
  MapPin,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const t = useTranslations("shell.nav");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";

  const navItems = [
    { key: "dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { key: "persons", icon: Users, label: t("persons") },
    { key: "events", icon: Zap, label: t("events") },
    { key: "sources", icon: FileText, label: t("sources") },
    { key: "relations", icon: Link2, label: t("relations") },
    { key: "locations", icon: MapPin, label: t("locations") },
    { key: "literature", icon: BookOpen, label: t("literature") },
    { key: "settings", icon: Settings, label: t("settings") },
  ] as const;

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-14 z-30 flex flex-col border-r bg-background transition-all duration-200",
        isOpen ? "w-56" : "w-12",
      )}
      aria-label="Main navigation"
    >
      <nav className="flex flex-col gap-1 p-2" role="navigation">
        {navItems.map(({ key, icon: Icon, label }) => (
          <Link
            key={key}
            href={`/${locale}#`}
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
        ))}
      </nav>
    </aside>
  );
}
