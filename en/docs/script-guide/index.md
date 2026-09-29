# Script Management

Find the game you play below, open its guide, and follow along.

Your game is not in the list? See [General Scheduling](/en/docs/script-guide/general). As long as the script can start running a task on startup and writes a log, AUTO-MAS can manage it.

## Guide Index

### [MAA](/en/docs/script-guide/maa)

Arknights - MaaAssistantArknights

- Supports all Annihilation and daily automation tasks
- Supports multi-account management for official and Bilibili servers
- Supports stage configuration through weekly plans

### [MaaEnd](/en/docs/script-guide/maaend)

Arknights: Endfield - MaaEnd Assistant

- Supports quick Protocol Space adjustments and automatic check-ins
- Supports PC and emulator control, with PC recommended
- Supports stage configuration through weekly plans, currently in beta

---

### [M9A](/en/docs/script-guide/m9a)

Reverse: 1999 - M9A

- Supports daily automation, event farming, automatic Artificial Somnambulism, and more
- Supports MuMu and LDPlayer emulators
- Added as an MFW script: the directory is recognised automatically, start / close game and official-server account switching are inserted for you

---

### [MFW Projects](/en/docs/script-guide/maafw)

Any MaaFramework project that ships an `interface.json`

- Runs the task queue straight from the interface without starting the project's own UI
- Runs on AUTO-MAS's own copy: the original directory is never touched and can be deleted after import; one project can back several scripts running at the same time
- Project updates from GitHub or MirrorChyan, automatically before or after a run

---

### [OK-WW](/en/docs/script-guide/okww)

Wuthering Waves - OK-WW

- Currently supports daily tasks and multi-account dailies
- AUTO-MAS can start and close the game for you
- Complex settings stay in OK-WW's own UI; AUTO-MAS only takes over the high-frequency ones
- Supports the official launcher only, not WeGame

---

### [HSR](/en/docs/script-guide/hsr)

Honkai: Star Rail - March7thAssistant (M7A) + StarRailAssistant (SRA)

- You can mix both scripts and decide which one handles which task
- Covers Trailblaze Power, reward collection, Divergent Universe, and Currency Wars
- Retries failed tasks automatically and will not break your existing script config

---

### [BetterGI](/en/docs/script-guide/bettergi)

Genshin Impact - BetterGI

- Native GUI configuration; accounts are managed natively by BetterGI, complex settings are done in BetterGI's interface
- Manages the One Dragon built-in config groups (8 toggles) and custom config groups independently per account
- Supports reward party, combat party, and auto-battle strategy fields, auto-reading combat scripts under `User/AutoFight`
- Account switching, notifications, and extra scripts can each be configured independently

---

### [General Scheduling](/en/docs/script-guide/general)

For scripts that can run tasks on startup and print logs

- Supports most mainstream scripts, including March7thAssistant, SRC, zzzOD, and M9A
- Ready-made config templates you can use straight away
- Supports flexible custom managed plans

---

### [March7thAssistant](/en/docs/script-guide/march7th)

Honkai: Star Rail - March7thAssistant

- Under development
- Can be used together with automatic login scripts

---

## Reading Recommendations

- **New users**: start with the [MAA guide](/en/docs/script-guide/maa) if you play Arknights
- **Wuthering Waves players**: read the [OK-WW guide](/en/docs/script-guide/okww)
- **Reverse: 1999 players**: read the [M9A guide](/en/docs/script-guide/m9a)
- **Other MaaFramework projects**: read the [MFW project guide](/en/docs/script-guide/maafw)
- **Honkai: Star Rail players**: read the [HSR guide](/en/docs/script-guide/hsr)
- **Genshin Impact players**: read the [BetterGI guide](/en/docs/script-guide/bettergi)
- **Other games**: read [General Scheduling](/en/docs/script-guide/general) and use an existing template
- **Advanced users**: learn the configuration management model in [General Scheduling](/en/docs/script-guide/general) and customize your scheduling plan
