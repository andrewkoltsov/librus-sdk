# librus-sdk

[![CI](https://github.com/andrewkoltsov/librus-sdk/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/andrewkoltsov/librus-sdk/actions/workflows/ci.yml)
[![CodeQL](https://github.com/andrewkoltsov/librus-sdk/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/andrewkoltsov/librus-sdk/actions/workflows/codeql.yml)
[![Snyk Security](https://github.com/andrewkoltsov/librus-sdk/actions/workflows/snyk.yml/badge.svg?branch=master)](https://github.com/andrewkoltsov/librus-sdk/actions/workflows/snyk.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/andrewkoltsov/librus-sdk/badge)](https://scorecard.dev/viewer/?uri=github.com/andrewkoltsov/librus-sdk)

Fresh TypeScript SDK and CLI for the Librus family portal and Gateway API 2.0
JSON flows.

For Portal accounts, this project logs into `portal.librus.pl`, loads linked
child accounts from `portal/api/v3/SynergiaAccounts`, and uses the selected
child account's bearer token against `https://api.librus.pl/3.0`.

For school-issued accounts, it can also log in with the Gateway API 2.0 login
and password, keep the resulting Synergia cookies, and read
`https://synergia.librus.pl/gateway/api/2.0`. That backend is already scoped to
one account and does not support Portal-only child discovery.

It intentionally does not reuse the legacy `synergia.librus.pl` HTML-scraping
approach.

## Acknowledgements

This implementation was inspired by
[Mati365/librus-api](https://github.com/Mati365/librus-api/).

## Security

Report vulnerabilities privately as described in [`SECURITY.md`](./SECURITY.md).

Never commit, log, or print real credentials, bearer tokens, cookies, or other
secrets in source files, fixtures, examples, or documentation.

The repository also publishes a weekly
[OpenSSF Scorecard report](https://scorecard.dev/viewer/?uri=github.com/andrewkoltsov/librus-sdk)
from GitHub Actions so maintainers can track workflow hardening and other
supply-chain signals over time.

## Install

This package requires Node.js 22 or newer.

Install the package from npm:

```bash
npm install librus-sdk
```

Use the CLI without installing it globally:

```bash
npm exec --package librus-sdk -- librus-sdk --version
npm exec --package librus-sdk -- librus-sdk children list
npm exec --package librus-sdk -- librus-sdk grades list --child <id-or-login>
```

The canonical CLI binary is `librus-sdk`. A deprecated `librus` alias remains
temporarily for compatibility and prints a warning before delegating.

The package also ships generated OpenAPI documents for the SDK-supported
`api_v3`, `gateway_api_20`, and `wiadomosci.librus.pl/api` surfaces, so
non-TypeScript consumers can generate clients in other languages. The legacy
API 3.0 document is [`openapi/api_v3_openapi.json`](./openapi/api_v3_openapi.json).
For package compatibility it is still also exported as `librus-sdk/openapi.json`.

## Public Interface

This README is the canonical public-interface reference for the npm package and
CLI published from this repository.

### Environment

`LibrusSession.fromEnv()` and the CLI read credentials and timeout settings from
these variables:

| Variable                  | Required         | Purpose                                                            |
| ------------------------- | ---------------- | ------------------------------------------------------------------ |
| `LIBRUS_API_BACKEND`      | No               | Optional `api_v3` or `gateway_api_20` selector.                    |
| `LIBRUS_PORTAL_EMAIL`     | `api_v3`         | Portal login email used for `portal.librus.pl`.                    |
| `LIBRUS_PORTAL_PASSWORD`  | `api_v3`         | Portal login password used for `portal.librus.pl`.                 |
| `LIBRUS_GATEWAY_LOGIN`    | `gateway_api_20` | School-issued Gateway API 2.0 login. This is not an email address. |
| `LIBRUS_GATEWAY_PASSWORD` | `gateway_api_20` | Password for the Gateway API 2.0 login.                            |
| `LIBRUS_CHILD`            | No               | Optional default child id or login for `api_v3` CLI commands.      |
| `LIBRUS_TIMEOUT_MS`       | No               | Positive integer request timeout in milliseconds.                  |

If no timeout is configured, portal and child-scoped SDK requests default to
`30000` milliseconds. Invalid timeout values fail fast with
`CONFIGURATION_ERROR`.

When no `LIBRUS_API_BACKEND` is set, complete Portal credentials select
`api_v3`. If Portal credentials are absent and complete Gateway credentials are
present, `gateway_api_20` is selected. If neither set is complete, the default
is `api_v3` so missing-credential errors stay Portal-oriented. When both
credential sets are complete, `api_v3` wins unless
`LIBRUS_API_BACKEND=gateway_api_20` is set explicitly.

Empty credential variables are treated as invalid. If a portal-prefixed
credential variable is set but empty, the deprecated compatibility alias for
that credential is ignored. `LIBRUS_CHILD` is used only by `api_v3`; CLI
`--child` wins over `LIBRUS_CHILD`, and explicit `--child` is rejected for
`gateway_api_20` because that backend is already scoped to one account.

### Top-Level SDK Entry Points

Import from the package root:

```ts
import {
  BffApiClient,
  GatewayApi20AuthClient,
  LibrusSession,
  PortalClient,
  SynergiaApiClient,
  generateGatewayApi20OpenApiDocument,
  generateOpenApiDocument,
  generateWiadomosciOpenApiDocument,
  LibrusSdkError,
  type LibrusApiBackend,
} from "librus-sdk";
```

| Export                                | Purpose                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `LibrusSession`                       | Recommended high-level entry point. Handles login, linked-child discovery, child selection, and creation of child-scoped API clients. |
| `BffApiClient`                        | Experimental child-scoped client for selected `https://testbff.librus.pl/v1` mobile backend reads.                                    |
| `GatewayApi20AuthClient`              | Lower-level Gateway API 2.0 login/password auth client for `synergia.librus.pl/gateway/api/2.0` cookie-backed requests.               |
| `PortalClient`                        | Lower-level portal session client for `portal.librus.pl` login, `/Me`, and `/SynergiaAccounts`.                                       |
| `SynergiaApiClient`                   | Child-scoped GET client for the supported `https://api.librus.pl/3.0` surface when you already have a bearer token.                   |
| `generateOpenApiDocument`             | Generates the shipped OpenAPI document for the supported `api_v3` child-scoped GET subset.                                            |
| `generateGatewayApi20OpenApiDocument` | Generates the shipped OpenAPI document for the supported `gateway_api_20` GET subset.                                                 |
| `generateWiadomosciOpenApiDocument`   | Generates the shipped OpenAPI document for the supported `wiadomosci.librus.pl/api` inbox subset.                                     |

Recommended session flow:

```ts
import { LibrusSession } from "librus-sdk";

const session = LibrusSession.fromEnv();
const children = await session.listChildren();
const client = await session.forChild(children[0]);
const grades = await client.getGrades();
console.log(grades);
```

Gateway API 2.0 flow:

```bash
LIBRUS_API_BACKEND=gateway_api_20
LIBRUS_GATEWAY_LOGIN=1234567
LIBRUS_GATEWAY_PASSWORD=your-password
npm exec --package librus-sdk -- librus-sdk grades list
```

```ts
import { LibrusSession } from "librus-sdk";

const session = LibrusSession.fromGatewayCredentials({
  login: "1234567",
  password: "your-password",
});
const client = await session.forChild();
const grades = await client.getGrades();
console.log(grades);
```

Gateway API 2.0 is already child-scoped. `getPortalMe()`,
`getSynergiaAccounts()`, `listChildren()`, `resolveChild(...)`,
`forChildBff(...)`, and `forChildWiadomosci(...)` require Portal auth and fail
with `UNSUPPORTED_BACKEND` in `gateway_api_20`.

Current high-level methods on `LibrusSession`:

- `LibrusSession.fromEnv(env?)`
- `LibrusSession.fromGatewayCredentials(credentials, options?)`
- `new LibrusSession({ apiBackend?, credentials, portalClient?, portalClientOptions?, gatewayApi20AuthClient?, gatewayApi20AuthClientOptions?, bffClientOptions?, synergiaClientOptions?, wiadomosciClientOptions?, requestTimeoutMs? })`
- `login()`
- `getApiBackend()`
- `getPortalMe()`
- `getSynergiaAccounts()`
- `listChildren()`
- `resolveChild(selector)`
- `forChild(selectorOrChild)`
- `forChildWiadomosci(selectorOrChild)`
- `forChildBff(selectorOrChild)`

Current methods on `PortalClient`:

- `new PortalClient(options?)`
- `login(credentials)`
- `getMe()`
- `getSynergiaAccounts()`
- `isLoggedIn()`

`SynergiaApiClient` exposes explicit child-scoped read methods grouped by
endpoint family rather than raw route strings:

| Domain                           | Methods exposed today                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profile                          | `getMe()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Grades                           | `getGrades()`, `getGradeAverages(subjectId?)`, `getGradeCategories()`, `getGradeComments()`, `getBehaviourGrades()`, `getBehaviourGradeTypes()`, `getBehaviourGradePoints()`, `getBehaviourPointCategories()`, `getBehaviourPointComments()`, `getBehaviourSystemProposal()`, `getDescriptiveGrades()`, `getDescriptiveGradeComments()`, `getDescriptiveGradeSkills()`, `getDescriptiveGradeText(subjectId)`, `getDescriptiveGradeTextCategories()`, `getDescriptiveTextGrades()`, `getDescriptiveTextGradeSkills()`, `getPointGrades(subjectId?)`, `getPointGradeAverages(subjectId?)`, `getPointGradeCategories()`, `getPointGradeComments()`, `getTextGrades()` |
| Attendance                       | `getAttendances()`, `getAttendanceTypes()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Timetable                        | `getTimetableWeek(weekStart)`, `getTimetableDay(day)`, `getTimetableEntry(id)`, `getCalendars()`, `getClassFreeDays()`, `getClassFreeDayTypes()`, `getSchoolFreeDays()`, `getTeacherFreeDays()`, `getSubstitution(id)`, `getVirtualClasses()`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Lessons                          | `listLessons()`, `getLesson(id)`, `listPlannedLessons()`, `getPlannedLesson(id)`, `getPlannedLessonAttachment(id)`, `listRealizations()`, `getRealization(id)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Homework                         | `getHomeWorks()`, `getHomeworkAssignments()`, `getHomeworkAssignmentAttachment(id)`, `getHomeworkCategories()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Messages                         | `listMessages(options?)`, `getMessage(id)`, `getUnreadMessages()`, `listMessagesForUser(userId)`, `listMessageReceiverGroups()`, `getMessageReceiverGroup(id)`, `getMessageAttachment(id)`. `listMessages` supports `afterId`, `page`, `limit`, `alternativeBody`, `changeNewLine`, and `getAllTypes` query options.                                                                                                                                                                                                                                                                                                                                               |
| Announcements and notes          | `listSchoolNotices()`, `getSchoolNotice(id)`, `listNotes()`, `getNote(id)`, `listNoteCategories()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| School metadata                  | `getSchool()`, `getSchoolById(id)`, `getClass()`, `getClassroom(id)`, `listSubjects()`, `getSubject(id)`, `listUsers()`, `getUser(id)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Notifications and justifications | `getLuckyNumber(forDay?)`, `getNotificationCenter()`, `getPushConfigurations()`, `listJustifications(options?)`, `getJustification(id)`, `listParentTeacherConferences()`, `getSystemData()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Auth reads                       | `listAuthPhotos()`, `getAuthPhoto(id)`, `getAuthUserInfo(id)`, `getAuthTokenInfo()`, `getAuthClassroom(id)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Attachment-style methods such as `getHomeworkAssignmentAttachment(id)`,
`getMessageAttachment(id)`, and `getPlannedLessonAttachment(id)` return
`SynergiaBinaryResult` with `{ data, contentType, contentDisposition }`.

When a `SynergiaApiClient` is created through `api_v3`
`LibrusSession.forChild(child)`, reads use bearer-token requests against
`https://api.librus.pl/3.0` by default. When it is created through
`gateway_api_20` with `LibrusSession.forChild()` and no child selector, reads
use cookie-backed requests against
`https://synergia.librus.pl/gateway/api/2.0` instead; API 3.0 bearer requests
are not expected to work for that backend.

Use `LibrusSession.forChildWiadomosci()` to opt in to the portal-authenticated
`https://wiadomosci.librus.pl/api` inbox backend for `listMessages()`,
`getMessage(id)`, and `getUnreadMessages()`. Other child-scoped reads, message
receiver groups, and message attachment downloads continue to use the session's
default Synergia transport. Direct `new SynergiaApiClient(token)` construction
keeps using API 3.0 for all methods unless lower-level transport options or a
custom message backend are supplied.

`BffApiClient` currently exposes the research-oriented `listMessages()` method
for `GET https://testbff.librus.pl/v1/Messages`. It uses the selected child's
Synergia access token as `x-zse-authorization` and returns the raw
`{ inboxMessages }` BFF response shape.

`getAuthPhoto(id)` mirrors the live API and returns JSON with the photo payload
under `data.photo`, including base64 content in `data.photo.content`. The CLI
`auth photo --output <path>` command decodes that content before writing the
file.

`HomeWork.LessonNo` mirrors the live Librus payload and may be `string`,
`number`, or `null`. `HomeWork.Subject` may be omitted entirely or returned as
`null`.

### Constructor And Helper Option Shapes

These tables describe the option objects currently accepted by the exported
constructors and helpers. The interface names are the current source names used
in the generated `.d.ts`, but the package documents the accepted property shapes
here rather than promising every helper type as a named top-level export.

`LibrusSession` constructor options (`LibrusSessionOptions`):

| Property                        | Required | Meaning                                                                              |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `credentials`                   | Yes      | Portal `{ email, password }` or Gateway `{ login, password }` credentials.           |
| `apiBackend`                    | No       | `api_v3` by default, or `gateway_api_20` for Gateway API 2.0 credentials.            |
| `portalClient`                  | No       | Reuse an existing `PortalClient` instance instead of constructing one internally.    |
| `portalClientOptions`           | No       | Passed to the internally created `PortalClient` when `portalClient` is not supplied. |
| `gatewayApi20AuthClient`        | No       | Reuse an existing Gateway API 2.0 auth client in `gateway_api_20`.                   |
| `gatewayApi20AuthClientOptions` | No       | Passed to the internally created Gateway API 2.0 auth client.                        |
| `bffClientOptions`              | No       | Passed to BFF clients created by `forChildBff(...)`.                                 |
| `synergiaClientOptions`         | No       | Passed to `SynergiaApiClient` instances created by `forChild(...)`.                  |
| `wiadomosciClientOptions`       | No       | Passed to wiadomosci-backed clients created by `forChildWiadomosci(...)`.            |
| `requestTimeoutMs`              | No       | Session-wide default timeout for internally created portal and child clients.        |

`PortalClient` constructor options (`PortalClientOptions`):

| Property           | Required | Meaning                                                                             |
| ------------------ | -------- | ----------------------------------------------------------------------------------- |
| `fetch`            | No       | Custom fetch implementation. The client wraps it in cookie-backed session handling. |
| `portalBaseUrl`    | No       | Portal origin. Defaults to `https://portal.librus.pl`.                              |
| `portalApiBaseUrl` | No       | Portal API base URL. Defaults to `${portalBaseUrl}/api/v3`.                         |
| `loginPath`        | No       | Login page path. Defaults to `/konto-librus/login`.                                 |
| `loginActionPath`  | No       | Login form submission path. Defaults to `/konto-librus/login/action`.               |
| `requestTimeoutMs` | No       | Positive integer timeout in milliseconds. Defaults to `30000`.                      |

`SynergiaApiClient` constructor options (`SynergiaApiClientOptions`):

| Property           | Required | Meaning                                                         |
| ------------------ | -------- | --------------------------------------------------------------- |
| `fetch`            | No       | Custom fetch implementation for child-scoped API requests.      |
| `apiBaseUrl`       | No       | Synergia API base URL. Defaults to `https://api.librus.pl/3.0`. |
| `authMode`         | No       | `bearer` by default, or `cookie` for Gateway-created sessions.  |
| `requestTimeoutMs` | No       | Positive integer timeout in milliseconds. Defaults to `30000`.  |

OpenAPI generator options (`GenerateOpenApiDocumentOptions`):

| Property    | Required | Meaning                                                                                                          |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `title`     | No       | Overrides the generated OpenAPI `info.title`.                                                                    |
| `version`   | No       | Overrides the generated OpenAPI `info.version`. Pass the package version when generating a publishable document. |
| `serverUrl` | No       | Overrides the generator's default server URL.                                                                    |

### Public Types And Errors

In addition to the top-level classes above, the package root re-exports the
model and error modules under `src/sdk/models/`.

| Category                       | Public surface                                                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portal and child-account types | `PortalCredentials`, `PortalMe`, `ChildAccount`, `SynergiaAccountsResponse`                                                                                                        |
| Shared response helpers        | `ApiRef`, `SynergiaBinaryResult`, other common helper interfaces used by SDK responses                                                                                             |
| Synergia response models       | Response and entity interfaces for the supported child-scoped API surface under the `synergia` model barrels                                                                       |
| Error classes                  | `LibrusSdkError`, `LibrusApiError`, `LibrusAuthenticationError`, `LibrusConfigurationError`, `LibrusNetworkTimeoutError`, `LibrusPortalPageError`, `LibrusResponseValidationError` |

### CLI Surface

Root CLI commands:

- `librus-sdk --help`
- `librus-sdk --version`

Every leaf command supports `--format <text|json>`. In `api_v3`, child-scoped
commands require a child selector: pass `--child <id-or-login>` or set
`LIBRUS_CHILD`. `--child` wins when both are present. In `gateway_api_20`, the
account is already child-scoped, so the same commands run without `--child` and
explicit `--child` fails with `UNSUPPORTED_BACKEND`. Portal-only commands such
as `children list`, `messages bff-list`, and `messages wiadomosci-list` are not
available in `gateway_api_20`.

| Family           | Subcommands                                                                                                 | Extra selectors and flags                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`       | `list`                                                                                                      | Portal-only; no child selector.                                                                                                                                                                    |
| `me`             | root command                                                                                                | `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                                                     |
| `grades`         | `list`                                                                                                      | `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                                                     |
| `attendance`     | `list`                                                                                                      | `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                                                     |
| `homework`       | `list`                                                                                                      | `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                                                     |
| `messages`       | `list`, `bff-list`, `get`, `unread`, `wiadomosci-list`, `wiadomosci-get`, `wiadomosci-unread`               | `list`, `get`, and `unread` support `--backend <api3\|wiadomosci>` and default to `api3`; `get` and `wiadomosci-get` require `--id <id>`; `bff-*` and `wiadomosci-*` are Portal-only.              |
| `timetable`      | `week`, `day`, `entry`                                                                                      | `week` requires `--week-start <YYYY-MM-DD>`; `day` requires `--day <YYYY-MM-DD>`; `entry` requires `--id <id>`; `api_v3` requires a child selector; `gateway_api_20` does not.                     |
| `announcements`  | `list`, `get`                                                                                               | `get` requires `--id <id>`; `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                         |
| `notes`          | `list`, `get`                                                                                               | `get` requires `--id <id>`; `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                         |
| `lessons`        | `list`, `get`, `planned-list`, `planned-get`, `planned-attachment`, `realizations-list`, `realizations-get` | `get`, `planned-get`, and `realizations-get` require `--id <id>`; `planned-attachment` requires `--id <id>` and `--output <path>`; `api_v3` requires a child selector; `gateway_api_20` does not.  |
| `lucky-number`   | `get`                                                                                                       | Optional `--for-day <YYYY-MM-DD>`; `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                  |
| `notifications`  | `center`, `push-configurations`                                                                             | `api_v3` requires a child selector; `gateway_api_20` does not.                                                                                                                                     |
| `justifications` | `list`, `get`, `conferences`, `system-data`                                                                 | `list` supports `--date-from <YYYY-MM-DD>`; `get` requires `--id <id>`; `api_v3` requires a child selector; `gateway_api_20` does not.                                                             |
| `auth`           | `photos`, `photo`, `user-info`, `token-info`, `classroom`                                                   | `photo` requires `--id <id>` and `--output <path>`; `user-info` and `classroom` require `--id <id>`; `api_v3` requires a child selector for child-scoped auth commands; `gateway_api_20` does not. |

### CLI Output Contract

- Human-readable text is the default stdout format for successful commands.
- `--format json` is the stable machine-readable interface for automation.
- Errors are written to stderr and follow the selected output format.
- Non-successful commands return a non-zero exit code.
- `children list` JSON output is `{ lastModification, children }`.
- Child-scoped read commands emit `{ child, data }` in JSON output for `api_v3`
  and `{ data }` for `gateway_api_20`, where the session is already
  child-scoped.
- Download commands such as `lessons planned-attachment` and `auth photo`
  write the requested file first, then report saved-file metadata instead of raw
  bytes. JSON output keeps the same `{ child, data }` envelope, where `data`
  contains `{ path, bytes, contentType, contentDisposition }`.
- Text output is meant for terminal readability. It is not a stable parsing
  contract.
- Current text rendering normalizes epoch-style `*Date` fields to local
  `YYYY-MM-DD HH:mm:ss` values and turns escaped message bodies and `<br>` tags
  into readable terminal text.

### Error-Code Contract

Consumers should branch on `error.code`, not on the free-form message text.

JSON stderr shape is stable:

```json
{
  "error": {
    "code": "CONFIGURATION_ERROR",
    "message": "Missing portal credentials. Email: LIBRUS_PORTAL_EMAIL is unset; fallback LIBRUS_EMAIL is unset. Password: LIBRUS_PORTAL_PASSWORD is unset; fallback LIBRUS_PASSWORD is unset.",
    "details": {}
  }
}
```

Contract:

- `error.code` is the stable discriminator for machine handling.
- `error.message` is human-facing and may be refined without changing the error
  category.
- `error.details` is optional and extensible. Callers should ignore unknown
  keys.
- Existing documented codes stay stable.
- Future SDK features may add new codes without changing the overall JSON error
  envelope.

Current codes emitted by the SDK and CLI:

| Code                         | Meaning                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| `CONFIGURATION_ERROR`        | Required credentials or other local configuration are missing or invalid.  |
| `AUTHENTICATION_FAILED`      | Portal or Gateway API 2.0 authentication failed.                           |
| `PORTAL_LOGIN_PAGE_INVALID`  | The portal login page no longer matches the expected CSRF-token structure. |
| `NETWORK_TIMEOUT`            | A portal or Synergia request exceeded the configured timeout.              |
| `API_REQUEST_FAILED`         | A portal or Synergia request failed with a non-maintenance HTTP error.     |
| `SERVICE_MAINTENANCE`        | The Synergia API reported maintenance mode.                                |
| `RESPONSE_VALIDATION_FAILED` | The live payload no longer matches the validated SDK schema.               |
| `CHILD_NOT_FOUND`            | No linked child account matched the provided selector.                     |
| `AMBIGUOUS_CHILD`            | More than one linked child account matched the provided selector.          |
| `CHILD_REQUIRED`             | `api_v3` needs `--child`, `LIBRUS_CHILD`, or an SDK child selector.        |
| `UNSUPPORTED_BACKEND`        | The selected API backend cannot support the requested operation.           |
| `CLI_USAGE_ERROR`            | The CLI arguments were invalid, incomplete, or used unsupported values.    |
| `INTERNAL_ERROR`             | Unexpected non-SDK error wrapper used by the CLI fallback path.            |

### Troubleshooting

Direct API 3.0 `messages` reads can fail with HTTP `403` even when other
child-scoped endpoints such as `grades list` still work. CLI
`messages list`, `messages get`, and `messages unread` use API 3.0 by default.
Pass `--backend wiadomosci` or use `messages wiadomosci-list`,
`messages wiadomosci-get`, and `messages wiadomosci-unread` to read through the
portal-authenticated `wiadomosci.librus.pl` inbox backend.

When a `/Messages` request returns `API_REQUEST_FAILED` with `status: 403`, the
SDK and CLI now add diagnostics under `error.details`:

- `feature: "messages"`
- `requiredScope: "messages"`
- `scopePresent` when `Auth/TokenInfo` exposes scopes for the same child token
- `tokenScopes` when those scopes are readable
- `hint` pointing to `librus-sdk auth token-info --child <id-or-login>`

Use the auth helper directly when you need to compare child tokens:

```bash
npm exec --package librus-sdk -- librus-sdk auth token-info --child <id-or-login>
```

For timeout handling, the SDK throws `LibrusNetworkTimeoutError`, and the CLI
writes the same `NETWORK_TIMEOUT` failure to stderr. With `--format json`,
stderr includes secret-safe `details` shaped like `{ endpoint, timeoutMs }`.
With `--format text`, stderr still includes the same stable code and the
human-facing timeout message. The endpoint is the request URL only;
credentials, bearer tokens, and cookie values are not included.

### OpenAPI

OpenAPI documents are generated from the SDK's supported endpoints and valibot
response schemas. The documents are best-effort and intentionally cover only
post-auth API calls, not the Portal or Gateway login flows.

Generated files:

- [`openapi/api_v3_openapi.json`](./openapi/api_v3_openapi.json):
  child-scoped `https://api.librus.pl/3.0` `api_v3` bearer-token requests.
- [`openapi/gateway_api_20_openapi.json`](./openapi/gateway_api_20_openapi.json):
  cookie-backed `https://synergia.librus.pl/gateway/api/2.0` requests.
- [`openapi/wiadomosci_librus_pl_api_openapi.json`](./openapi/wiadomosci_librus_pl_api_openapi.json):
  cookie-backed `https://wiadomosci.librus.pl/api` inbox requests.

Regenerate or verify the file locally with:

```bash
npm run openapi:generate
npm run openapi:check
```

You can also generate the document programmatically:

```ts
import {
  generateGatewayApi20OpenApiDocument,
  generateOpenApiDocument,
  generateWiadomosciOpenApiDocument,
} from "librus-sdk";

const openApi = generateOpenApiDocument({ version: "0.4.0" });
const gatewayApi20 = generateGatewayApi20OpenApiDocument({ version: "0.4.0" });
const wiadomosciApi = generateWiadomosciOpenApiDocument({ version: "0.4.0" });
```

### Release And Versioning Policy

Repository release policy, SemVer rules, tag naming, changelog-backed release
notes, and badge-homepage guidance are documented in
[`docs/releasing.md`](./docs/releasing.md).

## Local Development

```bash
npm install
npm run validate
npm run openapi:generate
npm run cli -- children list
npm run cli -- grades list --child <id-or-login>
```

More examples:

```bash
npm run cli -- me --child <id-or-login>
npm run cli -- attendance list --child <id-or-login>
npm run cli -- homework list --child <id-or-login>
npm run cli -- lessons list --child <id-or-login>
npm run cli -- lucky-number get --child <id-or-login>
npm run cli -- messages list --child <id-or-login>
npm run cli -- timetable week --child <id-or-login> --week-start 2026-03-30
npm run cli -- announcements list --child <id-or-login>
npm run cli -- notes list --child <id-or-login>
npm run cli -- justifications conferences --child <id-or-login>
npm run cli -- auth photo --child <id-or-login> --id <photo-id> --output ./photo.jpg
```

### Testing And Dynamic Analysis

The required pre-merge verification command for this repository is:

```bash
npm run validate
```

`npm run validate` runs the same canonical checks used by the CI validation
gate:

- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm run test:coverage`
- `npm run pack:check`

Behavior changes should add or update focused Vitest coverage in the closest
relevant suite under `test/`.

This repository's dynamic-analysis evidence is the automated Vitest test suite
plus coverage checks. That evidence comes from `npm run test:coverage` locally
and the `Validation gate` CI job in
[`./.github/workflows/ci.yml`](./.github/workflows/ci.yml).

For Best Practices and repository-policy purposes, this project does not rely on
fuzzing or browser scanning as its dynamic-analysis evidence.

Current CI jobs:

- `Validation gate`: runs the required `npm run validate` path before merge.
- `Dependency vulnerability gate`: fails on high or critical npm advisories.
- `Snyk Security`: fails on high or critical dependency vulnerabilities using
  the configured `SNYK_TOKEN` GitHub Actions secret.
- `Trivy scan (informational)`: publishes vulnerability and secret-scan results
  for review.

## Live Integration Tests

This repo also includes optional live integration tests for the built SDK and
CLI artifacts in `dist`.

They are intended for local manual verification only:

- they require real Librus credentials
- they are manual-only and not required for ordinary merges
- they are not part of `npm test`
- they are not part of `npm run validate`
- they are not run in CI or release automation

Create a dedicated Portal env file at `.env.integration.local`:

```bash
LIBRUS_PORTAL_EMAIL=you@example.com
LIBRUS_PORTAL_PASSWORD=your-password
```

Then run:

```bash
npm run test:integration
npm run test:integration:sdk
npm run test:integration:cli

npm run report:integration
npm run report:integration:sdk
npm run report:integration:cli
```

For Gateway API 2.0 verification, create
`.env.integration.gateway-api-20.local` with the school-issued login. The login
is printed or issued by the school; it is not an email address.

```bash
LIBRUS_GATEWAY_LOGIN=1234567
LIBRUS_GATEWAY_PASSWORD=your-password
```

Then run:

```bash
npm run test:integration:gateway-api-20
npm run test:integration:gateway-api-20:sdk
npm run test:integration:gateway-api-20:cli

npm run report:integration:gateway-api-20
npm run report:integration:gateway-api-20:sdk
npm run report:integration:gateway-api-20:cli
```

The Gateway API 2.0 integration scripts force
`LIBRUS_API_BACKEND=gateway_api_20`, so a developer shell with Portal variables
set will not accidentally run the Portal matrix. The Gateway matrix is already
child-scoped: SDK checks use `session.forChild()` without a selector, and CLI
checks run commands such as `librus-sdk grades list` without `--child`.
Portal-only checks are skipped in the Gateway report because
`gateway_api_20` cannot list Portal-linked children or create Portal-backed
BFF/wiadomosci clients.

To limit the Portal live run to specific children, set `LIBRUS_TEST_CHILDREN` as
a comma-separated list of child ids or logins:

```bash
LIBRUS_TEST_CHILDREN=7147345 npm run test:integration
LIBRUS_TEST_CHILDREN=7147345,child-login npm run report:integration
```
