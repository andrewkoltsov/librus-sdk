import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 93,
        branches: 85,
        functions: 95,
        lines: 93,
      },
    },
    include: ["test/**/*.test.ts"],
  },
});
