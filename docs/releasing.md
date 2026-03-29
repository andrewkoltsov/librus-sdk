# Releasing

This repository publishes `librus-sdk` to npm from GitHub Actions using npm trusted
publishing.

## One-time setup

Configure npm trusted publishing for package `librus-sdk` with:

- owner repository: `andrewkoltsov/librus-sdk`
- workflow path: `.github/workflows/release.yml`

Do not use GitHub Packages for this repository. The package remains unscoped and
continues to publish to npmjs only.

## Release checklist

1. Update `package.json` to the release version.
2. Move the release notes from `Unreleased` into a new versioned section in
   `CHANGELOG.md`.
3. Merge the release commit to `master`.
4. Refresh your local `master` branch.
5. Create an annotated tag for the release version.
6. Push the tag to GitHub.
7. Verify that the release workflow publishes the package and creates the GitHub Release.

Example:

```bash
git checkout master
git pull --ff-only origin master
git tag -a v0.1.1 -m "v0.1.1"
git push origin v0.1.1
```

The release workflow will:

- confirm the tag matches `package.json`
- require the tagged commit to be reachable from `origin/master`
- publish to npm if that version is not already present
- create the GitHub Release from the matching `CHANGELOG.md` section
