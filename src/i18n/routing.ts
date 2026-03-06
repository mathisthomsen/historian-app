import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "always",
  // Disable browser Accept-Language header detection so the default locale
  // (de) is used when no NEXT_LOCALE cookie is present.
  // Locale preference is detected from the cookie only.
  localeDetection: false,
});
