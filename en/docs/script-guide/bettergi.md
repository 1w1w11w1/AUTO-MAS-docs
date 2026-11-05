---
title: BetterGI Configuration Guide
description: Genshin Impact - BetterGI specialization configuration guide
date: 2026-08-27
---

# BetterGI Configuration Guide

## Two things to know first

**BetterGI** is a third-party tool for Genshin Impact. It can run One Dragon (daily commissions, resin clearing, Ley Line Outcrops, domains, world boss kills, etc.) and many advanced features. It works in a **native GUI configuration** mode: accounts are managed natively by BetterGI, and complex settings are configured inside BetterGI's own interface.

The AUTO-MAS specialization manages, for each account independently, the **One Dragon** task configuration, **custom config groups**, account switching records, and notifications. Before a run it loads that account's independent configuration into BetterGI; when the run ends it reads back that account's One Dragon settings and saves them as an independent copy. AUTO-MAS does not keep a full copy of the BetterGI configuration.

<Box :items="[
{ name: 'BetterGI GitHub', link: 'https://github.com/babalae/better-genshin-impact', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },
]"/>

## Quick start

1. Download and extract [BetterGI](https://github.com/babalae/better-genshin-impact) from its official repository. It is recommended to use a path without non-ASCII characters, and complete a basic configuration in BetterGI first.
2. Open **Managed scripts** → **New managed script**, choose **BetterGI**, and set the BetterGI `RootPath`.
3. Add an account, choose **Independent configuration** as the **Configuration Management Mode** on the account edit page, and configure the One Dragon tasks as needed.
4. Click **Configure BetterGI** in the top-right corner. In the BetterGI native interface, edit the One Dragon named **"MAS Independent Config"** and save it; complex settings are also done here.
5. Save, then add the managed script to the scheduling queue.

## Configuration management mode

Each account can choose a source for their One Dragon configuration:

| Configuration mode | Best for | What it means |
| --- | --- | --- |
| **Independent configuration** | Most accounts | Saves an independent One Dragon configuration per account, loaded before a run and read back after. Different accounts under the same managed script can differ. |
| **Native configuration** | Letting BetterGI manage the config | Uses the script's current configuration directly, neither loading nor reading back the account's independent configuration; shared by native-configuration accounts. |

> When **Native configuration** is chosen, the **Task Configuration** and **Custom Config Groups** sections below are greyed out and not editable; BetterGI's native configuration decides.

### Where the independent config lives (important)

When **Independent configuration** is enabled, AUTO-MAS does **not rewrite** your original One Dragon config (such as `User/OneDragon/默认配置.json`, "Default Config"). Instead it materializes the account's independent config into a **MAS-owned slot** `{RootPath}/User/OneDragon/MAS独立配置.json`, launches BetterGI with `startOneDragon MAS独立配置`, and deletes the slot when done (idempotent).

So the One Dragon you always edit inside BetterGI is the one named **"MAS独立配置"** — not your own original config (that real file is never read or modified).

## Task configuration (One Dragon)

BetterGI stores each One Dragon configuration as an independent JSON file at `{RootPath}/User/OneDragon/{Name}.json` (the `Name` field equals the file name).

### One Dragon config name (required)

The name of a configuration saved in BetterGI's One Dragon page, **defaulting to 「默认配置」("Default Config")**. Options come from the existing config files under `{RootPath}/User/OneDragon/` (「默认配置」is placed first; the MAS slot "MAS独立配置" is not shown).

This name decides which real BetterGI configuration this account's One Dragon is snapshotted from. Choosing it does **not** mean MAS reads/writes that file at runtime — in independent mode the actual file is the "MAS独立配置" slot, as described under "Where the independent config lives" above.

### Built-in config groups (8 toggles)

The 8 **capsule toggles** below turn the One Dragon built-in config groups **run / do not run** and are multi-selectable. **Checked (on) tasks run; unchecked (off) tasks do not**:

| # | Config group |
| --- | --- |
| 1 | Mail claim |
| 2 | Resin synthesis |
| 3 | Auto Ley Line Outcrop |
| 4 | Auto Domain |
| 5 | Auto world boss hunting |
| 6 | Auto Stygian Onslaught |
| 7 | Claim daily rewards |
| 8 | Claim Serenitea Pot rewards |

**Important semantics**:

- These buttons are **toggles, not removals**: turning a group off only disables it; **its definition is preserved** and can be turned back on anytime (reversible).
- If a group is "on" but missing from the configuration, it is automatically created and enabled.
- AUTO-MAS only manages these 8 built-in groups; all other settings fields (parties, domains, Ley Line Outcrops, world boss hunting, etc.) are left untouched.

### Daily reward party

The party name used when collecting rewards. **Leaving it empty does not override** BetterGI's existing settings.

### Combat party

The party name used in general combat. Leaving it empty does not override BetterGI's existing settings; when filled, it is applied to the four combat tasks (**Auto Ley Line Outcrop, Auto Domain, Auto world boss hunting, Auto Stygian Onslaught**), replacing BetterGI's default party for those tasks.

### Combat strategy

Dropdown for the auto-battle strategy. Options are **"Auto-select based on party"** plus the `.txt` combat script file names under `{RootPath}/User/AutoFight/` (scanned in real time; you can drop in `.txt` scripts to add options). **Leaving it empty defaults to "Auto-select based on party"**. Like the combat party, it applies to the four combat tasks above.

## Custom config groups

Custom config groups are groups you create in BetterGI's One Dragon page, beyond the 8 built-in groups — this is the table's data **source**. The table is only a **switch**: groups present in the One Dragon but not in the table **run by default**; groups added to the table follow their row's switch — on means run, off means do not run.

### Master toggle "Enable"

Controls whether AUTO-MAS manages the on / off state of custom groups:

- **Off (default)**: custom groups are **left as-is** (their enabled state and order preserved); whether they run is decided by BetterGI's internal configuration.
- **On**: AUTO-MAS manages custom group states through the table below. Groups listed in the table follow their table state; groups present in the BetterGI configuration but not listed run **by default**; groups listed as enabled but missing from the configuration are automatically recreated.

> When toggled on for the first time with an empty table, existing custom groups are **auto-loaded from the current BetterGI One Dragon configuration** into the table (in independent mode it reads the "MAS独立配置" slot).

### Add config group

Click **Add Config Group** to pick a group from BetterGI's current configuration to bring under control, enter a name and confirm. New groups are **enabled by default** (names must not duplicate existing groups). Groups not added to the table stay in the One Dragon and are not lost because of the table.

### Table management

The table lists each custom config group, with "Config group name" and "Enabled" columns (click the toggle to switch). You can select several rows with the checkboxes, then click **Delete Selected** to remove them in batch.

## Configure BetterGI (native settings session)

Click the **Configure BetterGI** button in the top-right corner to open a settings session in BetterGI's native interface. A mask appears prompting you to finish configuration in BetterGI. With **Independent configuration** enabled, select and edit the One Dragon named **"MAS独立配置"** (do not touch your original config), then click **Save Settings** to end the session (the session times out automatically after 30 minutes of no interaction). On save, AUTO-MAS **reads back the current "MAS独立配置" slot** and snapshots it as that account's independent copy.

## Per-account One Dragon copy

Each account holds a copy of the One Dragon configuration at `data/{ScriptID}/{UserID}/OneDragon/{Name}.json`. The seed priority when writing is:

1. This account's copy (used first if present)
2. BetterGI's current real One Dragon configuration (by the One Dragon config name)
3. Built-in template

## FAQ

### After enabling "Independent configuration", which One Dragon should I edit in BetterGI?

The one named **"MAS独立配置"**. In independent mode MAS reads and writes this slot and launches with it at runtime. Your original config (such as 「默认配置」, "Default Config") is not read and is unaffected by edits here.

### Will my "Default Config" created in BetterGI be overwritten into the shape of "Independent configuration"?

No. MAS only operates on the "MAS独立配置" slot; your same-named real config (such as 「默认配置」, "Default Config") is never touched — this zero-contact behavior is exactly the design goal of independent mode.

### If I turn off a built-in group, can I get it back later?

Yes. The buttons are toggles: turning off only disables a group without deleting its definition. Turn it back on and its enabled state is restored.

### Why can't I edit task configuration in "Native configuration" mode?

In native-configuration mode, the One Dragon configuration is fully decided by BetterGI's native configuration; AUTO-MAS neither loads nor writes back the account's independent configuration, so the related fields are greyed out. Switch back to "Independent configuration" to have AUTO-MAS manage it.

### Will my groups created in BetterGI be lost if I turn off the custom groups toggle?

No. When the master toggle is off, custom groups keep their enabled state and order untouched. Only after you turn it on does AUTO-MAS manage their states through the table.

### Why do I see strategy options I did not create?

"Auto-select based on party" is BetterGI's built-in default strategy. The rest come from `.txt` combat scripts under `{RootPath}/User/AutoFight/`, scanned in real time by the system.
