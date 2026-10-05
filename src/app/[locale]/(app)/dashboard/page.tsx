import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const t = await getTranslations("auth.dashboard");
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  const name = session.user.name ?? session.user.email;
  const projectId = session.user.projectId;

  return (
    <div className="page-container mx-auto space-y-4">
      <h1 className="text-foreground text-3xl font-semibold tracking-[-0.02em]">
        {t("welcome", { name })}
      </h1>
      <p className="text-muted-foreground">{t("loggedIn")}</p>
      <div className="space-y-2">
        {projectId ? (
          <div className="space-y-1">
            <Button asChild variant="outline">
              <a href={`/api/projects/${projectId}/export`} download>
                {t("export.action")}
              </a>
            </Button>
            <p className="text-muted-foreground text-sm">{t("export.help")}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("export.noProject")}</p>
        )}
      </div>
      <LogoutButton label={t("logout")} />
    </div>
  );
}
