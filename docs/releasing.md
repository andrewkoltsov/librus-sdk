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
  `v0.2.0`, `v0.2.1`, `v0.2.2`, `v0.3.0`, and `v0.3.1`.

Example:

```bash
git checkout master
git pull --ff-only origin master
git tag -a v0.3.1 -m "v0.3.1"
git push origin v0.3.1
```

The release workflow in
[`../.github/workflows/release.yml`](../.github/workflows/release.yml) will:

- confirm the pushed tag matches `package.json`
- require the tagged commit to be reachable from `origin/master`
- publish to npm if that version is not already present
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

## One-Time Setup

Configure npm trusted publishing for package `librus-sdk` with:

- owner repository: `andrewkoltsov/librus-sdk`
- workflow path: `.github/workflows/release.yml`

Do not use GitHub Packages for this repository. The package remains unscoped and
continues to publish to npmjs only.

## Release Checklist

1. Update `package.json` to the release version.
2. Move the release notes from `Unreleased` into a new versioned section in
   `CHANGELOG.md`.
3. Merge the release commit to `master`.
4. Refresh your local `master` branch.
5. Create an annotated tag `vX.Y.Z` for the same version.
6. Push the tag to GitHub.
7. Verify that the release workflow publishes the package and creates the
   GitHub Release.

## Homepage Value For Badge Evidence

For consistency with `package.json`, use this project homepage value in badge or
Best Practices forms until the package metadata changes:

`https://github.com/andrewkoltsov/librus-sdk#readme`
