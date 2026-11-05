# Emulator Management

Register an emulator, then select its configuration and device number in the script settings. AUTO-MAS fills connection information for supported scripts and starts or closes instances as required by the task.

::: info Version and demonstration scope
This page follows **dev after v5.8.0-beta.3 (3c9448bdf)**. In an isolated environment, a new generic emulator configuration was changed to **Auto-detect (recommended)**, saved, checked after reload, and its **Manage emulators** dialog opened. The screenshots show the Chinese interface. No real devices were searched for, added, or started, and no game was run.
:::

## Add an emulator

1. Select **Emulators** in the left navigation and click **Add manually**, marked ①. The screenshot has no configurations yet, so the button is in the center. With existing configurations, use **Add a multi-instance manager** to the right of the configuration tabs.

[![Step 1: add an emulator manually](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-add.png)](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-add.png)

2. In the new configuration tab, find the **Emulator settings** section and open the **Type** list. Change **Generic emulator** to **Auto-detect (recommended)**, marked ②. Wait for saving, then reload to check the type.

[![Step 2: select auto-detection](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-type-select.png)](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-type-select.png)

3. In the same section, click **Manage emulators** on the right of the **Path** row, marked ③.

[![Step 3: open emulator management](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-manage.png)](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-manage.png)

4. Click **Search and add** in the upper-right of the **Emulators** dialog, marked ④, then select a supported installation. Results include versions and reasons an installation cannot be added. Modified AVD has a separate entry. The screenshot shows the entry only; no real installation search was run.

[![Step 4: find the search-and-add entry in path management](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-paths.png)](/docs/img/tutorial-context-20261105-3c9448bdf/emulator-paths.png)

5. After adding an installation, return to the device table, identify the instance, and bind the corresponding emulator configuration and **device number** in the script settings.

For first-time setup, you can also use **Search for emulators** on the main emulator-management page. Automatic search reads installation information from the Windows registry; it is **not limited to default installation directories**. Custom locations may be found, while portable or unregistered installations may be missed. Auto-detect currently supports LDPlayer 14, MuMu 6, and modified AVD. Existing older emulators can use the single-type configurations below.

One auto-detect configuration can manage several installation paths in a single device table. **MAS device numbers may differ from the emulator's own instance numbers.** Bind scripts using the MAS device number shown in the table.

## Filling In the Settings

| Setting | What to enter |
| --- | --- |
| **Emulator name** | Anything you like. It is only shown to you inside AUTO-MAS |
| **Emulator type** | Use auto-detect for new configurations, or retain the type matching an existing installation |
| **Emulator path** | Select the **multi-instance manager**, not the emulator's main program |
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
