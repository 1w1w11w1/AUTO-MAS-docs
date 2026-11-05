# Configuration Semantics

Adapters that manage a script's native configuration describe task configuration in two layers: the **base** and the **overlay**. During a task, the overlay overrides base fields to produce the effective configuration:


task_config = base ⊕ overlay

The `overlay` has higher precedence than `base`. Without an overlay, the task uses the base directly. The overlay exists only for the task run and does not change the base source. This page is the semantic contract for developers and documentation maintainers.

Availability of the three base sources and the regular-configuration override depends on each adapter's UI and implementation. A compatibility field is not evidence of an effective switch; see [Adapter Boundaries](#adapter-boundaries). The configuration framework's transaction workspace is also distinct from this business overlay; see [Configuration Management](./config.md).

## Core Entities

### Managed script

A **managed script** is the MAS-side entity used to control an external automation script. It owns the script path, launch arguments, and configuration for the managed script, and can contain multiple accounts.

### Account

An **account** is an execution-configuration entry under a managed script. It can store game-account information, credentials, and task settings; support for switching game accounts depends on the adapter. One managed script can contain multiple accounts.

Existing code and API identifiers such as `Script` / `User` and `script_id` / `user_id` remain unchanged; explanatory prose uses managed script and account.

Managed script and Account describe MAS boundaries; they do not redefine the external script's object model. An adapter should preserve upstream concepts instead of renaming them merely to match MAS entities.

## Base Layer

The base is the main task configuration. It persists on disk across tasks and has exactly one of these three sources:

| Source | MAS level | Meaning | Base owner |
| --- | --- | --- | --- |
| **Managed-script level (shared configuration)** | Managed script | Multiple accounts under one managed script share one base configuration | Managed script |
| **Account level (independent configuration)** | Account | Each account has its own independent base configuration | Account |
| **Native** | No MAS level | The base comes directly from the external script; MAS does not maintain a parallel copy | External script |

Managed-script level and Account level are storage levels for base. Native is a third source alongside them, not another MAS level.

### Boundaries of the Three Sources

The source determines the base owner, not every field that will be effective during a run:

- Managed-script level means that the base can be shared by multiple accounts. It does not guarantee identical final runtime configurations.
- Account level isolates the base per account. It does not prevent that account from using an overlay.
- Native means that MAS uses the external script's existing configuration as base and does not mirror or maintain a parallel model.

Shared configuration therefore does not mean that changing one file always produces the same runtime result for every account. An account with an enabled overlay still uses its own override fields for that run.

## Overlay Layer

The overlay is the task-time configuration enabled in the user-facing UI as **Override Standard Configuration**. It contains the standard task fields exposed by MAS and temporarily overrides matching base fields when the task starts.

The overlay must follow these rules:

- **Higher precedence**: when a field exists in both layers, the overlay value wins.
- **No source conversion**: enabling or disabling Override Standard Configuration does not convert Managed-script level, Account level, or Native into another source.
- **Per-account scope**: an overlay belongs to the account's task settings and does not spread to other accounts under the same managed script.
- **Restoration**: save the base before applying the temporary override and restore it afterwards. Success, failure, cancellation, timeout, exceptions, and process crashes must all be covered.
- **Limited fields**: the overlay only covers standard task fields explicitly exposed by MAS; it does not replace the external script's full configuration.

The layers compose as follows:

| Base source | Override Standard Configuration off | Override Standard Configuration on |
| --- | --- | --- |
| Managed-script level (shared configuration) | Use the shared base | Shared base + the current account's overlay |
| Account level (independent configuration) | Use the independent base | Independent base + the current account's overlay |
| Native | Use the external script's native configuration | Native configuration + MAS standard-field overrides |

“Override” is temporary for the task run and must not be implemented as a permanent write to base. Only a deliberate save in the external script's own configuration UI belongs to the native base.

## Resolution Flow

Resolve an account's configuration in this order:

1. Select the base source: Managed-script level, Account level, or Native.
2. If Override Standard Configuration is enabled, read the account's overlay fields.
3. Merge overlay fields into base by field, with overlay taking precedence.
4. Start the task with the merged configuration.
5. Restore any temporarily modified base files and clear the run's overlay state when the task ends.

Every new adapter must identify whether each field belongs to base or overlay and must identify its disk owner. Runtime-only fields must not be persisted into base, and an account overlay must never contaminate another account under the same managed script.

## Adapter Boundaries

The current implementations have these exceptions. The presence of a field does not establish support for all three sources or for configuration overrides:

| Adapter | Actual behavior |
| --- | --- |
| MFW and its flavors | Tasks come from the account page's task snapshot. Runs do not consume `Info.Base` or `Info.IfQuickConfig`. |
| General | Native uses the external script's configuration; other sources use the current account's `ConfigFile`. The legacy `shared` value behaves like `independent`, does not read a shared `Default`, and does not consume the override switch. |
| BetterGI | The UI offers independent and native configuration. The legacy `shared` value uses the current account's independent configuration, without sharing between accounts. |
| HSR | The base comes from shared plans, account plans, or upstream native configuration. There is no per-account `ConfigFile` copy, and runs do not consume `Info.IfQuickConfig`. |
| BAAH | Runs use the file bound by the account's `Info.ConfigName`, not `Info.Base` or `Info.IfQuickConfig`. Managed emulator settings, stage plans, and event priority have separate rules; a source value does not guarantee that configuration files stay unchanged. |
| Whimbox | Both `shared` and `independent` currently use this account's page settings; they do not establish sharing between accounts. With `native`, enabling overrides temporarily writes the panel's values and restores them afterwards. |

## The zzz-od Model

zzz-od uses one managed script with multiple accounts. A MAS account binds to an upstream instance slot. The native configuration tree contains both per-slot configuration and content shared across slots.

Therefore:

- The UI offers independent and native sources. The legacy `shared` value uses account fields and the bound slot; it does not establish a shared base between accounts.
- MAS configuration backups are bucketed by the bound slot, rather than by the ordinary per-account directory layout.
- Runs do not consume `Info.IfQuickConfig`; native runs do not inject MAS task overrides. A shared physical directory does not imply a shared base configuration.

## Terminology

Use these terms consistently:

- `base`: Base layer; describe it to users as base configuration.
- `overlay`: Overlay layer; expose it to users as “Override Standard Configuration”.
- Managed script and Account.
- Base sources: Managed-script level (shared configuration), Account level (independent configuration), and Native.

The words “script” and “user” remain valid in ordinary contexts, such as “external script configuration” or “credentials entered by the user”. They must not be used as names for the MAS entities or base sources above.

## Related Discussion

- [AUTO-MAS#879](https://github.com/AUTO-MAS-Project/AUTO-MAS/issues/879): configuration semantics and terminology
