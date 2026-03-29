import { formatJson, serializeError } from "./helpers/errors.mjs";
import { runSdkMatrix } from "./helpers/sdk.mjs";

try {
  const report = await runSdkMatrix();
  console.log(formatJson(report));
  process.exitCode = report.ok ? 0 : 1;
} catch (error) {
  console.error(formatJson({ ok: false, error: serializeError(error) }));
  process.exitCode = 1;
}
