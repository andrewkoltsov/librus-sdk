import assert from "node:assert/strict";
import test from "node:test";

import { formatJson } from "./helpers/errors.mjs";
import { runCliMatrix } from "./helpers/cli.mjs";

test("CLI integration matrix", async (t) => {
  const report = runCliMatrix();

  assert.ok(
    report.targetChildren.length > 0,
    "No target children selected for CLI integration tests.",
  );

  for (const result of report.results) {
    await t.test(result.command, () => {
      assert.equal(result.ok, true, formatJson(result));
    });
  }
});
