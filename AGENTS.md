# AGENTS.md

Guidance for coding agents working in this repository.

## Project summary

- This is a TypeScript SDK and CLI for the Librus family portal flow.
- The supported path is `portal.librus.pl` authentication plus child-scoped `https://api.librus.pl/3.0` requests.
- Do not reintroduce the legacy `synergia.librus.pl` HTML-scraping approach.
- The package exposes both an SDK entrypoint and a CLI binary named `librus`.

## Repository layout

- `src/sdk/` contains the public SDK surface, auth helpers, API clients, and domain models.
- `src/cli/` contains the CLI entrypoint and subcommands.
- `test/` contains Vitest coverage for SDK and CLI behavior.
- `docs/` contains reverse-engineering and verification notes. Treat these as background material, not product API.

## Development workflow

- Install dependencies with `npm install`.
- Build with `npm run build`.
- Run tests with `npm test`.
- Run the CLI locally with `npm run cli -- <command>`.
- `master` is protected. Do not commit directly to `master`.
- Start every change on a separate branch. Use a short descriptive branch name for each task.

Useful examples:

```bash
npm run cli -- children list
npm run cli -- me --child <id-or-login>
npm run cli -- grades list --child <id-or-login>
```

## Environment and secrets

- Runtime credentials come from `LIBRUS_PORTAL_EMAIL` and `LIBRUS_PORTAL_PASSWORD`.
- `LIBRUS_EMAIL` and `LIBRUS_PASSWORD` are kept as compatibility fallbacks.
- Never hardcode credentials, tokens, or session cookies.
- Keep CLI and SDK errors secret-safe. Do not leak passwords, bearer tokens, or raw cookie values in output, logs, tests, or thrown error messages.

## Code conventions

- Use ESM TypeScript with explicit `.js` import specifiers, matching the existing source.
- Prefer small focused modules and keep SDK models in `src/sdk/models/`.
- Preserve the JSON-first CLI behavior: normal results go to stdout, structured errors go to stderr, and commands should return non-zero exit codes on failure.
- Follow the existing class boundaries:
  - `PortalClient` handles portal login/session concerns.
  - `LibrusSession` orchestrates login, child discovery, and child selection.
  - `SynergiaApiClient` handles authenticated API calls for a specific child account.
- Keep compatibility with Node 20+.

## Testing guidance

- Add or update Vitest coverage for behavior changes.
- Prefer focused unit tests alongside the closest existing suite in `test/`.
- Avoid tests that depend on live Librus credentials or network access unless the task explicitly calls for manual verification.

## Change guidance

- Preserve the current portal-based flow unless the task explicitly requires architectural change.
- All code and documentation changes should be made on separate branches, not on `master`.
- Keep public SDK exports intentional and update `README.md` when user-facing CLI or SDK behavior changes.
- Update `CHANGELOG.md` for notable user-facing changes.
