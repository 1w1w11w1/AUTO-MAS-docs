# Configuration Semantics

Adapters that manage a script's native configuration describe task configuration in two layers: the **base** and the **overlay**. During a task, the overlay overrides base fields to produce the effective configuration:


task_config = base ⊕ overlay

The `overlay` has higher precedence than `base`. Without an overlay, the task uses the base directly. The overlay exists only for the task run and does not change the base source. This page is the semantic contract for developers and documentation maintainers.

Availability of the three base sources and the regular-configuration override depends on each adapter's UI and implementation. MFW and its flavors use the user page's task snapshot directly and do not consume `Info.Base` or `Info.IfQuickConfig`; the configuration-switching workflow below does not apply to them. The configuration framework's transaction workspace is also distinct from this business overlay; see [Configuration Management](./config.md).

## Core Entities

### Managed

A **Managed** is the MAS-side entity used to control an external automation script. It owns the script path, launch arguments, and Managed-level configuration, and can contain multiple accounts.

### Account

An **Account** is a game-account entry under a Managed. It owns account-level configuration, credentials, and task settings. One Managed can contain multiple accounts.

Managed and Account describe MAS boundaries; they do not redefine the external script's object model. An adapter should preserve upstream concepts instead of renaming them merely to match MAS entities.

## Base Layer

The base is the main task configuration. It persists on disk across tasks and has exactly one of these three sources:

| Source | MAS level | Meaning | Base owner |
| --- | --- | --- | --- |
| **Managed level (shared configuration)** | Managed | Multiple accounts under one Managed share one base configuration | Managed |
| **Account level (independent configuration)** | Account | Each account has its own independent base configuration | Account |
| **Native** | No MAS level | The base comes directly from the external script; MAS does not maintain a parallel copy | External script |

Managed level and Account level are storage levels for base. Native is a third source alongside them, not another MAS level.

### Boundaries of the Three Sources

The source determines the base owner, not every field that will be effective during a run:

- Managed level means that the base can be shared by multiple accounts. It does not guarantee identical final runtime configurations.
- Account level isolates the base per account. It does not prevent that account from using an overlay.
- Native means that MAS uses the external script's existing configuration as base and does not mirror or maintain a parallel model.

Shared configuration therefore does not mean that changing one file always produces the same runtime result for every account. An account with an enabled overlay still uses its own override fields for that run.

## Overlay Layer

The overlay is the task-time configuration enabled in the user-facing UI as **Override Standard Configuration**. It contains the standard task fields exposed by MAS and temporarily overrides matching base fields when the task starts.

The overlay must follow these rules:

- **Higher precedence**: when a field exists in both layers, the overlay value wins.
- **No source conversion**: enabling or disabling Override Standard Configuration does not convert Managed level, Account level, or Native into another source.
- **Per-account scope**: an overlay belongs to the account's task settings and does not spread to other accounts under the same Managed.
- **Restoration**: save the base before applying the temporary override and restore it afterwards. Success, failure, cancellation, timeout, exceptions, and process crashes must all be covered.
- **Limited fields**: the overlay only covers standard task fields explicitly exposed by MAS; it does not replace the external script's full configuration.

The layers compose as follows:

| Base source | Override Standard Configuration off | Override Standard Configuration on |
| --- | --- | --- |
| Managed level (shared configuration) | Use the shared base | Shared base + the current account's overlay |
| Account level (independent configuration) | Use the independent base | Independent base + the current account's overlay |
| Native | Use the external script's native configuration | Native configuration + MAS standard-field overrides |

“Override” is temporary for the task run and must not be implemented as a permanent write to base. Only a deliberate save in the external script's own configuration UI belongs to the native base.

## Resolution Flow

Resolve an account's configuration in this order:

1. Select the base source: Managed level, Account level, or Native.
2. If Override Standard Configuration is enabled, read the account's overlay fields.
3. Merge overlay fields into base by field, with overlay taking precedence.
4. Start the task with the merged configuration.
5. Restore any temporarily modified base files and clear the run's overlay state when the task ends.

Every new adapter must identify whether each field belongs to base or overlay and must identify its disk owner. Runtime-only fields must not be persisted into base, and an account overlay must never contaminate another account under the same Managed.

## The zzz-od Model

zzz-od has a single-Managed, multiple-account structure. Its MAS account entry and upstream “instance” are not the same layer; the upstream instance corresponds to an account and is managed inside the native configuration.

Therefore:

- zzz-od account views may all be stored in the same Managed-level base configuration.
- The physical locations of Managed level, Account level, and Native cannot be assumed to match the ordinary adapter layout.
- An adapter for zzz-od must follow the upstream configuration model while preserving the MAS boundaries between Managed, Account, and overlay.

## Terminology

Use these terms consistently:

- `base`: Base layer; describe it to users as base configuration.
- `overlay`: Overlay layer; expose it to users as “Override Standard Configuration”.
- `Managed` and `Account`.
- Base sources: Managed level (shared configuration), Account level (independent configuration), and Native.

The words “script” and “user” remain valid in ordinary contexts, such as “external script configuration” or “credentials entered by the user”. They must not be used as names for the MAS entities or base sources above.

## Related Discussion

- [AUTO-MAS#879](https://github.com/AUTO-MAS-Project/AUTO-MAS/issues/879): configuration semantics and terminology
