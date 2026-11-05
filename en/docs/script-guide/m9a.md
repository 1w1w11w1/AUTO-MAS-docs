# M9A Configuration Guide

::: tip Tip
M9A is now one kind of [MFW script](/en/docs/script-guide/maafw): pick the M9A directory and AUTO-MAS recognises it and treats it as M9A. The managed-script page, account page, updates and the embedded copy all work like any other MFW project; this page only covers what is specific to M9A.
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

## Configure the managed script

1. Go to **Managed scripts**, click **New managed script** and choose **MaaFW** (choosing **M9A** does the same; the two only differ in the default name).
2. Under **Project directory**, click **Pick a local directory** and select the extracted M9A directory. AUTO-MAS imports it as its own copy, recognises it as M9A, and the script type becomes **M9A** automatically.
3. Pick the server under **Game resource** (official / Bilibili / global…), and choose the emulator and instance under **Emulators**.
4. Everything else — run configuration, project update (GitHub / MirrorChyan, auto update before a run) — is described in the [MFW Project Configuration Guide](/en/docs/script-guide/maafw).

::: tip The server is per managed script
M9A's `interface.json` declares servers as "resources", so in AUTO-MAS the server is chosen on the **managed script**, and every account under one managed script is on the same server. To run both the official server and Bilibili, create two managed scripts and select the resource for each. Their account settings and run views are separate, but managed scripts for the same project and update channel share the project version.
:::

## Configure accounts

1. Click **Add an account** in the managed script's row under **Managed scripts**.
2. Fill in a name and a note. The **Account** field is only used on the official server (see automatic account switching below); on other servers it is just a note.
3. You can add several accounts; AUTO-MAS runs each account's task queue in list order.

### Task queue

The task list is exactly the tasks declared in M9A's `interface.json`, whatever version you have. Select tasks to add them to the queue and drag to reorder; M9A's own **presets** (e.g. "Daily") add a whole set in one click. Each task's **Task options** are the options from M9A's own UI, with the same defaults.

**You don't add Start game or Close game yourself.** At run time AUTO-MAS completes the head and tail automatically:

```text
Start game → [Switch account] → your tasks → Close game
```

Tasks already in the queue are not added twice, and anything you placed elsewhere is left where it is.

### Automatic account switching

**Official server only** — other servers can't do it due to an M9A limitation.

When the managed script's game resource is the official server and an account has its **Account** field filled in, AUTO-MAS inserts a **Switch account** task right after Start game and fills the account in; leave it empty if you don't need to switch. On other servers the account is just a note and no switch is inserted.

### Once a day / once a month

**Skip once done today** / **Skip once done this month** under **Run configuration** on the managed-script page replace the old M9A script's "Psychube once a day" and "Limbo once a month" switches: add **每日心相（意志解析）** to the daily list and **自动深眠**, **自动醒梦** to the monthly list, and they are skipped automatically after succeeding once that day / month. Any other task can be added as well.

## Upgrading from the old M9A script

The **M9A script** in older versions of AUTO-MAS was a separate adapter. It is migrated to the setup above automatically the first time the upgraded AUTO-MAS starts; you do not need to rebuild anything:

- Managed scripts, accounts, emulator, notification settings and run counters are kept as they were; each account's task queue is converted to the new format and task options are matched by name.
- The old "server" was per account, the new one is per managed script: the managed script takes the server used by most of its enabled accounts; accounts on a different server are **disabled** with the reason written in their note — move them to another managed script (or change the managed script's resource) and re-enable them.
- Old automatic-update settings migrate to project updates. Current automatic updates run before a task; disabled updates remain **Off**. Check the source and project-specific CDK after migration: routine updates do not fall back to AUTO-MAS's own update credentials.
- The old "run time limit" was a log-stall threshold; the new one is a hard limit on the whole run, so it is set to 120 minutes across the board.
- The configuration is backed up before migrating as `config/ScriptConfig.json.m9a-legacy-<timestamp>.bak` (the last three are kept); a notification listing the results pops up after start-up.
- Config backups made by the old adapter (`data/<managed script ID>/M9ABackups/`) are left in place and no longer shown under Config restore.

::: warning The first run after migration
Imports a copy from the original M9A directory; duration depends on project size and disk performance. Keep the source while source following is enabled, or when it may be needed to rebuild a missing copy.
:::

## FAQ

### I created a generic MFW script — why did it turn into M9A?

The project decides the type: if the `interface.json` in the directory is M9A's (MirrorChyan rid `M9A`, or GitHub pointing at `MAA1999/M9A`), the managed script is recognised as M9A and gets automatic start / close game and account switching. After a successful import, the directory is locked. Create a new managed script to use a different project.

### A task failed — how do I look into it?

Check that the emulator connected → read the run-page log (every task's start / success / failure and the last node it stopped at are there) → a screenshot is taken automatically on failure and shown in the history → if still unclear, open that history record and download its MaaFramework native log from the attachments.

### Why doesn't the run count go up?

**The day boundary is computed in UTC+4**, which may be a few hours off from your computer's date; the day does not roll over at local midnight. Once the day's count reaches **Runs per day for this account**, the remaining accounts are skipped.

### Support matrix

| | Status |
|---|---|
| Official server | Supported, and the only server with automatic account switching |
| Bilibili / other servers | Supported, without automatic account switching (M9A limitation) |
| MFAAvalonia package / MXU package | Both supported (AUTO-MAS never starts the UI; only `interface.json` is used) |
| MuMu / LDPlayer | Supported |
| Other emulators | Untested, may have issues |
