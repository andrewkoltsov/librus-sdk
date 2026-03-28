# Verification Notes

Date: 2026-03-29

All notes below are sanitized:

- no raw credentials
- no raw bearer tokens
- no child names

## Local checks

Successful commands:

```bash
npm run lint
npm run build
npm test
npm run test:coverage
npm run pack:check
```

Outcome:

- lint succeeded
- build succeeded
- test suite passed: 32 tests across 5 files
- coverage report succeeded after adding `@vitest/coverage-v8`
- package dry run succeeded with a temporary npm cache, confirming the tarball includes `dist/`, `README.md`, `LICENSE`, and the CLI entrypoint

Coverage summary from `npm run test:coverage`:

- statements: `82.99%`
- branches: `77.67%`
- functions: `81.96%`
- lines: `82.85%`

Largest remaining gaps:

- command handlers other than `children list`
- `LibrusSession` cache and environment branches
- type-only model barrels, which naturally report `0%`

## Live CLI verification

Successful commands:

```bash
node dist/cli/main.js children list
node dist/cli/main.js me --child <selected-child-id>
node dist/cli/main.js grades list --child <selected-child-id>
node dist/cli/main.js attendance list --child <selected-child-id>
```

Outcome on the verified account:

- `children list` returned exactly `2` linked child accounts
- `me`, `grades list`, and `attendance list` all completed successfully against the live API
- the current response validation accepts the real `Me`, `SynergiaAccounts`, `Grades`, and `Attendances` payloads after widening `Attendance.Id`

Observed live payload variance:

- `Attendances[*].Id` is mixed-type on the live API:
  - numeric ids: `572`
  - string ids: `26`
- `Attendances[*].Trip` is absent on most records:
  - missing `Trip` field: `572`
- sampled grade references were non-null in this account:
  - `AddedBy`: `0` nulls
  - `Category`: `0` nulls
  - `Lesson`: `0` nulls
  - `Student`: `0` nulls
  - `Subject`: `0` nulls

That means the attendance schema needed an immediate fix, while grade nullability remains unobserved rather than disproven.

## Timeout behavior

Successful command:

```bash
node --input-type=module <<'NODE'
import http from "node:http";
import { once } from "node:events";
import { PortalClient } from "./dist/sdk/portal/PortalClient.js";

const server = http.createServer(() => {});
server.listen(0, "127.0.0.1");
await once(server, "listening");
// ...
NODE
```

Outcome:

- a local server that accepted the connection and never responded left `PortalClient.login(...)` pending for more than `1500ms`
- no built-in timeout fired during that window

This confirms that request timeout policy is still an architectural follow-up, not an already-implemented behavior.
