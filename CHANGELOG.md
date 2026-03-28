# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Baseline GitHub Actions CI for pull requests and branch pushes running `npm ci`, `npm run build`, and `npm test`.

### Fixed
- Root CLI help and no-argument invocation now exit cleanly without appending a JSON error payload.
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
