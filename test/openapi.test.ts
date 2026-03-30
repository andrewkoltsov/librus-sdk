import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { generateOpenApiDocument } from "../src/sdk/index.js";

type JsonObject = Record<string, unknown>;

function getRepositoryRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

function getPackageVersion(): string {
  const packageJson = JSON.parse(
    readFileSync(resolve(getRepositoryRoot(), "package.json"), "utf8"),
  ) as { version: string };

  return packageJson.version;
}

function getGeneratedDocument() {
  return generateOpenApiDocument({ version: getPackageVersion() });
}

function getOperation(
  document: ReturnType<typeof getGeneratedDocument>,
  path: string,
) {
  return (document.paths[path] as { get: JsonObject }).get;
}

describe("generateOpenApiDocument", () => {
  it("matches the checked-in openapi.json", () => {
    const document = getGeneratedDocument();
    const checkedIn = JSON.parse(
      readFileSync(resolve(getRepositoryRoot(), "openapi.json"), "utf8"),
    ) as ReturnType<typeof getGeneratedDocument>;

    expect(checkedIn).toEqual(document);
  });

  it("documents bearer auth against the child-scoped Synergia API", () => {
    const document = getGeneratedDocument();

    expect(document.servers).toEqual([
      {
        url: "https://api.librus.pl/3.0",
        description: "Child-scoped Librus Synergia API base URL.",
      },
    ]);

    expect(document.components.securitySchemes.bearerAuth).toEqual(
      expect.objectContaining({
        type: "http",
        scheme: "bearer",
      }),
    );
  });

  it("describes the timetable endpoint with both supported query filters", () => {
    const document = getGeneratedDocument();
    const operation = getOperation(document, "/Timetables");

    expect(operation.operationId).toBe("getTimetables");
    expect(operation.description).toEqual(
      expect.stringContaining("exactly one"),
    );

    expect(operation.parameters).toEqual([
      expect.objectContaining({ name: "weekStart", in: "query" }),
      expect.objectContaining({ name: "day", in: "query" }),
    ]);
  });

  it("marks attachment endpoints as binary downloads", () => {
    const document = getGeneratedDocument();
    const messageAttachment = getOperation(
      document,
      "/Messages/Attachment/{attachmentId}",
    );
    const homeworkAttachment = getOperation(
      document,
      "/HomeWorkAssignments/Attachment/{attachmentId}",
    );

    expect((messageAttachment.responses as { 200: JsonObject })["200"]).toEqual(
      expect.objectContaining({
        content: {
          "application/octet-stream": {
            schema: {
              type: "string",
              format: "binary",
            },
          },
        },
      }),
    );

    expect(
      (homeworkAttachment.responses as { 200: JsonObject })["200"],
    ).toEqual(
      expect.objectContaining({
        content: {
          "application/octet-stream": {
            schema: {
              type: "string",
              format: "binary",
            },
          },
        },
      }),
    );
  });
});
