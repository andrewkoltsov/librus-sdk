import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

const vitestGlobals = {
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  vi: "readonly",
};

export default tseslint.config(
  {
    ignores: [
      ".claude/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      ".husky/_/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["test/**/*.ts", "vitest.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitestGlobals,
      },
    },
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
  eslintConfigPrettier,
);
