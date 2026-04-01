import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import * as releaseNotesModule from "../scripts/extract-release-notes.mjs";

const { extractReleaseNotes } = releaseNotesModule as {
  extractReleaseNotes: (changelog: string, version: string) => string;
};

const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), {
  encoding: "utf8",
});
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const releaseNotesScriptPath = fileURLToPath(
  new URL("../scripts/extract-release-notes.mjs", import.meta.url),
);

describe("extractReleaseNotes", () => {
  it("returns the matching changelog section without the next version heading", () => {
    const notes = extractReleaseNotes(changelog, "0.1.1");

    expect(notes).toContain("Dependabot configuration");
    expect(notes).toContain("README installation section now documents");
    expect(notes).not.toContain("## [0.1.0]");
  });

  it("fails when the requested version is missing", () => {
    expect(() => extractReleaseNotes(changelog, "9.9.9")).toThrow(
      "Missing CHANGELOG entry for version 9.9.9.",
    );
  });

  it("returns the final changelog section when it is the last entry", () => {
    const notes = extractReleaseNotes(
      "## [0.2.0] - 2026-03-31\r\n\r\nFinal release notes line 1\r\nFinal release notes line 2\r\n",
      "0.2.0",
    );

    expect(notes).toBe(
      "Final release notes line 1\nFinal release notes line 2",
    );
  });

  it("fails when the matching version heading has no notes", () => {
    expect(() =>
      extractReleaseNotes(
        ["## [0.2.0] - 2026-03-31", "", "## [0.1.9] - 2026-03-30"].join("\n"),
        "0.2.0",
      ),
    ).toThrow("CHANGELOG entry for version 0.2.0 has no release notes.");
  });
});

describe("extract-release-notes CLI", () => {
  it("prints the requested release notes to stdout", () => {
    const result = spawnSync(
      process.execPath,
      [releaseNotesScriptPath, "0.1.1"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Dependabot configuration");
    expect(result.stdout).toContain(
      "README installation section now documents",
    );
  });

  it("fails with usage output when the version argument is missing", () => {
    const result = spawnSync(process.execPath, [releaseNotesScriptPath], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Usage: node ./scripts/extract-release-notes.mjs <version>",
    );
  });
});
