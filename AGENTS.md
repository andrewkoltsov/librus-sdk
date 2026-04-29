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
- For GitHub PR work, prefer the GitHub connector for metadata, diffs, comments, and status inspection. If the connector can read a PR but cannot merge it with `403 Resource not accessible by integration`, fall back to the authenticated `gh` CLI for the merge and include an expected-head guard such as `gh pr merge <number> --match-head-commit <sha>`.
- For parallel work, prefer a separate `git worktree` for each active feature so changes do not interfere with each other.
- Give each mergeable line of work its own branch with a short descriptive name.
- Prefer creating new feature branches from an up-to-date `master`.
- Before creating a feature branch that is expected to merge directly into `master`, check out `master` and update it from `origin/master` with a fast-forward-only pull.
- When work depends on in-flight changes from another feature branch, a short-lived dependent branch may be created from that branch. Keep the dependency explicit and rebase or retarget once the parent branch lands.
- Do not create new work branches from a stale base branch, whether that base is `master` or another feature branch.

Useful examples:

```bash
git checkout master
git pull --ff-only origin master
git worktree add ../librus-sdk-my-change -b codex/my-change master

# Stacked branch when the work intentionally depends on another feature branch.
git worktree add ../librus-sdk-child-change -b codex/child-change codex/parent-change

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
- All code and documentation changes should be made outside `master`. Prefer one worktree per active feature and one branch per mergeable change. Prefer branches cut from an up-to-date `master`, but allow short-lived dependent branches when the work is intentionally stacked.
- Keep public SDK exports intentional and update `README.md` when user-facing CLI or SDK behavior changes.
- Update `CHANGELOG.md` for notable user-facing changes.
