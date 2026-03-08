import { XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reset.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{t("errors.tokenInvalid")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
