import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { extractPortalCsrfToken } from "../src/sdk/auth/csrf.js";
import {
  LibrusConfigurationError,
  LibrusPortalPageError,
} from "../src/sdk/models/errors.js";
import { parseRequestTimeoutMsFromEnv } from "../src/sdk/requestTimeout.js";
import { buildEndpoint } from "../src/sdk/synergia/request.js";

const FAST_CHECK_SETTINGS = {
  numRuns: 200,
  seed: 20260404,
} as const;

const safeIdentifierArbitrary = fc.stringMatching(/^[A-Za-z0-9_-]{1,24}$/u);
const safePathArbitrary = fc
  .array(safeIdentifierArbitrary, { minLength: 1, maxLength: 4 })
  .map((segments) => segments.join("/"));
const queryValueArbitrary = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
);

describe("Scorecard-oriented property coverage", () => {
  it("extracts CSRF tokens from nested malformed portal markup", () => {
    fc.assert(
      fc.property(safeIdentifierArbitrary, (token) => {
        const html = `<main><section><form><div><input value="${token}" name="_token" type="hidden"></section>`;

        expect(extractPortalCsrfToken(html)).toBe(token);
      }),
      FAST_CHECK_SETTINGS,
    );
  });

  it("rejects generated portal markup when the _token input is missing", () => {
    fc.assert(
      fc.property(
        safeIdentifierArbitrary.filter((name) => name !== "_token"),
        safeIdentifierArbitrary,
        (fieldName, fieldValue) => {
          const html = `<form><div><input type="hidden" name="${fieldName}" value="${fieldValue}"><input type="hidden" name="_token_hint" value="${fieldValue}"></div></form>`;

          expect(() => extractPortalCsrfToken(html)).toThrowError(
            LibrusPortalPageError,
          );
        },
      ),
      FAST_CHECK_SETTINGS,
    );
  });

  it("normalizes generated endpoint paths with arbitrary leading slashes", () => {
    fc.assert(
      fc.property(
        safePathArbitrary,
        fc.integer({ min: 0, max: 5 }),
        (path, leadingSlashCount) => {
          const endpoint = new URL(
            buildEndpoint(
              "https://api.librus.pl/3.0",
              `${"/".repeat(leadingSlashCount)}${path}`,
            ),
          );

          expect(endpoint.pathname).toBe(`/3.0/${path}`);
        },
      ),
      FAST_CHECK_SETTINGS,
    );
  });

  it("omits only nullish query values when building generated endpoints", () => {
    fc.assert(
      fc.property(
        safePathArbitrary,
        fc.record({
          a: queryValueArbitrary,
          b: queryValueArbitrary,
          c: queryValueArbitrary,
          d: queryValueArbitrary,
        }),
        (path, query) => {
          const endpoint = new URL(
            buildEndpoint("https://api.librus.pl/3.0", path, query),
          );

          for (const [key, value] of Object.entries(query)) {
            if (value === null || value === undefined) {
              expect(endpoint.searchParams.has(key)).toBe(false);
            } else {
              expect(endpoint.searchParams.get(key)).toBe(String(value));
            }
          }
        },
      ),
      FAST_CHECK_SETTINGS,
    );
  });

  it("accepts generated positive integer timeout strings", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }), (n) => {
        expect(parseRequestTimeoutMsFromEnv(String(n))).toBe(n);
      }),
      FAST_CHECK_SETTINGS,
    );
  });

  it("rejects or parses arbitrary timeout strings consistently", () => {
    fc.assert(
      fc.property(fc.string(), (rawValue) => {
        const trimmedValue = rawValue.trim();

        if (!/^\d+$/u.test(trimmedValue)) {
          expect(() => parseRequestTimeoutMsFromEnv(rawValue)).toThrowError(
            LibrusConfigurationError,
          );
          return;
        }

        const parsedValue = Number.parseInt(trimmedValue, 10);

        if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
          expect(() => parseRequestTimeoutMsFromEnv(rawValue)).toThrowError(
            LibrusConfigurationError,
          );
          return;
        }

        expect(parseRequestTimeoutMsFromEnv(rawValue)).toBe(parsedValue);
      }),
      FAST_CHECK_SETTINGS,
    );
  });
});
