# Verification Notes

Date: 2026-03-27

All notes below are sanitized:

- no raw credentials
- no raw bearer tokens
- no child names

## Local checks

Successful commands:

```bash
npm install --cache /tmp/librus-sdk-npm-cache
npm run build
npm test
```

Outcome:

- build succeeded
- test suite passed: 10 tests across 4 files

## Live CLI verification

Successful command:

```bash
node dist/cli/main.js children list
```

Outcome:

- portal login succeeded using the local `.env`
- `children list` returned exactly `2` linked child accounts

Attempted commands:

```bash
node dist/cli/main.js me --child <selected-child-id>
node dist/cli/main.js grades list --child <selected-child-id>
node dist/cli/main.js attendance list --child <selected-child-id>
node dist/cli/main.js homework list --child <selected-child-id>
```

Observed outcome on 2026-03-27 at approximately 23:06 Europe/Warsaw:

- all four commands reached `https://api.librus.pl/3.0/...`
- all four returned HTTP `503`
- the live response body reported a planned maintenance window for the night of March 27/28, 2026, from `23:00` to `06:00`
- the CLI now surfaces this as:
  - code: `SERVICE_MAINTENANCE`
  - message: `Librus API is temporarily unavailable due to maintenance.`

## Prior live API confirmation

Before the maintenance window began, the family portal flow itself had already been confirmed against the same account during the research session captured in [librus-family-portal-research-2026-03-27.md](/Users/andreykoltsov/work/librus-sdk/docs/librus-family-portal-research-2026-03-27.md):

- `portal/api/v3/SynergiaAccounts` returned both linked children
- child bearer tokens worked against:
  - `GET https://api.librus.pl/3.0/Me`
  - `GET https://api.librus.pl/3.0/Grades`
  - `GET https://api.librus.pl/3.0/Attendances`
  - `GET https://api.librus.pl/3.0/HomeWorks`

That earlier verification confirms the target flow is correct. The post-implementation CLI verification of those child-data commands is temporarily blocked only by the live maintenance window.
