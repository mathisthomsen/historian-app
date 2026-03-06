"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations("common");
  const isDev = process.env["NODE_ENV"] === "development";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center gap-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle>{t("error")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isDev ? error.message : "An unexpected error occurred."}
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={reset}>{t("tryAgain")}</Button>
          <Button asChild variant="outline">
            <Link href="/">{t("backToHome")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
