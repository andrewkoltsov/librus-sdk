import { describe, expect, it, vi } from "vitest";

import { runCli } from "../src/cli/main.js";
import { LibrusSdkError, type ChildAccount } from "../src/sdk/index.js";

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

function formatLocalDateTime(timestamp: number): string {
  const date = new Date(timestamp);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ]
    .join("-")
    .concat(
      ` ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`,
    );
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
    name: "messages list",
    argv: ["node", "librus", "messages", "list", "--child", "child-login"],
    method: "listMessages",
    response: {
      Messages: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages",
    },
    expectedArgs: [{}],
  },
  {
    name: "messages list with after-id",
    argv: [
      "node",
      "librus",
      "messages",
      "list",
      "--child",
      "child-login",
      "--after-id",
      "42",
    ],
    method: "listMessages",
    response: {
      Messages: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages?afterId=42",
    },
    expectedArgs: [{ afterId: "42" }],
  },
  {
    name: "messages get",
    argv: [
      "node",
      "librus",
      "messages",
      "get",
      "--child",
      "child-login",
      "--id",
      "17",
    ],
    method: "getMessage",
    response: {
      Message: { Id: 17 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages/17",
    },
    expectedArgs: ["17"],
  },
  {
    name: "messages unread",
    argv: ["node", "librus", "messages", "unread", "--child", "child-login"],
    method: "getUnreadMessages",
    response: {
      UnreadMessages: 4,
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages/Unread",
    },
    expectedArgs: [],
  },
  {
    name: "timetable week",
    argv: [
      "node",
      "librus",
      "timetable",
      "week",
      "--child",
      "child-login",
      "--week-start",
      "2026-03-30",
    ],
    method: "getTimetableWeek",
    response: {
      Timetable: { "2026-03-30": [] },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Timetables?weekStart=2026-03-30",
    },
    expectedArgs: ["2026-03-30"],
  },
  {
    name: "timetable day",
    argv: [
      "node",
      "librus",
      "timetable",
      "day",
      "--child",
      "child-login",
      "--day",
      "2026-03-31",
    ],
    method: "getTimetableDay",
    response: {
      Timetable: { "2026-03-31": [] },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Timetables?day=2026-03-31",
    },
    expectedArgs: ["2026-03-31"],
  },
  {
    name: "timetable entry",
    argv: [
      "node",
      "librus",
      "timetable",
      "entry",
      "--child",
      "child-login",
      "--id",
      "11",
    ],
    method: "getTimetableEntry",
    response: {
      TimetableEntry: { Id: 11 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/TimetableEntries/11",
    },
    expectedArgs: ["11"],
  },
  {
    name: "announcements list",
    argv: ["node", "librus", "announcements", "list", "--child", "child-login"],
    method: "listSchoolNotices",
    response: {
      SchoolNotices: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/SchoolNotices",
    },
    expectedArgs: [],
  },
  {
    name: "announcements get",
    argv: [
      "node",
      "librus",
      "announcements",
      "get",
      "--child",
      "child-login",
      "--id",
      "6",
    ],
    method: "getSchoolNotice",
    response: {
      SchoolNotice: { Id: 6 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/SchoolNotices/6",
    },
    expectedArgs: ["6"],
  },
  {
    name: "notes list",
    argv: ["node", "librus", "notes", "list", "--child", "child-login"],
    method: "listNotes",
    response: {
      Notes: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Notes",
    },
    expectedArgs: [],
  },
  {
    name: "notes get",
    argv: [
      "node",
      "librus",
      "notes",
      "get",
      "--child",
      "child-login",
      "--id",
      "9",
    ],
    method: "getNote",
    response: {
      Note: { Id: 9 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Notes/9",
    },
    expectedArgs: ["9"],
  },
];

const usageFailureCases = [
  {
    name: "messages list requires child",
    argv: ["node", "librus", "messages", "list"],
    expectedMessage: "required option '--child <id-or-login>' not specified",
  },
  {
    name: "messages get requires id",
    argv: ["node", "librus", "messages", "get", "--child", "child-login"],
    expectedMessage: "required option '--id <id>' not specified",
  },
  {
    name: "messages unread requires child",
    argv: ["node", "librus", "messages", "unread"],
    expectedMessage: "required option '--child <id-or-login>' not specified",
  },
  {
    name: "timetable week requires week start",
    argv: ["node", "librus", "timetable", "week", "--child", "child-login"],
    expectedMessage:
      "required option '--week-start <YYYY-MM-DD>' not specified",
  },
  {
    name: "timetable day requires day",
    argv: ["node", "librus", "timetable", "day", "--child", "child-login"],
    expectedMessage: "required option '--day <YYYY-MM-DD>' not specified",
  },
  {
    name: "timetable entry requires id",
    argv: ["node", "librus", "timetable", "entry", "--child", "child-login"],
    expectedMessage: "required option '--id <id>' not specified",
  },
  {
    name: "announcements list requires child",
    argv: ["node", "librus", "announcements", "list"],
    expectedMessage: "required option '--child <id-or-login>' not specified",
  },
  {
    name: "announcements get requires id",
    argv: ["node", "librus", "announcements", "get", "--child", "child-login"],
    expectedMessage: "required option '--id <id>' not specified",
  },
  {
    name: "notes list requires child",
    argv: ["node", "librus", "notes", "list"],
    expectedMessage: "required option '--child <id-or-login>' not specified",
  },
  {
    name: "notes get requires id",
    argv: ["node", "librus", "notes", "get", "--child", "child-login"],
    expectedMessage: "required option '--id <id>' not specified",
  },
];

describe("runCli high-value commands", () => {
  it.each(successCases)(
    "writes success payloads for $name",
    async ({ argv, expectedArgs, method, response }) => {
      const { apiMethod, child, context, forChild, getOutput, resolveChild } =
        createCommandContext(method, response);

      const exitCode = await runCli(withJsonFormat(argv), context);
      const output = parseJson<{ child: { login: string }; data: unknown }>(
        getOutput().stdout,
      );

      expect(exitCode).toBe(0);
      expect(getOutput().stderr).toBe("");
      expect(resolveChild).toHaveBeenCalledWith("child-login");
      expect(forChild).toHaveBeenCalledWith(child);
      expect(apiMethod).toHaveBeenCalledWith(...expectedArgs);
      expect(output.child.login).toBe("child-login");
      expect(output.data).toEqual(response);
    },
  );

  it.each(usageFailureCases)(
    "keeps usage failures for $name",
    async ({ argv, expectedMessage }) => {
      let stderr = "";

      const exitCode = await runCli(withJsonFormat(argv), {
        stdout: { write: () => undefined },
        stderr: { write: (chunk) => (stderr += chunk) },
        createSession: () => ({}) as never,
        outputWidth: 80,
      });

      const output = parseJson<{ error: { code: string; message: string } }>(
        stderr,
      );

      expect(exitCode).not.toBe(0);
      expect(output.error.code).toBe("CLI_USAGE_ERROR");
      expect(output.error.message).toContain(expectedMessage);
    },
  );

  it("keeps new command failures secret-safe", async () => {
    let stderr = "";

    const exitCode = await runCli(
      ["node", "librus", "messages", "list", "--child", "child-login"],
      {
        stdout: { write: () => undefined },
        stderr: { write: (chunk) => (stderr += chunk) },
        outputWidth: 80,
        createSession: () =>
          ({
            resolveChild: async () => createChild(),
            forChild: async () => {
              throw new LibrusSdkError(
                "API_REQUEST_FAILED",
                'Messages are unavailable for this child account because the token does not advertise the required "messages" scope.',
                {
                  endpoint: "https://api.librus.pl/3.0/Messages",
                  status: 403,
                  feature: "messages",
                  requiredScope: "messages",
                  scopePresent: false,
                  tokenScopes: ["grades", "attendance"],
                  hint: "Run `librus auth token-info --child <id-or-login>` to inspect the token scopes for this child.",
                },
              );
            },
          }) as never,
      },
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain("API_REQUEST_FAILED");
    expect(stderr).toContain("requiredScope");
    expect(stderr).toContain("scopePresent");
    expect(stderr).toContain("tokenScopes");
    expect(stderr).toContain("auth token-info");
    expect(stderr).not.toContain("token-secret");
    expect(stderr).not.toContain("Bearer ");
  });

  it("renders text output by default for messages list", async () => {
    const { context, getOutput } = createCommandContext("listMessages", {
      Messages: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages",
    });

    const exitCode = await runCli(
      ["node", "librus", "messages", "list", "--child", "child-login"],
      context,
    );

    expect(exitCode).toBe(0);
    expect(getOutput().stderr).toBe("");
    expect(getOutput().stdout).toContain("Child");
    expect(getOutput().stdout).toContain("Messages");
    expect(getOutput().stdout).toContain("Metadata");
  });

  it("formats message dates and body text in text output", async () => {
    const rawBody =
      "Szanowni Pa\\u0144stwo,\\u003Cbr\\u003E\\u003Cbr\\u003Ewysy\\u0142am grafik obiad\\u00f3w.\\u003Cbr\\u003E\\u003Cbr\\u003EPozdrawiam\\u003Cbr\\u003EAleksandra Wojtasik";
    const { context, getOutput } = createCommandContext("getMessage", {
      Message: {
        Id: 17,
        ReadDate: 1757068051,
        SendDate: "1757314190000",
        Body: rawBody,
      },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages/17",
    });

    const exitCode = await runCli(
      [
        "node",
        "librus",
        "messages",
        "get",
        "--child",
        "child-login",
        "--id",
        "17",
      ],
      context,
    );

    expect(exitCode).toBe(0);
    expect(getOutput().stderr).toBe("");
    expect(getOutput().stdout).toContain(
      formatLocalDateTime(1757068051 * 1000),
    );
    expect(getOutput().stdout).toContain(formatLocalDateTime(1757314190000));
    expect(getOutput().stdout).toContain("Szanowni Państwo,");
    expect(getOutput().stdout).toContain("wysyłam grafik obiadów.");
    expect(getOutput().stdout).toContain("Pozdrawiam");
    expect(getOutput().stdout).not.toContain("1757068051");
    expect(getOutput().stdout).not.toContain("1757314190000");
    expect(getOutput().stdout).not.toContain("\\u0144");
    expect(getOutput().stdout).not.toContain("<br>");
  });

  it("keeps raw message dates and body text in json output", async () => {
    const rawBody =
      "Szanowni Pa\\u0144stwo,\\u003Cbr\\u003E\\u003Cbr\\u003Ewysy\\u0142am grafik obiad\\u00f3w.\\u003Cbr\\u003E\\u003Cbr\\u003EPozdrawiam\\u003Cbr\\u003EAleksandra Wojtasik";
    const { context, getOutput } = createCommandContext("getMessage", {
      Message: {
        Id: 17,
        ReadDate: 1757068051,
        SendDate: "1757314190000",
        Body: rawBody,
      },
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages/17",
    });

    const exitCode = await runCli(
      withJsonFormat([
        "node",
        "librus",
        "messages",
        "get",
        "--child",
        "child-login",
        "--id",
        "17",
      ]),
      context,
    );
    const output = parseJson<{
      data: {
        Message: { Body: string; ReadDate: number; SendDate: string };
      };
    }>(getOutput().stdout);

    expect(exitCode).toBe(0);
    expect(getOutput().stderr).toBe("");
    expect(output.data.Message.ReadDate).toBe(1757068051);
    expect(output.data.Message.SendDate).toBe("1757314190000");
    expect(output.data.Message.Body).toBe(rawBody);
  });
});
