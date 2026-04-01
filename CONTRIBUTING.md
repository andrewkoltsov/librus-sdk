# Contributing

This repository accepts focused improvements to the SDK, CLI, documentation, and
repository automation.

## Before You Start

- Use the issue tracker for reproducible bugs, feature requests, and scoped maintenance work.
- Do not open public issues for security-sensitive reports. Follow
  [`SECURITY.md`](./SECURITY.md) instead.
- Keep changes small and reviewable. Split unrelated work into separate branches and pull requests.

## Branch Workflow

`master` is protected. Do not commit directly to `master`, and do not create new
feature branches from a stale base branch.

For work that should merge directly into `master`:

```bash
git checkout master
git pull --ff-only origin master
git worktree add ../librus-sdk-my-change -b codex/my-change master
```

Use a short descriptive branch name. Prefer one worktree per active feature so
parallel changes do not interfere with each other.

If a change intentionally depends on another in-flight feature branch, keep that
dependency explicit and rebase or retarget the child branch once the parent
lands.

## Local Setup And Required Checks

Install dependencies before running checks:

```bash
npm install
```

Run the canonical verification command before opening or updating a pull request
unless you explain why it was skipped:

```bash
npm run validate
```

`npm run validate` runs:

- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm run test:coverage`
- `npm run pack:check`

You can run the CLI locally with:

```bash
npm run cli -- <command>
```

## Tests, Docs, And Changelog Expectations

- Behavior changes should include focused Vitest coverage near the closest existing suite in `test/`.
- `npm test` remains available as the quick unit-test path, but `npm run validate` is the required merge gate.
- Live integration tests are manual-only, require local credentials, and stay outside `npm run validate`, CI, and release automation unless a task explicitly calls for that verification.
- Avoid tests that require live credentials or network access unless the change explicitly calls for manual verification.
- User-facing SDK or CLI changes should update [`README.md`](./README.md).
- User-facing SDK or CLI changes should also update [`CHANGELOG.md`](./CHANGELOG.md).
- Documentation-only or workflow-only changes do not require a new npm release.

## Pull Request Flow

- Keep each pull request focused on one mergeable line of work.
- Describe the user-visible change and any notable internal refactors.
- List the verification you ran and note any intentionally skipped checks.
- Call out required documentation or changelog updates when they apply.
- Link the relevant issue when the pull request addresses tracked work.

The repository includes a pull request template. Use it as the baseline summary
for your change.

## Maintainer Response Expectations

Maintainer response times are best-effort, not guaranteed.

- Bug reports: maintainers aim to acknowledge or triage new reports within 7 calendar days. If a report is incomplete, maintainers may ask for reproduction details, versions, or sanitized logs before taking action.
- Enhancement requests: maintainers aim to acknowledge or triage new requests within 7 calendar days and may ask follow-up questions to confirm the problem, scope, or proposed interface.
- Pull requests: maintainers aim to review new pull requests, or at least leave a status update, within 7 calendar days.
- Stale work: issues and pull requests with no activity for 30 days may be marked stale. If there is still no reply after 14 more days, maintainers may close them until new context is available.

Security-sensitive reports are handled outside the public issue tracker. Use
[`SECURITY.md`](./SECURITY.md) for that process.

## Community Standards

By participating in this project, you agree to follow
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
