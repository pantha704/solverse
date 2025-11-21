import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ This allows production builds to successfully complete even if
    // your project has type errors. Use with caution!
    ignoreBuildErrors: false, // Set to true to ignore TS errors
  }
};

export default nextConfig;
