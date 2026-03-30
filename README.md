# librus-sdk

Fresh TypeScript SDK and CLI for the Librus family portal flow.

This project logs into `portal.librus.pl`, loads linked child accounts from `portal/api/v3/SynergiaAccounts`, and uses the selected child account's bearer token against `https://api.librus.pl/3.0`.

It intentionally does not reuse the legacy `synergia.librus.pl` HTML-scraping approach.

## Acknowledgements

This implementation was inspired by [Mati365/librus-api](https://github.com/Mati365/librus-api/).

## Environment

Set these variables before running the CLI:

```bash
LIBRUS_PORTAL_EMAIL=you@example.com
LIBRUS_PORTAL_PASSWORD=your-password
```

The SDK also accepts the older aliases `LIBRUS_EMAIL` and `LIBRUS_PASSWORD` as a compatibility fallback for the current local `.env`.

## Install

Install the package from npm:

```bash
npm install librus-sdk
```

Use the CLI without installing it globally:

```bash
npx librus --version
npx librus children list
npx librus grades list --child <id-or-login>
```

## Local development

```bash
npm install
npm run lint
npm run format:check
npm run build
npm run pack:check
npm run cli -- children list
npm run cli -- grades list --child <id-or-login>
```

More examples:

```bash
npm run cli -- me --child <id-or-login>
npm run cli -- attendance list --child <id-or-login>
npm run cli -- homework list --child <id-or-login>
```

`HomeWork.LessonNo` mirrors the live Librus payload and may be `string`, `number`, or `null`. `HomeWork.Subject` may be omitted entirely or returned as `null`.

## SDK usage

```ts
import { LibrusSession } from "librus-sdk";

const session = LibrusSession.fromEnv();
const children = await session.listChildren();
console.log(children);
```

`await session.forChild(child).getHomeWorks()` preserves the API's `HomeWork.LessonNo` value as `string`, `number`, or `null`, and leaves `HomeWork.Subject` absent when the API omits it.

All commands write JSON to stdout by default. Errors are written as JSON to stderr and return a non-zero exit code.
