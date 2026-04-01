import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function assertPublishedPackageSecurityMetadata(metadata, packageSpec) {
  if (!metadata || typeof metadata !== "object") {
    throw new Error(
      `npm view returned no package metadata for ${packageSpec}.`,
    );
  }

  const dist =
    "dist" in metadata && metadata.dist && typeof metadata.dist === "object"
      ? metadata.dist
      : null;
  const attestations =
    dist &&
    "attestations" in dist &&
    dist.attestations &&
    typeof dist.attestations === "object"
      ? dist.attestations
      : null;
  const provenance =
    attestations &&
    "provenance" in attestations &&
    attestations.provenance &&
    typeof attestations.provenance === "object"
      ? attestations.provenance
      : null;
  const signatures =
    dist && "signatures" in dist && Array.isArray(dist.signatures)
      ? dist.signatures
      : [];

  if (!attestations || typeof attestations.url !== "string") {
    throw new Error(
      `Published package ${packageSpec} is missing npm attestations metadata.`,
    );
  }

  if (!provenance || typeof provenance.predicateType !== "string") {
    throw new Error(
      `Published package ${packageSpec} is missing provenance details.`,
    );
  }

  if (signatures.length === 0) {
    throw new Error(
      `Published package ${packageSpec} is missing npm registry signatures.`,
    );
  }
}

export function verifyPublishedPackage(packageName, packageVersion) {
  const packageSpec = packageVersion
    ? `${packageName}@${packageVersion}`
    : packageName;
  const stdout = execFileSync("npm", ["view", packageSpec, "--json"], {
    encoding: "utf8",
  });
  const metadata = JSON.parse(stdout);

  assertPublishedPackageSecurityMetadata(metadata, packageSpec);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
  const [, , packageName, packageVersion] = process.argv;

  if (!packageName) {
    console.error(
      "Usage: node ./scripts/verify-published-package.mjs <package-name> [version]",
    );
    process.exitCode = 1;
  } else {
    verifyPublishedPackage(packageName, packageVersion);
  }
}
