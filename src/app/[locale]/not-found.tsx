import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{t("notFound")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("notFoundDescription")}</p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/">{t("backToHome")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
