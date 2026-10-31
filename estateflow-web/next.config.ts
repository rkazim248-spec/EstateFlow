import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  // The repository root also contains a Flutter app and another lockfile.
  // Pin tracing to this app so the build does not infer C:\Users\HP.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
