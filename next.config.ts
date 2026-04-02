import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/finanzzz" : "",
  assetPrefix: isProd ? "/finanzzz/" : "",
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
