import assert from "node:assert/strict";
import test from "node:test";

import { describeChild } from "./helpers/children.mjs";
import { formatJson, serializeError } from "./helpers/errors.mjs";
import { runSdkMatrix } from "./helpers/sdk.mjs";

test("SDK integration matrix", async (t) => {
  let report;

  try {
    report = await runSdkMatrix();
  } catch (error) {
    assert.fail(formatJson({ error: serializeError(error) }));
  }

  assert.ok(
    report.childCount > 0,
    "No target children selected for SDK integration tests.",
  );

  for (const child of report.children) {
    const childLabel = describeChild(child);

    for (const [checkName, check] of Object.entries(child.checks)) {
      await t.test(`${checkName} works for ${childLabel}`, () => {
        assert.equal(
          check.ok,
          true,
          formatJson({
            child: childLabel,
            check: checkName,
            error: check.error ?? null,
          }),
        );
      });
    }
  }
});
