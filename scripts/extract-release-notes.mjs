import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractReleaseNotes(changelog, version) {
  const normalizedChangelog = changelog.replace(/\r\n/g, "\n");
  const headingPattern = new RegExp(
    `^## \\[${escapeRegExp(version)}\\](?: - .*)?$`,
    "m",
  );
  const headingMatch = headingPattern.exec(normalizedChangelog);

  if (!headingMatch || headingMatch.index === undefined) {
    throw new Error(`Missing CHANGELOG entry for version ${version}.`);
  }

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const remaining = normalizedChangelog.slice(sectionStart);
  const nextHeadingIndex = remaining.search(/\n## \[/);
  const section = (
    nextHeadingIndex === -1 ? remaining : remaining.slice(0, nextHeadingIndex)
  ).trim();

  if (!section) {
    throw new Error(
      `CHANGELOG entry for version ${version} has no release notes.`,
    );
  }

  return section;
}

function main(argv = process.argv.slice(2)) {
  const [version] = argv;

  if (!version) {
    throw new Error(
      "Usage: node ./scripts/extract-release-notes.mjs <version>",
    );
  }

  const changelogPath = resolve("CHANGELOG.md");
  const changelog = readFileSync(changelogPath, "utf8");
  process.stdout.write(`${extractReleaseNotes(changelog, version)}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main();
}
