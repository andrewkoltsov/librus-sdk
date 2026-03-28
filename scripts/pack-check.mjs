import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const cacheDir = join(tmpdir(), "librus-sdk-npm-cache");
const result = spawnSync(
  npmCommand,
  ["pack", "--dry-run", "--ignore-scripts", "--cache", cacheDir],
  {
    stdio: "inherit",
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

process.exit(result.status ?? 1);
