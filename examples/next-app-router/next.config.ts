import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aip/core", "@aip/verify", "@aip/next"],
};

export default nextConfig;
