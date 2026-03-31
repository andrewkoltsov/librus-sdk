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

  it("covers the full current supporting-feature GET surface", () => {
    const document = getGeneratedDocument();
    const requiredPaths = [
      "/Lessons",
      "/Lessons/{lessonId}",
      "/PlannedLessons",
      "/PlannedLessons/{plannedLessonId}",
      "/PlannedLessons/Attachment/{attachmentId}",
      "/Realizations",
      "/Realizations/{realizationId}",
      "/LuckyNumbers",
      "/NotificationCenter",
      "/PushConfigurations",
      "/Justifications",
      "/Justifications/{justificationId}",
      "/ParentTeacherConferences",
      "/SystemData",
      "/Auth/Photos",
      "/Auth/Photos/{photoId}",
      "/Auth/UserInfo/{userId}",
      "/Auth/TokenInfo",
      "/Auth/Classrooms/{classroomId}",
    ];

    // The client currently exposes 78 GET methods; week/day share one OpenAPI path.
    expect(Object.keys(document.paths)).toHaveLength(77);

    for (const path of requiredPaths) {
      expect(document.paths[path]).toBeDefined();
    }
  });

  it("marks attachment endpoints as binary downloads", () => {
    const document = getGeneratedDocument();
    const messageAttachment = getOperation(
      document,
      "/Messages/Attachment/{attachmentId}",
    );
    const plannedLessonAttachment = getOperation(
      document,
      "/PlannedLessons/Attachment/{attachmentId}",
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
      (plannedLessonAttachment.responses as { 200: JsonObject })["200"],
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
