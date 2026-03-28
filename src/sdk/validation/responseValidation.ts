import * as v from "valibot";

import { LibrusResponseValidationError } from "../models/errors.js";

const MAX_ISSUES = 3;

function summarizeIssues(issues: v.BaseIssue<unknown>[]): string[] {
  return issues.slice(0, MAX_ISSUES).map((issue) => {
    const path = v.getDotPath(issue);
    return path ? `${path}: ${issue.message}` : issue.message;
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
