import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { AccessRequestDecision } from "@/components/admin/AccessRequestDecision";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isExpired, type RetentionRow } from "@/lib/access-retention";
import { prisma } from "@/lib/db";
import { isOperator } from "@/lib/operators";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

/**
 * Operator confirmation page (spec §4.4, §6.3).
 *
 * READ-ONLY (I8): an email link opens this page, and mail scanners and link
 * previewers open links too. The decision is a POST from `AccessRequestDecision`;
 * nothing in this loader writes.
 */
export default async function AccessRequestPage({ params }: PageProps) {
  const { locale, id } = await params;

  // The middleware already redirects anonymous visitors; this is the belt to its braces.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/${locale}/auth/login`);

  // Operator = the database's role, now (I7). The session role is stale by
  // design and is not consulted. 404, not 403: the page must not confirm that
  // request ids exist, and the lookup below is not reached by a non-operator.
  if (!(await isOperator(userId))) notFound();

  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id },
    include: {
      invites: { select: { used_at: true, expires_at: true } },
      reviewed_by: { select: { name: true, email: true } },
    },
  });
  if (!accessRequest) notFound();

  const retentionRow: RetentionRow =
    accessRequest.status === "INVITED"
      ? {
          status: "INVITED",
          status_changed_at: accessRequest.status_changed_at,
          invites: accessRequest.invites,
        }
      : { status: accessRequest.status, status_changed_at: accessRequest.status_changed_at };
  if (isExpired(retentionRow)) notFound();

  const accountExists =
    (await prisma.user.findUnique({
      where: { email: accessRequest.email },
      select: { id: true },
    })) !== null;

  const t = await getTranslations("admin.accessRequest");
  // Europe/Berlin throughout: the operator's mail states deadlines in Berlin time (§7.1).
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(date);

  const notProvided = <span className="text-muted-foreground">{t("fields.notProvided")}</span>;
  const localeName =
    accessRequest.locale === "de" || accessRequest.locale === "en"
      ? t(`localeName.${accessRequest.locale}`)
      : accessRequest.locale;

  // Stranger-supplied text is rendered as React text nodes only — never as HTML.
  const fields: { label: string; value: React.ReactNode; multiline?: boolean }[] = [
    { label: t("fields.name"), value: accessRequest.name },
    { label: t("fields.email"), value: accessRequest.email },
    { label: t("fields.institution"), value: accessRequest.institution ?? notProvided },
    { label: t("fields.researchArea"), value: accessRequest.research_area ?? notProvided },
    {
      label: t("fields.toolGap"),
      value: accessRequest.tool_gap ?? notProvided,
      multiline: accessRequest.tool_gap !== null,
    },
    { label: t("fields.locale"), value: localeName },
    { label: t("fields.created"), value: formatDate(accessRequest.created_at) },
  ];
  if (accessRequest.reviewed_at) {
    const reviewer = accessRequest.reviewed_by?.name ?? accessRequest.reviewed_by?.email;
    const date = formatDate(accessRequest.reviewed_at);
    fields.push({
      label: t("fields.reviewed"),
      value: reviewer
        ? t("reviewedBy", { date, name: reviewer })
        : t("reviewedByUnknown", { date }),
    });
  }

  return (
    <div className="page-container mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold tracking-[-0.02em]">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="space-y-4">
            {fields.map(({ label, value, multiline }) => (
              <div key={label} className="space-y-1">
                <dt className="text-muted-foreground text-sm">{label}</dt>
                <dd className={multiline ? "break-words whitespace-pre-wrap" : "break-words"}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("decisionHeading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccessRequestDecision
            requestId={accessRequest.id}
            initialStatus={accessRequest.status}
            accountExists={accountExists}
          />
        </CardContent>
      </Card>
    </div>
  );
}
