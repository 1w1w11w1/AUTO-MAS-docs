# Testing and Verification

Verification in the main repository has three layers. They answer different questions; one does not replace another.

| Layer | Covers | Runs on | In CI |
| --- | --- | --- | --- |
| pytest regression | Backend contracts, config round-trips, minimal scheduling and adapter behavior | Local `uv run --no-sync python -m pytest` | Yes; PRs targeting `dev` run the full suite on Windows and Ubuntu |
| Browser E2E | User paths that go through the real HTTP/WebSocket stack | Local `yarn e2e` | No; only the E2E infrastructure contract self-check (seconds) |
| `@real` run | Real script, emulator, account, and one real dispatch | Author's machine | Never |

## pytest regression

`tests/` is organized by the boundary under test: `tests/api/`, `tests/core/`, `tests/models/`, `tests/platform/`, `tests/services/`, `tests/task/`, `tests/tools/`. Script adapter tests go in `tests/task/test_<script>_<behavior>.py`, not in the root.

```powershell
uv sync --locked --group dev
uv run --no-sync python -m pytest tests/api/test_config_roundtrip.py -q   # run the file for the layer you touched
uv run --no-sync python -m pytest tests -q                               # full regression suite
```

- pytest lives in the `dev` dependency group of `pyproject.toml`; use the locked environment for both installation and execution. Manual virtual environment activation is not needed.
- Deterministic, isolated, repeatable regression tests that guard user-visible behavior or public contracts are submitted with the implementation in the same PR and maintained with it. A stable bug reproduction should fail before the fix, pass after it, and remain in the repository. Only one-off diagnostic tests stay local or in the ignored `.dev/` directory.
- A test must be able to expose the behavior it guards. Record that behavior and the verification result in the PR. If it cannot expose the defect, strengthen the assertion or replace the coverage; test removal follows the development standards and requires a reason and replacement coverage where applicable.
- A full pytest run includes collection; there is no separate `--collect-only` merge gate.
- [Test Submission and Maintenance](/en/developer/development-specifications#test-submission-and-maintenance) is the authority for submission, maintenance, and PR evidence. The main repository's `tests/AGENTS.md` describes test locations and entry points.

## Browser E2E

The only entry point is `frontend/e2e/run.mjs`. It creates a one-off run root, starts the backend and the frontend, selects tests by tag, and deletes the root when they exit. Do not bypass it and run `playwright test` directly.

First-time setup:

```powershell
uv sync --locked --group dev
Set-Location frontend
yarn install --immutable
yarn playwright install chromium
```

Run every later command from `frontend/`:

| Command | Scope |
| --- | --- |
| `yarn e2e:check` | Infrastructure contract self-check plus the E2E TypeScript check; run it after touching the launcher or the seed rules |
| `yarn e2e` | All non-`@real` tests |
| `yarn e2e:smoke` / `:init` / `:queue` / `:scheduler` / `:settings` / `:history` / `:recovery` / `:notify` | A single tag |
| `yarn e2e --grep '@queue\|@scheduler'` | Any combination of tags; the argument is a regular expression |

Current tags: `@smoke` page navigation, `@init` backend cold start, `@queue` queue create/rename with persistence after reload, `@scheduler` start blocked without tasks, `@settings` persistence and rollback on save failure, `@history` navigation and filtering, `@recovery` connection rebuild after reload, `@notify` test notification delivery and disabled channels, `@real` real dispatch. The `@notify` system-channel test displays an actual Windows notification; it is skipped on other platforms.

The launcher is **isolated** by default: `data/` under the run root is an empty data root, so queues the tests create, settings they change, history and logs they write all stay there and are deleted with the run root, leaving your checkout untouched. Configuration is initialized from defaults in the isolated root; local tool, check-in account, and startup queue configuration is not copied.

### Debugging switches

| Variable / flag | Effect |
| --- | --- |
| `AUTO_MAS_E2E_KEEP_ROOT=1` | Keep the run root after the run and print its path, to diff what the tests actually wrote |
| `--in-place` or `AUTO_MAS_E2E_IN_PLACE=1` | Do not isolate; use the current checkout as the data root. It writes `config/`, `data/`, `history/`, `debug/` and does not clean up |
| `AUTO_MAS_E2E_DATA_ROOT=<dir>` | Use a different data root when running in place |
| `AUTO_MAS_E2E_TEMPLATE_ROOT=<dir>` | Config seed source for real runs; defaults to the current checkout |

When you need to assert a setting or script config field, do not depend on the state of the checkout. The main repository ignores `config/`, so ordinary Git worktree diffs cannot show local configuration changes. In an isolated run root, save copies of the configuration before and after changing the control, then compare those copies, for example with `git diff --no-index <before> <after>`, or compare the settings API responses. Exit code 1 from `git diff --no-index` means differences were found; keep configuration copies local and do not submit account data or credentials. You can also trace a component field to its backend model: `UI.IfHideCloseButton` in `frontend/src/views/setting/TabBasic.vue` is declared in `app/models/config/setting.py`. Read `<data root>/debug/app.log` when diagnosing runtime behavior. Choose the seed by priority: build it through the UI or API inside the test, then write config files before the launcher starts the backend, then commit a minimal profile. Finally keep the run root with `AUTO_MAS_E2E_KEEP_ROOT=1`, confirm that the test really wrote it, and put the observed change into both the assertion and the cleanup.

### Admission: a test must go red when the code breaks

An E2E test only counts if it fails when the code it guards is actually broken. After adding or changing a test, verify once: break the behavior under test, run the test, it must fail, then restore. If it does not fail, strengthen the assertion or replace the coverage first. Test removal follows the development standards and requires a reason and replacement coverage where applicable. Record the verification result in the PR; coverage and verification guidance are in the main repository's `docs/testing/e2e.md`.

### Where to look on failure

- `frontend/test-results/browser/`: screenshots, trace, video.
- `frontend/playwright-report/browser/`: HTML report, opened by `yarn e2e:report`.
- `<data root>/debug/app.log`: backend log, deleted with the run root by default, kept with `KEEP_ROOT=1`, written into the specified data root with `--in-place`. The launcher prints the data root path.

## Author-local real run

```powershell
Set-Location frontend
yarn e2e:real --grep '@real'
```

**Automatic target selection by default**: the launcher reads `config/scripts.yaml` from the current checkout, picks the first enabled script user, and prints the selected target at startup. The legacy `config/ScriptConfig.json` is only a fallback for a data root that has not completed configuration migration; migrated data roots use YAML. If a migrated root is missing its YAML file, the launcher fails and configuration must first be restored in the application. In a worktree, set `AUTO_MAS_E2E_TEMPLATE_ROOT` to your main checkout containing the real configuration. The repository contains only code and tests: it ships no game resources, script installs, or test accounts, so a real run uses the scripts already installed on your machine and the users already configured in MAS. Only set `AUTO_MAS_E2E_SCRIPT_ID`, `AUTO_MAS_E2E_USER_ID`, and `AUTO_MAS_E2E_ACCOUNT_NAME` when you want a specific account; a target that does not exist fails instead of silently switching to another account.

- Real runs also use an isolated run root: only the selected script, user, and plans are copied in, and notification fields are stripped from the copied user, so no real notifications are sent; changes to queues, settings, history, and the database are deleted with the run root.
- A machine-wide atomic lock lives in `%SystemRoot%\Temp\AUTO-MAS`, so only one real run per machine at a time. If a forced kill leaves a lock file, confirm nothing is running before deleting it manually.
- Script installs and emulators still point at the real local environment; config injection and recovery can change game state or consume resources, so pick a suitable script and user.
- It verifies the task terminal state and user result that MAS publicly reports, not every in-game step. Failures are not replayable, and reports or terminal output may contain local information; review before sharing and never upload the whole result directory.
- The summary and selected screenshots are under `frontend/test-results/real/`; the HTML report is under `frontend/playwright-report/real/`. Open it from `frontend/` with `yarn playwright show-report playwright-report/real`.

### Batch runs across every adapter

```powershell
yarn e2e:real:all --list                        # list enabled user targets, run nothing
yarn e2e:real:all                               # all targets, one at a time
yarn e2e:real:all --only MaaConfig,SrcConfig    # only users of the named adapters
```

Each enabled user is a target, so an adapter with several enabled users runs once for each user. Each target gets its own isolated run root and lock and writes one result under `test-results/real-batch/<n>-<adapter>-<account>/`; one failure does not stop the rest. Expect 20-30 seconds of fixed overhead per target because every target restarts the service pair. `--in-place` is rejected, and the emulator comes from each target's own script binding. The HTML report retains only the last target's run.

## Letting an AI assistant run the tests

The assistant can act on the requests below; it must not bypass `run.mjs` and `real-batch.mjs` to call `playwright test` directly.

| You say | The assistant runs |
| --- | --- |
| UI is changed, did I break anything? | `yarn e2e --grep '@smoke\|@<related tag>'` |
| The launcher or seed rules changed | `yarn e2e:check` |
| Scheduling, a task, or an adapter changed | `yarn e2e:real`, or `yarn e2e:real:all --only <adapter>` |
| Which real targets does this machine have? | `yarn e2e:real:all --list` |

**Between opening a PR and the review, the assistant must hand you this table**: the commands relevant to the changed path, what each one produces (screenshots, HTML report, `real-e2e-summary.json`), and a question about which one to run now. It may run the non-real commands itself; `@real` is author-local only and the assistant must never claim a real result it did not observe. The conventions live in `.agents/skills/mas-e2e/SKILL.md` and `.agents/skills/pr/SKILL.md` in the main repository.

## What to put in a PR

```text
- E2E scenario: <user feature and path verified>
- Command: `<the command actually run>`
- Commit: `<full SHA>`; worktree: <clean / dirty (explain)>
- Result: <pass/fail/not run and what you observed>
- Evidence: <screenshot and/or real-e2e-summary.json path>
- Limits: <uncovered scenarios, environment preconditions, or none>
```

Do not just write "E2E passed". Requirements by changed path:

| Changed path | Requirement |
| --- | --- |
| Frontend interaction / UI | Recommended: run the related tag and attach a screenshot |
| `app/task/**`, script adapters, scheduling, emulators | Required: attach a `@real` self-check with the key `real-e2e-summary.json` fields plus selected screenshots |
| Docs / CI / tests only | Not needed |

A single passing E2E or real run only shows that scenario passes on that commit; it does not replace judgement about the branches it does not cover.

## Related files

- `docs/testing/e2e.md` in the main repository: coverage goals, test inventory, and troubleshooting.
- `.agents/skills/mas-e2e/SKILL.md` in the main repository: E2E conventions for AI assistants.
- `frontend/e2e/run.mjs` and `frontend/e2e/fixtures.ts`: the launcher and the shared test fixtures.
- `frontend/e2e/real-batch.mjs`: the entry point that runs every adapter's real flow one after another.
