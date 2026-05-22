import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      accounts: new URL("./src/lib/wallet/accounts-stub.ts", import.meta.url)
        .pathname
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "polymarket-upload.s3.us-east-2.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "gamma-api.polymarket.com"
      }
    ]
  },
  typedRoutes: true
};

export default withNextIntl(nextConfig);
