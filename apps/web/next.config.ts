import type { NextConfig } from "next";

// Inkura v13:
// - Web + API + NextAuth are hosted in the SAME Next.js app (apps/web).
// - No cross-origin /api rewrites (fixes session/cookie issues).
// - Uploads are served from Cloudflare R2 (no /uploads rewrite).
// - IMPORTANT (cost): disable Next.js image optimizer so images are fetched directly from R2/CDN.

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  // Reduce serverless function bundle duplication (helps large route trees + Prisma on Vercel).
  // This often prevents deploy-time "Deploying outputs..." internal errors on Hobby.
  output: "standalone",
  experimental: {
    // Keep Prisma out of RSC bundling/tracing to avoid repeated native engine copies.
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
