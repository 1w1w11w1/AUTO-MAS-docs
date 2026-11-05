# Emulator Management

Register an emulator, then select its configuration and device number in the managed-script settings. AUTO-MAS fills connection information for supported scripts and starts or closes instances as required by the task.

::: info Version and demonstration scope
This page follows **dev after v5.8.0-beta.3 (d49cff7c5)**. The automatic-path screenshot marks the search entry only; no installation search or import was performed. The manual path created an isolated configuration, selected MuMu, and checked the saved type after reload. No real executable was selected, and no emulator or game was started. The screenshots show the Chinese interface.
:::

## Choose one way to add an emulator

Select **Emulators** in the left navigation, then choose the path that fits your installation.

| Your situation | Path to follow |
| --- | --- |
| An emulator is installed and you want MAS to find its location and fill the configuration | [Search and import](#search-and-import) |
| Automatic search did not find the installation, or you want to choose the manager executable yourself | [Add manually](#add-manually) |

**Complete one path, then go directly to [Bind a device](#bind-a-device). You do not need to perform the other add path.**

### Search and import

1. **Search for installations.** Click **Search for emulators** on the main page. With no configurations, this button is in the center; with existing configurations, it is to the right of the configuration tabs.

[![Step 1: the automatic-search entry on the main emulator page](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/automatic-entry.png)](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/automatic-entry.png)

2. **Import a result.** When installations are found, MAS opens the search-results dialog. Check the emulator and its path, then click **Import** beside the installation you want. Import creates the configuration; you do not need to add one manually first. If no emulator is found, switch to [Add manually](#add-manually).

3. **Check the imported configuration.** In its configuration tab, check that the name, type, and path match the intended installation, then inspect the device list. Continue to [Bind a device](#bind-a-device).

Automatic search reads installation information from the Windows registry; it is **not limited to default installation directories**. Custom locations may be found, while portable or unregistered installations may be missed. The image shows the search entry in step 1 only; no installation search or import was performed.

### Add manually

1. **Create an empty configuration.** Click **Add manually**. The screenshot has no configurations, so the button is in the center. With existing configurations, use **Add a multi-instance manager** to the right of the configuration tabs.

[![Step 1: the entry for creating a manual configuration](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/manual-entry.png)](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/manual-entry.png)

2. **Select the emulator type.** In the new configuration tab, open **Type** in the **Emulator settings** section and choose a single-emulator type that matches your installation. This example selects **MuMu emulator**; choose LDPlayer for an LDPlayer installation, or the appropriate type for another installation. Changes save automatically.

[![Step 2: select a type matching the installation, with MuMu shown as the example](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/manual-type.png)](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/manual-type.png)

3. **Select the manager executable.** Click the folder icon at the right of the **Path** row and select that emulator's multi-instance manager. Common paths are listed below. The selected path saves automatically. Check the path and device list, then continue to [Bind a device](#bind-a-device).

[![Step 3: the file-selection entry in the Path row](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/manual-path.png)](/docs/img/tutorial-emulator-branches-20261105-d49cff7c5/manual-path.png)

This example stops at the file-selection entry. No real executable was selected, and the empty path does not mean installation registration is complete.

## Bind a device

After completing **Search and import** or **Add manually**, identify the intended instance in the device list, then select its emulator configuration and **device number** in the managed-script settings. A configuration that has already been added does not need to be added again.

## Manage several installation paths with auto-detect (optional)

If you need a single device table for several installation paths, create a separate configuration with the **Auto-detect (recommended)** type. Use **Path > Manage emulators > Search and add** to add supported installations. Results include versions and reasons an installation cannot be added; modified AVD has a separate entry. Auto-detect currently supports LDPlayer 14, MuMu 6, and modified AVD. Existing older emulators can continue using single-type configurations.

**Auto-detect (recommended)** is a configuration type. Search inside its management dialog adds installation paths to the current configuration through a different entry from **Search and import** above. Use this setup only when you need to manage several installation paths together.

One auto-detect configuration can manage several installation paths. **MAS device numbers may differ from the emulator's own instance numbers.** Bind managed scripts using the MAS device number shown in the table.

## Filling In the Settings

| Setting | What to enter |
| --- | --- |
| **Emulator name** | Anything you like. It is only shown to you inside AUTO-MAS |
| **Emulator type** | Match a single-emulator configuration to the installed emulator; use the optional auto-detect setup above when managing several installation paths together |
| **Emulator path** | Select the **multi-instance manager executable** for a single-type configuration; use **Manage emulators** to add paths for auto-detect configurations |
| **Maximum wait time** | How long to wait for the emulator to start. The script only launches once the emulator is up, so raise this on a slow machine |
| **Boss key** | In silent mode, AUTO-MAS presses this key to hide the emulator |

::: tip Common multi-instance manager paths
- MuMu 12 v4: `MuMu installation directory\shell\MuMuManager.exe`
- MuMu 12 v5: `MuMu installation directory\nx_main\MuMuManager.exe`
- LDPlayer: `LDPlayer installation directory\ldconsole.exe`
:::

::: tip No emulator yet? Pick MuMu 12 or LDPlayer
Both perform well and capture screenshots reliably, and their multi-instance manager support is the most complete, so AUTO-MAS works best with them. Other emulators may land you on problems nobody has hit before.
:::
