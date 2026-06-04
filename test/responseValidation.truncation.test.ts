import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { LibrusResponseValidationError } from "../src/sdk/models/errors.js";
import { parseApiResponse } from "../src/sdk/validation/responseValidation.js";

const ENDPOINT = "https://api.librus.pl/3.0/Test";

const fiveFieldSchema = v.object({
  a: v.string(),
  b: v.string(),
  c: v.string(),
  d: v.string(),
  e: v.string(),
});

const twoFieldSchema = v.object({
  x: v.string(),
  y: v.string(),
});

function throwingParse(
  schema: Parameters<typeof parseApiResponse>[0],
  payload: unknown,
): LibrusResponseValidationError {
  try {
    parseApiResponse(schema, payload, ENDPOINT);
  } catch (err) {
    if (err instanceof LibrusResponseValidationError) {
      return err;
    }
  }
  throw new Error(
    "expected parseApiResponse to throw LibrusResponseValidationError",
  );
}

describe("parseApiResponse — issue truncation", () => {
  it("truncates to 3 issues when schema produces more", () => {
    const err = throwingParse(fiveFieldSchema, {});

    expect(err.details?.issues).toHaveLength(3);
  });

  it("includes all issues when schema produces fewer than 3", () => {
    const err = throwingParse(twoFieldSchema, {});

    expect(err.details?.issues).toHaveLength(2);
  });

  it("formats field issues as 'path: message'", () => {
    const err = throwingParse(twoFieldSchema, {});
    const issues = err.details?.issues ?? [];

    expect(issues[0]).toMatch(/^x: /);
    expect(issues[1]).toMatch(/^y: /);
  });

  it("formats root-level issues without a path prefix", () => {
    const err = throwingParse(v.string(), 42);
    const issues = err.details?.issues ?? [];

    expect(issues).toHaveLength(1);
    expect(issues[0]).not.toMatch(/^\w+: /);
  });

  it("returns parsed output for a valid payload", () => {
    const result = parseApiResponse(
      twoFieldSchema,
      { x: "hello", y: "world" },
      ENDPOINT,
    );

    expect(result).toEqual({ x: "hello", y: "world" });
  });

  it("includes endpoint in error details", () => {
    const err = throwingParse(twoFieldSchema, {});

    expect(err.details?.endpoint).toBe(ENDPOINT);
  });
});
