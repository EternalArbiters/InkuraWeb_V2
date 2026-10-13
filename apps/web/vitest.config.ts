import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // See tests/fixtures/empty-module.ts — Next.js resolves these two itself,
      // Vite does not.
      "server-only": path.resolve(__dirname, "tests/fixtures/empty-module.ts"),
      "client-only": path.resolve(__dirname, "tests/fixtures/empty-module.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.spec.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
