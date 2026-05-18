import { beforeEach, describe, expect, it, vi } from "vitest";

import * as publishedPackageModule from "../scripts/verify-published-package.mjs";

const { execFileSync } = vi.hoisted(() => ({
  execFileSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFileSync,
}));

const { assertPublishedPackageSecurityMetadata } = publishedPackageModule as {
  assertPublishedPackageSecurityMetadata: (
    metadata: unknown,
    packageSpec: string,
  ) => void;
  fetchPublishedPackageMetadata: (packageSpec: string) => string;
  verifyPublishedPackage: (
    packageName: string,
    packageVersion?: string,
  ) => void;
};
const { fetchPublishedPackageMetadata, verifyPublishedPackage } =
  publishedPackageModule as {
    fetchPublishedPackageMetadata: (packageSpec: string) => string;
    verifyPublishedPackage: (
      packageName: string,
      packageVersion?: string,
    ) => void;
  };

beforeEach(() => {
  execFileSync.mockReset();
});

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

  it("fails when npm returns no metadata object", () => {
    expect(() =>
      assertPublishedPackageSecurityMetadata(null, "librus-sdk@0.3.3"),
    ).toThrow("npm view returned no package metadata");
  });
});

describe("fetchPublishedPackageMetadata", () => {
  it("fetches package metadata through npm view", () => {
    execFileSync.mockReturnValue('{"name":"librus-sdk"}');

    const stdout = fetchPublishedPackageMetadata("librus-sdk@0.3.3");

    expect(stdout).toBe('{"name":"librus-sdk"}');
    expect(execFileSync).toHaveBeenCalledWith(
      "npm",
      ["view", "librus-sdk@0.3.3", "--json"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  });

  it("wraps npm view failures", () => {
    execFileSync.mockImplementation(() => {
      throw new Error("registry unavailable");
    });

    expect(() => fetchPublishedPackageMetadata("librus-sdk@0.3.3")).toThrow(
      "Failed to fetch package metadata for librus-sdk@0.3.3 from npm registry: registry unavailable",
    );
  });
});

describe("verifyPublishedPackage", () => {
  it("verifies a specific package version", () => {
    execFileSync.mockReturnValue(
      JSON.stringify({
        dist: {
          attestations: {
            url: "https://registry.npmjs.org/-/npm/v1/attestations/librus-sdk@0.3.3",
            provenance: {
              predicateType: "https://slsa.dev/provenance/v1",
            },
          },
          signatures: [{ keyid: "abc", sig: "def" }],
        },
      }),
    );

    expect(() => verifyPublishedPackage("librus-sdk", "0.3.3")).not.toThrow();
    expect(execFileSync).toHaveBeenCalledWith(
      "npm",
      ["view", "librus-sdk@0.3.3", "--json"],
      expect.any(Object),
    );
  });

  it("verifies the latest package when version is omitted", () => {
    execFileSync.mockReturnValue(
      JSON.stringify({
        dist: {
          attestations: {
            url: "https://registry.npmjs.org/-/npm/v1/attestations/librus-sdk",
            provenance: {
              predicateType: "https://slsa.dev/provenance/v1",
            },
          },
          signatures: [{ keyid: "abc", sig: "def" }],
        },
      }),
    );

    expect(() => verifyPublishedPackage("librus-sdk")).not.toThrow();
    expect(execFileSync).toHaveBeenCalledWith(
      "npm",
      ["view", "librus-sdk", "--json"],
      expect.any(Object),
    );
  });
});
