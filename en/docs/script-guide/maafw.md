# MFW Project Guide

::: tip
A [MaaFramework](https://github.com/MaaXYZ/MaaFramework) project with an `interface.json` can be added to AUTO-MAS as an **MFW script**. AUTO-MAS does not launch the project's own UI. Some projects, including [M9A](/en/docs/script-guide/m9a), are recognized as a project-specific flavor after import.
:::

## Before you start

Download a Windows release package for your system from the project's release page and extract it. Select the folder that **directly contains** `interface.json`. You can usually leave the project's own UI closed. Some Agents perform additional setup on first run; follow the project's release notes if they do.

MFW reads the project's controllers, resources, and tasks from `interface.json`, then runs the queue you configure. Compatibility still depends on the package, its Agent, and the controllers available on your computer.

## Add the script

1. Open **Scripts**, choose **New script**, then **MFW script**.
2. Under **Project directory**, pick the folder containing `interface.json`. Wait for import and check the project overview and **Runtime environment** result. Initial preparation may take a few minutes.
3. Select the control mode and resource. For ADB, configure an emulator first. For Win32, choose how the game is started. Save the script settings.
4. Add a user and put one simple task in their queue. Test it before adding the rest.

### Where the project runs

AUTO-MAS imports the parts needed for execution into a managed copy. Runs and project updates use that copy; they do not modify the source directory. After a successful import and test run, the script can keep running if the source directory disappears. **Re-importing or rebuilding a missing copy still requires the source.** Keep the source if you use the project's own UI.

The **Embedded copy** panel shows its status and the source version recorded at import. The copy may later be newer than the source because AUTO-MAS updates it independently. **Re-import** reads the current source again. Changing the selected directory imports that source instead; inspect the task queue afterward, especially if it is a different project.

Several scripts can use the same project, each with its own run view and user settings. Scripts for the same project and update channel share the managed project version. AUTO-MAS may share unchanged files on disk; do not treat these scripts as independent version copies.

::: warning
The managed copy can contain runtime state. Do not edit or delete `data/mfw/` by hand. If the copy appears damaged, check its status and logs and use the page's re-import action.
:::

## Settings

| Setting | What to choose |
| --- | --- |
| Control mode | A controller declared by the project, such as Android/ADB or PC/Win32. |
| Resource | A resource declared by the project, often a server or platform. Leave blank to let AUTO-MAS choose a compatible default. |
| Emulator | Required for ADB; set it up under **Emulators** first. |
| Game package | Used for ADB. Check the inferred value if one appears. |
| PC game launch | Let MAS start and stop the game, or attach to a game started another way. |
| Retry and time limit | Limit failed-task retries and the duration of one user's run. |
| Daily, weekly, monthly skip | Skip tasks already completed in the chosen period. |

Under **Project update**, choose a source and channel provided by the project, then choose whether to update before runs, after runs, or manually. The page also offers a manual check and update with progress. Project updates affect the managed copy, not your source folder. A running script cannot be updated until that run ends.

## Users and task queues

Add users from the script list. Each user has a separate queue. Select tasks declared by the project, arrange them, and fill in their options. A project's presets may add several tasks at once. Project-specific flavors can manage some tasks automatically; follow the notice on that project's page rather than adding those tasks manually.

## Troubleshooting

- **Runtime preparation fails:** Check the **Runtime environment** panel, your connection, and whether you selected the folder containing `interface.json`. Retry after fixing the issue.
- **Pre-run check fails:** Confirm that the resource supports the selected controller and that an ADB script has an emulator instance.
- **Agent exits or times out:** Read the run log and check the project's dependency and first-run instructions. If you initialized the original project afterward, re-import it.
- **Source folder is gone:** A healthy managed copy can continue to run and update. To re-import or rebuild a missing copy, restore the source or select a new project folder.

## For developers

To give a project its own script identity or pre-run rules, see [Flavor Development](/en/developer/maafw-flavor).
