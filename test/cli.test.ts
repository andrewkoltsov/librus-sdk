import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

import {
  isCliEntryPoint,
  loadCliEnvironment,
  runCli,
} from "../src/cli/main.js";
import {
  LibrusSdkError,
  type ChildAccount,
  type ChildAccountSummary,
} from "../src/sdk/index.js";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

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

function withJsonFormat(argv: string[]): string[] {
  return [...argv, "--format", "json"];
}

describe("runCli", () => {
  it("writes text output by default", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "children", "list"], {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => createSessionStub() as never,
      outputWidth: 80,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Response");
    expect(stdout).toContain("lastModification:");
    expect(stdout).toContain("Children");
    expect(stdout).toContain("login:");
    expect(stdout).not.toContain("accessToken");
  });

  it("writes JSON payloads to stdout for --format json", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(
      withJsonFormat(["node", "librus", "children", "list"]),
      {
        stdout: { write: (chunk) => (stdout += chunk) },
        stderr: { write: (chunk) => (stderr += chunk) },
        createSession: () => createSessionStub() as never,
        outputWidth: 80,
      },
    );

    const output = parseJson<{
      lastModification: number;
      children: ChildAccountSummary[];
    }>(stdout);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(output.lastModification).toBe(999);
    expect(output.children[0]).not.toHaveProperty("accessToken");
  });

  it("prints root help and exits successfully when no command is provided", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["node", "librus"], {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => createSessionStub() as never,
      outputWidth: 80,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Usage: librus");
  });

  it("prints root help and exits successfully for --help", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "--help"], {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => createSessionStub() as never,
      outputWidth: 80,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Usage: librus");
  });

  it("prints the package version and exits successfully for --version", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "--version"], {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => createSessionStub() as never,
      outputWidth: 80,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout.trim()).toBe(packageJson.version);
  });

  it("writes stable JSON errors to stderr for --format json", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(
      withJsonFormat(["node", "librus", "children", "list"]),
      {
        stdout: { write: (chunk) => (stdout += chunk) },
        stderr: { write: (chunk) => (stderr += chunk) },
        createSession: () => {
          throw new LibrusSdkError(
            "CONFIGURATION_ERROR",
            "Missing portal credentials.",
          );
        },
        outputWidth: 80,
      },
    );

    const output = parseJson<{ error: { code: string; message: string } }>(
      stderr,
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(output.error.code).toBe("CONFIGURATION_ERROR");
    expect(output.error.message).toBe("Missing portal credentials.");
  });

  it("writes text errors to stderr by default", async () => {
    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "children", "list"], {
      stdout: { write: (chunk) => (stdout += chunk) },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => {
        throw new LibrusSdkError(
          "CONFIGURATION_ERROR",
          "Missing portal credentials.",
        );
      },
      outputWidth: 80,
    });

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toContain("Error");
    expect(stderr).toContain("code:");
    expect(stderr).toContain("CONFIGURATION_ERROR");
    expect(stderr).toContain("message:");
  });

  it("keeps usage errors as failures", async () => {
    let stderr = "";
    const processStderrWrite = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    const exitCode = await runCli(["node", "librus", "grades", "list"], {
      stdout: { write: () => undefined },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => createSessionStub() as never,
      outputWidth: 80,
    });

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("CLI_USAGE_ERROR");
    expect(stderr).toContain("required option");
    expect(processStderrWrite).not.toHaveBeenCalled();
    processStderrWrite.mockRestore();
  });

  it("fails cleanly for invalid --format values", async () => {
    let stderr = "";

    const exitCode = await runCli(
      ["node", "librus", "children", "list", "--format", "yaml"],
      {
        stdout: { write: () => undefined },
        stderr: { write: (chunk) => (stderr += chunk) },
        createSession: () => createSessionStub() as never,
        outputWidth: 80,
      },
    );

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("CLI_USAGE_ERROR");
    expect(stderr).toContain('Expected "text" or "json".');
  });

  it("does not leak bearer tokens in error payloads", async () => {
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "children", "list"], {
      stdout: { write: () => undefined },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => {
        throw new LibrusSdkError(
          "API_REQUEST_FAILED",
          "Synergia API request failed",
          {
            endpoint: "https://api.librus.pl/3.0/Grades",
            status: 401,
          },
        );
      },
      outputWidth: 80,
    });

    expect(exitCode).toBe(1);
    expect(stderr).not.toContain("token-secret");
    expect(stderr).not.toContain("Bearer ");
  });

  it("keeps validation errors compact and secret-safe", async () => {
    let stderr = "";
    const exitCode = await runCli(["node", "librus", "children", "list"], {
      stdout: { write: () => undefined },
      stderr: { write: (chunk) => (stderr += chunk) },
      createSession: () => {
        throw new LibrusSdkError(
          "RESPONSE_VALIDATION_FAILED",
          "Received an unexpected response from Librus.",
          {
            endpoint: "https://api.librus.pl/3.0/Grades",
            issues: ["Grades.0.Grade: Invalid type"],
          },
        );
      },
      outputWidth: 80,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("RESPONSE_VALIDATION_FAILED");
    expect(stderr).not.toContain("Bearer ");
    expect(stderr).not.toContain("super-secret");
  });
});

describe("isCliEntryPoint", () => {
  it("matches symlinked cli paths to the real module file", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "librus-sdk-cli-"));
    const realEntryPath = join(tempDir, "dist", "cli", "main.js");
    const symlinkedEntryPath = join(
      tempDir,
      "node_modules",
      "librus-sdk",
      "dist",
      "cli",
      "main.js",
    );

    mkdirSync(join(tempDir, "dist", "cli"), { recursive: true });
    mkdirSync(join(tempDir, "node_modules", "librus-sdk", "dist", "cli"), {
      recursive: true,
    });
    writeFileSync(realEntryPath, "// test entrypoint\n", { encoding: "utf8" });
    symlinkSync(realpathSync(realEntryPath), symlinkedEntryPath);

    try {
      expect(
        isCliEntryPoint(
          ["node", symlinkedEntryPath],
          pathToFileURL(realpathSync(realEntryPath)).href,
        ),
      ).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("falls back to the original argv path when realpath resolution fails", () => {
    const missingEntryPath = "/tmp/librus-sdk-missing-main.js";

    expect(
      isCliEntryPoint(
        ["node", missingEntryPath],
        pathToFileURL(missingEntryPath).href,
      ),
    ).toBe(true);
  });
});

describe("loadCliEnvironment", () => {
  it("loads .env files through Node's built-in helper", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "librus-sdk-env-"));
    const previousCwd = process.cwd();
    const previousValue = process.env.LIBRUS_CLI_ENV_TEST;

    writeFileSync(join(tempDir, ".env"), "LIBRUS_CLI_ENV_TEST=loaded-value\n", {
      encoding: "utf8",
    });
    delete process.env.LIBRUS_CLI_ENV_TEST;
    process.chdir(tempDir);

    try {
      loadCliEnvironment();
      expect(process.env.LIBRUS_CLI_ENV_TEST).toBe("loaded-value");
    } finally {
      process.chdir(previousCwd);

      if (previousValue === undefined) {
        delete process.env.LIBRUS_CLI_ENV_TEST;
      } else {
        process.env.LIBRUS_CLI_ENV_TEST = previousValue;
      }

      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("ignores missing .env files", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "librus-sdk-missing-env-"));
    const previousCwd = process.cwd();

    process.chdir(tempDir);

    try {
      expect(() => loadCliEnvironment()).not.toThrow();
    } finally {
      process.chdir(previousCwd);
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
