# MFW Project Guide

::: info Version and screenshots
Text was checked against **the dev version following v5.8.0-beta.3**. Older screenshots may differ. After import, the project directory is locked; the old embedded-copy status table and change-directory workflow are no longer part of the current page.
:::

::: tip
A [MaaFramework](https://github.com/MaaXYZ/MaaFramework) project with an `interface.json` can be added to AUTO-MAS as an **MFW script**. AUTO-MAS does not launch the project's own UI. Some projects, including [M9A](/en/docs/script-guide/m9a), are recognized as a project-specific flavor after import.
:::

## Before you start

Download a Windows release package for your system from the project's release page and extract it. Select the folder that **directly contains** `interface.json`. You can usually leave the project's own UI closed. Some Agents perform additional setup on first run; follow the project's release notes if they do.

MFW reads the project's controllers, resources, and tasks from `interface.json`, then runs the queue you configure. Compatibility still depends on the package, its Agent, and the controllers available on your computer.

## Add the managed script

1. Open **Managed scripts**, choose **New managed script**, then **MaaFW**.
2. Under **Project directory**, pick the folder containing `interface.json`. Wait for import and check the project overview and **Runtime environment** result. Initial preparation may take a few minutes.
3. Select the control mode and resource. For ADB, configure an emulator first. For Win32, choose how the game is started. Save the managed-script settings.
4. If importing configurations created accounts, open one of those accounts for editing. If there are no accounts yet, add one. For either route, put one simple task in that account's queue and test it before adding the rest.

### Where the project runs

AUTO-MAS imports the parts needed for execution into a managed copy. Runs and project updates use that copy without modifying the source directory. After import, **Project directory** shows the managed copy and its selection button is locked. **Create a new managed script to use a different project.**

The basic information section offers **Follow source directory (developer mode)**:

- Normally leave it off and use **Project update**. A healthy copy can run and update without the source; rebuilding a missing copy can still require it.
- When enabled, MAS checks and syncs source changes before each run. **Sync now** requests a sync immediately. Project updates are disabled in this mode, so keep the source directory.
- Source-form projects always follow their source, with the switch locked on. Keep the local source and its dependencies.
- If synchronization or preparation fails, read the **Runtime environment** log and use **Retry** or **Sync now** after fixing the cause. These actions do not change the project.

Several managed scripts can use the same project with separate run views and account settings. Ordinary managed scripts for the same project and update channel share the managed project version. Managed scripts following their source use their own source instead. Deleting a managed script removes its run view without deleting the source; preserve any runtime data you still need first.

::: warning
Do not edit or delete `data/mfw/` by hand. If the copy appears damaged, read the runtime logs and use the available preparation or source-sync action.
:::

## Settings

| Setting | What to choose |
| --- | --- |
| Control mode | A controller declared by the project, such as Android/ADB or PC/Win32. |
| Resource | A resource declared by the project, often a server or platform. Leave blank to let AUTO-MAS choose a compatible default. |
| Emulator | Required for ADB; set it up under **Emulators** first. |
| Game package | Used for ADB. Check the inferred value if one appears. |
| PC game launch | Let MAS start and stop the game, or attach to a game started another way. |
| Retry and time limit | Limit failed-task retries and the duration of one account's run. |
| Daily, weekly, monthly skip | Skip tasks already completed in the chosen period. |

When source following is off, under **Project update**, choose a source and channel provided by the project, then choose updates before runs or manual updates only. The old after-run setting is treated as before-run. MirrorChyan requires this project's own CDK; it does not fall back to the CDK used for AUTO-MAS itself. The page also offers a manual check and update with progress. Project updates affect the managed copy, not your source folder. A running managed script cannot be updated until that run ends.

## Accounts and task queues

Edit an account created by configuration import, or add one from the managed-script list if there are no accounts yet. You can add more accounts from that list as needed. Each account has a separate queue. Select tasks declared by the project, arrange them, and fill in their options. A project's presets may add several tasks at once. Project-specific flavors can manage some tasks automatically; follow the notice on that project's page rather than adding those tasks manually.

## Troubleshooting

- **Runtime preparation fails:** Check the **Runtime environment** panel, your connection, and whether you selected the folder containing `interface.json`. Retry after fixing the issue.
- **Pre-run check fails:** Confirm that the resource supports the selected controller and that an ADB managed script has an emulator instance.
- **Agent exits or times out:** Read the run log and check the project's dependency and first-run instructions. If the original project needed initialization, complete it there and use source following to synchronize those changes before preparing the runtime again.
- **Source folder is gone:** A healthy copy can run and update while source following is off. If source following is enabled, or the copy must be rebuilt, restore the source. If the page allows directory selection for a missing copy, select a complete project package again.

## For developers

To give a project its own script identity or pre-run rules, see [Flavor Development](/en/developer/maafw-flavor).
