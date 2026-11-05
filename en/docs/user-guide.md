# Getting Started

## What is AUTO-MAS?

AUTO-MAS is a manager for your scripts. The scripts you would otherwise start one at a time (MAA, for example) get handed to it instead: it swaps account configs for you, launches the scripts in order, and watches their logs to tell a finished run from a hang.

In short, it runs your whole multi-account batch in one go.

> AUTO-MAS: Make ALL Scripts Auto

## Installation

### Download and install

1. Go to the [download page](/en/download/auto-mas) and get the latest package.
2. Install it according to the package type:
  - Installer: extract the archive and run `AUTO-MAS-Setup.exe`, then follow the installer.
  - Portable: extract the archive to wherever you want it installed, then run `AUTO-MAS.exe` to start the app.

::: tip What those words in the filename mean

Some download channels offer several packages. Pick by filename:

| Filename contains | What it means | Pick it when |
| --- | --- | --- |
| `setup` | Installer, run it and follow the prompts | You want the installer to handle the install location for you |
| no `setup` | Portable, extract and run | You want to choose where it goes, or move the whole folder later |
:::

Current releases offer installer and portable packages. Both need an internet connection to prepare the runtime on first launch. Versions containing `beta` are prereleases; choose the latest stable release if you do not want a beta.

### Antivirus exclusions

Download AUTO-MAS and scripts from their official channels. If security software blocks or quarantines a file, check the source and the detection details first. After confirming a false positive, you can exclude the affected installation directory in that security software. Keep exclusions limited to trusted installation directories.

Here is how to **add Windows Defender exclusions**:

Quick link:

<Pill name="Windows Security" link="ms-settings:windowsdefender"/>

1. Open Windows Security. The page may look different when another antivirus program is installed; use the options available on your system.
![Windows Defender configuration 1](/docs/img/WD-1.png)

2. **Virus & threat protection settings > Manage settings**
![Windows Defender configuration 2](/docs/img/WD-2.png)

3. **Exclusions > Add or remove exclusions**
![Windows Defender configuration 3](/docs/img/WD-3.png)

4. **Add an exclusion > Select the matching directory**
![Windows Defender configuration 4](/docs/img/WD-4.png)

## First launch

On first launch, Runtime prepares the backend code, Python, and dependencies. Keep the app connected and wait for the progress screen to finish. Installer and portable packages use the same initialization process.

If initialization fails, read the failed step and error details, then use the recovery actions offered on that page, such as **Retry**, **Retry with another source**, **Check the environment**, or **Rebuild the environment**. The available actions depend on the error. If recovery fails, export the logs and report the error; see the [FAQ](/en/docs/FAQ).

During normal use, the managed backend checks for fixes on the current version branch and prepares them in the background. When the title bar says **Backend update is ready and takes effect on the next launch**, restart the app to apply it. New desktop app versions still require the app update flow or a new installation package. Automatic checks stop while updates are paused.

## What to configure next

Almost every setting in the app comes with a note next to it. Work through each page top to bottom and you are basically done. If you get stuck, come back to the matching section of these docs.

Two things worth remembering for when something goes wrong:

- **To back up configuration**: use **Settings → Advanced → Export a data backup**. The export contains sensitive configuration in plaintext; keep it private and do not attach it to bug reports. For a manual backup, exit the app first, then copy `data`, `config`, and `history` from the installation directory. Credentials copied in encrypted form may need to be entered again after moving computers or reinstalling Windows; see [password storage](/en/docs/FAQ#are-my-account-passwords-safe). Back up script installations, emulators, and game data separately. Custom appearances and standalone mascots are stored in the Windows user-data directory and do not move with the installation folder; keep their ZIP packages separately.
- **To report an error**: use **Settings → Advanced → Export a log archive**. Initialization failure pages also offer log export. Raw logs are at `debug/app.log` (backend), `debug/frontend.log` (interface), and `debug/runtime/` (Runtime) in the installation directory. Check attachments and remove account details, credentials, and other private information before sharing.

### Find the backup and log export entries

1. Select **Settings** in the left navigation, then select the **Advanced** tab at the top of the page, marked ①.
2. In **Backup and export**, use the button on the right of the **Export a data backup** row to back up or migrate configuration, marked ②.
3. To report an error, find **Export a log archive** in the same section and use the button on the right of that row, marked ③.

Choose ② or ③ for your purpose; there is no need to run both. A data backup contains sensitive configuration in plaintext and must not replace a diagnostic log package.

[![Data backup and log export entries in Advanced settings](/docs/img/tutorial-context-20261105-3c9448bdf/settings-exports.png)](/docs/img/tutorial-context-20261105-3c9448bdf/settings-exports.png)

This Chinese-interface screenshot uses **dev after v5.8.0-beta.3 (3c9448bdf)**. Only the export entries were checked; no export was performed.
