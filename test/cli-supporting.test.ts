import { describe, expect, it, vi } from "vitest";

import { runCli } from "../src/cli/main.js";
import type { ChildAccount } from "../src/sdk/index.js";

function createChild(overrides: Partial<ChildAccount> = {}): ChildAccount {
  return {
    id: 1,
    accountIdentifier: "child-1",
    group: "parent",
    login: "child-login",
    studentName: "Child Name",
    accessToken: "token-secret",
    state: "active",
    ...overrides,
  };
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function withJsonFormat(argv: string[]): string[] {
  return [...argv, "--format", "json"];
}

function createCommandContext(
  method: string,
  response: unknown,
  child = createChild(),
) {
  let stdout = "";
  let stderr = "";
  const apiMethod = vi.fn().mockResolvedValue(response);
  const resolveChild = vi.fn().mockResolvedValue(child);
  const forChild = vi.fn().mockResolvedValue({
    [method]: apiMethod,
  });

  return {
    apiMethod,
    child,
    context: {
      stdout: { write: (chunk: string) => (stdout += chunk) },
      stderr: { write: (chunk: string) => (stderr += chunk) },
      outputWidth: 80,
      createSession: () =>
        ({
          resolveChild,
          forChild,
        }) as never,
    },
    forChild,
    getOutput: () => ({ stderr, stdout }),
    resolveChild,
  };
}

const successCases = [
  {
    name: "lessons list",
    argv: ["node", "librus", "lessons", "list", "--child", "child-login"],
    method: "listLessons",
    response: {
      Lessons: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Lessons",
    },
    expectedArgs: [],
  },
  {
    name: "lessons get",
    argv: [
      "node",
      "librus",
      "lessons",
      "get",
      "--child",
      "child-login",
      "--id",
      "17",
    ],
    method: "getLesson",
    response: {
      Lesson: { Id: 17 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Lessons/17",
    },
    expectedArgs: ["17"],
  },
  {
    name: "lessons planned-list",
    argv: [
      "node",
      "librus",
      "lessons",
      "planned-list",
      "--child",
      "child-login",
    ],
    method: "listPlannedLessons",
    response: {
      PlannedLessons: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/PlannedLessons",
    },
    expectedArgs: [],
  },
  {
    name: "lessons planned-get",
    argv: [
      "node",
      "librus",
      "lessons",
      "planned-get",
      "--child",
      "child-login",
      "--id",
      "18",
    ],
    method: "getPlannedLesson",
    response: {
      PlannedLesson: { Id: 18 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/PlannedLessons/18",
    },
    expectedArgs: ["18"],
  },
  {
    name: "lessons realizations-list",
    argv: [
      "node",
      "librus",
      "lessons",
      "realizations-list",
      "--child",
      "child-login",
    ],
    method: "listRealizations",
    response: {
      Realizations: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Realizations",
    },
    expectedArgs: [],
  },
  {
    name: "lessons realizations-get",
    argv: [
      "node",
      "librus",
      "lessons",
      "realizations-get",
      "--child",
      "child-login",
      "--id",
      "19",
    ],
    method: "getRealization",
    response: {
      Realization: { Id: 19 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Realizations/19",
    },
    expectedArgs: ["19"],
  },
  {
    name: "lucky-number get",
    argv: ["node", "librus", "lucky-number", "get", "--child", "child-login"],
    method: "getLuckyNumber",
    response: {
      LuckyNumber: { LuckyNumber: 13 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/LuckyNumbers",
    },
    expectedArgs: [undefined],
  },
  {
    name: "lucky-number get with for-day",
    argv: [
      "node",
      "librus",
      "lucky-number",
      "get",
      "--child",
      "child-login",
      "--for-day",
      "2026-03-30",
    ],
    method: "getLuckyNumber",
    response: {
      LuckyNumber: { LuckyNumber: 13 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/LuckyNumbers?forDay=2026-03-30",
    },
    expectedArgs: ["2026-03-30"],
  },
  {
    name: "notifications center",
    argv: [
      "node",
      "librus",
      "notifications",
      "center",
      "--child",
      "child-login",
    ],
    method: "getNotificationCenter",
    response: {
      NotificationCenter: {},
      Resources: {},
      Url: "https://api.librus.pl/3.0/NotificationCenter",
    },
    expectedArgs: [],
  },
  {
    name: "notifications push-configurations",
    argv: [
      "node",
      "librus",
      "notifications",
      "push-configurations",
      "--child",
      "child-login",
    ],
    method: "getPushConfigurations",
    response: {
      version: "7",
      settings: {},
      Resources: {},
      Url: "https://api.librus.pl/3.0/PushConfigurations",
    },
    expectedArgs: [],
  },
  {
    name: "justifications list",
    argv: [
      "node",
      "librus",
      "justifications",
      "list",
      "--child",
      "child-login",
    ],
    method: "listJustifications",
    response: {
      Justifications: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Justifications",
    },
    expectedArgs: [{}],
  },
  {
    name: "justifications list with date-from",
    argv: [
      "node",
      "librus",
      "justifications",
      "list",
      "--child",
      "child-login",
      "--date-from",
      "2026-03-01",
    ],
    method: "listJustifications",
    response: {
      Justifications: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Justifications?dateFrom=2026-03-01",
    },
    expectedArgs: [{ dateFrom: "2026-03-01" }],
  },
  {
    name: "justifications get",
    argv: [
      "node",
      "librus",
      "justifications",
      "get",
      "--child",
      "child-login",
      "--id",
      "11",
    ],
    method: "getJustification",
    response: {
      Justification: { Id: 11 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Justifications/11",
    },
    expectedArgs: ["11"],
  },
  {
    name: "justifications conferences",
    argv: [
      "node",
      "librus",
      "justifications",
      "conferences",
      "--child",
      "child-login",
    ],
    method: "listParentTeacherConferences",
    response: {
      ParentTeacherConferences: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/ParentTeacherConferences",
    },
    expectedArgs: [],
  },
  {
    name: "justifications system-data",
    argv: [
      "node",
      "librus",
      "justifications",
      "system-data",
      "--child",
      "child-login",
    ],
    method: "getSystemData",
    response: {
      Date: "2026-03-30",
      Time: "23:39:02",
      Resources: {},
      Url: "https://api.librus.pl/3.0/SystemData",
    },
    expectedArgs: [],
  },
  {
    name: "auth photos",
    argv: ["node", "librus", "auth", "photos", "--child", "child-login"],
    method: "listAuthPhotos",
    response: {
      data: { status: true, photo: null, awaitingPhoto: null },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Auth/Photos",
    },
    expectedArgs: [],
  },
  {
    name: "auth user-info",
    argv: [
      "node",
      "librus",
      "auth",
      "user-info",
      "--child",
      "child-login",
      "--id",
      "LID-123",
    ],
    method: "getAuthUserInfo",
    response: {
      UserIdentifier: "LID-123",
      Resources: {},
      Url: "https://api.librus.pl/3.0/Auth/UserInfo/LID-123",
    },
    expectedArgs: ["LID-123"],
  },
  {
    name: "auth token-info",
    argv: ["node", "librus", "auth", "token-info", "--child", "child-login"],
    method: "getAuthTokenInfo",
    response: {
      UserIdentifier: "LID-123",
      Resources: {},
      Url: "https://api.librus.pl/3.0/Auth/TokenInfo",
    },
    expectedArgs: [],
  },
  {
    name: "auth classroom",
    argv: [
      "node",
      "librus",
      "auth",
      "classroom",
      "--child",
      "child-login",
      "--id",
      "class-1",
    ],
    method: "getAuthClassroom",
    response: {
      Classroom: { Id: "class-1" },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Auth/Classrooms/class-1",
    },
    expectedArgs: ["class-1"],
  },
];

const usageFailureCases = [
  {
    name: "lessons get requires id",
    argv: ["node", "librus", "lessons", "get", "--child", "child-login"],
    expectedMessage: "required option '--id <id>' not specified",
  },
  {
    name: "lessons planned-attachment requires output",
    argv: [
      "node",
      "librus",
      "lessons",
      "planned-attachment",
      "--child",
      "child-login",
      "--id",
      "17",
    ],
    expectedMessage: "required option '--output <path>' not specified",
  },
  {
    name: "lucky-number get requires child",
    argv: ["node", "librus", "lucky-number", "get"],
    expectedMessage: "required option '--child <id-or-login>' not specified",
  },
  {
    name: "justifications get requires id",
    argv: ["node", "librus", "justifications", "get", "--child", "child-login"],
    expectedMessage: "required option '--id <id>' not specified",
  },
  {
    name: "auth photo requires output",
    argv: [
      "node",
      "librus",
      "auth",
      "photo",
      "--child",
      "child-login",
      "--id",
      "photo-1",
    ],
    expectedMessage: "required option '--output <path>' not specified",
  },
  {
    name: "auth classroom requires id",
    argv: ["node", "librus", "auth", "classroom", "--child", "child-login"],
    expectedMessage: "required option '--id <id>' not specified",
  },
];

describe("supporting CLI commands", () => {
  it.each(successCases)(
    "$name",
    async ({ argv, method, response, expectedArgs }) => {
      const { apiMethod, context, getOutput, resolveChild, forChild } =
        createCommandContext(method, response);

      const exitCode = await runCli(withJsonFormat(argv), context);
      const output = parseJson<{ child: ChildAccount; data: unknown }>(
        getOutput().stdout,
      );

      expect(exitCode).toBe(0);
      expect(getOutput().stderr).toBe("");
      expect(resolveChild).toHaveBeenCalledWith("child-login");
      expect(forChild).toHaveBeenCalledTimes(1);
      expect(apiMethod).toHaveBeenCalledWith(...expectedArgs);
      expect(output.child).not.toHaveProperty("accessToken");
      expect(output.data).toEqual(response);
    },
  );

  it("writes planned lesson attachments to the requested file", async () => {
    let stdout = "";
    let stderr = "";
    let writeCall: { path: string; data: Uint8Array } | null = null;
    const child = createChild();
    const resolveChild = vi.fn().mockResolvedValue(child);
    const getPlannedLessonAttachment = vi.fn().mockResolvedValue({
      data: Uint8Array.from([1, 2, 3]).buffer,
      contentDisposition: 'attachment; filename="planned.pdf"',
      contentType: "application/pdf",
    });
    const forChild = vi.fn().mockResolvedValue({ getPlannedLessonAttachment });

    const exitCode = await runCli(
      withJsonFormat([
        "node",
        "librus",
        "lessons",
        "planned-attachment",
        "--child",
        "child-login",
        "--id",
        "attachment-1",
        "--output",
        "/tmp/planned.pdf",
      ]),
      {
        stdout: { write: (chunk) => (stdout += chunk) },
        stderr: { write: (chunk) => (stderr += chunk) },
        outputWidth: 80,
        createSession: () =>
          ({
            resolveChild,
            forChild,
          }) as never,
        writeFile: (path, data) => {
          writeCall = { path, data };
        },
      },
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(getPlannedLessonAttachment).toHaveBeenCalledWith("attachment-1");
    expect(writeCall).toEqual({
      path: "/tmp/planned.pdf",
      data: Uint8Array.from([1, 2, 3]),
    });
    expect(
      parseJson<{ data: { bytes: number; path: string } }>(stdout).data,
    ).toEqual({
      bytes: 3,
      contentDisposition: 'attachment; filename="planned.pdf"',
      contentType: "application/pdf",
      path: "/tmp/planned.pdf",
    });
  });

  it("writes auth photos by decoding base64 content", async () => {
    let stdout = "";
    let stderr = "";
    let writeCall: { path: string; data: Uint8Array } | null = null;
    const child = createChild();
    const resolveChild = vi.fn().mockResolvedValue(child);
    const getAuthPhoto = vi.fn().mockResolvedValue({
      data: {
        status: true,
        photo: {
          id: "photo-1",
          fileName: "photo.jpg",
          content: Buffer.from([4, 5, 6]).toString("base64"),
        },
      },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Auth/Photos/photo-1",
    });
    const forChild = vi.fn().mockResolvedValue({ getAuthPhoto });

    const exitCode = await runCli(
      withJsonFormat([
        "node",
        "librus",
        "auth",
        "photo",
        "--child",
        "child-login",
        "--id",
        "photo-1",
        "--output",
        "/tmp/photo.jpg",
      ]),
      {
        stdout: { write: (chunk) => (stdout += chunk) },
        stderr: { write: (chunk) => (stderr += chunk) },
        outputWidth: 80,
        createSession: () =>
          ({
            resolveChild,
            forChild,
          }) as never,
        writeFile: (path, data) => {
          writeCall = { path, data };
        },
      },
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(getAuthPhoto).toHaveBeenCalledWith("photo-1");
    expect(writeCall).toEqual({
      path: "/tmp/photo.jpg",
      data: Uint8Array.from([4, 5, 6]),
    });
    expect(
      parseJson<{ data: { bytes: number; path: string } }>(stdout).data,
    ).toEqual({
      bytes: 3,
      contentDisposition: null,
      contentType: "image/jpeg",
      path: "/tmp/photo.jpg",
    });
  });

  it("fails when the auth photo response does not contain file content", async () => {
    let stderr = "";
    const child = createChild();
    const resolveChild = vi.fn().mockResolvedValue(child);
    const getAuthPhoto = vi.fn().mockResolvedValue({
      data: {
        status: true,
        photo: { id: "photo-1", fileName: "photo.jpg" },
      },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Auth/Photos/photo-1",
    });
    const forChild = vi.fn().mockResolvedValue({ getAuthPhoto });

    const exitCode = await runCli(
      withJsonFormat([
        "node",
        "librus",
        "auth",
        "photo",
        "--child",
        "child-login",
        "--id",
        "photo-1",
        "--output",
        "/tmp/photo.jpg",
      ]),
      {
        stdout: { write: () => undefined },
        stderr: { write: (chunk) => (stderr += chunk) },
        outputWidth: 80,
        createSession: () =>
          ({
            resolveChild,
            forChild,
          }) as never,
        writeFile: () => undefined,
      },
    );

    const output = parseJson<{ error: { code: string; message: string } }>(
      stderr,
    );

    expect(exitCode).toBe(1);
    expect(output.error.code).toBe("RESPONSE_VALIDATION_FAILED");
  });

  it.each(usageFailureCases)("$name", async ({ argv, expectedMessage }) => {
    let stderr = "";

    const exitCode = await runCli(withJsonFormat(argv), {
      stdout: { write: () => undefined },
      stderr: { write: (chunk) => (stderr += chunk) },
      outputWidth: 80,
      createSession: () =>
        ({
          resolveChild: vi.fn(),
          forChild: vi.fn(),
        }) as never,
    });

    const output = parseJson<{ error: { code: string; message: string } }>(
      stderr,
    );

    expect(exitCode).not.toBe(0);
    expect(output.error.code).toBe("CLI_USAGE_ERROR");
    expect(output.error.message).toContain(expectedMessage);
  });

  it("renders text output by default for lessons list", async () => {
    const { context, getOutput } = createCommandContext("listLessons", {
      Lessons: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Lessons",
    });

    const exitCode = await runCli(
      ["node", "librus", "lessons", "list", "--child", "child-login"],
      context,
    );

    expect(exitCode).toBe(0);
    expect(getOutput().stderr).toBe("");
    expect(getOutput().stdout).toContain("Child");
    expect(getOutput().stdout).toContain("Lessons");
    expect(getOutput().stdout).toContain("Metadata");
  });
});
