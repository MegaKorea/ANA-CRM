import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    // Suppress Dart Sass @import deprecation warnings (cosmetic only, not errors)
    silenceDeprecations: ["import"],
  },
};

export default nextConfig;
