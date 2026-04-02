# Verification Notes

Date: 2026-04-02

All notes below are sanitized:

- no raw credentials
- no raw bearer tokens
- no child names

## Local checks

Successful commands:

```bash
npm run validate
node ./scripts/extract-release-notes.mjs 0.4.0
npx vitest run test/portal-client.test.ts test/synergia-client.test.ts test/librus-session.test.ts test/cli.test.ts -t 'timeout|LIBRUS_TIMEOUT_MS'
```

Outcome:

- `npm run validate` succeeded with `272` tests passing across `18` files
- coverage from `npm run validate` reported:
  - statements: `90.97%`
  - branches: `83.64%`
  - functions: `93.17%`
  - lines: `91.09%`
- `node ./scripts/extract-release-notes.mjs 0.4.0` succeeded and returned the
  `requestTimeoutMs`, `LIBRUS_TIMEOUT_MS`, and `NETWORK_TIMEOUT` release notes
- focused timeout and environment checks passed: `7` tests matched, `7` passed

## Timeout behavior

Deterministic timeout coverage now confirms the implemented public contract:

- `PortalClient` times out a hanging login-page request with `NETWORK_TIMEOUT`
  and secret-safe `{ endpoint, timeoutMs }` details
- `SynergiaApiClient` times out a hanging child-scoped request with the same
  stable error code and details shape
- CLI stderr keeps the timeout failure secret-safe in both `--format json` and
  text output
- `LibrusSession.fromEnv()` reads `LIBRUS_TIMEOUT_MS` and rejects invalid values
  with `CONFIGURATION_ERROR` before making requests

Observed timeout contract:

- code: `NETWORK_TIMEOUT`
- message shape: `Librus request timed out after <timeoutMs>ms.`
- details shape: `{ endpoint, timeoutMs }`
- secrets excluded from the error payload: portal password, bearer token, and
  authorization header values

## Documentation cross-check

The current public documentation now matches the implemented timeout surface:

- `README.md` documents `LIBRUS_TIMEOUT_MS`
- `README.md` documents `requestTimeoutMs` on `LibrusSession`,
  `PortalClient`, and `SynergiaApiClient`
- timeout defaults remain `30000` milliseconds when no override is supplied
- CLI timeout behavior is described as stderr output in both `text` and `json`
  formats
