import type { NextConfig } from "next";

// The site is a static export served by GitHub Pages from a project path.
// trailingSlash keeps the old URLs: /weeks/week05/ is out/weeks/week05/index.html.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/02805_social_graphs",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { globalNotFound: true },
};

export default nextConfig;
