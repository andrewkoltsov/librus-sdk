import { formatJson } from "./helpers/errors.mjs";
import { runCliMatrix } from "./helpers/cli.mjs";

const report = runCliMatrix();

console.log(formatJson(report));
process.exitCode = report.ok ? 0 : 1;
