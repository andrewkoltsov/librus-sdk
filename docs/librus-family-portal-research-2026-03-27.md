# Librus Family Portal Research

Date: 2026-03-27

This note summarizes the reverse-engineering work done against a live parent `Konto LIBRUS` account with multiple children.

Sensitive data is intentionally omitted:

- no emails
- no passwords
- no access tokens
- no child names

## High-Level Conclusion

For the family portal flow, the old `synergia.librus.pl` HTML scraping approach is not the right foundation.

The working flow is:

1. Login to `Konto LIBRUS` on `portal.librus.pl`
2. Fetch linked Synergia child accounts from `portal.librus.pl/api/v3/SynergiaAccounts`
3. Use the selected child account's `accessToken` as `Bearer` for `https://api.librus.pl/3.0/...`

This is different from the old JS library and also different from the cookie-based `gateway/api/2.0` flow previously tested through direct Synergia login.

## Verified Findings

### 1. Old `Mati365/librus-api` style flow is effectively broken for the tested account

The current repository is a handwritten HTML scraping client:

- `README.md` describes it as parsing HTML
- `package.json` describes it as a scraping API
- `lib/api.js` and `lib/resources/*.js` use `cheerio` and CSS selectors

On the live account, the old HTML pages returned `Brak dostępu` or `403`, so this approach is no longer a reliable base for new work.

### 2. There are at least two distinct modern Librus API families

#### A. Synergia cookie/session flow

Previously verified through classic Librus auth:

- login via `https://api.librus.pl/OAuth/Authorization?...`
- then cookie-backed access to:
  - `https://synergia.librus.pl/gateway/api/2.0/Me`
  - `https://synergia.librus.pl/gateway/api/2.0/Auth/TokenInfo`
  - `https://synergia.librus.pl/gateway/api/2.0/Root`

This works for direct Synergia session auth, but not for the family portal child tokens described below.

#### B. Family portal flow

The family portal uses:

- `https://portal.librus.pl/api/v3`
- `https://api.librus.pl/3.0`

This is the important flow for a parent account with multiple children.

### 3. Parent portal login flow

Verified flow:

1. `GET https://portal.librus.pl/konto-librus/login?...`
2. Extract CSRF token from the HTML form
3. `POST https://portal.librus.pl/konto-librus/login/action`
4. Session becomes logged in on `portal.librus.pl`

After login:

- `GET https://portal.librus.pl/api/v3/Me` returns portal account information
- `GET https://portal.librus.pl/rodzina/home` returns the family portal shell page

### 4. `rodzina/home` is only a shell, not the real data source

The page embeds a widget iframe:

- `/vendor/widget-librus/index.html?...&code=...`

The widget bundle contains configuration pointing to:

- `librusEndpoint: https://portal.librus.pl`
- `librusEndpointApiVersion: /api/v3`
- `synergiaEndpoint: https://api.librus.pl`

This strongly suggests the family portal itself is built as:

- portal account and integration management on `portal/api/v3`
- educational data on `api.librus.pl/3.0`

### 5. Linked child accounts are returned by `portal/api/v3/SynergiaAccounts`

Verified endpoint:

- `GET https://portal.librus.pl/api/v3/SynergiaAccounts`

Returned data includes one entry per linked child account. Each entry contains fields such as:

- `id`
- `accountIdentifier`
- `group`
- `accessToken`
- `login`
- `studentName`
- `state`

On the tested live parent account, this returned exactly 2 linked child accounts.

### 6. Each child account has its own working bearer token for `api.librus.pl/3.0`

For each entry returned by `SynergiaAccounts`, its `accessToken` was tested as:

`Authorization: Bearer <accessToken>`

Verified working endpoints:

- `GET https://api.librus.pl/3.0/Me`
- `GET https://api.librus.pl/3.0/Grades`
- `GET https://api.librus.pl/3.0/Attendances`
- `GET https://api.librus.pl/3.0/HomeWorks`

These endpoints returned valid data for both child accounts.

The returned counts differed between the two child accounts, which confirms that:

- the token is already child-specific
- the CLI does not need a mandatory server-side "switch active child" request to access data

### 7. These child tokens do not work on `gateway/api/2.0`

Tested with the same `accessToken` values from `portal/api/v3/SynergiaAccounts`:

- `GET https://synergia.librus.pl/gateway/api/2.0/Me`
- `GET https://synergia.librus.pl/gateway/api/2.0/Auth/TokenInfo`

Result:

- `401 Unauthorized`

So the family portal child tokens are for `https://api.librus.pl/3.0`, not for `gateway/api/2.0`.

## Inference About Child Switching

The widget bundle contains references like:

- `setActiveAccount`
- `currentSynergiaAccount`
- `synergiaAccounts`
- `synergiaAxiosFor`

Combined with the live-account tests, the most likely model is:

1. Portal login
2. Fetch all linked child accounts
3. Select one child account locally in app state
4. Use that child's bearer token directly against `api.librus.pl/3.0`

This means "switching child" in the portal is likely a client-side selection of which child token/account to use, not a required server-side state change before every data request.

## Practical Recommendation

Do not continue from the old HTML scraping client as the main foundation.

Build a new project with:

- SDK/core
- CLI
- optional skill/tool wrapper on top

Recommended architecture:

### PortalClient

Responsibilities:

- login to `Konto LIBRUS`
- manage portal cookies/session
- fetch `portal/api/v3/Me`
- fetch `portal/api/v3/SynergiaAccounts`

### ChildAccount

Represents one entry from `SynergiaAccounts`, for example:

- `id`
- `login`
- `accountIdentifier`
- `studentName`
- `accessToken`
- `state`

### SynergiaApiClient

Responsibilities:

- accept a child `accessToken`
- send `Bearer` requests to `https://api.librus.pl/3.0`
- expose methods like:
  - `getMe()`
  - `getGrades()`
  - `getAttendances()`
  - `getHomeWorks()`

### CLI

Suggested commands:

- `librus login`
- `librus children list`
- `librus child use <id>`
- `librus me --child <id>`
- `librus grades list --child <id>`
- `librus attendance list --child <id>`
- `librus homework list --child <id>`

## SDK + CLI in One Repository

Recommended.

The preferred approach is:

- one repository
- SDK/core as the real domain layer
- CLI as the first consumer of the SDK

Do not think of CLI as only an example. It should be the first real client of the SDK.

Suggested project shape:

```text
src/
  sdk/
    auth/
    portal/
    synergia/
    models/
    index.ts
  cli/
    commands/
    output/
    main.ts
```

## TypeScript vs Python

For this project, TypeScript is a good default choice if the goal is:

- a reusable SDK
- a clean CLI
- typed response models
- future npm-friendly distribution

Python would be fine for a quick private tool, but TypeScript is the better fit for a long-lived SDK + CLI repo.

## Useful External References

### Existing projects

- `Mati365/librus-api`
  - old HTML scraping JS client
  - useful as historical reference only

- `FlakM/librus-rs`
  - handwritten Rust client
  - useful as a modern API-oriented reference

- `szkolny-android`
  - hybrid approach
  - combines API usage with separate message and legacy flows

### Notes from widget bundle

The family portal widget contains strings indicating:

- `portal/api/v3`
- `api.librus.pl/3.0`
- account list handling
- local active account selection

## Suggested Repository Names

Best candidate:

- `librus-sdk`

Good alternatives:

- `librus-family-sdk`
- `librus-portal-sdk`
- `librus-toolkit`
- `librus-parent-sdk`

If the main public surface is CLI-first:

- `librus-cli`

If the main goal is SDK + CLI together and the name should stay broad:

- `librus-sdk` is still the strongest option.

## Short Recommendation

If starting from scratch:

1. new repository
2. TypeScript
3. SDK + CLI in one repo
4. portal login -> `SynergiaAccounts` -> child token -> `api.librus.pl/3.0`
5. do not build the new system on top of the old HTML scraping client
