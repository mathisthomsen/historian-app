import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const t = await getTranslations("auth.dashboard");
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  const name = session.user.name ?? session.user.email;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{t("welcome", { name })}</h1>
      <p className="text-muted-foreground">{t("loggedIn")}</p>
      <LogoutButton label={t("logout")} />
    </div>
  );
}
