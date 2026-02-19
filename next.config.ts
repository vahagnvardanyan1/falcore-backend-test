import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["@playwright/test", "playwright"],
};

export default nextConfig;
