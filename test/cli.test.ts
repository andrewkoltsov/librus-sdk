import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

import { isCliEntryPoint, runCli } from "../src/cli/main.js";
import { LibrusSdkError, type ChildAccount, type ChildAccountSummary } from "../src/sdk/index.js";

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

function createSessionStub(child = createChild()) {
  return {
    getSynergiaAccounts: async () => ({
      lastModification: 999,
      accounts: [child],
    }),
    resolveChild: async () => child,
    forChild: async () => ({
      getGrades: async () => ({
        Grades: [],
        Resources: {},
        Url: "https://api.librus.pl/3.0/Grades",
      }),
    }),
  };
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

describe("runCli", () => {
  it("writes success payloads to stdout", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "children", "list"], {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => createSessionStub() as never,
    });

    const output = parseJson<{ lastModification: number; children: ChildAccountSummary[] }>(stdout);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(output.lastModification).toBe(999);
    expect(output.children[0]).not.toHaveProperty("accessToken");
  });

  it("writes stable JSON errors to stderr", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "children", "list"], {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => {
        throw new LibrusSdkError("CONFIGURATION_ERROR", "Missing portal credentials.");
      },
    });

    const output = parseJson<{ error: { code: string; message: string } }>(stderr);

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(output.error.code).toBe("CONFIGURATION_ERROR");
    expect(output.error.message).toBe("Missing portal credentials.");
  });

  it("does not leak bearer tokens in error payloads", async () => {
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "children", "list"], {
      stdout: { write: () => undefined },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => {
        throw new LibrusSdkError("API_REQUEST_FAILED", "Synergia API request failed", {
          endpoint: "https://api.librus.pl/3.0/Grades",
          status: 401,
        });
      },
    });

    expect(exitCode).toBe(1);
    expect(stderr).not.toContain("token-secret");
    expect(stderr).not.toContain("Bearer ");
  });
});

describe("isCliEntryPoint", () => {
  it("matches symlinked cli paths to the real module file", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "librus-sdk-cli-"));
    const realEntryPath = join(tempDir, "dist", "cli", "main.js");
    const symlinkedEntryPath = join(tempDir, "node_modules", "librus-sdk", "dist", "cli", "main.js");

    mkdirSync(join(tempDir, "dist", "cli"), { recursive: true });
    mkdirSync(join(tempDir, "node_modules", "librus-sdk", "dist", "cli"), { recursive: true });
    writeFileSync(realEntryPath, "// test entrypoint\n", { encoding: "utf8" });
    symlinkSync(realpathSync(realEntryPath), symlinkedEntryPath);

    try {
      expect(isCliEntryPoint(["node", symlinkedEntryPath], pathToFileURL(realpathSync(realEntryPath)).href)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("falls back to the original argv path when realpath resolution fails", () => {
    const missingEntryPath = "/tmp/librus-sdk-missing-main.js";

    expect(isCliEntryPoint(["node", missingEntryPath], pathToFileURL(missingEntryPath).href)).toBe(true);
  });
});
