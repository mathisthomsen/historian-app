import { XCircle } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/** The non-`valid` states of the register page's invite preview (spec §4.2, §6.2). */
export type InviteStateKind = "missing" | "invalid" | "expired" | "used";

interface InviteStateCardProps {
  kind: InviteStateKind;
}

/**
 * What the register page shows instead of the form. The sentence is the same
 * copy `RegisterForm` shows when a 403 arrives after submit (spec §8): one copy,
 * two readers.
 */
export function InviteStateCard({ kind }: InviteStateCardProps) {
  const t = useTranslations("auth.invite");
  const locale = useLocale();

  // A used invite means the account exists, so the way forward is signing in;
  // every other state is a dead end that only a new request resolves.
  const action =
    kind === "used"
      ? { href: `/${locale}/auth/login`, label: t("toLogin") }
      : {
          href: `/${locale}#access`,
          label: kind === "expired" ? t("requestAgain") : t("requestAccess"),
        };

  return (
    <div className="space-y-3">
      <div className="text-destructive flex items-start gap-2 text-sm">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>{t(kind)}</p>
      </div>
      <Link href={action.href} className="text-primary block text-sm hover:underline">
        {action.label}
      </Link>
    </div>
  );
}
