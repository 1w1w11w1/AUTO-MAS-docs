# Specialized Script Adaptation

Specialized script adaptation must connect configuration, schema, API, task scheduling, frontend entry points, and runtime verification. The detailed engineering rules for the current project are defined by the Skill built into the main repository at `.agents/skills/mas-script-specialized-adapter`. This document keeps only the workflow entry points most likely to be missed by developers.

## Black-Box Premise

Decide capability ownership first: **work the script owns** (in-game actions, task execution and verdicts, script config semantics) may only be reused through upstream entry points; **MAS-owned domains** (managed scripts and accounts, multi-script scheduling, plans, notifications, statistics, emulator lifecycle, cross-script orchestration) may be implemented in MAS; **upstream private formats** (config internals, plans/queues/run records, resource files) may only be passed through. The adapter depends only on upstream outward contracts, which limits breakage when upstream changes.

- **Order of work**: lower the configuration barrier first (remove manual install/import, path picking, first-run setup, and high-frequency task arrangement steps; cut the number of options users must adjust), and only then fill a gap in the script itself (the gap must belong to a MAS-owned domain and upstream must offer no equivalent entry point). Before starting, state which manual step the change removes; moving an upstream configuration panel into MAS does not count as lowering the barrier.
- **Allowed dependencies**: CLI arguments and exit codes, upstream-documented JS/API, the native GUI and configuration sessions, process and directory structure, logs and run reports.
- **Forbidden: copying**: do not build a MAS semantic layer on top of upstream private layouts — field-mapping tables over upstream configuration fields, format copies of plans/queues/run records, re-parsing of internal resource files, or self-invented success signals that replace the upstream result surface (marking and parsing your own output for a task upstream executes). The test is who owns execution and verdicts, and whether you write upstream fields or a MAS model — not whether an upstream file is read or written. Writing upstream fields with execution and verdicts still owned by upstream is pass-through, which is allowed.
- **Work the script owns**: reuse the upstream entry point when it exists; when it does not, first consider contributing it upstream via a pull request. If upstream declines (the author sees no need while the adapter does) or its review/release cycle blocks users, the adapter may fill in temporarily, marked as "temporary fill-in, remove once upstream ships it". Once upstream ships the same entry point, treat it as a violation: switch to reuse and remove the adapter implementation together with its config items, frontend entries, and verdict logic.
- **MAS-owned domains**: may be implemented in MAS, but must not read or infer upstream internal state. "Filling in" is legitimate only inside MAS-owned domains.
- **Warn on a hit**: when a change implements work the script owns, builds MAS semantics on top of upstream private formats, or keeps an implementation upstream has since duplicated, the loaded skill reports "This may violate the MAS development norms" with the matched item, evidence, and an alternative. The warning does not block work; the developer decides whether to continue.
- **Exception**: parse upstream internal fields only when evidence shows upstream offers no equivalent entry point (CLI, documented API, logs, exit codes) and the coupling is confined to a single module with its failure mode recorded.

See the main repository at `.agents/skills/mas-script-specialized-adapter/references/blackbox-boundary.md` for the full criteria, the allow/deny lists, and the reporting requirement.

## Confirm the Architecture First

Before adding or refactoring a `ScriptType`, identify which architecture line the external script belongs to:

| Architecture line | Reference in this repository |
|-------------------|------------------------------|
| MAA line | `MAA` |
| SRC line | `SRC` |
| MXU line | `MaaEnd` |
| MFAA line | `M9A` |
| General | `General` |
| ok-script family | `Okww` (Wuthering Waves) and `OkNte` (Neverness to Everness); confirm each project's contract separately |

Ask the user for the upstream script or GUI wrapper repository URL first. Then determine the architecture line based on README, launch arguments, configuration persistence method, and release artifacts. If no repository is available, confirm the script shape, formal `ScriptType`, display text, icon source, startup method, and configuration persistence method with the user.

## Implementation Order

Specialized adaptation should follow the order "frontend surface first, then backend completion":

1. **Architecture confirmation**
   - Confirm upstream repository, formal `ScriptType`, route segment, user-visible text, and icon.
   - Confirm whether automatic tasks run through CLI arguments, JSON writes, or an external configuration session.

2. **Frontend surface**
   - `Scripts.vue` and `ScriptTable.vue`: Hub entry, cards, icons, and action buttons.
   - `router/index.ts`: add a route segment consistent with the Hub.
   - `frontend/src/types/script.ts`: add `ScriptType` and default structure.
   - `frontend/src/composables/useScriptApi.ts`: complete managed-script type branches and `UserConfig -> users[]` branch.
   - `EditView/Script/`, `EditView/User/`: add or adjust managed-script edit pages, account edit pages, and sections.

3. **Backend registration**
   - `app/models/config.py`: add `XxxConfig` / `XxxUserConfig` and register them to the corresponding configuration collections.
   - `app/models/schema.py`: complete API schema.
   - `app/core/config.py`, `app/api/scripts.py`, `app/utils/constants.py`: complete configuration, API, display text, and type mapping.
   - After backend schema changes, start the current local backend and run `yarn openapi` in `frontend`. Do not manually edit the generated `frontend/src/api` directory.

4. **Task module**
   - `app/task/Xxx/`: implement `Manager` and `AutoProxy` according to the architecture line, and add `config_schema.py` or `ScriptConfig.py` when needed.
   - `Manager` and task execution classes must implement `final_task` / `on_crash`.
   - `check()` return messages should tell users how to resolve the issue, not just provide technical descriptions.

5. **Verification and cleanup**
   - If `General` was used first to verify startup, logs, and configuration feasibility, remove the temporary entry after specialized adaptation lands.
   - Before committing, self-check against `.agents/skills/mas-script-specialized-adapter/references/adapter-code-norms.md` in the main repository.
   - Confirm that Hub, routes, edit pages, API, task scheduling, logs, and history records all work.

## Code Quality Baseline

- Do not copy `app/task/General` and globally replace variable names. Align with the closest architecture line and existing surface template.
- Configuration writes and restores should use an atomic mindset to avoid corrupting configuration after task interruption.
- Recovery logic shared by `final_task` and `on_crash` should be extracted and reused.
- Side effects such as process cleanup and file cleanup should catch exceptions separately, preventing one failure from blocking later cleanup.
- Instance attributes should be explicitly initialized with type annotations in `__init__`, not patched with `hasattr()` fallbacks.
- Status, logs, process management, and pre/post scripts should align with `General` first. Introduce specialized differences only after the architecture is confirmed.

## Further Reading

When an AI assistant performs specialized adaptation, it should load `.agents/skills/mas-script-specialized-adapter/SKILL.md` from the main repository and read the following as needed:

- `references/script-frontend-architectures.md`
- `references/blackbox-boundary.md`
- `references/adapter-code-norms.md`
- `examples-*.md` for the corresponding architecture line
