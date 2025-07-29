import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol:'https',
        hostname: 'cloud.appwrite.io',
        pathname:'**'
      },
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
        pathname: '**'
      }
    ]
  }
  /* config options here */

};
const withNextIntl = createNextIntlPlugin();

export default nextConfig;
