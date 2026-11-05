# Core Capabilities

When developing plugins, you inevitably need many core capabilities, such as logging, configuration management, event sending and receiving, cache management, and runtime execution.

This document explains how plugins obtain these capabilities through the context object, referred to as `ctx`, and gives a short introduction and minimal usage example for each capability.

## Context

### What is ctx?

`ctx` is the unified capability entry point at plugin runtime. After a plugin is instantiated, the host passes `ctx` to it. You can use it to access:

- `ctx.plugin_name` / `ctx.instance_id`: plugin and instance identifiers.
- `ctx.logger`: logging.
- `ctx.config`: configuration reading and writing.
- `ctx.event`: event listening and sending.
- `ctx.cache`: instance-level cache management.
- `ctx.runtime`: runtime detection and code execution.

::: tip More capabilities

This page covers the basic `ctx` capabilities. Continue reading the [event system](/en/plugin/basic/event) and other documents for more.

:::

### How ctx Is Injected

Typical flow:

1. The plugin loader builds `PluginContext`.
2. The loader calls `Plugin(ctx)` to create the plugin instance.
3. The plugin stores `self.ctx` in `__init__`, then uses it during lifecycle and event handling.

Minimal example:

```python
class Plugin:
    def __init__(self, ctx):
        self.ctx = ctx
        self.ctx.logger.info(f"plugin initialized: {ctx.plugin_name}")
```

## Basic Properties

### ctx.plugin_name

The current plugin name, also known as the logical name.

Usage:

```python
name = ctx.plugin_name
ctx.logger.info(f"plugin_name={name}")
```

### ctx.instance_id

The current plugin instance ID. In multi-instance scenarios, it is usually used to isolate cache, events, and state.

Usage:

```python
instance_id = ctx.instance_id
ctx.logger.info(f"instance_id={instance_id}")
```

## Logging

### ctx.logger

Plugin logging entry point. The host usually manages output, formatting, and persistence.

Common methods:

- `ctx.logger.debug(msg)`: debug information.
- `ctx.logger.info(msg)`: normal information.
- `ctx.logger.warning(msg)`: warning information.
- `ctx.logger.error(msg)`: error information.

Minimal usage:

```python
ctx.logger.debug("debug log")
ctx.logger.info("plugin started")
ctx.logger.warning("this is a warning")
ctx.logger.error("an error occurred")
```

Recommendations:

- Include `plugin_name` or a business key in logs to make cross-plugin troubleshooting easier.
- On error paths, record the exception type and key context whenever possible.

## Configuration

### ctx.config

Configuration proxy object. It is compatible with dictionary-style access and extends semantic methods such as `set`, `update`, and `reset`.

### ctx.config.get

Reads a configuration item and returns a default value when missing.

Usage:

```python
hello = ctx.config.get("hello", "world")
```

### ctx.config.set

Writes a single configuration item.

::: warning Should you use this method?

We do not recommend using `set` to dynamically modify configuration during plugin runtime, because this may make frontend display inconsistent with actual configuration.

That said, it is only a display consistency issue. If you want to store a timestamp, such as "last weekly task execution time", using it is reasonable.

:::

Usage:

```python
ctx.config.set("retry", 3)
ctx.config.set("feature_enabled", True)
```

Notes:

- `key` must be a non-empty string, or an exception is raised.

### ctx.config.update

Batch updates configuration items. It accepts a dictionary or keyword arguments.

Usage:

```python
ctx.config.update({"timeout": 10, "mode": "fast"})
ctx.config.update(timeout=15, mode="safe")
```

### ctx.config.reset

Resets the configuration source and rebuilds the current configuration.

Usage:

```python
snapshot = ctx.config.reset({"hello": "new-world"})
ctx.logger.info(f"config after reset: {snapshot}")
```

Notes:

- `reset(None)` resets to empty configuration. It does not mean "no change".

### ctx.config.to_dict

Returns a deep copy of the current configuration, suitable for read-only snapshots.

Usage:

```python
current_config = ctx.config.to_dict()
```

### ctx.config.source_dict

Returns a deep copy of the source configuration, useful for comparing current configuration with source configuration.

Usage:

```python
source_config = ctx.config.source_dict()
```

## Events

### ctx.event

Plugin event facade. It provides a unified interface for listening to, unregistering, and sending events.

### ctx.event.on

Registers an event listener and returns `listener_id`.

Usage:

```python
async def on_ping(payload):
    ctx.logger.info(f"received ping: {payload}")

listener_id = ctx.event.on(
    "demo.ping",
    on_ping,
    scope="global",
    priority=10,
    once=False,
)
```

Key parameters:

- `event`: event name.
- `handler`: handler function.
- `scope`: `global` or `instance`.
- `priority`: larger numbers run earlier.
- `once`: whether to automatically unbind after one trigger.
- `error_policy`: `continue` or `raise`; `None` means inheriting the event-level policy.

### @on_event (Recommended)

You can also import and use the `@on_event` decorator to quickly register an event listener.

```python
from mas.plugins import on_event

@on_event("script.exit", scope="global", priority=0, once=False)
async def on_script_exit(payload, ctx):
    ctx.logger.info(f"script.exit: {payload}")
```

### ctx.event.off

Unregisters a listener by `handler` or `listener_id`.

Usage:

```python
ctx.event.off("demo.ping", listener_id=listener_id)
```

### ctx.event.off_all

Unregisters all listeners registered by the current instance.

Usage:

```python
ctx.event.off_all()
```

### ctx.event.emit_async

Sends an event asynchronously. Prefer this in async flows.

Usage:

```python
await ctx.event.emit_async(
    "cache.test",
    {"key": "k1", "value": {"x": 1}},
    scope="instance",
    error_policy="continue",
)
```

### ctx.event.emit

Synchronous bridge for sending events. If an event loop exists, it creates a task and sends asynchronously. If no event loop exists, it creates one and runs it automatically.

Usage:

```python
ctx.event.emit("demo.ping", {"message": "hello"}, scope="global")
```

Recommendations:

- In async code, prefer `emit_async` and `await`.
- When strict ordering is required, do not rely on the background-task behavior of synchronous `emit`.

## Cache

Although it is called "cache", it can be persistent and provides full CRUD functionality.

### ctx.cache

Instance-level cache manager used to register and manage multiple cache spaces.

### ctx.cache.register

Registers a cache and returns the cache instance. The current backend supports only `json`.

Usage:

```python
cache = ctx.cache.register(
    cache_name="test_cache",
    backend="json",
    limit=10,
    limit_mode="count",
)
```

Key parameters:

- `cache_name`: cache name. Use a normalized English name.
- `backend`: backend type. Currently only `json` is supported.
- `limit`: threshold.
- `limit_mode`: `count` for item count or `bytes` for size.
- `limit_unit`: `b/kb/mb/gb`, only effective in `bytes` mode.

Common examples:

```python
# Limit by item count
cache_a = ctx.cache.register(
    cache_name="recent_users",
    backend="json",
    limit=100,
    limit_mode="count",
)

# Limit by size
cache_b = ctx.cache.register(
    cache_name="large_payload",
    backend="json",
    limit="10mb",
    limit_mode="bytes",
    limit_unit="mb",
)
```

When registering a cache with an existing name, parameters must match the first registration, or an exception is raised.

### ctx.cache.get_registered

Gets a registered cache instance. Returns `None` if it does not exist.

Usage:

```python
cache = ctx.cache.get_registered("test_cache")
if cache is None:
    cache = ctx.cache.register(
        cache_name="test_cache",
        backend="json",
        limit=10,
        limit_mode="count",
    )
```

### ctx.cache.list_registered

Lists all registered caches and their statistics for the current instance.

Usage:

```python
stats_map = ctx.cache.list_registered()
ctx.logger.info(f"registered caches: {stats_map}")
```

### ctx.cache.instance_cache_dir

Path to the current instance cache directory.

Usage:

```python
cache_dir = ctx.cache.instance_cache_dir
ctx.logger.info(f"cache directory: {cache_dir}")
```

### Cache Instance Methods

These methods are available on the object returned by `register`.

#### cache.set

Writes one key-value pair.

```python
cache.set("user:1", {"name": "Alice"})
```

#### cache.get

Reads a key-value pair. Returns the default value when missing.

```python
user = cache.get("user:1", default={})
```

#### cache.delete

Deletes a key and returns whether deletion succeeded.

```python
deleted = cache.delete("user:1")
```

#### cache.exists

Checks whether a key exists.

```python
exists = cache.exists("user:1")
```

#### cache.update

Writes multiple key-value pairs.

```python
cache.update({"k1": 1, "k2": 2})
```

#### cache.all

Gets all cache key-value pairs, excluding internal metadata.

```python
all_items = cache.all()
```

#### cache.clear

Clears the cache.

```python
cache.clear()
```

#### cache.stats

Returns cache statistics, including count, size, threshold, and path.

```python
stats = cache.stats()
ctx.logger.info(f"cache stats: {stats}")
```

## Runtime

::: warning

The methods listed here have been implemented, but more extensions are planned and may introduce breaking changes.

2026/4/19

:::

MAS allows plugins to configure a code interpreter so specific code can run in a specific virtual environment.

::: tip Use It Reasonably

Plugin developers should use a separate runtime for libraries that may break the main program.

For example, if you need a library that MAS already has but in a different version, a different Python version, or another large framework, consider an extra runtime.

:::

### ctx.runtime

Runtime facade providing environment detection, parameter settings, code execution, and related capabilities.

### ctx.runtime.info

Gets runtime information, such as the host interpreter, currently selected interpreter, and interpreter check results.

Usage:

```python
info = ctx.runtime.info()
ctx.logger.info(f"selected_python={info.get('selected_python')}")
```

### ctx.runtime.set

Updates runtime options, such as interpreter path and timeout settings.

Usage:

```python
runtime_config = ctx.runtime.set(
    python_executable="/usr/bin/python3",
    timeout_seconds=20,
)
ctx.logger.info(f"runtime config: {runtime_config}")
```

Notes:

- `timeout_seconds` maps to `python_timeout_seconds` in runtime configuration.

### ctx.runtime.run

Asynchronously executes a piece of Python code and returns the result.

Usage:

```python
result = await ctx.runtime.run(
    code="a=1; b=2; print(a+b)",
    timeout_seconds=5,
)

if result.get("ok"):
    ctx.logger.info(result.get("stdout", "").strip())
else:
    ctx.logger.error(result.get("stderr", "").strip())
```

Common return fields:

- `ok`: whether execution succeeded.
- `returncode`: process return code.
- `stdout`: standard output.
- `stderr`: standard error.
- `python`: interpreter path actually used.

### ctx.runtime.check_interpreter

Checks whether an interpreter is usable.

Usage:

```python
check = ctx.runtime.check_interpreter("/usr/bin/python3")
ctx.logger.info(f"interpreter ok={check.get('ok')}")
```

### ctx.runtime.list_scripts

Reads the `list_scripts` list exposed by the host. Returns an empty list if the host has not registered this capability. The method retains its historical name; the host's registered capability defines what each list item represents.

Usage:

```python
scripts = ctx.runtime.list_scripts()
```

### ctx.runtime.get_script_log

Reads an execution log by its historical `script_id` identifier. Returns an empty string if the host has not registered this capability.

Usage:

```python
log_text = ctx.runtime.get_script_log("script-001", limit=200)
```

## Sync and Async Boundaries

### Common Boundaries

- `ctx.runtime.run` is asynchronous and must be awaited in an async context.
- `ctx.event.emit_async` is asynchronous and should be preferred.
- `ctx.event.emit` is a synchronous bridge and does not guarantee strict blocking until sending completes.

### Notes for Synchronous Listeners

If a listener is a synchronous function and you need to create asynchronous tasks, change the listener to `async def` to avoid errors such as `no running event loop`.

## Minimal Implementation Template

```python
from typing import Any
from mas.plugins import on_event


class Plugin:
    def __init__(self, ctx):
        self.ctx = ctx
        self.cache = self.ctx.cache.register(
            cache_name="test_cache",
            backend="json",
            limit=10,
            limit_mode="count",
        )

    async def on_start(self) -> None:
        await self.ctx.event.emit_async(
            "demo.ping",
            {"message": "Hello from plugin"},
            scope="global",
        )

    @on_event("demo.ping", scope="global", priority=10)
    async def on_ping(self, payload: dict, ctx) -> None:
        ctx.logger.info(f"received demo.ping: {payload}")

    @on_event("cache.test", scope="instance")
    def on_cache_test(self, payload: dict, ctx) -> None:
        value = payload.get("value", {"k": "v"})
        self.cache.set("test_cache", value)
        ctx.logger.info(f"cache write succeeded: {self.cache.get('test_cache')}")

    @on_event("runtime.test", scope="instance")
    async def on_runtime_test(self, payload: Any, ctx) -> None:
        _ = payload
        result = await ctx.runtime.run(code="print(1+2)", timeout_seconds=5)
        if result.get("ok"):
            ctx.logger.info(f"run result: {result.get('stdout', '').strip()}")
        else:
            ctx.logger.error(f"run failed: {result.get('stderr', '').strip()}")
```

## FAQ

### cache.register reports inconsistent parameters

Possible cause:

- The same `cache_name` is reused in the same instance, but `limit` or `limit_mode` differs from the first registration.

Recommendation:

- Keep parameters consistent, or use a new `cache_name`.

### Event listener does not trigger

Possible causes:

- The event name is misspelled.
- Scope mismatch. For example, the event is sent as `global`, but the listener uses `instance`.
- The listener signature is invalid, causing registration to fail.

### runtime.run reports an error

Possible causes:

- It is called directly in a non-async context without `await`.
- The interpreter path is invalid.
- The timeout is too short.

### Configuration disappears after config.reset

Possible cause:

- `None` or an empty dictionary was passed in. This means "reset to empty configuration".

## Conclusion

The goal of `ctx` is to gather the most common plugin development capabilities into one object: logging, configuration, events, cache, and runtime.

Start with the minimal template in this document, then extend event and cache strategies according to your business needs.
