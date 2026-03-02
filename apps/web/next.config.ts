import type { NextConfig } from "next";

// Inkura v13:
// - Web + API + NextAuth are hosted in the SAME Next.js app (apps/web).
// - No cross-origin /api rewrites (fixes session/cookie issues).
// - Uploads are served from Cloudflare R2 (no /uploads rewrite).
// - IMPORTANT (cost): disable Next.js image optimizer so images are fetched directly from R2/CDN.

const nextConfig: NextConfig = {
  // Helps Vercel deploy stability by reducing trace duplication across many routes/functions.
  output: "standalone",

  // Next 14: keep Prisma packages external to avoid bundling native engines into every route.
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
