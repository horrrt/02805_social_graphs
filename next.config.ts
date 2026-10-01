import { execSync } from "node:child_process";
import type { NextConfig } from "next";

// The site is a static export served by GitHub Pages from a project path.
// trailingSlash keeps the old URLs: /weeks/week05/ is out/weeks/week05/index.html.
// `next dev` serves from the root so the preview opens on a page, not a 404.
const basePath = process.env.NODE_ENV === "production" ? "/02805_social_graphs" : "";

// Files under public/ keep fixed names, so their URLs carry the commit instead
// (src/scripts/site.js). Next hashes everything it bundles on its own.
function buildId(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 10);
  try {
    return execSync("git rev-parse --short=10 HEAD", { encoding: "utf8" }).trim();
  } catch {
    return String(Date.now());
  }
}

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_BUILD_ID: buildId(),
  },
  experimental: { globalNotFound: true },
};

export default nextConfig;
