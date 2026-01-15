import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "e2e/**", // E2E tests use Playwright
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
