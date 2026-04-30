import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      thresholds: {
        branches: 84,
      },
    },
    include: ["test/**/*.test.ts"],
  },
});
