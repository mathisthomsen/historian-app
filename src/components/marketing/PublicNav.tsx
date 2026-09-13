import Link from "next/link";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Button } from "@/components/ui/button";

interface PublicNavProps {
  isSignedIn: boolean;
  locale: string;
}

export function PublicNav({ isSignedIn, locale }: PublicNavProps) {
  const t = useTranslations("marketing.nav");

  return (
    <nav
      aria-label={t("label")}
      className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur"
    >
      {/*
        flex-wrap below `sm`: at 320px CSS width the wordmark, changelog link,
        locale switcher, theme toggle and the two auth buttons do not fit on
        one row (measured, issue #85 — WCAG 1.4.10 Reflow). Wrapping instead
        of overflowing keeps every control reachable without hiding anything
        essential. The changelog link is the one item hidden below `sm` — it
        is also linked from the footer (PublicFooter), so nothing becomes
        unreachable.
      */}
      <div className="mx-auto flex h-auto min-h-14 max-w-[var(--content-max-width)] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:h-14 sm:flex-nowrap sm:gap-x-6 sm:px-6 sm:py-0">
        <Link href={`/${locale}`} className="font-semibold tracking-tight no-underline">
          Evidoxa
        </Link>
        <Link
          href={`/${locale}/changelog`}
          className="text-muted-foreground hidden text-sm no-underline sm:inline-block"
        >
          {t("changelog")}
        </Link>
        <div className="hidden flex-1 sm:block" />
        <LocaleSwitcher />
        <ThemeToggle />
        {isSignedIn ? (
          <Button asChild size="sm">
            <Link href={`/${locale}/dashboard`}>{t("toApp")}</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/auth/login`}>{t("signIn")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/${locale}/auth/register`}>{t("register")}</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
