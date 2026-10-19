# Configuration Management

The configuration framework lives in `app/config/`. Configuration is declared
with Pydantic models and supports staging, transactional workspaces, signals,
business locks, and YAML persistence. The application entry point is
`Config`, exported by `app/core/config.py`.

This page documents the framework itself. Shared script configuration, account
overrides, and runtime restoration are business semantics; see
[Configuration Semantics](./config-semantics.md). Business overlays organize
values for different accounts, while a transaction workspace holds pending
state until it is committed.

## 1. Ownership and Structure

- `app/config/core/`: nodes, fields, groups, collections, transaction
  management, and staging operations.
- `app/config/fields/`, `types.py`, and `shortcuts.py`: references,
  encryption, UI metadata, legacy-field compatibility, and standard field
  types.
- `app/config/signals.py`: field and collection events.
- `app/config/wire.py`: API input/output contracts derived from configuration
  models and collection index schemas.
- `app/models/config/`: business configuration classes and their single source
  of truth for fields, defaults, and validation rules.
- `app/core/config.py`: configuration facade, startup order, and orchestration.
- `app/core/config_upgrade.py`: one-time JSON-to-YAML upgrade at startup.
- `app/models/schema.py`: shared cross-module API contracts. Endpoint-specific
  request and response models belong at the top level of their `app/api/`
  module.

The three basic models have distinct responsibilities:

- `ConfigGroup` is a typed group of fields, such as `Info.Name` and
  `Run.Enabled`.
- `ConfigEntry` is a configuration object containing groups and possibly
  nested collections.
- `ConfigCollection[TEntry]` is an ordered collection with UUIDs and a type
  index.

Entries and collections both inherit from `ConfigNode`, which provides shared
identity, lifecycle, workspace, locking, and signal behavior. `app.config`
exports the public types used by business code; methods beginning with an
underscore are framework internals.

### Minimal Complete Example

The following example builds, activates, changes, and saves a file-backed
configuration object. `file=` registers its persistence target, and `flush()`
writes the configuration to `config/example.yaml` under the current directory.

```python
import asyncio
from pathlib import Path

from pydantic import Field

from app.config import ConfigEntry, ConfigGroup, config_manager


class ExampleConfig(ConfigEntry):
    """Example configuration."""

    class InfoFields(ConfigGroup):
        Name: str = Field(default="Default name", description="Display name")
        Enabled: bool = Field(default=True, description="Whether it is enabled")

    Info: InfoFields = Field(default_factory=InfoFields)


async def main() -> None:
    config = ExampleConfig.build(file=Path("config/example.yaml"))
    await config.activate()

    config.Info.Name = "New name"
    await config.commit()
    assert config.Info.Name == "New name"

    await config_manager.flush()
    config_manager.unregister_root(config)


if __name__ == "__main__":
    asyncio.run(main())
```

## 2. Defining Configuration Classes

### Groups, Fields, and Defaults

Groups inherit from `ConfigGroup`, and configuration objects inherit from
`ConfigEntry`. Type annotations define field types; `Field` declares defaults
and descriptions. Use `default_factory` so groups and mutable values are
created independently for each instance.

```python
from typing import Annotated, Literal

from pydantic import Field

from app.config import ConfigEntry, ConfigGroup


class TaskConfig(ConfigEntry):
    """Task configuration."""

    class RunFields(ConfigGroup):
        Mode: Literal["normal", "silent"] = Field(
            default="normal", description="Run mode"
        )
        RetryCount: Annotated[int, Field(ge=0, le=10)] = Field(
            default=3, description="Number of retries after failure"
        )
        Tasks: list[str] = Field(default_factory=list, description="Task list")

    Run: RunFields = Field(default_factory=RunFields)
```

Pydantic types, `Literal`, enums, and `Field` constraints provide basic
validation. A normal constraint failure raises a validation error; for
example, `Field(ge=0)` rejects negative values. Reusable correction behavior
is packaged as standard `Annotated` types and participates in the same
validation chain.

Use Pydantic submodels for fixed structures and typed dictionaries for open
mappings. A mapping may omit keys that business code creates when needed.
These declarations preserve the different validation guarantees of fixed and
open structures.

### Nested Collections

Use `collection()` to declare a nested collection. The generic argument
provides the static member type, while the function arguments register the
concrete types that may be loaded:

```python
from pydantic import Field

from app.config import ConfigCollection, ConfigEntry, ConfigGroup, collection


class AccountConfig(ConfigEntry):
    class InfoFields(ConfigGroup):
        Name: str = Field(default="Default account", description="Account name")

    Info: InfoFields = Field(default_factory=InfoFields)


class ProjectConfig(ConfigEntry):
    Accounts: ConfigCollection[AccountConfig] = collection(AccountConfig)
```

The framework establishes parent-child relationships and persists nested
collections with their root. The root owns the file association. After
construction, register a nested collection as a named reference target with
`config_manager.register_collection(name, collection)`.

### Inheritance, Type Hints, and Runtime State

Configuration classes support inheritance. A subclass may override groups or
collections to create a distinct business configuration type. Narrowing a
mutable attribute can produce an incompatible override diagnostic; an exact,
documented exemption is appropriate only where runtime behavior has been
verified.

`ConfigEntry.build()` and `ConfigCollection.build()` accept runtime construction
arguments such as `parent`, `uid`, `payload`, and `file`. A Pydantic plugin may
show a subclass constructor containing only model fields, so `build()` is the
complete, type-checkable construction entry point.

Mark ordinary class constants as `ClassVar`. Use Pydantic `PrivateAttr` for
instance-only runtime state. Task handles, staging queues, lock tickets, and
service instances are not persisted. Hot writes enter through whole-field
assignment and public collection operations, which connect changes to staging,
validation, signals, and transactions.

## 3. Declarative Field Features

### Paths

Path values in memory are `Path | None`. Standard types include:

- `FilePath`: an existing file, subject to the standard blocked-directory rules.
- `FolderPath`: an existing directory, subject to the same rules.
- `ScriptRootPath`: an existing script directory; the application working
  directory is allowed and other system-directory boundaries apply.
- `ExecutablePath`: an existing `exe`, `bat`, `cmd`, or `com` file.
- `LoosePath`: a file or directory that may not exist; only normalization is
  performed.

`path_policy()` combines path kind, extensions, existence, and blocked
directories:

```python
from pathlib import Path
from typing import Annotated

from pydantic import Field

from app.config import ConfigGroup, STANDARD_BLOCKED_DIRS, path_policy


class LaunchFields(ConfigGroup):
    Program: Annotated[
        Path | None,
        path_policy(
            kind="file",
            extensions=("exe", "cmd"),
            must_exist=True,
            blocked_dirs=STANDARD_BLOCKED_DIRS,
        ),
    ] = Field(default=None, description="Program to launch")
```

`kind` is `"file"`, `"folder"`, or `"any"`. `extensions` accepts concrete
extensions such as `"exe"`, `".exe"`, and `"tar.gz"`; they are normalized,
case-insensitively deduplicated, and may not contain wildcards. A non-empty
extension list on a folder policy is a declaration error. When `must_exist` is
true, an invalid path becomes `None`; otherwise a valid future path is kept.
`blocked_dirs` accepts strings, `Path` objects, or `PathBlockPreset` values.

Normalization trims whitespace, expands environment variables and user
directories, makes paths absolute, resolves links, and handles Windows `.lnk`
shortcuts. Failed or cyclic shortcut resolution clears the value. Removing a
trailing version-like suffix is attempted only for an existing directory rule
and only when the corrected directory actually matches the policy.

For `kind="any"` with `must_exist=False`, extensions constrain paths that can
be identified as files. `kind="file"` explicitly identifies the path as a file,
including a file that has not yet been created. The same declaration derives
UI hints such as `path_kind`, `path_extensions`, and `path_must_exist`; backend
blocked-directory enforcement remains authoritative.

### Date and Time

Date/time fields store complete `datetime` values. `ConfigGroup` normalizes
them to UTC during Pydantic validation, using the same rule for cold
construction, defaults, and hot commits:

1. A timezone-aware input is converted to UTC without changing its instant.
2. A naive input is interpreted directly as UTC; no server timezone is guessed.
3. Attribute reads convert the value through the field's `tz(...)` preset.
4. Serialization exports the stored UTC value directly and does not re-read the
   field or invoke the timezone preset.

`tz()` accepts a fixed-offset `datetime.timezone` or a synchronous read-only
function that receives the group and returns one. Without `tz()`, reads use
UTC+8. The current implementation supports fixed offsets; daylight-saving
transitions, date changes, and long-lived UI offset refresh remain documented
TODO boundaries.

### Encryption and Other Standard Types

Declare sensitive strings as `Annotated[str, encrypted()]`. Property reads
return plaintext; persistence stores ciphertext, while API and migration
exports select plaintext or ciphertext by audience. UI masking and encryption
are independent features.

```python
from typing import Annotated

from pydantic import Field

from app.config import ConfigGroup, encrypted


class CredentialFields(ConfigGroup):
    Token: Annotated[str, encrypted()] = Field(
        default="", description="Access credential"
    )
```

Encryption supports decryption by multiple users on the same device, so
ciphertext portability is device-scoped. If decryption fails, the original
content is retained and the frontend decides how to notify the user. The
framework only decrypts fields marked with `encrypted()`; business-specific
ciphertext formats are handled by their owning business code.

Other standard string types include `WindowsNameString`, `UrlString`,
`JsonDictString`, `JsonListString`, `KeyboardKeyString`, `CliArgumentString`,
and `CliArgumentListString`. JSON string types remain strings, invalid URLs are
cleared, and keyboard keys are lowercased. An invalid key falls back through
Pydantic's default-value mechanism to the valid default declared by `Field`.

### Reference Fields

Reference fields store a UUID or an explicitly allowed special string and find
the target through a registered logical collection name:

```python
from typing import Annotated
from uuid import UUID

from pydantic import Field

from app.config import ConfigGroup, RefDeleteAction, ref


class RelationFields(ConfigGroup):
    AccountId: Annotated[
        UUID | str,
        ref(
            "example_accounts",
            default="-",
            allow_values=("-",),
            display_field="Info.Name",
            on_delete=RefDeleteAction.SET_DEFAULT,
        ),
    ] = Field(default="-", description="Related account")
```

Cold validation does not query collections. Activation and hot writes validate
the target and fall back to `default` when it is missing or has the wrong
type. `entry_types=(SomeEntry,)` restricts target types with `isinstance`, so
subclasses are accepted.

Target deletion, `reload_type`, and `replace_type` all revalidate references.
Invalid references use the declared policy: `SET_DEFAULT` restores the
default, `RESTRICT` rejects the operation, `CASCADE` removes the referencing
member, and `CUSTOM` invokes the callback or method named by
`on_delete_callback`. The operation and resulting reference changes share one
transaction.

`display_field="Info.Name"` means that choices use UUIDs while their display
text is read from the target member. Collection and type restrictions produce
UI choice metadata; the frontend owns the actual editor.

### Virtual Fields, Triggers, and UI

`Virtual[T]` is a computed, read-only field paired with a synchronous
`@virtual_field("Group.Field")` method on the entry. It is not persisted.
`Trigger[bool]` and `Trigger[Literal[...]]` pair with `@trigger_field(...)` as
action inputs. A boolean trigger runs when set to `True` and is idle at
`False`; a literal trigger is idle at `None`.

Trigger assignment dispatches immediately and is independent of ordinary
field staging. Async handlers run as separate tasks and have independent
completion and rollback boundaries; `commit()` waits only for its own chain.
Ordinary signal callbacks remain in the same task and transaction as the field
change.

`ui()` describes components, formats, choices, and visibility. `select()` can
add choice sources and ordering semantics. `UiVisibility` has four values:
`SHOW` displays and updates normally; `HIDE` omits the field from API output
and default updates; `DISABLE` allows output but rejects default updates; and
`MASKED` returns `UI_MASKED_VALUE`, accepts a new value, and treats the
placeholder on input as “keep the old value”.

Visibility may be static or computed by a synchronous read-only
`@ui_visibility("Group.Field")` method. Group visibility applies to child
fields; when all children are hidden, the JSON API hides the group. `MASKED`
is field-only and is invalid at group scope. Visibility controls API exposure
and default update scope, while encryption remains independently declared by
`encrypted()`. `check_visibility=False` is the internal escape hatch for
updating hidden fields.

### Legacy Field Compatibility

Declare moved or renamed fields with `legacy(group="Info", name="Mode",
convert=...)`. The optional converter runs before the target field's
validation. An explicitly supplied target field, including an explicit `None`,
takes precedence over the legacy value. The same mapping is applied while
preparing cold input and activating payloads; historical collection structure,
time semantics, and database versions belong to the startup upgrade process.

## 4. Cold State, Activation, and Startup

Construction and `model_validate()` create cold, inactive objects. Cold
assignment updates only Pydantic data. Runtime transactions, signals,
autosave, and reference existence checks run during hot activation. Request
validation uses cold or contract models and is separate from activation.

`build(payload=...)` retains the raw payload for activation, while ordinary
reads expose current cold values. `model_validate({...})` immediately fills
provided model fields and is suitable for validated cold update objects.

`await node.activate()` selects an explicit payload, the associated file, or
current cold values; enters `INITIALIZING`; applies fields and members in
isolated Init operations; activates nested collections and reference
subscriptions; and finally becomes `ACTIVE`. Activation is one-shot and
repeated activation raises. Hot assignments stage changes and require
`await commit()`.

Initialization keeps successful fields and members, aggregates failures, and
raises `ConfigAggregateError`. A root activation commits successful work to
live before raising. When activation is inside a parent transaction, successful
Init work joins that parent and can be rolled back with it.

`file=` belongs on root nodes and accepts `.yaml` and `.yml`; `payload` and
`file` are mutually exclusive. Startup registers reference targets, activates
target members, then activates dependents. `app/core/config.py` coordinates the
full process and starts services after configuration is ready. With
`regenerate_uuids=True`, collection members receive new UUIDs recursively;
reference conversion for copied structures is the caller's responsibility.

## 5. Transactions

A hot field assignment stages an operation for the current executor but does
not change the live value. `commit()` obtains the global execution gate and
node lock, creates a transaction when needed, applies and validates operations
in a workspace, dispatches signals, and merges the workspace into live state.
Direct calls and awaits in ordinary callbacks remain in the same task and
transaction; associated-node changes receive their own workspaces.

`async with config_manager.transaction()` reuses a transaction nested in the
same task; it does not create a savepoint. Inner `commit()` means only that the
operation was applied to the workspace. An exception escaping the outermost
transaction rolls back all associated configuration changes. Notifications,
device actions, database writes, and external file changes are external side
effects and are not rolled back.

Workspace reads require both the lifecycle and the real executor identity.
Having the same `ContextVar` is not enough. Reads prefer a valid Init
workspace, then a valid ordinary workspace, then live state. `node.effective`
returns the effective node for the current context. `node.model_dump()` on the
original live object exports live storage; `node.effective.model_dump()` may
export pending workspace content.

The global gate serializes commits, explicit transactions, autosave, and
`flush()`, with lock order global gate then node lock. Independent
`asyncio.create_task()` calls have separate transaction identities, read live
state, and queue for the gate. A child task must not be awaited while its
parent holds the gate and waits for the child to commit.

Staging queues are isolated by real executor and ordinary/Init scope. They
remain on live nodes and are neither persisted nor transferred. Cancellation
removes queued ownership or returns unexecuted operations to their queues;
business writes are not retried automatically. Uncommitted queues are reported
and cleaned according to their scope when callbacks, transactions, or tasks
finish.

## 6. Business Locks and Task Execution

The global gate queues configuration operations, node locks serialize batches
on one node, and business locks control writable scope during a task.
`lock_s(cascade=True)` provides a shareable lock that excludes X and rejects
hot writes in its scope. `lock_x(cascade=True)` is exclusive and permits
writes from the holder's token context. `try_lock_x()` returns `None` on
conflict, and `unlock()` requires the original `LockTicket` on its issuing node.

Locks cover descendants by default; `cascade=False` covers only the node.
Acquisition prechecks the complete scope and leaves all nodes unchanged on
conflict. An X token may be inherited by a child task, but transaction
participation still checks the real task identity.

```python
async def run_with_config(config: ExampleConfig) -> None:
    ticket = await config.lock_x()
    try:
        config.Info.Enabled = False
        await config.commit()
    finally:
        await config.unlock(ticket)
```

The business lock may cover the whole task while each commit has its own
transaction boundary. Structural operations such as deletion and type
replacement have additional preconditions beyond X write permission.

## 7. Signals and Related Changes

`SomeEntry.connect(...)` subscribes to events for that concrete type;
`entry.connect(...)` subscribes to one instance. Filters include `phase`,
`kind`, `group`, and `field`; collection events do not support group or field.
The default phase is `runtime`; initialization uses `init`. `kind="set"` also
matches `init_set` when combined with the Init phase.

```python
def on_name_changed(sender: object, event: FieldChangeEvent) -> None:
    assert event.group == "Info"
    assert event.field == "Name"


ExampleConfig.connect(on_name_changed, group="Info", field="Name", kind="set")
ExampleConfig.disconnect(on_name_changed, group="Info", field="Name", kind="set")
```

Public subscriptions use weak references and last as long as the receiver.
`FieldChangeEvent` includes `node`, `group`, `field`, `value`, and `old_value`;
collection events include the collection, UUID, entry, order, or type data.
Runtime equal-value field assignments do not emit duplicate events, while Init
always emits initialization events.

Signal callbacks run in the same task and may stage related changes. The
framework mirrors the relevant workspace, subscriptions, and receiver
wrappers, so callback changes participate in the same rollback boundary.
Foreign `asyncio.create_task()` work is independent and is not silently
included. Blinker does not expose a complete public subscription enumeration;
the framework maintains its own compatible receiver index.

## 8. Persistence, Errors, and Memory Export

`config_manager` persists registered roots and their associated files. Nested
collections and members are saved with their root. Successful transactions
register a debounced save request (about 50 ms); a single executor performs a
stable full scan, skips inactive roots, and atomically replaces each file.
There is no cross-file atomic commit, and a failed write does not roll back
committed memory.

Roots fail independently. I/O failures retry after 1, 2, 4, 8, and 16 seconds;
export and serialization failures retry only when the root changes or
`flush()` is called. `persistence_errors` exposes a read-only snapshot with
root UUID, path, phase, error type, retry count, and next retry time. First
failure, exhaustion, and recovery are logged; no HTTP or frontend error is
added automatically.

`await config_manager.flush()` skips debouncing, attempts all saveable roots,
and raises one `ConfigAggregateError` for that call's failures. Call it
outside a transaction. Autosave and `flush()` share the same serialized
implementation.

`model_dump()` defaults to JSON mode and the API audience. `ExportContext`
selects audiences:

- `api`: API-visible fields, response values, UI visibility, and masking.
- `persist`: complete persisted fields and ciphertext, excluding virtual
  fields and triggers.
- `export`: complete persisted fields and plaintext, excluding virtual fields
  and triggers.

`await node.to_dict()` requires an active, non-deleted node and uses the
persistence audience. `mode="python"` preserves native types and skips JSON
response injection and UI trimming. `await config_manager.export(target)`
accepts a directory, exports stable plaintext YAML for active registered
roots, and preserves relative file layout. It is independent of `flush()` and
rejects calls from a transaction or an output directory that overwrites active
configuration files. Plaintext exports may contain credentials.

`unregister_root(node)` removes file registration and failure state. Reference
pool registration is independent, so removing file registration does not
remove a still-registered collection.

## 9. Configuration Operations and API Contracts

For mutable fields, copy, modify, assign the whole new value, and commit:

```python
async def append_task(config: TaskConfig, name: str) -> None:
    tasks = [*config.Run.Tasks, name]
    config.Run.Tasks = tasks
    await config.commit()
```

In-place list, dictionary, or nested-object mutations bypass field assignment,
validation, locks, signals, staging, and rollback. Deep mutable-value
isolation remains a documented TODO; the supported transactional operation is
whole-field assignment.

`await target.update(other)` accepts a cold object of the same concrete
`Entry` type, submits only fields in `model_fields_set`, skips virtual fields,
checks visibility by default, and commits automatically. It does not update
nested collections or make the entire request an implicit atomic transaction.
Collection structure uses explicit methods followed by `await collection.commit()`:
`add`, `remove`, `set_order`, `add_type`, `remove_type`, `reload_type`, and
`replace_type`. Replacement retains UUID and order while the old instance is
soft-deleted and the new instance receives independent subscriptions.

`app.config.wire` derives cached pure-Pydantic `ConfigInput[ConfigType]` and
`ConfigPayload[ConfigType]` contracts. Omitted fields mean “do not change”;
explicit `null` is validated by the target field. Use
`model_dump(exclude_unset=True)` to preserve this distinction. The generated
response shape recursively includes groups and collections, where a collection
is represented as `{"order": [{"uid": "...", "type": "..."}], "data": {...}}`.
Runtime state is excluded. OpenAPI and frontend clients consume these derived
contracts and field metadata.

## 10. One-Time Configuration Upgrade

Runtime configuration uses YAML. Before services start, historical JSON files
undergo database-version upgrades, specialized preprocessing, structure
conversion, dependency-ordered activation, and verified saving:

- `Config.json` -> `setting.yaml`
- `ScriptConfig.json` -> `scripts.yaml`
- `PlanConfig.json` -> `plans.yaml`
- `QueueConfig.json` -> `queues.yaml`
- `EmulatorConfig.json` -> `emulators.yaml`
- `ToolsConfig.json` -> `tools.yaml`
- `GameSignAccounts.json` -> `game_sign_accounts.yaml`

The upgrade preserves UUIDs, types, order, references, credentials, and nested
users, webhooks, queues, and time fields. Historical naive date/time values
are interpreted using their original business timezone before conversion to
UTC; runtime naive values are interpreted as UTC.

Original files are retained under `config/legacy-json/`. The
`.config-migration-v2.json` record tracks ownership and progress, uses
temporary writes and validation, and supports interrupted retries. Ambiguous
existing YAML reports a conflict rather than being silently overwritten or
merged. The version advances from `v1.11` to `v2.0` only after migration,
activation, and saving succeed; failure stops startup at the last checkpoint.
After migration, YAML is the source of truth and JSON remains archive data.

## 11. Verification Scope

Isolation tests cover field declarations, transactions, persistence, and API
contracts:

1. Groups and mutable defaults are independent per instance and validated.
2. Paths honor existence and directory boundaries; dates store UTC; sensitive
   values serialize by audience.
3. Cold validation is separate from activation and persistence; omitted fields
   differ from explicit nulls.
4. Whole-field and collection staging is isolated by executor and scope.
5. Per-operation and explicit transaction rollback boundaries are preserved.
6. Shared locks reject hot writes, while X-token contexts can commit.
7. Signal and reference behavior remains valid across workspaces and type
   changes.
8. Debounced persistence, independent retries, and `flush()` are serialized.
9. Memory export reads stable live state and uses manager-defined layout.
10. Legacy declarations, resumable file upgrades, and derived API contracts
    remain compatible.

Tests use isolated temporary files and device/notification substitutes; real
user configuration and external services are outside this verification scope.
