# Failure Replay Guide

When an automatic run fails, AUTO-MAS can ask OBS to save the last few minutes of footage and link the video to the failure record. Use the replay together with the log to see what happened before an intermittent stall, login failure, or interrupted task.

Set it up in this order: **capture the game in OBS → start the Replay Buffer → configure the connection in MAS → save and watch a test replay**. Once configured, keep OBS and its Replay Buffer running. MAS requests a save when an automatic run finally fails.

::: tip Version requirement
Failure replays are available starting with **v5.7.0-beta.2**. If the setting is missing, get a version that includes the feature from the [download page](/en/download/auto-mas).
:::

## Set up OBS

Install [OBS Studio](https://obsproject.com/download) on **the same computer** as AUTO-MAS. Use **OBS Studio 28 or later**: these versions include the WebSocket support used by MAS, so no separate plugin is needed. See the [OBS Remote Control Guide](https://obsproject.com/kb/remote-control-guide).

### Capture the game

1. Open OBS and select or create a scene in **Scenes**.
2. Click **＋** under **Sources** and add a suitable source, such as **Window Capture** for an emulator or **Game Capture** for a PC game.
3. Select the target window in the source properties and confirm that the actual game appears in the OBS preview. For details, see the OBS guides for [Window Capture](https://obsproject.com/kb/window-capture-sources) and [Game Capture](https://obsproject.com/kb/game-capture-setup-guide).

MAS saves **whatever the current OBS scene captures**. After switching scripts, games, or emulator instances, check that the source still captures the right window. MAS does not switch OBS scenes automatically.

### Enable and start the Replay Buffer

1. Open **Settings → Output** in OBS.
2. For an initial setup, you can use **Simple** output mode. Configure the recording path, quality, and encoder, then select **Enable Replay Buffer**. In **Advanced** output mode, use the **Replay Buffer** tab.
3. Set **Maximum Replay Time**. Start with **5 minutes, or 300 seconds**. If you need earlier footage, you can increase this to 10–30 minutes depending on your available memory and encoding settings. Both the time limit and memory limit affect how much footage can actually be retained.
4. Click **Apply**, close the settings, and click **Start Replay Buffer** in the main OBS window. The button changes to **Stop Replay Buffer** when the buffer is running. You can also refer to the [OBS replay buffer tutorial](https://obsproject.com/forum/resources/how-to-setup-instant-replay-in-obs-studio.613/).

::: info How the Replay Buffer works
OBS keeps recent footage in memory and writes it to a file when a save is requested. With a five-minute buffer, a saved replay contains up to roughly five minutes before the save request. If the buffer has only just started, the available footage will be shorter.

OBS controls the video length, quality, and audio. MAS does not record an account's entire task, and cannot recover footage from before the buffer started.
:::

### Enable the WebSocket server

1. In OBS, open **Tools → WebSocket Server Settings**. Some versions call this **obs-websocket Settings**.
2. Select **Enable WebSocket server**. You can keep the default port, **4455**.
3. Keep **Enable Authentication** selected. Set or view the server password so you can enter it in MAS next.
4. Click **Apply** or **OK** to save.

MAS connects only to OBS on the same computer; it has no field for another computer's address. OBS also recommends keeping password authentication enabled. See the [obs-websocket instructions](https://github.com/obsproject/obs-websocket/blob/master/README.md) for authentication and the default port.

## Configure AUTO-MAS

Select **Settings** in the left navigation, open the **Features** tab at the top of the page, then scroll to the **Failure replays** section. The MAS steps and storage rules below follow **dev after v5.8.0-beta.3 (3c9448bdf)**. The separate replay list and copy-count limit from older versions no longer apply.

1. Prepare OBS, then turn on **Enable failure replays**, marked ①.
2. Check **OBS WebSocket port** against your local OBS server, marked ②.
3. If OBS authentication is enabled, enter **OBS WebSocket password** and click **Save password**, marked ③.

[![Failure replay settings and default video capacity in the Chinese interface](/docs/img/tutorial-context-20261105-3c9448bdf/failure-replay-settings.png)](/docs/img/tutorial-context-20261105-3c9448bdf/failure-replay-settings.png)

This example does not connect to OBS. The password input and save button only show where to enter a password; no password was saved, connection checked, or replay saved or played. Video capacity defaults to **1024 MiB** and is configured separately in the table below.

| Setting | What to enter |
| --- | --- |
| Enable failure replays | Turn the switch on; it is off by default. |
| OBS WebSocket port | Default **4455**; it must match OBS. |
| Video storage limit (MiB) | Default **1024 MiB**, range **1–1048576 MiB**. Click **Save limit** after changing it. All history videos share this capacity. |
| OBS WebSocket password | Enter the server password and click **Save password**. |

After saving, the password input clears and **Password configured** appears. Leaving the field blank does not delete the saved password. Use **Clear password** to remove it. If authentication is enabled in OBS, clearing the password in MAS will prevent authentication.

::: warning Lowering capacity can immediately remove videos
After you save the capacity, MAS reclaims the oldest archived videos until usage fits. Logs and statistics remain. Download or copy important videos elsewhere first. Editing the input without saving does not start cleanup.
:::

### Check the connection

Click **Check connection**. A successful check displays **OBS is connected and the replay buffer is active**, the connection and buffer states, the OBS version, and the directory of an existing OBS replay if one can be queried.

The check only reads status. Make sure the buffer is **Active**; MAS does not launch OBS or start its buffer.

### Save a test video

1. Keep the OBS Replay Buffer running and let the game run for a little while.
2. Click **Save test replay** and wait for the message that OBS saved the test without creating a history record.
3. Find the video in File Explorer using **Test capture location (managed by OBS)** shown on the page, then play it.
4. Check the game footage, length, and audio.

A test creates a real OBS output file. **It creates no history record or MAS video copy, and uses none of the history video capacity.** Manage test files yourself in the OBS output directory.

## Automatic saves during a run

Keep OBS open with the correct game source and an active Replay Buffer, then start an **Auto run**, or run a scheduled queue in automatic mode.

| Run outcome | Video storage |
| --- | --- |
| An account still fails after retries | A video attachment is saved with that failed execution record, at most once per account in the same managed script and run cycle. |
| Preflight, launch, or scheduling fails without an account history record | MAS may ask OBS to save a diagnostic original and show its path in the task notice or log. No separate history replay is created. |
| An attempt fails but a retry succeeds | No failure video attachment is retained for the successful result. |
| Success, skipping, configuration, updates, or other modes | No automatic failure video is saved. |
| Manual stop or cancellation | No history video is added for the cancelled result. A request already sent may have created an OBS original. |

After detecting a final failure, MAS asks OBS to save the current buffer and archives a copy with the account's execution record. Writing and copying take time. If the failure is detected only after a timeout or the last retry, increase the OBS buffer length to preserve earlier events.

If OBS is unavailable, the connection fails, or saving fails, task notices and logs describe the capture or save failure. This does not change the original automation result.

## View failure replays

1. Open **History** and select the date and account.
2. Open the failed execution record and expand **Attachments (N)** in its log window.
3. Play the video in the window, or click **Download** beside the attachment and open the saved file in a compatible player.

Current versions have no separate failure-replay list or associated-replay button. Tests and diagnostics without an account record remain only in the OBS output directory, outside history attachments.

If the attachment says it was not saved or was reclaimed because of the storage limit, check capacity and the OBS original folder. Missing files and archive failures have their own warnings; logs and statistics remain available.

## Video storage and cleanup

| Location | Purpose and cleanup |
| --- | --- |
| Recording path configured in OBS | Original videos, including tests and diagnostics. **MAS never deletes them**; manage them yourself. |
| `history/date/record-ID/` under the AUTO-MAS runtime directory | Logs and attachments archived with each execution record. The oldest videos are reclaimed when total video capacity is exceeded. Records are also removed according to history retention. |

Videos are limited by **total size**, not copy count. A video larger than the whole limit may not be archived. Saving a lower limit immediately starts cleanup. Capacity cleanup removes videos while preserving the record's logs and statistics; expiration of a history record removes its attachments too.

**Export a data backup includes history attachments that are still available at export time**, but not originals in the OBS output directory. Backups can contain game footage and account information; keep them private. To report a failure, download the relevant video and provide its matching log.

The OBS original folder can continue to grow after MAS reclaims its copies. Removing a MAS copy does not free the space used by an OBS original.

::: tip Wait for the video before exiting
MAS waits only a limited time for pending replay saves during exit, restart, or shutdown. If you need the footage, wait until the attachment is playable in the execution record before closing MAS or OBS.
:::

## Start the buffer automatically with OBS

If you use failure replays every day, add a launch parameter to your OBS shortcut to avoid forgetting to start the buffer.

1. Right-click the OBS shortcut and open **Properties → Shortcut**.
2. Keep the existing program path in **Target**. Add a space followed by `--startreplaybuffer`, for example:

   ```text
   "C:\Program Files\obs-studio\bin\64bit\obs64.exe" --startreplaybuffer
   ```

3. **Start in** should point to the folder containing `obs64.exe`. The path above is only an example; use your own installation location.
4. Save the shortcut, launch OBS through it, and use **Check connection** in MAS to confirm that the buffer is active.

To launch OBS when you sign in to Windows, place this shortcut in the Windows Startup folder: press **Win + R** and enter `shell:startup`. See the [official OBS launch parameter guide](https://obsproject.com/kb/launch-parameters).

## Troubleshooting

| Symptom                                                  | What to check                                                                                                                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The connection check fails                               | Make sure OBS is running on the same computer, its WebSocket server is enabled, and both ports match. For authentication failures, re-enter and save the password.            |
| Connected, but the Replay Buffer is inactive             | Click **Start Replay Buffer** in OBS. Selecting **Enable Replay Buffer** in Output settings alone is not enough.                                                              |
| Videos save, but show a black screen or the wrong window | Check the OBS preview, scene, and capture source. A successful connection check cannot verify the captured game footage.                                                      |
| The video is shorter than the configured duration        | The buffer may have just started or reached its OBS memory limit. Let it run long enough, then save another test.                                                             |
| A task failed, but there is no replay                    | Confirm that automatic mode and failure replays are enabled, and the OBS buffer stayed active. Check for a warning about a replay save failure, and try saving a test replay. |
| The execution log has no video attachment | Check whether this was an account failure with a history record. Tests and unassigned diagnostics are stored only in OBS output. |
| Older videos have disappeared | Check capacity cleanup and history retention. Look for originals in OBS output, raise the capacity if needed, and keep important clips elsewhere. |

When reporting a problem, play the video to check its contents, then provide the **relevant failure video and the log from the same run**. If your source includes the desktop or a login screen, check for account details or anything else you do not intend to share before sending it.
