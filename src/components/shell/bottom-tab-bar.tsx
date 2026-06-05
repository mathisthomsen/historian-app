"use client";

/* DS: components.md Section 16 — Bottom Tab Bar (mobile/tablet navigation) */

import { FileText, LayoutDashboard, Link2, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface TabItem {
  key: string;
  icon: React.ElementType;
  labelKey: string;
  href: (locale: string) => string;
}

const TAB_ITEMS: TabItem[] = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    labelKey: "dashboard",
    href: (locale) => `/${locale}/`,
  },
  {
    key: "persons",
    icon: Users,
    labelKey: "persons",
    href: (locale) => `/${locale}/persons`,
  },
  {
    key: "events",
    icon: Zap,
    labelKey: "events",
    href: (locale) => `/${locale}/events`,
  },
  {
    key: "sources",
    icon: FileText,
    labelKey: "sources",
    href: (locale) => `/${locale}/sources`,
  },
  {
    key: "relations",
    icon: Link2,
    labelKey: "relations",
    href: (locale) => `/${locale}/relations`,
  },
];

export function BottomTabBar() {
  const t = useTranslations("shell.nav");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";
  const pathname = usePathname();

  function isActive(item: TabItem): boolean {
    const href = item.href(locale);
    if (item.key === "dashboard") {
      return (
        pathname === `/${locale}` ||
        pathname === `/${locale}/` ||
        pathname === `/${locale}/dashboard`
      );
    }
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label={t("bottomNav" as Parameters<typeof t>[0]) as string}
      className="border-border bg-card fixed right-0 bottom-0 left-0 z-40 flex h-16 items-stretch border-t lg:hidden"
    >
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const label = t(item.labelKey as Parameters<typeof t>[0]) as string;
        const active = isActive(item);
        const href = item.href(locale);

        return (
          <Link
            key={item.key}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1",
              "focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              active
                ? "border-primary text-primary border-t-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] leading-none font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
