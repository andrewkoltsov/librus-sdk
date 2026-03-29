# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- ESLint, Prettier, Husky, and lint-staged automation for local code-quality enforcement.
- Runtime response validation for portal and Synergia API payloads with explicit schema failures.
- Mocked SDK flow coverage for login, child resolution, and child-scoped API requests.
- Security policy plus issue and pull request templates for repository maintenance.
- Reproducible Vitest V8 coverage reporting for maintainers.
- Verification notes for the March 29 follow-up checks covering live payload variance, coverage, packaging, and timeout behavior.

### Changed

- GitHub Actions CI now runs the shared validation gates on pull requests and `master` pushes.
- Package metadata now links npm consumers back to the GitHub repository and issue tracker.
- Release safety checks now include `npm pack --dry-run` in both CI and `prepublishOnly`.

### Fixed

- Root CLI help and no-argument invocation now exit cleanly without appending a JSON error payload.
- Root CLI `--version` now exits cleanly and prints the published package version.
- Attendance validation now accepts the mixed numeric and string ids returned by the live API.
- Portal CSRF token extraction now parses HTML defensively and reports a specific login-page error when the token is missing.
- Portal login now preserves non-auth API failures from post-login verification instead of always reporting bad credentials.
- README SDK usage example now uses `LibrusSession.fromEnv()` instead of the unsupported zero-argument constructor.

## [0.1.1] - 2026-03-28

### Added

- Dependabot configuration for GitHub Actions and npm dependency updates.
- Sanitized reverse-engineering and verification notes under `docs/` for the family portal flow and live CLI checks.

### Changed

- README installation section now documents `npm install librus-sdk` and `npx` usage alongside local development examples.

### Fixed

- CLI entrypoint resolution for symlinked local installs so `npm link` and similar file-based installs work correctly.
- Vitest discovery now stays scoped to the repository's `test/` directory so local worktree copies do not run duplicate test suites.

## [0.1.0] - 2026-03-27

### Added

- Fresh TypeScript `librus-sdk` project scaffold with `tsc`, `vitest`, and a Node CLI.
- SDK modules for portal authentication, linked child account discovery, and child-scoped `api.librus.pl/3.0` access.
- CLI commands for `children list`, `me`, `grades list`, `attendance list`, and `homework list`.
- JSON-first CLI output with structured error handling and secret-safe failures.
- MIT license.
