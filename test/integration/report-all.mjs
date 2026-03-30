import { runCliMatrix } from "./helpers/cli.mjs";
import { serializeError, formatJson } from "./helpers/errors.mjs";
import { runSdkMatrix } from "./helpers/sdk.mjs";

let sdk;

try {
  sdk = await runSdkMatrix();
} catch (error) {
  sdk = {
    ok: false,
    error: serializeError(error),
  };
}

const cli = runCliMatrix();
const report = {
  ok: sdk.ok && cli.ok,
  sdk,
  cli,
};

console.log(formatJson(report));
process.exitCode = report.ok ? 0 : 1;
