# Releasing

This repository publishes `librus-sdk` to npm from GitHub Actions using npm
trusted publishing.

## Versioning Policy

- `package.json` is the source of truth for the published package version.
- Releases follow Semantic Versioning (`MAJOR.MINOR.PATCH`).
- Documentation-only, workflow-only, and badge-only changes do not require a
  new npm release unless they accompany an actual public SDK or CLI behavior
  change.

## Tag And Branch Policy

- Releases are triggered by annotated `vX.Y.Z` tags.
- The tag name must exactly match the version in `package.json`.
- The tagged commit must be reachable from `origin/master`.
- The current repository history follows this convention with tags such as
  `v0.2.0`, `v0.2.1`, `v0.2.2`, `v0.3.0`, `v0.3.1`, and `v0.3.2`.

Example:

```bash
git checkout master
git pull --ff-only origin master
git tag -a v0.4.0 -m "v0.4.0"
git push origin v0.4.0
```

The release workflow in
[`../.github/workflows/release.yml`](../.github/workflows/release.yml) will:

- confirm the pushed tag matches `package.json`
- require the tagged commit to be reachable from `origin/master`
- publish to npm if that version is not already present
- verify the published npm package still exposes provenance attestations and
  registry signatures after `npm publish --provenance`
- create the GitHub Release from the matching `CHANGELOG.md` section

## Release Notes Policy

- `CHANGELOG.md` is the source of truth for release notes.
- Before tagging a release, move notes from `Unreleased` into a new versioned
  `## [X.Y.Z] - YYYY-MM-DD` section.
- GitHub Release notes are generated from the matching changelog section by
  `scripts/extract-release-notes.mjs`.
- The matching changelog section must exist and must not be empty, or release
  note generation fails.
- When a security fix is publicly disclosed, call it out explicitly in the
  release notes for the affected version.
- Call out public runtime-hardening and other operational behavior changes that
  affect configuration or failure handling, such as request timeouts or
  secret-safe error-contract changes, even when they are not security fixes.

## One-Time Setup

Configure npm trusted publishing for package `librus-sdk` with:

- owner repository: `andrewkoltsov/librus-sdk`
- workflow path: `.github/workflows/release.yml`

Do not use GitHub Packages for this repository. The package remains unscoped and
continues to publish to npmjs only.

## Release Checklist

1. Run `npm version X.Y.Z --no-git-tag-version` to update
   `package.json`, `package-lock.json`, and `openapi.json` together.
2. Move the release notes from `Unreleased` into a new versioned section in
   `CHANGELOG.md`.
3. Merge the release commit to `master`.
4. Refresh your local `master` branch.
5. Create an annotated tag `vX.Y.Z` for the same version.
6. Push the tag to GitHub.
7. Verify that the release workflow publishes the package and creates the
   GitHub Release.
8. Confirm the workflow's published-package verification step succeeds.

Using `npm version` matters here because the repository's `version` lifecycle
hook regenerates `openapi.json` from the new package version automatically.

## Maintainer Continuity

- Keep `.github/CODEOWNERS` aligned with the trusted GitHub maintainers who can
  review and land changes.
- Keep at least two trusted maintainers on GitHub and npm before enforcing an
  approving-review requirement on `master`, so branch protection does not
  deadlock releases.
- After maintainers change, re-check `master` branch protection so the required
  status checks still include the CI validation gate and CodeQL analysis.

## Homepage Value For Badge Evidence

For consistency with `package.json`, use this project homepage value in badge or
Best Practices forms until the package metadata changes:

`https://github.com/andrewkoltsov/librus-sdk#readme`
