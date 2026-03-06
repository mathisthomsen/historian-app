import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Validate env at build time
import "./src/lib/env";

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default withNextIntl(config);
