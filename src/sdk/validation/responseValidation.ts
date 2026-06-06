import * as v from "valibot";

import { LibrusResponseValidationError } from "../models/errors.js";

const MAX_ISSUES = 3;

/**
 * Valibot's default issue messages embed the raw received value, e.g.
 * `Invalid type: Expected number but received "hunter2-SECRET"`. The validated
 * payload can carry secrets (passwords, tokens, child PII) that the Librus
 * server echoes back, so the received portion must never reach a thrown error.
 * Rebuild each message from the `Invalid <label>:` prefix and `issue.expected`
 * only — both are schema-derived and contain no payload data.
 */
function redactReceivedValue(issue: v.BaseIssue<unknown>): string {
  const label =
    issue.message.match(/^(Invalid [^:]+):/)?.[1] ?? "Invalid value";
  return issue.expected ? `${label}: Expected ${issue.expected}` : label;
}

function summarizeIssues(issues: v.BaseIssue<unknown>[]): string[] {
  return issues.slice(0, MAX_ISSUES).map((issue) => {
    const path = v.getDotPath(issue);
    const message = redactReceivedValue(issue);
    return path ? `${path}: ${message}` : message;
  });
}

export function parseApiResponse<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(schema: TSchema, payload: unknown, endpoint: string): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, payload);

  if (!result.success) {
    throw new LibrusResponseValidationError(
      endpoint,
      summarizeIssues(result.issues),
    );
  }

  return result.output;
}
