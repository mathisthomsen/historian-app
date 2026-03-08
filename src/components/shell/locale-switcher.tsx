"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback } from "react";

import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Locale = (typeof routing.locales)[number];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;

      const segments = pathname.split("/");
      if (segments[1] === locale) {
        segments[1] = nextLocale;
      }
      const nextPath = segments.join("/") || `/${nextLocale}`;

      // Set cookie for persistence
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 30}`;

      router.replace(nextPath);
    },
    [locale, pathname, router],
  );

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language switcher">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          aria-pressed={loc === locale}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium uppercase transition-colors",
            loc === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
