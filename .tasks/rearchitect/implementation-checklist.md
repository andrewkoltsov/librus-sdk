# Rearchitect Implementation Checklist

Current branch snapshot: `codex/dependabot-saturday`.

Use this file as the tracking view for `.tasks/rearchitect`. A checked box means the task is implemented in the current worktree. An unchecked box means it is planned, deferred, or not started.

## Recommended Order

- [x] [06 - Clearer env var error messages](06-env-validation.md) - implemented
- [ ] [08 - Narrow error-path test gaps](08-test-coverage.md) - not implemented
- [ ] [12 - README: three missing worked examples](12-readme-patterns.md) - not implemented
- [ ] [02 - Token refresh at the session layer](02-session-refresh.md) - not implemented
- [ ] [04 - Retry/backoff for transient failures](04-retry-backoff.md) - not implemented
- [ ] [03 - Split monolithic `openapi.ts`](03-openapi-split.md) - not implemented
- [ ] [01 - Split `SynergiaApiClient` by domain](01-domain-split.md) - not implemented
- [ ] [05 - Logging hooks](05-logging-hooks.md) - not implemented
- [ ] [11 - Fixture-backed contract tests](11-contract-tests.md) - not implemented
- [ ] [09 - CLI boilerplate](09-cli-boilerplate.md) - deferred; no implementation planned until a concrete trigger appears

## First Batch

These are the safest tasks to land first because they are small and mostly additive.

- [x] [06 - Clearer env var error messages](06-env-validation.md)
  - Current state: `LibrusSession.fromEnv()` reports missing or empty primary and fallback credential env vars without exposing values.
  - Expected change: mention primary and fallback env vars without exposing values.
  - Main files: `../../src/sdk/LibrusSession.ts`, `../../test/librus-session.test.ts`, `../../README.md`

- [ ] [08 - Narrow error-path test gaps](08-test-coverage.md)
  - Current state: no dedicated tests for `combineAbortSignals` or response-validation issue truncation.
  - Correction to task note: current validation code truncates to 3 issues but does not add a "remaining issues" marker, so that part requires a small production behavior decision.
  - Main files: `../../src/sdk/requestTimeout.ts`, `../../src/sdk/validation/responseValidation.ts`, `../../test/`

- [ ] [12 - README: three missing worked examples](12-readme-patterns.md)
  - Current state: README documents constructors and env vars, but does not include the planned worked examples.
  - Expected change now: add custom fetch and child-selection examples.
  - Hold until later: retry example should wait for [04](04-retry-backoff.md).
  - Main file: `../../README.md`

## Reliability Batch

These solve real SDK behavior gaps and should land with focused tests.

- [ ] [02 - Token refresh at the session layer](02-session-refresh.md)
  - Current state: `forChild()` creates `SynergiaApiClient` with a fixed bearer token; 401 responses are thrown directly.
  - Important implementation note: refresh must bypass or invalidate the cached Synergia accounts response, otherwise it may return the same stale token.
  - Main files: `../../src/sdk/LibrusSession.ts`, `../../src/sdk/synergia/SynergiaApiClient.ts`, `../../src/sdk/synergia/request.ts`, `../../test/librus-session.test.ts`

- [ ] [04 - Retry/backoff for transient failures](04-retry-backoff.md)
  - Current state: Synergia requests fail immediately on 429/5xx.
  - Important implementation note: define whether timeout applies per attempt or across the full retry operation before coding.
  - Main files: `../../src/sdk/synergia/request.ts`, `../../src/sdk/synergia/SynergiaApiClient.ts`, `../../test/`

## Structural Batch

These are worthwhile only when the repo is actively expanding endpoint coverage or OpenAPI edits become a merge-conflict problem.

- [ ] [03 - Split monolithic `openapi.ts`](03-openapi-split.md)
  - Current state: `src/sdk/openapi.ts` is still a single large file.
  - Gate: add or preserve a golden `openapi.json` check before moving code.
  - Main files: `../../src/sdk/openapi.ts`, `../../src/sdk/openapi/`, `../../test/openapi.test.ts`

- [ ] [01 - Split `SynergiaApiClient` by domain](01-domain-split.md)
  - Current state: `SynergiaApiClient.ts` is still a single class/file containing request wiring and domain methods.
  - Gate: preserve constructor, method names, parameter arity, and return types.
  - Main files: `../../src/sdk/synergia/SynergiaApiClient.ts`, `../../src/sdk/synergia/domains/`, `../../test/`

## Later / Optional

- [ ] [05 - Logging hooks](05-logging-hooks.md)
  - Current state: no SDK logger interface.
  - Recommendation: keep deferred until refresh/retry exists or a CLI verbose mode needs it.
  - Main files: `../../src/sdk/`, `../../src/cli/main.ts`, `../../README.md`

- [ ] [11 - Fixture-backed contract tests](11-contract-tests.md)
  - Current state: live integration tests exist, but no record/replay fixture layer.
  - Recommendation: start with a small replay pilot and strict redaction tests before wiring broad CI coverage.
  - Main files: `../../test/integration/`, `../../package.json`, `../../README.md`, `../../.github/workflows/`

- [ ] [09 - CLI boilerplate](09-cli-boilerplate.md)
  - Current state: deferred by design.
  - Trigger only if command boilerplate demonstrably starts causing drift.

## Already Solid

These are not tasks to implement; they are current properties to preserve while changing the code.

- [x] Portal-based authentication flow is the supported path.
- [x] `SynergiaApiClient` exposes named child-scoped methods rather than a generic public query builder.
- [x] OpenAPI generation is already checked against checked-in `openapi.json`.
- [x] Request timeout parsing and validation already exist.
- [x] CLI output is already centralized through command helpers.
- [x] Live integration tests are already opt-in and credential-gated.
