import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import * as releaseNotesModule from "../scripts/extract-release-notes.mjs";

const { extractReleaseNotes } = releaseNotesModule as {
  extractReleaseNotes: (changelog: string, version: string) => string;
};

const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), {
  encoding: "utf8",
});

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
});
