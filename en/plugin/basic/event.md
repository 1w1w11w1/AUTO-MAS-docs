# Event System

The event system is an important part of the MAS plugin system. Without the event system, there would be no practical plugin system.

This document explains the structure and usage of the MAS event system and helps you quickly write a plugin that uses events.

This page retains historical protocol names such as `task.*`, `script.*`, and `script_id`. Here, `script.*` describes an account run. The current interface calls its management entities “managed scripts” and “accounts”; keep event names and payload fields unchanged.

## Event Model

### Event Object Structure

A standard event object contains the following structure, which we call the **payload**.

*The following uses `task.start` as an example. The `data` field is incomplete.*

```json
{
  "event": "task.start",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:23:45+08:00",
  "data": {
    "task_id": "task-001"
  }
}
```

Field layers:

- Metadata layer (top level): `event`, `event_version`, `source`, `timestamp`.
- Business data layer (`data`): business fields that vary by event type.

### Key Differences Between task.* and script.*

`task.*` events usually place task fields inside `data`. `script.*` events promote account-run context fields to the top level.

`task.start` example, where task fields are mainly inside `data`:

```json
{
  "event": "task.start",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:23:45+08:00",
  "data": {
    "task_id": "task-001",
    "mode": "AutoProxy",
    "queue_id": "queue-001"
  }
}
```

`script.exit` example, where account-run fields are promoted to the top level:

```json
{
  "event": "script.exit",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:23:59+08:00",
  "task_id": "task-001",
  "script_id": "script-001",
  "script_name": "Daily task",
  "mode": "AutoProxy",
  "status": "completed",
  "error": null,
  "result": "script.success",
  "data": {
    "queue_id": "queue-001",
    "queue_name": "Daily polling"
  }
}
```

Conclusion:

- `task.*`: important fields are generally read from `data`, such as `data.task_id` and `data.mode`.
- `script.*`: important fields are generally read from the top level, such as `task_id`, `script_id`, `script_name`, and `result`.

Development recommendations:

- When handling `task.*`, read fields such as `task_id` from `payload["data"]` first.
- When handling `script.*`, read `task_id`, `script_id`, `script_name`, and `result` from the top level first.

## Standard System Events

### Task Events

- `task.start`: task started.
- `task.progress`: task progress snapshot.
- `task.log`: snapshot of the script log for the current account run.
- `task.exit`: task ended.

### Script Events

- `script.start`: account run started.
- `script.success`: account run completed successfully.
- `script.error`: account run failed.
- `script.cancelled`: account run was manually cancelled.
- `script.exit`: account run ended. Listening to this event first is recommended.

::: tip What is the difference?

`task` and `script` are execution levels in the historical event protocol. A task can contain multiple account runs, each of which uses `script.*` events.

For example, an MAA managed script has two accounts. When a task runs those accounts in turn, each account run produces its own set of `script.*` events.

:::

## Event Listening

### Decorator Parameters

Example:

```python
from mas.plugins import on_event

@on_event("script.exit", scope="global", priority=0, once=False)
async def on_script_exit(payload, ctx):
    ...
```

Parameters:

- `event`: event name. It cannot be empty.
- `scope`: scope, either `global` or `instance`.
- `priority`: execution priority. Larger numbers run earlier.
- `once`: whether to automatically unbind after one trigger.
- `error_policy`: `continue` or `raise`; `None` means inheriting the event-level policy.

### Supported Handler Signatures

The loader injects context automatically. Use one of the following forms:

- `handler(payload)`
- `handler(payload, ctx)`
- `handler(payload, *, ctx=...)`

If the signature does not match, registration fails.

### Notes for Synchronous Listeners

The event bus runs synchronous functions in a thread. If you call `asyncio.create_task` directly inside a synchronous listener, a common error is `no running event loop`.

If you need to create asynchronous tasks, define the listener as `async def`.

## Scope, Priority, and Error Policy

### Scope Routing

- Events broadcast with `global` only match listeners with `scope=global`.
- Events broadcast with `instance` only match `scope=instance` listeners in the same instance.

Core events such as `task.*` and `script.*` are sent as `global` by default, so plugins usually need `scope="global"` when listening to core events.

### Execution Order

- Listeners are grouped by `priority` from high to low.
- Listeners with the same priority run concurrently.
- After the current priority group completes, the next group runs.

### Error Policy

- `continue`: log the exception and continue dispatching.
- `raise`: listener exceptions are raised upward and participate in dispatch exception aggregation.

Practical recommendation:

- Prefer catching exceptions inside plugins to avoid event-flow instability caused by policy or version differences.

## Payload Reading Patterns

### task.* Reading Pattern

```python
def read_task_payload(payload: dict) -> tuple[str, str]:
    # Optional type check
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        return "", ""
    
    task_id = str(data.get("task_id") or "").strip()
    mode = str(data.get("mode") or "").strip()
    return task_id, mode
```

### script.* Reading Pattern

```python
def read_script_payload(payload: dict) -> tuple[str, str, str]:
    if not isinstance(payload, dict):
        return "", "", ""
    script_name = str(payload.get("script_name") or "").strip()
    script_id = str(payload.get("script_id") or "").strip()
    result = str(payload.get("result") or "").strip()
    return script_name, script_id, result
```

## Minimal Implementation Template

```python
from typing import Any
from mas.plugins import on_event


class Plugin:
    def __init__(self, ctx):
        self.ctx = ctx
        self._seen: set[tuple[str, str, str]] = set()

    @on_event("script.exit", scope="global")
    async def on_script_exit(self, payload: Any, ctx) -> None:
        _ = ctx
        try:
            if not isinstance(payload, dict):
                return

            script_name = str(payload.get("script_name") or "").strip()
            task_id = str(payload.get("task_id") or "").strip()
            script_id = str(payload.get("script_id") or "").strip()
            result = str(payload.get("result") or "").strip()

            if not script_name:
                return

            key = (task_id, script_id, script_name)
            if key in self._seen:
                return
            self._seen.add(key)

            if result == "script.success":
                self.ctx.logger.info(f"script succeeded: {script_name}")
            elif result == "script.error":
                self.ctx.logger.warning(f"script failed: {script_name}")
            elif result == "script.cancelled":
                self.ctx.logger.info(f"script cancelled: {script_name}")

        except Exception as e:
            self.ctx.logger.warning(f"failed to handle script.exit: {type(e).__name__}: {e}")
```

## FAQ

### Listener Does Not Trigger

Possible causes:

- The event name is misspelled.
- The listener uses `scope="instance"`, but core events are sent as `global`.
- The function signature is invalid, causing registration to fail.

### Payload Fields Are Empty

Possible cause:

- Reading `task.*` as `script.*`, or the reverse.

## Event Examples

### task.start

```json
{
  "event": "task.start",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:23:45+08:00",
  "data": {
    "task_id": "task-001",
    "mode": "AutoProxy",
    "queue_id": "queue-001",
    "queue_name": "Daily polling",
    "script_total": 3,
    "scripts": [
      {
        "script_id": "script-001",
        "script_name": "Daily task",
        "status": "waiting"
      }
    ],
    "primary_script_id": null,
    "primary_script_name": null,
    "actions": {
      "stop_task": {
        "api": "/api/dispatch/stop",
        "method": "POST",
        "body": {
          "taskId": "task-001"
        }
      },
      "stop_all_tasks": {
        "api": "/api/dispatch/stop",
        "method": "POST",
        "body": {
          "taskId": "ALL"
        }
      }
    }
  }
}
```

### task.progress

```json
{
  "event": "task.progress",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:23:50+08:00",
  "data": {
    "task_id": "task-001",
    "mode": "AutoProxy",
    "queue_id": "queue-001",
    "queue_name": "Daily polling",
    "current_script_index": 0,
    "current_script_id": "script-001",
    "current_script_name": "Daily task",
    "script_total": 3,
    "script_completed": 1,
    "user_total": 12,
    "user_completed": 4,
    "current_script": {
      "script_id": "script-001",
      "script_name": "Daily task",
      "status": "running",
      "current_user_index": 1,
      "user_count": 4
    }
  }
}
```

### task.log

```json
{
  "event": "task.log",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:23:51+08:00",
  "data": {
    "task_id": "task-001",
    "mode": "AutoProxy",
    "queue_id": "queue-001",
    "queue_name": "Daily polling",
    "script_id": "script-001",
    "script_name": "Daily task",
    "script_status": "running",
    "current_script_index": 0,
    "log": "...full log...",
    "log_tail": "...tail log...",
    "log_length": 12345,
    "truncated_for_tail": true
  }
}
```

### task.exit

```json
{
  "event": "task.exit",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:24:20+08:00",
  "data": {
    "task_id": "task-001",
    "mode": "AutoProxy",
    "queue_id": "queue-001",
    "queue_name": "Daily polling",
    "scripts": [
      {
        "script_id": "script-001",
        "script_name": "Daily task",
        "status": "completed"
      }
    ],
    "final_script_id": "script-001",
    "final_script_name": "Daily task",
    "final_script_status": "completed",
    "result": "success",
    "error": null,
    "summary": "task summary..."
  }
}
```

### script.exit

```json
{
  "event": "script.exit",
  "event_version": "1",
  "source": "core.task_manager",
  "timestamp": "2026-03-22T01:23:59+08:00",
  "task_id": "task-001",
  "script_id": "script-001",
  "script_name": "Daily task",
  "mode": "AutoProxy",
  "status": "completed",
  "error": null,
  "result": "script.success",
  "data": {
    "queue_id": "queue-001",
    "queue_name": "Daily polling"
  }
}
```
