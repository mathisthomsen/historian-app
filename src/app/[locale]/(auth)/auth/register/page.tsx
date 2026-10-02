import { getTranslations } from "next-intl/server";

import { InviteStateCard } from "@/components/auth/InviteStateCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveInvite } from "@/lib/invite";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("auth.register");
  const params = await searchParams;
  // A repeated `?invite=a&invite=b` is not a token. Read-only preview (I8): this
  // GET writes nothing, and the lookup is by hash of a 256-bit token, so it
  // needs no rate limit (spec §4.2).
  const presented = typeof params.invite === "string" ? params.invite : null;
  const invite = await resolveInvite(presented);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {invite.kind === "valid" ? (
          <RegisterForm invite={{ email: invite.email, token: invite.token }} />
        ) : (
          <InviteStateCard kind={invite.kind} />
        )}
      </CardContent>
    </Card>
  );
}
