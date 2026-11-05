---
title: StarRailAssistant User Guide
description: Schedule StarRailAssistant in AUTO-MAS
date: 2025-11-08
---

# StarRailAssistant User Guide

## Schedule StarRailAssistant in AUTO-MAS

### What is SRA?

StarRailAssistant is a third-party tool for Honkai: Star Rail. It can handle repetitive tasks such as daily automation and Divergent Universe.

**For more information, see:**

<Box :items="[
{ name: 'SRA Website', link: 'https://starrailassistant.top/#/', image: 'https://starrailassistant.top/img/SRAico.png', },
{ name: 'SRA GitHub', link: 'https://github.com/Shasnow/StarRailAssistant', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },]"/>

## Install SRA

1. Download the archive from <Pill name="SRA Website" image="https://starrailassistant.top/img/SRAico.png" link="https://starrailassistant.top/#/"/>, <Pill name="SRA Repository" :image="{ light: '/icons/github.svg', dark: '/icons/github-dark.svg', }" link="https://github.com/Shasnow/StarRailAssistant/releases/"/>, or <Pill name="MirrorChyan" image="https://mirrorchyan.com/favicon.ico" link="https://mirrorchyan.com/zh/projects?scouce=AUTO-MAS-Web&rid=StarRailAssistant&channel=stable"/>.
2. Extract the SRA archive to any folder.

::: warning Don't Unpack Into a Non-English Path
Keep SRA, and any other general script, out of folders with non-ASCII characters in the name, such as `D:\脚本\`. Those paths cause failures that are hard to diagnose. Use a plain English path like `D:\SRA`.
:::

## Configure the Managed Script

::: tip Interface names
Historical screenshots may show “Script Management”, “New Script”, or “User”. These are now “Managed scripts”, “New managed script”, and “Account”; the steps below use the current names.
:::

SRA can manage multiple accounts on its own, and so can AUTO-MAS. That gives you two routes. **Pick one — don't set up both**:

| | What manages the accounts | Good if |
| --- | --- | --- |
| **Method 1** | AUTO-MAS | You want per-account results inside AUTO-MAS, and want to start or stop individual accounts |
| **Method 2** | SRA | You already have several accounts configured in SRA and don't want to redo them |

See the [comparison diagram](#differences) at the bottom of this page for how the two differ.

### Method 1: Use AUTO-MAS Multi-Account

1. Open **AUTO-MAS**, go to **Managed scripts**, click **New managed script**, and select **General** to add a managed-script configuration page.
   ![SRA configuration 1](/docs/img/script-guide/March7thAssistan/AUTO-MAA-1.png)
2. In the popup, select **Create from template**, then click **OK**.
   ![SRA configuration 2](/docs/img/script-guide/March7thAssistan/AUTO-MAA-2.png)
3. In the new window, find and select the **StarRailAssistant** template for SRA v2.14 and above, then click **Use this template**.
4. The managed-script configuration opens shortly:
   ![SRA configuration 3](/docs/img/script-guide/sra/mas1.png)
5. In the opened managed-script settings, click **Select folder** for **Script root directory**, then open the SRA software directory.
   ![SRA configuration 4](/docs/img/script-guide/sra/mas2.png)
   ::: warning Don't Edit the Paths Below by Hand
   Once you pick the script root directory, the paths under **script configuration** are filled in automatically by the template. Leave them alone unless you know what each one does. Wrong values break automation in confusing ways.
   :::
6. After selecting the SRA directory, the **script configuration** paths are corrected automatically and need no manual selection.
   ![SRA configuration 5](/docs/img/script-guide/sra/mas3.png)
7. SRA uses `C:\Users\YourName\AppData\Roaming\SRA` as its default config directory, so you don't need to change the **config file path** field.
   ![SRA configuration 6](/docs/img/script-guide/sra/mas4.png)
8. The script configuration saves automatically. Leave the managed-script configuration page.
9. Click **Add an account** and give the account a name in the account name field — it's only a label. Then click **General Configuration** in the upper-right corner.
   ![SRA configuration 7](/docs/img/script-guide/sra/mas5.png)
10. This launches the SRA window, where you configure SRA itself.
   ::: warning Keep the Config File Named `Default`
   When you use AUTO-MAS multi-account, do not rename the config file. Leave it as the default `Default`.
   :::
   ![SRA configuration 8](/docs/img/script-guide/sra/sra1.png)
11. When you're done, click the arrow to the right of the start button on the SRA home page to expand the launch options, then select **Save config only**.
   ![SRA configuration 9](/docs/img/script-guide/sra/sra2.png)
12. After clicking **Save config only**, close the SRA window and click the save configuration button in AUTO-MAS. That completes one account.
   ![SRA configuration 10](/docs/img/script-guide/sra/sra3.png)
13. To add more accounts, repeat steps 9 to 12. You may notice that SRA loads the previous config file when it opens at step 10 — that's normal. Just change the settings for the new account.
   ::: warning Same Rule for Every Account
   Keep the config file named `Default` for all of them.
   :::

### Method 2: Use SRA Multiple Configurations

Steps 1 to 7 are the same as Method 1. From step 8 on, they differ.

8. Change **launch arguments** to `-e task run`. This makes SRA run every config it has saved on startup, instead of just one.
   ![Change launch arguments](/docs/img/script-guide/sra/mas6.png)
9. The configuration saves automatically. Leave the managed-script configuration page.
10. Click **Add an account** and give the account a name in the account name field — it's only a label. Then click **General Configuration** in the upper-right corner.
   ![SRA configuration 7](/docs/img/script-guide/sra/mas5.png)
11. This launches the SRA window, where you configure SRA itself.
   You can use the `Default` config file as-is. If you have several accounts, create the new configs **inside SRA** and switch to each one to edit it.
   ![SRA configuration 8-1](/docs/img/script-guide/sra/sra4.png)
   ![SRA configuration 8-2](/docs/img/script-guide/sra/sra5.png)
   ![SRA configuration 8-3](/docs/img/script-guide/sra/sra6.png)
12. After finishing each config, click the arrow to the right of the start button on the SRA control panel to expand the launch options, then select **Save config only**.
   ![SRA configuration 9](/docs/img/script-guide/sra/sra2.png)
13. Once every config is saved, close the SRA window and click the save configuration button in AUTO-MAS. All accounts are now configured.

### Differences

One diagram covers it:

![Comparison](/docs/img/script-guide/sra/compare.png)

In short: with Method 1, AUTO-MAS swaps in one account's config at a time and launches SRA for each round. With Method 2, AUTO-MAS launches SRA once and SRA works through all of its own configs.
