import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { format } from "prettier";

import {
  generateGatewayApi20OpenApiDocument,
  generateOpenApiDocument,
  generateWiadomosciOpenApiDocument,
} from "../src/sdk/openapi.js";

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = resolve(scriptDir, "..");
  const packageJsonPath = resolve(repositoryRoot, "package.json");

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    version: string;
  };
  const documents = [
    {
      outputPath: resolve(repositoryRoot, "openapi.json"),
      document: generateOpenApiDocument({ version: packageJson.version }),
    },
    {
      outputPath: resolve(
        repositoryRoot,
        "openapi",
        "gateway_api_20_openapi.json",
      ),
      document: generateGatewayApi20OpenApiDocument({
        version: packageJson.version,
      }),
    },
    {
      outputPath: resolve(
        repositoryRoot,
        "openapi",
        "wiadomosci_librus_pl_api_openapi.json",
      ),
      document: generateWiadomosciOpenApiDocument({
        version: packageJson.version,
      }),
    },
  ];
  const checkMode = process.argv.includes("--check");

  for (const { document, outputPath } of documents) {
    const serialized = await format(JSON.stringify(document), {
      filepath: outputPath,
    });

    if (checkMode) {
      const current = await readFile(outputPath, "utf8");

      if (current !== serialized) {
        throw new Error(
          `${outputPath} is out of date. Run \`npm run openapi:generate\`.`,
        );
      }

      continue;
    }

    await writeFile(outputPath, serialized, "utf8");
  }
}

await main();
