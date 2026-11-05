---
title: HSR Honkai Star Rail Configuration Guide
description: "Schedule Honkai: Star Rail external scripts in AUTO-MAS with M7A and SRA"
date: 2026-06-17
---

# HSR Honkai Star Rail Configuration Guide

## What the HSR Script Type Is For

Honkai: Star Rail has two widely used third-party scripts, and each is better at different things:

- **March7th Assistant (M7A)**: better at Trailblaze Power stages and weekly tasks.
- **StarRailAssistant (SRA)**: better at collecting daily rewards and at Divergent Universe.

That is the point of the HSR script type: **you do not have to choose one**. Run both under a single managed script and decide task by task which one handles it. AUTO-MAS starts the game, calls the scripts in order, retries failures, and remembers whether this week's weekly tasks are already done.

**What it can run** (exact coverage depends on the script versions you install):

- Trailblaze Power stages: Calyx (Golden), Calyx (Crimson), Cavern of Corrosion, Ornament Extraction
- Echo of War, reset weekly
- Daily tasks and rewards: redemption codes, mail, assignments, Nameless Honor, Daily Training, and more
- Weekly: Divergent Universe, Currency Wars

**For more information, see:**

<Box :items="[
{ name: 'March7th Assistant Website', link: 'https://m7a.top/', image: 'https://m7a.top/assets/screenshot/March7th.png', },
{ name: 'March7th Assistant GitHub', link: 'https://github.com/moesnow/March7thAssistant', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },
{ name: 'SRA Website', link: 'https://starrailassistant.top/', image: 'https://starrailassistant.top/favicon.ico', },
{ name: 'SRA GitHub', link: 'https://github.com/Shasnow/StarRailAssistant', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },
]"/>

## Before You Start

Get these out of the way first. It removes about half the problems people run into later.

1. **Install the scripts you want to use.** At least one of M7A and SRA. Install both if you want to mix them.
2. **Open each script manually once.** A script only writes its own configuration file on first launch (`config.yaml` for March7th, a profile under `%APPDATA%\SRA\configs` for SRA). AUTO-MAS reads it to fill in the options on the right side of "Tasks managed by MAS", and Native configuration cannot even pass the pre-run check without it. If SRA has not written one after you open it, just save any setting inside SRA.
3. **Install the Honkai: Star Rail PC client**, the CN official client.
4. Download scripts from their official sources. If security software blocks a file, check the source and detection details first. Add an exclusion only for a trusted installation directory after confirming a false positive.
5. **Keep paths free of non-English characters and spaces**, for example `D:\M7A` and `D:\SRA`. Such paths have a long history of breaking image recognition and path parsing.

::: warning Pick the folder, not the exe
When you save, AUTO-MAS checks that the folder you picked contains the matching exe. Pick the wrong thing and a popup stops you right there:

| For this field | The folder must contain |
| --- | --- |
| March7th path | `March7th Assistant.exe` |
| SRA path | `SRA-cli.exe` |
| Game path | `StarRail.exe` |
:::

## Create an HSR Managed Script

### 1. Create the managed script

Go to **Managed scripts** → **New managed script** → pick **HSR** → confirm. The app jumps to the managed-script configuration page.

### 2. Managed script and game configuration

| Field | What to enter |
|---|---|
| **Managed script name** | Any name you will recognize, such as "Main Star Rail account" |
| **March7th path** | The **folder** M7A lives in |
| **SRA path** | The **folder** SRA lives in |
| **SRA config profile** | SRA can keep several configuration profiles; this picks which one to use. Defaults to "auto", see below |
| **MAS manages the game** | Lets AUTO-MAS launch the game, restart it when switching scripts, and watch the game process. Defaults to "Yes"; a game that is already running is detected and the launch is skipped, so you do not need to turn this off for that. **Only pick "No" for Native configuration with the cloud client**; turning it off disables all three behaviours at once |
| **Game path** | The **folder** Honkai: Star Rail lives in. Required when "MAS manages the game" is "Yes" |
| **Maximum game launch wait** | Seconds to wait after launching before the client is considered ready. Default 60, raise it on slower machines |
| **Run in 1920×1080 windowed mode** | Temporarily rewrites the registry before a task so the game runs at 1920×1080 windowed, and restores it afterwards. The scripts' image recognition is tuned for this resolution, so turn it on if your aspect ratio differs |
| **Redeem codes run only when they change** | On by default. Skips the redemption code step when the codes have not changed, so it does not run pointlessly every day |

::: tip One script is enough
Fill in only M7A or only SRA and leave the other empty. The empty one will not appear as an engine choice on the account page.
:::

::: tip About SRA configuration profiles
SRA stores its settings as one or more profiles under `%APPDATA%\SRA\configs`. Which one you pick decides two things: what the options under "Tasks managed by MAS" show, which profile Native configuration runs.

Leaving it on "auto" prefers `Default` and otherwise takes the first profile in filename order — which is exactly what AUTO-MAS always did before. If the profile you picked is later deleted or renamed, AUTO-MAS falls back to auto and says so on both the managed-script page and the account page, rather than switching silently.
:::

::: warning Change the resolution while the game is closed
"Run in 1920×1080 windowed mode" works by writing the registry, which does not take effect while the game is already running. AUTO-MAS logs a note asking you to close the game and run again; the current round still proceeds, just without the resolution change.
:::

### 3. Set retries and timeouts

These control timeout and retry behavior. The defaults suit most setups; adjust them for your machine.

| Field | What it does | Default |
|---|---|---|
| **Maximum attempts for a failed task** | How many attempts a task gets in **total**, first one included. The default 3 means the first run plus at most 2 retries | 3 |
| **Daily task timeout (minutes)** | Cap for daily / Trailblaze Power / reward tasks | 20 |
| **Weekly task timeout (minutes)** | Cap for Divergent Universe and Currency Wars | 60 |
| **Enable low-performance compatibility mode** | Only affects M7A running Divergent Universe. Turn it on if M7A runs it unreliably | Off |

::: tip Task assignment is not on this page
Which script runs which task is decided **per account**, on the account page, not here. Two accounts under the same managed script can use different engines.
:::

### 4. External script updates

**External script updates** on the managed-script page covers the M7A / SRA paths you configured:

- Updates are checked before a run by default. Select **Off** for manual updates only. The old after-run setting is treated as before-run.
- March7thAssistant defaults to GitHub and also offers MirrorChyan. SRA defaults to the AUTO-MAS download site; other sources can be selected on the page.
- MirrorChyan requires the HSR-specific CDK entered here. It does not fall back to the CDK in AUTO-MAS's own update settings.
- Each engine has separate **Check for updates** and **Update now** actions. Confirm the target version and result before starting tasks.

## Create an HSR Account

In the **Managed scripts** table, click **Add an account**, then fill in the basics:

| Field | What to enter |
|---|---|
| **Account name** | Display name. It is also sent to the script as the "Trailblazer name" for Currency Wars |
| **Enabled** | Disabled accounts are skipped |
| **Account** | Phone number or similar login. Only needed when SRA has to switch accounts for you |
| **Password** | Login password, same condition |
| **Server** | CN official only for now |
| **Days remaining** | How many more days to run this account. `-1` means no limit. It **drops by at most one per day**, and only once at least one module has succeeded in that day's daily phase. The account is skipped at 0. Direct-control accounts never count down, but they are still skipped at 0 |
| **Note** | Anything you want |

::: warning About the account and password
They are stored locally and encrypted automatically. Nothing is uploaded.

**They only appear when the managed-script page has an SRA path and this account is in MAS-managed mode.** Whether they are actually used for login or account switching further depends on one of your enabled modules being assigned to SRA; otherwise they sit unused.

Also, do not share your `data/` directory or managed-script configuration JSON with anyone. They contain your encrypted credentials.
:::

## Run Mode: MAS Managed or Native Configuration

Every account picks a **run mode**, which decides who is in charge:

| Mode | Who decides what runs | Who it suits |
|---|---|---|
| **MAS managed** (default) | AUTO-MAS. Task switches, engines, stages and every option are set on this page | People who want to manage every account from one place |
| **Native configuration** | M7A / SRA themselves. AUTO-MAS only launches them on schedule | People already comfortable in the scripts who just want a scheduler |

### Native configuration

Native configuration needs **no configuration in AUTO-MAS at all**. Whatever you set up in M7A / SRA is exactly what runs, and changes take effect immediately — there is nothing to sync back here.

Two steps: pick the run mode, then switch on the scripts you want to run.

::: warning Native configuration ignores the rest of this page
Task switches, account and password, stages, and the options under "Tasks managed by MAS" have **no effect** in native configuration. They belong to managed mode, and so does the "Progress and reset" area further down.

Native configuration also has no automatic retry (whatever the script does is the result), a fixed two-hour cap per run, and works only through the automatic proxy — you cannot run a single native-configuration account on its own from the scheduler.
:::

## Configure Trailblaze Power Stages

The **Trailblaze Power** area has four dropdowns, one per stage type. Leave a dropdown empty for stages you do not want to farm:

| Dropdown | What it farms |
|---|---|
| **Calyx (Golden)** | Character EXP / Light Cone EXP / Credits |
| **Calyx (Crimson)** | Trace materials |
| **Cavern of Corrosion** | Relics |
| **Ornament Extraction** | Planar ornaments |

Golden and Crimson are independent and can both be saved at once.

Below that:

- **Farm stages**: which of the four types this run actually farms.
- **Active stage**: shows the stage you selected, for confirmation only.
- **Echo of War**: pick one of the stages read from the script, or leave it empty to skip.
- **Echo of War start day**: pick a weekday. From that day on, if this week's run has not happened yet, it runs. Once done, it does not repeat that week.

::: tip Stage options follow the engine
These stage options are not written by AUTO-MAS — they are **read out of your M7A / SRA**, from whichever engine handles Trailblaze Power. The two lists differ, so **your stage choice is stored per engine**. Switch engines and you have to pick again; switch back and your earlier choice is still there.
:::

## Tasks Managed by MAS

This is the main area of managed mode: the four task modules on the left, and the selected module's detailed options on the right.

| Module | What it covers | Switch default |
|---|---|---|
| **Trailblaze Power and cultivation targets** | Trailblaze Power stages, Echo of War | On |
| **Daily tasks and rewards** | Redemption codes, mail, assignments, Nameless Honor, Daily Training, and more | On |
| **Divergent Universe** | Divergent Universe | Off |
| **Currency Wars** | Currency Wars | Off |

Divergent Universe and Currency Wars have separate switches but share the weekly completion record. If that record is incomplete when a run starts, both enabled tasks can enter that run's queue. Completing either makes later runs that week skip the weekly phase.

Each module picks its own **engine** (SRA or March7th Assistant). With only one script path filled in, that is the only choice.

### Where the detailed options come from

The options on the right are **not defined by AUTO-MAS**. They are read live out of your SRA / March7th Assistant configuration file, showing whatever the script has saved right now. When you change one here, AUTO-MAS records **only the fields you changed** (its "overrides"); everything else keeps following the script.

That has a few direct consequences:

- New options added by a script update show up here on their own — you do not have to wait for an AUTO-MAS update.
- **Switching the engine swaps the entire set of options**, because the two engines do not share field names. Values you changed under the current engine are not carried over, but they are kept, so switching back brings them along.
- Some things are deliberately left to the script, such as SRA's redemption code list. Those can only be entered in the script's own UI.

::: warning Two kinds of settings are force-disabled by AUTO-MAS
In managed mode, AUTO-MAS forces the script's own **notifications** and **after-task action** off in the temporary configuration (March7th's `after_finish`, SRA's `missionAccomplished`).

The reason is that those actions close the game, or the whole computer. March7th closes the game on the way out whenever `after_finish` is anything but "None", which forces the rest of that phase to stop and go to a retry; set to "Shutdown" it really does shut the machine down 60 seconds later. Notifications are sent by AUTO-MAS itself instead.

This only affects the run AUTO-MAS performs in managed mode — your own settings are restored afterwards. **Native configuration leaves both of these alone**: whatever you set is what runs. The one exception is SRA's Windows toast notifications, which are turned off for the whole run whenever an SRA path is configured, and restored when it ends.
:::

### Reset to the source configuration

**Reset to the source configuration**, at the top right of the module list, **deletes every override this account has in AUTO-MAS** (all modules, all fields). Everything then displays and runs according to the script's current configuration. The source configuration file itself is not touched.

The action cannot be undone, so it asks for confirmation first.

### What "N stale overrides" means

After a script update, or after switching SRA configuration profiles, a field you once changed may no longer exist, or its type may no longer match. Such an override is marked stale:

- **It is ignored at run time and the source value is used instead.** It never causes an error or interrupts the task.
- The detail panel lists which ones, why they became invalid, and the value you had saved.
- **Remove stale overrides** takes them out of this account's configuration. That too only touches the AUTO-MAS side, never the source file.

## AUTO-MAS Handles Weekly Progress for You

AUTO-MAS keeps its own records for these:

- **Echo of War**: tracked on its own, per week.
- **Divergent Universe and Currency Wars**: these two **share a single "weekly" record**. If the weekly record is incomplete at the start, both enabled tasks enter that run's queue. Once either is confirmed complete in the log, the shared record is marked complete and later runs that week skip both.

They reset at Monday 04:00 on the CN server, equivalent to Monday 00:00 in UTC+4, not local Monday midnight.

### Changing progress by hand

The **Progress and reset** area at the bottom of the account page (managed mode only) shows whether Echo of War and the weekly tasks are done this week, with **Mark as done** and **Reset** for each.

Two uses: you already did it yourself in game and want AUTO-MAS to stop trying, or you want to force a re-run.

::: tip These buttons only change records
They only touch AUTO-MAS's own bookkeeping. They **do not make the scripts run anything**.
:::

## Running and Logs

Once configured, add the managed script to a [task queue](/en/docs/task-scheduler) and it runs automatically. Three things worth knowing:

- **The game may restart repeatedly**: three things trigger it — switching between the two scripts for one account, that account moving from the daily phase into the weekly phase (regardless of which script), and each retry round. All deliberate, to keep script state from interfering. All three only happen while "MAS manages the game" is on.
- **Your M7A / SRA configuration is safe**: AUTO-MAS backs it up before running and restores it afterwards.
- **Retryable failures are retried** up to the configured maximum, restarting the game first when game management is enabled. Configuration errors and cloud login, queue, or play-time failures that retries cannot resolve are not repeatedly retried.

### Which logs to attach when reporting a problem

- `debug/app.log` — the AUTO-MAS backend log
- `debug/frontend.log` — the UI log

If the problem looks like it is in one of the scripts, attach that script's own log as well (see its documentation for the location).

::: tip Check before you share a log
AUTO-MAS forwards M7A / SRA output into its own log verbatim, so it may contain your in-game UID (the scripts pick it up while doing OCR). Account and password are redacted; the UID is not. Search for your UID and mask it before posting to a public issue.

Also note that with March7th's log level set to DEBUG the forwarded volume gets very large — a thousand lines for one run is normal. Set March7th's own `log_level` back to `INFO` for a tidier log.
:::

## FAQ

### There is no HSR option when creating a managed script

Your AUTO-MAS is too old to have the HSR script type. Update from the [download page](/en/download/auto-mas) and restart the app afterwards.

### The path is rejected no matter what I enter

**You probably selected the exe itself. This field wants the folder.** Make sure the folder directly contains the matching exe: `March7th Assistant.exe` for M7A, `SRA-cli.exe` for SRA, `StarRail.exe` for the game. Do not select a subfolder either.

### The stage list is empty

Stage options are read from the lists shipped inside the scripts themselves (`assets\config\instance_names.json` for March7th, `tasks\config\trailblaze_power.toml` for SRA). They exist as soon as you unzip, so **this has nothing to do with whether you have opened the script**. That leaves two causes: the **path does not point at the script's root folder** (most common — those folders must be visible inside it), or you **just switched the engine for Trailblaze Power** — the two lists differ, so you have to pick again, and the page says so.

### Task status is wrong, things run that shouldn't or don't run that should

- Check the task switches on the account page first.
- Weekly tasks reset weekly; crossing into a new week clears them automatically.
- **Progress and reset** lets you mark or reset a task to fix the state immediately.
- If it is still wrong, check `debug/app.log` for how the script exited.

### M7A runs Divergent Universe unreliably

Turn on **Enable low-performance compatibility mode** on the managed-script page. Team, blessings and simulation strategy are outside AUTO-MAS's control — set those up in M7A beforehand.

### SRA finished Currency Wars but there are no points

Check the points and unclaimed rewards in the game, then consult the installed SRA version's task instructions and logs. A MAS completion record does not prove that all game rewards were collected; reward collection belongs to the upstream script.

### The game keeps restarting

Three sources: switching between scripts, finishing the daily phase and moving into the weekly one, and each retry round. All deliberate, to prevent script state from interfering.

Assigning everything to one script removes the first, but as long as Divergent Universe or Currency Wars is enabled, the restart after the daily phase is unavoidable. To keep AUTO-MAS away from the game entirely, turn off "MAS manages the game" on the managed-script page — at the cost of handling launching, switching and process monitoring yourself.

### A task failed, but there is no script output in the log

Check `debug/app.log` for the launch error, then verify the installation directory, executable, and script dependencies. Missing output alone does not identify the cause. If security software recorded a block, verify the download source before treating it as a false positive.

## Feedback and Help

- AUTO-MAS issues: [GitHub Issues](https://github.com/AUTO-MAS-Project/AUTO-MAS/issues)
- March7th Assistant: [m7a.top](https://m7a.top/) / [GitHub](https://github.com/moesnow/March7thAssistant)
- StarRailAssistant: [starrailassistant.top](https://starrailassistant.top/) / [GitHub](https://github.com/Shasnow/StarRailAssistant)
