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
      <div className="mx-auto flex h-14 max-w-[var(--content-max-width)] items-center gap-6 px-4 sm:px-6">
        <Link href={`/${locale}`} className="font-semibold tracking-tight no-underline">
          Evidoxa
        </Link>
        <Link href={`/${locale}/changelog`} className="text-muted-foreground text-sm no-underline">
          {t("changelog")}
        </Link>
        <div className="flex-1" />
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
