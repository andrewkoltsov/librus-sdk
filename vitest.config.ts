import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      thresholds: {
        branches: 80,
      },
    },
    include: ["test/**/*.test.ts"],
  },
});
