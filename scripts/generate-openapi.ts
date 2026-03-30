import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { generateOpenApiDocument } from "../src/sdk/openapi.js";

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = resolve(scriptDir, "..");
  const packageJsonPath = resolve(repositoryRoot, "package.json");
  const outputPath = resolve(repositoryRoot, "openapi.json");

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    version: string;
  };
  const document = generateOpenApiDocument({ version: packageJson.version });
  const serialized = `${JSON.stringify(document, null, 2)}\n`;
  const checkMode = process.argv.includes("--check");

  if (checkMode) {
    const current = await readFile(outputPath, "utf8");

    if (current !== serialized) {
      throw new Error(
        "openapi.json is out of date. Run `npm run openapi:generate`.",
      );
    }

    return;
  }

  await writeFile(outputPath, serialized, "utf8");
}

await main();
