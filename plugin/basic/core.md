# 核心功能

当在开发插件时，不可避免地需要使用大量核心能力，比如日志系统、配置管理、事件收发、缓存和运行时执行。

本文将介绍如何使用上下文（context，下称 ctx）让插件获得这些能力，并给出每个能力的简介与最小可用用法。

## 上下文

### ctx 是什么

ctx 是插件运行时的统一能力入口。插件实例化后，宿主会把 ctx 传给插件，你可以通过它访问：

- `ctx.plugin_name` / `ctx.instance_id`：插件与实例标识。
- `ctx.logger`：日志能力。
- `ctx.config`：配置读写能力。
- `ctx.event`：事件监听与发送能力。
- `ctx.cache`：实例级缓存管理能力。
- `ctx.runtime`：运行时探测与代码执行能力。

::: tip 还有更多

此处列举了基础ctx，更多请继续查阅[事件系统](../basic/event) **等**文档

:::

### ctx 如何注入到插件

典型流程：

1. 插件加载器构建 `PluginContext`。
2. 加载器调用 `Plugin(ctx)` 创建插件实例。
3. 插件在 `__init__` 中保存 `self.ctx`，后续生命周期和事件处理阶段可直接使用。

最小示例：

```python
class Plugin:
	def __init__(self, ctx):
		self.ctx = ctx
		self.ctx.logger.info(f"插件已初始化: {ctx.plugin_name}")
```

## 基础属性

### ctx.plugin_name

当前插件名（逻辑名）。

用法：

```python
name = ctx.plugin_name
ctx.logger.info(f"plugin_name={name}")
```

### ctx.instance_id

当前插件实例 ID。多实例场景下通常用于隔离缓存、事件、状态。

用法：

```python
instance_id = ctx.instance_id
ctx.logger.info(f"instance_id={instance_id}")
```

## 日志能力

### ctx.logger

插件日志入口，通常由宿主统一接管输出、格式和持久化。

常用方法：

- `ctx.logger.debug(msg)`：调试信息。
- `ctx.logger.info(msg)`：常规信息。
- `ctx.logger.warning(msg)`：告警信息。
- `ctx.logger.error(msg)`：错误信息。

最小用法：

```python
ctx.logger.debug("调试日志")
ctx.logger.info("插件开始执行")
ctx.logger.warning("这是一个告警")
ctx.logger.error("发生错误")
```

实践建议：

- 日志中带上 `plugin_name` 或业务主键，便于跨插件排查。
- 错误路径尽量记录异常类型和关键上下文。

## 配置能力

### ctx.config

配置代理对象，兼容字典访问，并扩展了 `set/update/reset` 等语义化方法。

### ctx.config.get

读取配置项，未命中时返回默认值。

用法：

```python
hello = ctx.config.get("hello", "world")
```

### ctx.config.set

写入单个配置项。

::: warning 你会用到这个方法吗？

我们不推荐使用set的方式在插件运行时动态的修改配置项，因为这可能导致前端显示的配置不一致。

不过那也就是个显示的问题而已，如果你想存储时间戳，类似三月七的“上一次执行周本时间”这样的，那不妨一用。

:::

用法：

```python
ctx.config.set("retry", 3)
ctx.config.set("feature_enabled", True)
```

注意事项：

- key 必须是非空字符串，否则会抛出异常。

### ctx.config.update

批量更新配置项，可传字典，也可用关键字参数。

用法：

```python
ctx.config.update({"timeout": 10, "mode": "fast"})
ctx.config.update(timeout=15, mode="safe")
```

### ctx.config.reset

重置配置源并重建当前配置。

用法：

```python
snapshot = ctx.config.reset({"hello": "new-world"})
ctx.logger.info(f"重置后配置: {snapshot}")
```

注意事项：

- `reset(None)` 会重置为空配置，不是“不做变更”。

### ctx.config.to_dict

返回当前配置深拷贝，适合只读快照。

用法：

```python
current_config = ctx.config.to_dict()
```

### ctx.config.source_dict

返回源配置深拷贝，用于对比当前配置与源配置差异。

用法：

```python
source_config = ctx.config.source_dict()
```

## 事件能力

### ctx.event

插件事件门面，统一提供监听、取消监听、发送事件能力。

### ctx.event.on

注册事件监听器，返回 listener_id。

用法：

```python
async def on_ping(payload):
	ctx.logger.info(f"收到 ping: {payload}")

listener_id = ctx.event.on(
	"demo.ping",
	on_ping,
	scope="global",
	priority=10,
	once=False,
)
```

关键参数：

- `event`：事件名。
- `handler`：处理函数。
- `scope`：`global` 或 `instance`。
- `priority`：越大越先执行。
- `once`：是否触发一次后自动解绑。
- `error_policy`：`continue` 或 `raise`，`None` 表示继承事件级策略。

### @on_event（推荐）

你也可以导入并使用@on_event装饰器来快速启用一个事件监听器，这很酷不是吗？

```python
from mas.plugins import on_event

@on_event("script.exit", scope="global", priority=0, once=False)
async def on_script_exit(payload, ctx):
	ctx.logger.info(f"script.exit: {payload}")
```

## 

### ctx.event.off

取消监听器，可用 handler 或 listener_id 解绑。

用法：

```python
ctx.event.off("demo.ping", listener_id=listener_id)
```

### ctx.event.off_all

取消当前实例注册的全部监听器。

用法：

```python
ctx.event.off_all()
```

### ctx.event.emit_async

异步发送事件，推荐在 async 流程中优先使用。

用法：

```python
await ctx.event.emit_async(
	"cache.test",
	{"key": "k1", "value": {"x": 1}},
	scope="instance",
	error_policy="continue",
)
```

### ctx.event.emit

同步桥接发送事件。若当前有事件循环，会创建任务异步发送；若无事件循环，会自动创建并执行。

用法：

```python
ctx.event.emit("demo.ping", {"message": "hello"}, scope="global")
```

实践建议：

- 在 async 代码中优先使用 `emit_async` 并 `await`。
- 需要严格时序时，不建议依赖同步 `emit` 的后台任务行为。

## 缓存能力

虽然它名字是叫缓存，而且叫“cache”，但是实际上他是可以持久化的，拥有完整的CRUD功能。

*哪天支持数据库了我真得考虑要不要给他改个名字了*

### ctx.cache

实例级缓存管理器，用于注册和管理多个缓存空间。

### ctx.cache.register

注册缓存并返回缓存实例（当前后端仅支持 `json`）。

用法：

```python
cache = ctx.cache.register(
	cache_name="test_cache",
	backend="json",
	limit=10,
	limit_mode="count",
)
```

关键参数：

- `cache_name`：缓存名，建议英文规范名。
- `backend`：后端类型，当前仅支持 `json`。
- `limit`：阈值。
- `limit_mode`：`count`（按条目数）或 `bytes`（按字节数）。
- `limit_unit`：`b/kb/mb/gb`，仅 `bytes` 模式生效。

常见示例：

```python
# 按条目数限制
cache_a = ctx.cache.register(
	cache_name="recent_users",
	backend="json",
	limit=100,
	limit_mode="count",
)

# 按体积限制
cache_b = ctx.cache.register(
	cache_name="large_payload",
	backend="json",
	limit="10mb",
	limit_mode="bytes",
	limit_unit="mb",
)
```

同名缓存重复注册时，参数必须一致，否则会抛异常。

### ctx.cache.get_registered

获取已注册缓存实例，不存在返回 `None`。

用法：

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

列出当前实例全部已注册缓存及统计信息。

用法：

```python
stats_map = ctx.cache.list_registered()
ctx.logger.info(f"已注册缓存: {stats_map}")
```

### ctx.cache.instance_cache_dir

当前实例缓存目录路径。

用法：

```python
cache_dir = ctx.cache.instance_cache_dir
ctx.logger.info(f"缓存目录: {cache_dir}")
```

### 缓存实例方法（register 返回对象）

#### cache.set

写入单个键值。

```python
cache.set("user:1", {"name": "Alice"})
```

#### cache.get

读取键值，未命中返回默认值。

```python
user = cache.get("user:1", default={})
```

#### cache.delete

删除键，返回是否删除成功。

```python
deleted = cache.delete("user:1")
```

#### cache.exists

判断键是否存在。

```python
exists = cache.exists("user:1")
```

#### cache.update

批量写入键值。

```python
cache.update({"k1": 1, "k2": 2})
```

#### cache.all

获取缓存全部键值（不含内部元数据）。

```python
all_items = cache.all()
```

#### cache.clear

清空缓存。

```python
cache.clear()
```

#### cache.stats

返回缓存统计信息（计数、大小、阈值、路径等）。

```python
stats = cache.stats()
ctx.logger.info(f"cache stats: {stats}")
```

## 运行时能力

::: warning

该能力所列出来的方法已经完成，但后续还有更多拓展功能在计划中，随时可能出现破坏性的修改和更新。

*目前看上去实现的并不够优雅，可能后续用更优雅的实现方式*

2026/4/19

:::

MAS允许你设定插件的代码解释器，以在特定的虚拟环境下执行特定的代码。

::: tip 合理使用

插件开发者理应对可能导致主程序无法使用的库使用单独的运行时。

比如想使用MAS拥有，但版本不同的库，想使用不一样的python版本，或是引入其他大型框架。

都可以尝试额外的运行时。

:::

### ctx.runtime

运行时门面，提供环境探测、参数设置、代码执行等能力。

### ctx.runtime.info

获取运行时信息（如宿主解释器、当前选定解释器、解释器检查结果）。

用法：

```python
info = ctx.runtime.info()
ctx.logger.info(f"selected_python={info.get('selected_python')}")
```

### ctx.runtime.set

更新运行时选项，如解释器路径和超时设置。

用法：

```python
runtime_config = ctx.runtime.set(
	python_executable="/usr/bin/python3",
	timeout_seconds=20,
)
ctx.logger.info(f"runtime config: {runtime_config}")
```

说明：

- `timeout_seconds` 会映射到 runtime 配置中的 `python_timeout_seconds`。

### ctx.runtime.run

异步执行一段 Python 代码并返回执行结果。

用法：

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

返回结构常见字段：

- `ok`：是否执行成功。
- `returncode`：进程返回码。
- `stdout`：标准输出。
- `stderr`：标准错误。
- `python`：实际执行所用解释器路径。

### ctx.runtime.check_interpreter

检查解释器是否可用。

用法：

```python
check = ctx.runtime.check_interpreter("/usr/bin/python3")
ctx.logger.info(f"interpreter ok={check.get('ok')}")
```

### ctx.runtime.list_scripts

读取宿主暴露的 `list_scripts` 列表（若宿主未注册能力，返回空列表）。此处沿用历史能力名称，列表项的含义以宿主注册的能力为准。

用法：

```python
scripts = ctx.runtime.list_scripts()
```

### ctx.runtime.get_script_log

按历史 `script_id` 标识读取执行日志（若宿主未注册能力，返回空字符串）。

用法：

```python
log_text = ctx.runtime.get_script_log("script-001", limit=200)
```

## 同步与异步边界

### 常见边界

- `ctx.runtime.run` 是异步方法，必须在 async 上下文中 `await`。
- `ctx.event.emit_async` 是异步方法，建议优先使用。
- `ctx.event.emit` 是同步桥接，不保证严格阻塞发送完成。

### 同步监听器注意事项

如果监听器是同步函数，且你要创建异步任务，请将监听器改为 `async def`，避免出现 no running event loop 一类问题。

## 最小可用实现模板

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
		ctx.logger.info(f"收到 demo.ping: {payload}")

	@on_event("cache.test", scope="instance")
	def on_cache_test(self, payload: dict, ctx) -> None:
		value = payload.get("value", {"k": "v"})
		self.cache.set("test_cache", value)
		ctx.logger.info(f"缓存写入成功: {self.cache.get('test_cache')}")

	@on_event("runtime.test", scope="instance")
	async def on_runtime_test(self, payload: Any, ctx) -> None:
		_ = payload
		result = await ctx.runtime.run(code="print(1+2)", timeout_seconds=5)
		if result.get("ok"):
			ctx.logger.info(f"运行结果: {result.get('stdout', '').strip()}")
		else:
			ctx.logger.error(f"运行失败: {result.get('stderr', '').strip()}")
```

## 常见问题

### cache.register 报参数不一致

可能原因：

- 同一实例中重复使用同名 `cache_name`，但 `limit/limit_mode` 与第一次注册不一致。

建议：

- 参数保持一致，或换一个新的 `cache_name`。

### 事件监听器没有触发

可能原因：

- event 名拼写错误。
- scope 不匹配（事件按 global 发出，但监听器用 instance）。
- 监听器签名不合法，导致注册失败。

### runtime.run 调用时报错

可能原因：

- 在非 async 上下文直接调用，未 `await`。
- 解释器路径无效。
- 超时设置过短。

### config.reset 之后配置消失

可能原因：

- 传入了 `None` 或空字典，行为是“重置为空配置”。

## 结语

ctx 的目标是把插件开发中最常用的核心能力统一收敛到一个对象上：日志、配置、事件、缓存、运行时。

建议优先采用本文的“最小可用模板”起步，再按业务逐步扩展事件与缓存策略。
