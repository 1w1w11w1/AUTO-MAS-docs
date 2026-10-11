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

Open **Settings → Features → Failure replays** and configure the following options.

| Setting                 | What to enter                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Enable failure replays  | Set to **Yes**. The default is **No**. In versions that use a switch, turn it on.        |
| OBS WebSocket port      | The default is **4455**. It must match the server port in OBS.                           |
| Maximum retained copies | The default is **3**. You can set **1–20**; this limits the video copies managed by MAS. |
| OBS WebSocket password  | Enter the OBS server password, then click **Save password**.                             |

After saving the password, the input becomes empty again and **Password configured** appears. Leaving the field blank does not delete the saved password. Use **Clear password** to remove it. If authentication is enabled in OBS, clearing the password in MAS will prevent authentication.

### Check the connection

Click **Check connection**. When everything is ready, MAS displays **OBS is connected and the replay buffer is active**, along with:

- **Connection: Yes**.
- **Replay buffer: Active**.
- The OBS version and the MAS replay folder.

The connection check only queries the current status. Even if the connection succeeds, make sure the Replay Buffer is **Active**. MAS does not launch OBS or start its buffer for you.

### Save a test video

1. Keep the OBS Replay Buffer running and let the game run for a little while.
2. In MAS, click **Save test replay** and wait for **Replay saved**.
3. Open **History → Failure replays**, find the entry tagged **Save test replay**, and click **Play**.
4. Confirm that the video shows the intended game and has the length and audio you need.

::: warning Test replays count toward the retention limit
A test replay saves a real video and shares the retention limit with automatic failure replays. Saving several tests can remove older failure copies. Copy any video you want to keep to another folder first.
:::

## Automatic saves during a run

Before starting automation, make sure OBS is open, the target game appears in its preview, and the Replay Buffer is running. Then start an **Auto run**, or run a scheduled queue in automatic mode, as usual.

| Run outcome                                                        | Automatic replay save                                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| An account still fails after retries                               | A replay is saved, at most once per account within the same script and run cycle.   |
| A preflight check, launch, or scheduling step fails                | MAS can save a script-level replay, which may have no link to an account's history. |
| An attempt fails, but a retry succeeds                             | No replay is saved.                                                                 |
| Success, a skipped task, or another mode such as manual inspection | No automatic replay is saved.                                                       |
| You manually stop or cancel the run                                | No new replay save is triggered. A save already requested may still finish.         |

When MAS detects a final failure, it asks OBS to save the current Replay Buffer, then copies the video. Writing and copying take time, so the new entry may appear in the list a little later. Some failures are only detected after a timeout or the last retry; increase the OBS buffer length if you need to see earlier events.

If OBS is not running, the connection fails, or saving fails, MAS reports that the failure replay could not be saved. A replay save failure does not change the original automation result.

## View failure replays

### Browse all retained videos

Open **History** and click **Failure replays** in the upper-right corner.

Each entry shows the script, account if associated, time, failure reason, and video path. You can:

- Click **Play** to open the video in the system's default video player.
- Click **Locate** to select the video in File Explorer.
- Click **Open replay folder** at the top of the list to browse the copies saved by MAS.

MAS uses the system's default application to play videos. If a video cannot be opened, use **Locate** to find the file, then open it with a player that supports its format.

### Open a replay from a task log

In History, select the date and account, then open the failed task's log. If a replay linked to that log is still retained, an **N associated replay(s)** button appears at the top of the log window. Click it to play or locate the associated videos.

Test replays, failures without an account history, and videos that have been removed may have no associated replay button. If the button is missing, first check the full list under **History → Failure replays**.

## Video storage and cleanup

Videos are saved in two locations:

| Location                                            | Purpose and cleanup                                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| The recording path configured in OBS                | OBS's original videos. **MAS never deletes these files**; manage them yourself.                                                  |
| `data/replays` under the AUTO-MAS runtime directory | Copies managed by MAS. After a new video is saved, older copies exceeding **Maximum retained copies** are removed automatically. |

Retention is based on the **number of copies**, not their age in days. Lowering the limit takes effect when the next video is saved successfully. Routine configuration backups do not include these videos, so copy them separately if you need to keep them.

Even with MAS set to retain only three copies, OBS's original video folder can continue to grow. Removing a MAS copy does not free the space used by its OBS original.

::: tip Wait for the video before exiting
When exiting, restarting, or shutting down, MAS waits only a limited time for replay saves in progress. If you need the footage from a failure, wait until the video appears in the list and confirm that it plays before exiting MAS or closing OBS.
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
| The log has no associated replay button                  | Check the full replay list. The failure may have no account history association, or the video may have been removed or moved.                                                 |
| Older videos have disappeared                            | New videos and tests share the retention limit. Check OBS's original folder, increase the MAS copy limit, and copy important clips elsewhere.                                 |

When reporting a problem, play the video to check its contents, then provide the **relevant failure video and the log from the same run**. If your source includes the desktop or a login screen, check for account details or anything else you do not intend to share before sending it.
