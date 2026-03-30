import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const cacheDir = join(tmpdir(), "librus-sdk-npm-cache");
const requiredPaths = [
  "README.md",
  "LICENSE",
  "dist/cli/main.js",
  "dist/sdk/index.js",
];

const result = spawnSync(
  npmCommand,
  ["pack", "--dry-run", "--ignore-scripts", "--json", "--cache", cacheDir],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: cacheDir,
      NPM_CONFIG_CACHE: cacheDir,
    },
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const output = JSON.parse(result.stdout);
const packedPaths = new Set(
  (Array.isArray(output) ? output : []).flatMap((pkg) =>
    Array.isArray(pkg?.files)
      ? pkg.files.flatMap((file) =>
          typeof file?.path === "string" ? [file.path] : [],
        )
      : [],
  ),
);
const missingPaths = requiredPaths.filter((path) => !packedPaths.has(path));

if (missingPaths.length > 0) {
  process.stderr.write(
    `npm pack --dry-run is missing required files: ${missingPaths.join(", ")}\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `npm pack --dry-run includes: ${requiredPaths.join(", ")}\n`,
);
