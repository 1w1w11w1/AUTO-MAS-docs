---
title: OK-WW Configuration Guide
description: Wuthering Waves - OK-WW specialized adaptation guide
date: 2026-08-18
---

# OK-WW Configuration Guide

## Two things to know first

**OK-WW** is a third-party automation tool for Wuthering Waves. It is part of the **ok-script family**. **OkNte**, used for Neverness to Everness, is a separate project; this page only covers OK-WW.

The AUTO-MAS adaptation handles the repetitive parts: starting a task, monitoring logs, and optionally starting or closing the game. Complex OK-WW settings stay in the native OK-WW GUI, so MAS does not need to maintain a full copy of every setting.

<Box :items="[
{ name: 'OK-WW GitHub', link: 'https://github.com/ok-oldking/ok-wuthering-waves', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },]"/>

## Quick Start

1. Download [OK-WW from its official repository](https://github.com/ok-oldking/ok-wuthering-waves) and extract it. A path without Chinese characters is recommended. Open OK-WW once and complete its basic setup.
2. Open **Managed scripts** → **New managed script** and select **ok-ww**.
3. Set **ok-ww path** to the directory containing `ok-ww.exe`, not the executable itself.
4. Return to the managed-script list and click **Configure OK-WW** for this managed script. Save its basic configuration in the native GUI before adding an account. Existing accounts can also open a configuration session from their account page.
5. If MAS should manage the game lifecycle, enable **Game Configuration** and select the official Wuthering Waves `launcher.exe`.
6. Add an account, choose a configuration source, and decide whether to enable **Override standard configuration**.
7. Save the managed script and add it to the schedule.

## The Three Configuration Sources

The account editor offers **Shared configuration**, **Independent configuration**, and **Native**:

| Source | Choose it when | Meaning |
| --- | --- | --- |
| **Shared configuration** | Most accounts have the same settings | Uses shared MAS high-frequency settings for the managed script. |
| **Independent configuration** | Accounts need different settings | Stores independent MAS high-frequency settings for this account. |
| **Native** | OK-WW should own the complex settings | Reads the existing OK-WW configuration first; complex settings are edited in the native OK-WW GUI. |

As a shortcut: choose **Shared configuration** for shared settings, **Independent configuration** for per-account high-frequency settings, and **Native** when you want to keep the native OK-WW configuration and let MAS mainly schedule it.

> **Native does not mean that MAS never reads or writes files.** It means that MAS uses the external script's native configuration as its source. When Override Standard Configuration is enabled, MAS still applies a temporary override to the high-frequency fields for that run.

## Override Standard Configuration

The **Override standard configuration** switch controls the high-frequency task panel shown below it:

- **Enabled**: regardless of the selected source, the panel overrides the high-frequency fields for the next run.
- **Disabled**: the task uses the complete settings from the selected source. Native keeps the full native OK-WW configuration.

Override Standard Configuration only covers fields exposed by MAS. It does not replace the full OK-WW configuration. To run entirely from complex settings in the OK-WW GUI, choose **Native** and disable this option.

## When Configuration Is Restored

Override Standard Configuration is a **temporary runtime override**. It does not permanently rewrite the original OK-WW configuration:

1. Before each account's task, MAS backs up the original files under OK-WW `working/configs`.
2. During the task, MAS may write the selected account or override configuration.
3. After success, failure, an exception, or a stop, MAS restores the original files from the start of the task.

This prevents one account's quick settings from affecting the next account and prevents quick settings from being saved permanently in OK-WW. Only changes deliberately saved in the **Configure OK-WW** session through the native GUI become the script's original configuration.

## Official Launcher Requirement

- The OK-WW adaptation uses only official Wuthering Waves resources and the official launcher.
- The game path must be the official `launcher.exe`; **WeGame resources and the WeGame launcher are not supported**.
- If MAS should not manage game startup and shutdown, disable **Game Configuration**. This does not change the official-resource requirement for OK-WW.

## Which Tasks Can Run Right Now

AUTO-MAS handles just these two:

- The **daily task**
- The **multi-account daily task**

When a task finishes, AUTO-MAS makes OK-WW exit on its own, so there is nothing for you to do.

OK-WW's other tasks are not wired up yet. If you need one, open OK-WW and run it there.

## FAQ

### Did Override Standard Configuration overwrite my original OK-WW settings?

No. It only overrides settings during the current task. MAS restores the original configuration after success, failure, an exception, or a stop.

### Which source should I choose?

Choose **Managed level (shared config)** for shared settings, **Account level (independent config)** for different high-frequency settings per account, and **Native** when the complex settings are maintained in the OK-WW GUI. Disable Override Standard Configuration if Native must use the complete native settings.

### Why is my game path rejected?

Select the official Wuthering Waves `launcher.exe`. A WeGame launcher, a WeGame directory, or the game client executable cannot be used as the game path for this adaptation.

### Are OK-WW and OkNte the same script?

No. They are separate ok-script family projects for Wuthering Waves and Neverness to Everness, with independent configuration, tasks, and adaptation logic.
