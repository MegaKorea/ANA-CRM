import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    // Suppress Dart Sass @import deprecation warnings (cosmetic only, not errors)
    silenceDeprecations: ["import"],
  },
  // Allow the dev server to accept cross-origin requests from a Cloudflare quick
  // tunnel (phone testing over HTTPS) and the LAN IP. Dev-only; harmless in prod.
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.1.18"],
};

export default nextConfig;
