import type { NextConfig } from "next";

// Inkura v13:
// - Web + API + NextAuth are hosted in the SAME Next.js app (apps/web).
// - No cross-origin /api rewrites (fixes session/cookie issues).
// - Uploads are served from Cloudflare R2 (no /uploads rewrite).

const nextConfig: NextConfig = {
  // keep default config
};

export default nextConfig;
