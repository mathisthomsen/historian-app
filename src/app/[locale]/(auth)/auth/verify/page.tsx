import { getTranslations } from "next-intl/server";

import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("auth.verify");
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <VerifyEmailCard token={token} />
      </CardContent>
    </Card>
  );
}
