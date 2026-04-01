import { describe, expect, it } from "vitest";

import * as publishedPackageModule from "../scripts/verify-published-package.mjs";

const { assertPublishedPackageSecurityMetadata } = publishedPackageModule as {
  assertPublishedPackageSecurityMetadata: (
    metadata: unknown,
    packageSpec: string,
  ) => void;
};

describe("assertPublishedPackageSecurityMetadata", () => {
  it("accepts published packages with attestations, provenance, and signatures", () => {
    expect(() =>
      assertPublishedPackageSecurityMetadata(
        {
          dist: {
            attestations: {
              url: "https://registry.npmjs.org/-/npm/v1/attestations/librus-sdk@0.3.3",
              provenance: {
                predicateType: "https://slsa.dev/provenance/v1",
              },
            },
            signatures: [{ keyid: "abc", sig: "def" }],
          },
        },
        "librus-sdk@0.3.3",
      ),
    ).not.toThrow();
  });

  it("fails when published attestations are missing", () => {
    expect(() =>
      assertPublishedPackageSecurityMetadata(
        { dist: { signatures: [{ keyid: "abc", sig: "def" }] } },
        "librus-sdk@0.3.3",
      ),
    ).toThrow("missing npm attestations metadata");
  });

  it("fails when npm registry signatures are missing", () => {
    expect(() =>
      assertPublishedPackageSecurityMetadata(
        {
          dist: {
            attestations: {
              url: "https://registry.npmjs.org/-/npm/v1/attestations/librus-sdk@0.3.3",
              provenance: {
                predicateType: "https://slsa.dev/provenance/v1",
              },
            },
            signatures: [],
          },
        },
        "librus-sdk@0.3.3",
      ),
    ).toThrow("missing npm registry signatures");
  });

  it("fails when provenance details are missing", () => {
    expect(() =>
      assertPublishedPackageSecurityMetadata(
        {
          dist: {
            attestations: {
              url: "https://registry.npmjs.org/-/npm/v1/attestations/librus-sdk@0.3.3",
            },
            signatures: [{ keyid: "abc", sig: "def" }],
          },
        },
        "librus-sdk@0.3.3",
      ),
    ).toThrow("missing provenance details");
  });
});
