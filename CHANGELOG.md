# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- README now exposes CI, CodeQL, and Snyk Security status badges alongside the
  public OpenSSF Scorecard badge.
- Snyk Security now runs in GitHub Actions and fails on high or critical
  dependency vulnerabilities.

### Changed

- Vitest branch coverage enforcement now requires at least 84%.

### Fixed

- Missing `LibrusSession.fromEnv()` credential errors now name the primary and
  fallback environment variables and distinguish unset values from empty ones.

## [0.4.3] - 2026-04-13

### Fixed

- CLI text rendering now decodes escaped message-body sequences without
  dropping mixed raw backslashes, closing the outstanding CodeQL sanitization
  finding in the terminal formatter.

## [0.4.2] - 2026-04-13

### Fixed

- Development and CI dependency refresh now removes the disclosed high-severity
  Vite advisories `GHSA-4w7w-66w2-5vf9`, `GHSA-v2wj-q39q-566r`, and
  `GHSA-p9ff-h696-f583` from maintainer workflows and repository validation
  gates; the published SDK and CLI runtime surface is otherwise unchanged.

## [0.4.1] - 2026-04-04

### Added

- README now exposes the public OpenSSF Scorecard badge and report link for the
  repository security posture.

### Changed

- Minimum supported Node.js is now 22.x, CI and CodeQL validation now run on
  Node 22, and development type definitions now track the Node 22 line.
- GitHub Actions workflows now pin third-party and GitHub-hosted actions by
  commit hash, and write-scoped workflow token permissions are limited to the
  jobs that need them.
- Annotated-tag GitHub Action pins now use the underlying commit SHA so
  Scorecard result publication keeps working with `publish_results: true`.
- Dependabot now tracks both npm dependencies and pinned GitHub Actions
  updates.
- Scorecard artifact uploads now use `actions/upload-artifact@v7.0.0` so the
  workflow no longer relies on a Node.js 20 action runtime on github.com.
- Test coverage now includes property-based checks for CSRF parsing, endpoint
  construction, and timeout environment parsing.

## [0.4.0] - 2026-04-02

### Added

- Release automation now verifies the published npm package still exposes
  provenance attestations and registry signatures after
  `npm publish --provenance`.
- Repository ownership metadata now includes `.github/CODEOWNERS`, and release
  docs now spell out maintainer continuity expectations.
- Portal and Synergia requests now support explicit timeouts through
  `requestTimeoutMs` and `LIBRUS_TIMEOUT_MS`.

### Changed

- CLI startup now uses Node's built-in `.env` file loader instead of shipping
  `dotenv` as a runtime dependency.
- CLI text rendering now uses an internal formatter instead of `cliui`,
  reducing the published runtime dependency footprint while preserving the
  existing text/json command surface.
- Hanging SDK and CLI requests now fail predictably with the stable
  `NETWORK_TIMEOUT` code and secret-safe `{ endpoint, timeoutMs }` details.

## [0.3.2] - 2026-04-01

### Fixed

- Message endpoint `403` failures now include message-specific diagnostics and an `auth token-info` troubleshooting hint instead of the generic Synergia API error text alone.

## [0.3.1] - 2026-03-31

### Fixed

- CLI text output now renders epoch-style `*Date` fields as local `YYYY-MM-DD HH:mm:ss` values and decodes escaped message bodies into readable terminal text with line breaks.

## [0.3.0] - 2026-03-31

### Added

- SDK GET coverage for the remaining widget-adjacent grade, behaviour, attendance-type, homework-assignment, and homework-category endpoints.
- SDK GET coverage for high-value timetable, message, announcement, note, and school/class metadata endpoints.
- SDK GET coverage for supporting lessons, lucky number, notification settings, justifications, parent-teacher conferences, system data, and auth-related endpoints.
- CLI commands for `messages`, `timetable`, `announcements`, and `notes`.
- CLI commands for `lessons`, `lucky-number`, `notifications`, `justifications`, and `auth`.
- CLI download commands that write files to `--output` paths and then report saved-file metadata instead of raw bytes.
- Auth photo CLI download support that decodes the live API's base64 JSON content before writing the output file.
- Public `SynergiaBinaryResult` export for attachment-style SDK methods such as `getHomeworkAssignmentAttachment(id)`.
- Generated `openapi.json` for the SDK-supported child-scoped Synergia GET surface, plus a public `generateOpenApiDocument()` helper and npm regeneration scripts.

### Changed

- CLI leaf commands now accept `--format <text|json>`, default to human-readable text output, and keep `json` as the full machine-readable format.
- CLI errors now follow the selected output format, and download commands report saved-file metadata in text by default.

## [0.2.2] - 2026-03-29

### Fixed

- Homework validation now accepts live `HomeWork.Subject` values that are omitted entirely or returned as `null`.

## [0.2.1] - 2026-03-29

### Fixed

- Homework validation now accepts mixed and null `HomeWork.LessonNo` values returned by the live API.

## [0.2.0] - 2026-03-29

### Added

- ESLint, Prettier, Husky, and lint-staged automation for local code-quality enforcement.
- Runtime response validation for portal and Synergia API payloads with explicit schema failures.
- Mocked SDK flow coverage for login, child resolution, and child-scoped API requests.
- Maintainer release documentation and release safety checks for changelog extraction, package dry runs, and `master`-reachable tags.
- Security policy plus issue and pull request templates for repository maintenance.
- Reproducible Vitest V8 coverage reporting for maintainers.
- Verification notes for the March 29 follow-up checks covering live payload variance, coverage, packaging, and timeout behavior.

### Changed

- GitHub Actions CI now runs the shared validation gates on pull requests and `master` pushes.
- Releases now publish from `vX.Y.Z` tags with npm trusted publishing and changelog-backed GitHub Release notes.
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
