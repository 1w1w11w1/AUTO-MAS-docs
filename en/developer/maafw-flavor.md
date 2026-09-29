# Flavor Development

MFW is the shared engine for MaaFramework projects. If your project has an `interface.json` and only needs its existing tasks, controllers, resources, and options, use the [MFW project guide](/en/docs/script-guide/maafw). Add a **flavor** only when the project needs its own script identity, wording, or small project-specific rules before a run.

M9A and MSS are examples. They reuse MFW's import, runtime environment, project updates, execution, notifications, and periodic tasks. Before implementing a flavor, read the main repository's [`app/task/MaaFW/AGENTS.md`](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/AGENTS.md) and [`MaaFWFlavor` contract](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/tools/embedded/flavor.py).

## Choose the right owner

| Requirement | Owner |
| --- | --- |
| Tasks, controllers, resources, and options supplied by the project | The project's `interface.json`; MFW reads it |
| A capability needed by all MaaFramework projects | The MFW engine |
| Identity, help text, or queue rules specific to one project | A flavor |
| In-game actions and the meaning of task results | The project itself |

A flavor is a script type built into AUTO-MAS, not a plugin added to the project's release package. After an import, the engine identifies the project and can change a generic MFW script to the matching flavor, or back to generic MFW when another project is imported. The script ID stays the same; users should review the queue after changing projects.

## Backend registration

1. In `app/models/config.py`, define `XConfig(MaaFWConfig)` with `DEFAULT_SCRIPT_NAME`, `USER_CONFIG_CLASS`, and `FLAVOR = "app.task.X.flavor:FLAVOR"`. The user class can be an empty `MaaFWUserConfig` subclass if no extra fields are needed. Keep `FLAVOR` as an import string so loading config does not eagerly load task code.
2. Register the class in `CLASS_BOOK`, and map it to `MaaFWEmbeddedManager` in `app/core/task_manager.py`'s `_MANAGER_BOOK`. Add the config and API schema types in `app/models/schema.py`, then regenerate the frontend OpenAPI client from the development backend. Do not edit `frontend/src/api/` by hand.
3. Export `FLAVOR` from `app/task/X/flavor.py`. The required `MaaFWFlavor` members are `type_key`, `matches_project(interface_model)`, and `decorate_selection(...)`.

Use stable fields in `interface.json` for `matches_project`, such as `mirrorchyan_rid` or the repository address. A project name can be a compatibility fallback. The first matching registered flavor wins, so avoid broad predicates that claim unrelated projects.

`decorate_selection` receives the selected **task instance IDs** and options just before MFW builds the run plan. It returns `(task_ids, task_options)`. Use it for project-specific insertion, removal, ordering, or option changes. Leave runtime preparation, project updates, retries, timeouts, and general game lifecycle behavior to MFW. Task instance IDs are not necessarily task names; see the M9A and MSS implementations when handling duplicate tasks. Return new containers rather than mutating inputs, and log when an expected task or option is unavailable.

```python
class XFlavor:
    type_key = "X"

    def matches_project(self, interface_model) -> bool:
        return str(interface_model.mirrorchyan_rid or "").casefold() == "x"

    def decorate_selection(
        self, interface_model, task_ids, task_options, *,
        script_config, user_config, resource_name, send_log,
    ):
        return list(task_ids), dict(task_options)


FLAVOR = XFlavor()
```

### Optional hooks

- `sanitize_task_snapshot` normalizes a user's saved queue before it is written and can return related `Info` updates. Use the same rules during run planning, because older snapshots may still exist. See the signature and return contract in [`flavor.py`](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/tools/embedded/flavor.py); M9A provides an example.
- `ensure_game_updated` is an async hook for updating the **game client**. It is called only for ADB when the script enables game updates, after emulator startup and before the first task. It returns `GameUpdateResult`. Updating the MaaFramework **project package** remains MFW's shared responsibility.

Do not add optional hooks to the required `MaaFWFlavor` protocol: flavors without them must still load.

## Frontend registration

MFW's script page, user page, creation flow, and routes are shared. Export a `MaaFWFlavor` descriptor from `frontend/src/views/EditView/MaaFWFlavor/x/index.ts` and register it in `frontend/src/composables/useMaaFWFlavor.ts`. The descriptor holds the identity, config type names, icon, default name, creation card, translation keys, managed tasks, and optional custom UI.

Also update `frontend/src/types/script.ts`, `frontend/src/utils/scriptLogos.ts`, the creation mapping in `frontend/src/composables/useScriptApi.ts`, translations, and `MaaFWFlavorType` in `maafwFlavorTypes.ts`. The complete registration checklist is at the top of [`useMaaFWFlavor.ts`](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/frontend/src/composables/useMaaFWFlavor.ts).

Use `slots` only for project-specific controls. The existing `userBeforeTaskQueue` slot can place fields before the user's task queue; MSS demonstrates this with its plan selector and activity setting. Use `slots: {}` when no custom controls are needed. Do not copy MFW's whole script or user page.

## Verify

Import both the target project and an unrelated MaaFramework project to check recognition and switching. Check empty queues, repeated task instances, missing tasks and options, saving user changes, and restoring saved configuration if the snapshot hook is used. Verify the project-specific behavior while checking that shared MFW runs and updates still work. Run the relevant backend and frontend checks in the target worktree and report the commands actually run. If schemas changed, regenerate OpenAPI from that worktree's development backend.

Reference implementations: [M9A](https://github.com/AUTO-MAS-Project/AUTO-MAS/tree/dev/app/task/M9A) and [MSS](https://github.com/AUTO-MAS-Project/AUTO-MAS/tree/dev/app/task/MSS).
