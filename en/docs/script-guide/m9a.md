# M9A Configuration Guide

::: tip Tip
M9A is now one kind of [MFW script](/en/docs/script-guide/maafw): pick the M9A directory and AUTO-MAS recognises it and treats it as M9A. The script page, user page, updates and the embedded copy all work like any other MFW project; this page only covers what is specific to M9A.
:::

## What is M9A?

M9A is a third-party tool for Reverse: 1999. It handles repetitive work such as daily automation, Artificial Somnambulism, and event farming.

It is powered by [MaaFramework](https://github.com/MaaXYZ/MaaFramework) image recognition technology.

**For more information, see:**

<Box :items="[
{ name: 'M9A GitHub', link: 'https://github.com/MAA1999/M9A', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },
{ name: 'M9A Documentation', link: 'https://1999.fan/', image: 'https://1999.fan/images/m9a-logo_256x256.png', },]"/>

## Install M9A

1. Download the **Windows release package** (`M9A-win-x86_64-vX.Y.Z-MFAA.zip` or `-MXU.zip`, either works) from <Pill name="M9A Repository" :image="{ light: '/icons/github.svg', dark: '/icons/github-dark.svg', }" link="https://github.com/MAA1999/M9A/releases/latest"/> or <Pill name="MirrorChyan" image="https://mirrorchyan.com/favicon.ico" link="https://mirrorchyan.com/en/projects?rid=M9A&scouce=AUTO-MAS-Web"/>.
2. Extract it to any folder (e.g. `D:\M9A`). You should see `interface.json` directly inside the extracted directory.

::: warning Note
You **do not** need to open M9A once by hand first, nor install the .NET runtime — AUTO-MAS never starts M9A's own UI; it prepares the MaaFramework runtime and the Agent's Python environment itself.
:::

## Configure the script

1. Go to **Scripts**, click **New script** and choose **MFW script** (choosing **M9A script** does the same; the two only differ in the default name).
2. Under **Project directory**, click **Pick a local directory** and select the extracted M9A directory. AUTO-MAS imports it as its own copy, recognises it as M9A, and the script type becomes **M9A** automatically.
3. Pick the server under **Game resource** (official / Bilibili / global…), and choose the emulator and instance under **Emulators**.
4. Everything else — run configuration, project update (GitHub / MirrorChyan, auto update before / after run) — is described in the [MFW Project Configuration Guide](/en/docs/script-guide/maafw).

::: tip The server is per script
M9A's `interface.json` declares servers as "resources", so in AUTO-MAS the server is chosen on the **script**, and every user under one script is on the same server. To run both the official server and Bilibili, create two scripts pointing at the same directory (each gets its own copy; they don't interfere).
:::

## Configure users

1. Click **Add a user** in the script's row under **Scripts**.
2. Fill in a name and a note. The **Account** field is only used on the official server (see automatic account switching below); on other servers it is just a note.
3. You can add several users; AUTO-MAS runs each user's task queue in list order.

### Task queue

The task list is exactly the tasks declared in M9A's `interface.json`, whatever version you have. Select tasks to add them to the queue and drag to reorder; M9A's own **presets** (e.g. "Daily") add a whole set in one click. Each task's **Task options** are the options from M9A's own UI, with the same defaults.

**You don't add Start game or Close game yourself.** At run time AUTO-MAS completes the head and tail automatically:

```text
Start game → [Switch account] → your tasks → Close game
```

Tasks already in the queue are not added twice, and anything you placed elsewhere is left where it is.

### Automatic account switching

**Official server only** — other servers can't do it due to an M9A limitation.

When the script's game resource is the official server and the user's **Account** is filled in, AUTO-MAS inserts a **Switch account** task right after Start game and fills the account in; leave it empty if you don't need to switch. On other servers the account is just a note and no switch is inserted.

### Once a day / once a month

**Skip once done today** / **Skip once done this month** under **Run configuration** on the script page replace the old M9A script's "Psychube once a day" and "Limbo once a month" switches: add **每日心相（意志解析）** to the daily list and **自动深眠**, **自动醒梦** to the monthly list, and they are skipped automatically after succeeding once that day / month. Any other task can be added as well.

## Upgrading from the old M9A script

The **M9A script** in older versions of AUTO-MAS was a separate adapter. It is migrated to the setup above automatically the first time the upgraded AUTO-MAS starts; you do not need to rebuild anything:

- Scripts, users, emulator, notification settings and run counters are kept as they were; each user's task queue is converted to the new format and task options are matched by name.
- The old "server" was per user, the new one is per script: the script takes the server used by most of its enabled users; users on a different server are **disabled** with the reason written in their note — move them to another script (or change the script's resource) and re-enable them.
- "Auto update after the queue" becomes **Project update → After run**; if it was off it becomes **Off**. The update source is decided like this: the MirrorChyan CDK configured in the M9A directory if there was one, otherwise the CDK from AUTO-MAS's own update settings, otherwise GitHub.
- The old "run time limit" was a log-stall threshold; the new one is a hard limit on the whole run, so it is set to 120 minutes across the board.
- The configuration is backed up before migrating as `config/ScriptConfig.json.m9a-legacy-<timestamp>.bak` (the last three are kept); a notification listing the results pops up after start-up.
- Config backups made by the old adapter (`data/<script ID>/M9ABackups/`) are left in place and no longer shown under Config restore.

::: warning The first run after migration
imports a copy from the original M9A directory (ten-odd seconds to a minute). After that it runs on the copy, the original directory is never modified again, and you may delete it.
:::

## FAQ

### I created a generic MFW script — why did it turn into M9A?

The project decides the type: if the `interface.json` in the directory is M9A's (MirrorChyan rid `M9A`, or GitHub pointing at `MAA1999/M9A`), the script is recognised as M9A and gets automatic start / close game and account switching. The other way round, an M9A script pointed at a different project's directory becomes a generic MFW script again. Users and settings are kept.

### A task failed — how do I look into it?

Check that the emulator connected → read the run-page log (every task's start / success / failure and the last node it stopped at are there) → a screenshot is taken automatically on failure and shown in the history → if still unclear, look at that run's `.maafw.log` under `history/<date>/<user name>/`.

### Why doesn't the run count go up?

**The day boundary is computed in UTC+4**, which may be a few hours off from your computer's date; the day does not roll over at local midnight. Once the day's count reaches **Runs per day for this user**, the remaining users are skipped.

### Support matrix

| | Status |
|---|---|
| Official server | Supported, and the only server with automatic account switching |
| Bilibili / other servers | Supported, without automatic account switching (M9A limitation) |
| MFAAvalonia package / MXU package | Both supported (AUTO-MAS never starts the UI; only `interface.json` is used) |
| MuMu / LDPlayer | Supported |
| Other emulators | Untested, may have issues |
