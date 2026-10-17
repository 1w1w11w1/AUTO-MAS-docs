# Testing and Verification

Verification in the main repository has three layers. They answer different questions; one does not replace another.

| Layer | Covers | Runs on | In CI |
| --- | --- | --- | --- |
| pytest regression | Backend contracts, config round-trips, minimal scheduling and adapter behavior | Local `python -m pytest` | No; CI only runs format, lint, type, and packaging checks |
| Browser E2E | User paths that go through the real HTTP/WebSocket stack | Local `yarn e2e` | No; only the E2E infrastructure contract self-check (seconds) |
| `@real` run | Real script, emulator, account, and one real dispatch | Author's machine | Never |

## pytest regression

`tests/` is organized by the boundary under test: `tests/api/`, `tests/core/`, `tests/models/`, `tests/platform/`, `tests/services/`, `tests/task/`, `tests/tools/`. Script adapter tests go in `tests/task/test_<script>_<behavior>.py`, not in the root.

```bash
python -m pytest tests/api/test_config_roundtrip.py -q   # run the file for the layer you touched
python -m pytest tests --collect-only -q                 # collection gate before merging; exit code must be 0
```

- pytest lives in the `dev` dependency group of `pyproject.toml`; run `uv sync --group dev` if it is missing.
- **Tests for a feature or bug fix are one-off verification products**: once the implementation is done and the problem has been reproduced, they have no long-term value and only slow down every later test run, so they are not committed by default. Only cross-feature public and pure-logic tests stay in the repository, for example `tests/task/test_maafw_core.py`.
- A committed test must be able to fail: break the guarded code and it has to go red; if it never does, delete it. When adding one, state in the PR what it guards and how it breaks.
- The full rules are in the main repository's `tests/AGENTS.md`.

## Browser E2E

The only entry point is `frontend/e2e/run.mjs`. It creates a one-off run root, starts the backend and the frontend, selects tests by tag, and deletes the root when they exit. Do not bypass it and run `playwright test` directly.

First-time setup:

```powershell
uv sync --group dev
Set-Location frontend
yarn install --immutable
yarn playwright install chromium
```

Run every later command from `frontend/`:

| Command | Scope |
| --- | --- |
| `yarn e2e:check` | Infrastructure contract self-check plus the E2E TypeScript check; run it after touching the launcher or the seed rules |
| `yarn e2e` | All non-`@real` tests |
| `yarn e2e:smoke` / `:init` / `:queue` / `:scheduler` / `:settings` / `:history` / `:recovery` | A single tag |
| `yarn e2e --grep '@queue\|@scheduler'` | Any combination of tags; the argument is a regular expression |

Current tags: `@smoke` page navigation, `@init` backend cold start, `@queue` queue create/rename with persistence after reload, `@scheduler` start blocked without tasks, `@settings` persistence and rollback on save failure, `@history` navigation and filtering, `@recovery` connection rebuild after reload, `@real` real dispatch.

The launcher is **isolated** by default: `data/` under the run root is an empty data root, so queues the tests create, settings they change, history and logs they write all stay there and are deleted with the run root, leaving your checkout untouched. The launcher also writes `config/ToolsConfig.json` as `{"ArknightsPC": {"Enabled": false}}`, so `@init` never initializes the Arknights PC tool.

### Debugging switches

| Variable / flag | Effect |
| --- | --- |
| `AUTO_MAS_E2E_KEEP_ROOT=1` | Keep the run root after the run and print its path, to diff what the tests actually wrote |
| `--in-place` or `AUTO_MAS_E2E_IN_PLACE=1` | Do not isolate; use the current checkout as the data root. It writes `config/`, `data/`, `history/`, `debug/` and does not clean up |
| `AUTO_MAS_E2E_DATA_ROOT=<dir>` | Use a different data root when running in place |
| `AUTO_MAS_E2E_TEMPLATE_ROOT=<dir>` | Config seed source for real runs; defaults to the current checkout |

When you need to assert a setting or script config field, do not depend on the state of the checkout. Three ways to find the key: run a temporary UI-only test with `--in-place`, change the control, then `git diff config/`; trace the component field back to the backend model, for example `UI.IfHideCloseButton` in `frontend/src/views/setting/TabBasic.vue` lands in `app/models/schema.py` and `app/core/config.py`; or read `debug/app.log` in the run root. Choose the seed by priority: build it through the UI or API inside the test, then write config files before the launcher starts the backend, then commit a minimal profile. Finally confirm with `AUTO_MAS_E2E_KEEP_ROOT=1` that the test really wrote it, and put the observed change into both the assertion and the cleanup.

### Admission: a test must go red when the code breaks

An E2E test only counts if it fails when the code it guards is actually broken. After adding or changing a test, verify once: break the behavior under test, run the test, it must fail, then restore. A test that never goes red should be deleted; it only slows down every run. The current tests have been verified this way one by one; the record is in the main repository's `docs/testing/e2e.md`.

### Where to look on failure

- `frontend/test-results/browser/`: screenshots, trace, video.
- `frontend/playwright-report/browser/`: HTML report, opened by `yarn e2e:report`.
- `<run root>/debug/app.log`: backend log, deleted with the run root by default, kept with `KEEP_ROOT=1`, written into the checkout with `--in-place`.

## Author-local real run

```powershell
Set-Location frontend
yarn e2e:real --grep '@real'
```

**Zero configuration by default**: the launcher reads `config/ScriptConfig.json` from the current checkout, picks the first script and user whose user is enabled, and prints the selected target at startup. Only set `AUTO_MAS_E2E_SCRIPT_ID`, `AUTO_MAS_E2E_USER_ID`, and `AUTO_MAS_E2E_ACCOUNT_NAME` when you want a specific account; a target that does not exist fails loudly with the current candidates instead of silently switching to another account.

- Real runs also use an isolated run root: only the selected script, user, and plans are copied in, and notification fields are stripped from the copied user, so no real notifications are sent; changes to queues, settings, history, and the database are deleted with the run root.
- A machine-wide atomic lock lives in `%SystemRoot%\Temp\AUTO-MAS`, so only one real run per machine at a time. If a forced kill leaves a lock file, confirm nothing is running before deleting it manually.
- Script installs and emulators still point at the real local environment; config injection and recovery can change game state or consume resources, so pick a suitable script and user.
- It verifies the task terminal state and user result that MAS publicly reports, not every in-game step. Failures are not replayable, and reports or terminal output may contain local information; review before sharing and never upload the whole result directory.

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

- `docs/testing/e2e.md` in the main repository: coverage goals, test inventory, the three merge gates, and troubleshooting.
- `.agents/skills/mas-e2e/SKILL.md` in the main repository: E2E conventions for AI assistants.
- `frontend/e2e/run.mjs` and `frontend/e2e/fixtures.ts`: the launcher and the shared test fixtures.
