import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { auth } from "./auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default auth(async function middleware(request: NextRequest) {
  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
