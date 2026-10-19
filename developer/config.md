# 配置管理

配置框架位于 `app/config/`，以 Pydantic 模型声明配置，在运行时提供暂存、事务工作区、信号、业务锁和 YAML 持久化。程序中的配置入口为 `app/core/config.py` 导出的 `Config`。

本文说明配置框架本身。脚本的共享配置、账号覆盖层和运行期间的配置复原属于业务语义，另见[配置语义](./config-semantics.md)。业务覆盖层组织不同账号的配置取值，事务工作区承载一次事务中的待提交状态。

## 1. 代码归属与基本结构

- `app/config/core/`：节点、配置项、分组、集合、事务管理器和暂存操作。
- `app/config/fields/`、`types.py`、`shortcuts.py`：引用、加密、UI 元数据、历史字段兼容及标准字段类型。
- `app/config/signals.py`：字段和集合事件。
- `app/config/wire.py`：从配置模型派生接口输入、输出契约，描述集合索引结构。
- `app/models/config/`：各业务域的配置类及其字段，是业务字段、默认值和校验规则的唯一声明位置。
- `app/core/config.py`：配置管理门面、启动顺序和业务编排。
- `app/core/config_upgrade.py`：启动期的一次性 JSON → YAML 升级。
- `app/models/schema.py`：跨模块公共接口契约。端点专用请求、响应模型位于对应 `app/api/` 模块顶层。

三个基本模型分别承担以下职责：

- `ConfigGroup`：一组有明确类型的配置字段，例如 `Info.Name`、`Run.Enabled`。
- `ConfigEntry`：一个配置对象，包含分组，也可以包含嵌套集合。
- `ConfigCollection[TEntry]`：带 UUID、类型索引和顺序的配置集合，管理成员及成员类型。

Entry 与 Collection 共同继承 `ConfigNode`，共享身份、生命周期、工作区、锁和信号机制。`app.config` 集中导出业务可用的公开类型；以下划线开头的方法属于框架内部实现。

### 最小完整示例

以下示例展示一个关联文件的配置对象从构造、激活到修改和保存的完整过程。`file=` 登记持久化目标，示例中的 `flush()` 将配置写入当前工作目录下的 `config/example.yaml`。

```python
import asyncio
from pathlib import Path

from pydantic import Field

from app.config import ConfigEntry, ConfigGroup, config_manager


class ExampleConfig(ConfigEntry):
    """示例配置。"""

    class InfoFields(ConfigGroup):
        Name: str = Field(default="默认名称", description="显示名称")
        Enabled: bool = Field(default=True, description="是否启用")

    Info: InfoFields = Field(default_factory=InfoFields)


async def main() -> None:
    config = ExampleConfig.build(file=Path("config/example.yaml"))
    await config.activate()

    config.Info.Name = "新的名称"
    await config.commit()
    assert config.Info.Name == "新的名称"

    # flush 等待配置写入文件。
    await config_manager.flush()
    config_manager.unregister_root(config)


if __name__ == "__main__":
    asyncio.run(main())
```

## 2. 定义配置类

### 分组、字段与默认值

分组继承 `ConfigGroup`，配置对象继承 `ConfigEntry`。类型注解定义字段的数据类型，`Field` 声明默认值和中文 `description`。分组和可变值通过 `default_factory` 在各实例中独立创建。

```python
from typing import Annotated, Literal

from pydantic import Field

from app.config import ConfigEntry, ConfigGroup


class TaskConfig(ConfigEntry):
    """任务配置。"""

    class RunFields(ConfigGroup):
        Mode: Literal["normal", "silent"] = Field(
            default="normal", description="运行模式"
        )
        RetryCount: Annotated[int, Field(ge=0, le=10)] = Field(
            default=3, description="失败重试次数"
        )
        Tasks: list[str] = Field(default_factory=list, description="任务列表")

    Run: RunFields = Field(default_factory=RunFields)
```

Pydantic 自带类型、`Literal`、枚举和 `Field` 约束构成字段的基础校验规则。普通约束失败时抛出校验异常，例如 `Field(ge=0)` 会拒绝负数。可复用的纠正规则封装为标准 `Annotated` 类型，与字段声明共同组成完整的校验链。

固定结构通过 Pydantic 子模型表达；开放映射通过字典的键值类型表达。映射允许缺少业务运行时使用的键，这些键由业务代码按需补齐。两种声明分别描述确定结构与开放结构，保留各自的类型校验能力。

### 嵌套集合

`collection()` 声明嵌套集合，泛型参数提供静态成员类型，函数参数登记允许加载的具体成员类型：

```python
from pydantic import Field

from app.config import (
    ConfigCollection,
    ConfigEntry,
    ConfigGroup,
    collection,
)


class AccountConfig(ConfigEntry):
    class InfoFields(ConfigGroup):
        Name: str = Field(default="默认账号", description="账号名称")

    Info: InfoFields = Field(default_factory=InfoFields)


class ProjectConfig(ConfigEntry):
    Accounts: ConfigCollection[AccountConfig] = collection(AccountConfig)
```

嵌套集合由框架建立父子关系，与所属根节点一同持久化，文件关联由根节点持有。嵌套集合构造后，通过 `config_manager.register_collection(name, collection)` 登记为命名引用目标。

### 继承、类型提示与运行时状态

配置类支持继承，子类可以覆写分组或集合，形成独立的业务配置类型。可变属性的类型收窄可能触发类型检查器的不兼容覆写诊断。经运行时行为验证的具体覆写，可通过该声明处带说明的精确豁免表达；其余位置保留完整的类型检查。

`ConfigEntry.build()` 和 `ConfigCollection.build()` 接收 `parent`、`uid`、`payload`、`file` 等运行时构造参数。Pydantic 的静态插件可能将子类构造器提示生成为只有模型字段的签名，`build()` 提供完整且可被检查的构造入口。

普通类级常量标为 `ClassVar`，实例私有运行时状态使用 Pydantic 的 `PrivateAttr`。任务句柄、暂存队列、锁票据和服务实例属于运行时状态，持久化文档只包含配置数据。热态写入入口是分组内的整字段赋值与集合公开操作，它们将修改接入暂存、校验、信号和事务流程。

## 3. 声明式字段能力

### 路径

路径内存值为 `Path | None`。标准类型包括：

- `FilePath`：现存文件，应用标准阻止目录规则。
- `FolderPath`：现存目录，应用标准阻止目录规则。
- `ScriptRootPath`：现存脚本目录，允许程序工作目录，其余采用系统目录边界。
- `ExecutablePath`：现存的 `exe`、`bat`、`cmd`、`com` 文件，应用标准阻止目录规则。
- `LoosePath`：允许不存在的文件或目录，只进行路径归一化。

`path_policy()` 表达路径类型、后缀、存在性和阻止目录的组合规则：

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
    ] = Field(default=None, description="启动程序")
```

四项参数的含义如下：

- `kind`：`"file"`、`"folder"` 或 `"any"`。
- `extensions`：后缀字符串的列表或元组；接受 `"exe"`、`".exe"`、`"tar.gz"` 等具体扩展名，归一化后忽略大小写、去重。通配符及目录类型上的非空后缀声明会产生声明错误。
- `must_exist`：布尔值。要求存在时，失效路径清空为 `None`；允许不存在时，保留符合规则的未来路径。
- `blocked_dirs`：字符串、`Path` 或 `PathBlockPreset` 的列表或元组。普通目录阻止其自身及后代；框架预设处理系统目录、根目录和程序目录等特殊边界。自定义规则通过传入相应预设包含这些限制。

归一化包括去除首尾空白、展开环境变量与用户目录、转绝对路径、解析符号链接，以及 Windows `.lnk` 快捷方式。快捷方式解析失败或形成循环会清空。

仅在 `must_exist=True` 且允许目录的规则中，找不到原目录时才尝试去掉最后一个点号后缀；**只有修正后确有符合规则的目录才接受**。已经存在的 `v4.11.1` 目录完整保留，允许不存在的路径不做这种猜测。

`kind="any"` 且允许不存在时，未来实体类型尚未确定，`extensions` 仅约束可以确定为文件的路径。`kind="file"` 则将路径明确约束为文件，包括尚未创建的目标文件。

同一份声明会派生 `path_kind`、`path_extensions`、`path_must_exist` 等 UI 选择提示，用于表达文件类型和存在性信息；`blocked_dirs` 的限制由后端执行。消费方可以据此配置路径选择组件。

### 日期时间

日期和时刻配置使用完整的 `datetime` 存储。`ConfigGroup` 在 Pydantic 校验阶段将值归一为 UTC，冷态构造、默认值与热态提交采用相同的写入规则：

1. 输入已有时区：转换到 UTC，保持同一个时间点。
2. 输入没有时区：直接按 UTC 解释，与其他配置字段的修改顺序无关。
3. 属性读取：按该字段当前的 `tz(...)` 预设转换；不裁剪日期或时间。
4. 序列化：直接导出内存中带 UTC 时区的存储值，不重新读取字段，也不调用时区预设。

```python
from datetime import datetime, timedelta, timezone
from typing import Annotated

from pydantic import Field

from app.config import ConfigGroup, tz, ui


def server_timezone(group: "ScheduleFields") -> timezone:
    """只读地决定当前展示时区。"""
    return timezone(timedelta(hours=group.OffsetHours))


class ScheduleFields(ConfigGroup):
    OffsetHours: int = Field(default=4, ge=-12, le=14, description="服务器时差")
    CompletedAt: Annotated[
        datetime, tz(server_timezone), ui(format="hms")
    ] = Field(
        default_factory=lambda: datetime(2000, 1, 1, tzinfo=timezone.utc),
        description="最近完成时间",
    )
```

例如输入 `2026-10-19T09:30:00+08:00`，存储和 JSON 导出为 `2026-10-19T01:30:00Z`；在 UTC+4 预设下，属性读取为 `05:30+04:00`。若输入没有时区的 `2026-10-19T09:30:00`，则存为 `09:30Z`，不会猜测它属于服务器时区。

`tz()` 接受固定偏移的 `datetime.timezone`，或接收所属分组、返回固定偏移 `timezone` 的同步只读函数。动态函数每次读取重新求值，通过其他配置字段计算展示偏移；函数的只读性和无自身字段递归依赖保证了读取过程的稳定性。未声明 `tz()` 时，读取时区默认为 UTC+8。返回值校验接受 `timezone`，返回 `ZoneInfo` 时抛出异常。

`ui(format=...)` 提示展示格式，存储类型保持为完整日期时间。前端内存值保留日期及偏移，接口回传带 `Z` 或 `±HH:MM` 的时间戳。时间控件清空时，按字段约定回传 `00:00` 对应的完整带时区时间；字段的空值接受能力由其类型声明决定。

::: info 时区支持范围
时区预设采用固定偏移，支持范围为明确偏移量下的时间点转换。跨夏令时切换、日期改变及长时间打开页面后的偏移更新属于待完善的边界，前端日期时间转换代码中通过 TODO 记录。
:::

### 加密与其他标准类型

敏感字符串使用 `Annotated[str, encrypted()]`，`encrypted()` 放在该字段注解元数据的末尾。业务属性读取返回明文；持久化导出保存密文，接口与迁移导出按受众处理明文。UI 掩码与加密是两种独立能力。

```python
from typing import Annotated

from pydantic import Field

from app.config import ConfigGroup, encrypted


class CredentialFields(ConfigGroup):
    Token: Annotated[str, encrypted()] = Field(
        default="", description="访问凭据"
    )
```

加解密采用支持同设备多用户解密的方案，密文的可移植性受设备范围限制。无法解密时保留原始内容，由前端决定如何提示。框架的解密范围为 `encrypted()` 声明的字段，业务字符串中自行封装的密文格式由对应业务处理。

标准字符串类型还包括 `WindowsNameString`、`UrlString`、`JsonDictString`、`JsonListString`、`KeyboardKeyString`、`CliArgumentString`、`CliArgumentListString`。其中，JSON 字符串类型保持字符串形式，URL 无效时清空，键位自动转小写。非法键位通过 Pydantic 默认值机制回退到本字段 `Field` 声明的合法默认键位，该默认值是键位类型回退行为的组成部分。

### 引用字段

引用字段保存 UUID 或明确允许的特殊字符串，通过逻辑名定位已登记的目标集合。声明使用 `UUID | str`：

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
    ] = Field(default="-", description="关联账号")
```

冷态校验不查询集合；激活及热态写入才检查目标，找不到或类型不符时回退 `default`。`entry_types=(SomeEntry,)` 声明目标类型限制，统一使用 `isinstance` 判定，因此接受子类。

目标的删除、`reload_type` 和 `replace_type` 都会触发引用重校验。类型变化后引用仍有效则保留；失效时执行 `on_delete` 策略：

- `SET_DEFAULT`：改回默认值。
- `RESTRICT`：拒绝使目标失效的操作，异常沿事务回退。
- `CASCADE`：删除持有引用的成员，要求该 Entry 本身位于集合内。
- `CUSTOM`：执行 `on_delete_callback`；可以是回调或所属 Entry 的方法名。

删除、类型变更和它们导致的引用修改使用同一事务。框架的引用订阅统一覆盖这三类事件，并复用字段声明中的目标类型判定和失效策略。

`display_field="Info.Name"` 表示选项取值为 UUID，展示值从目标成员的 `Info.Name` 读取。UI 提示根据目标集合和类型限制计算候选值及其展示文本。这些选项作为元数据提供给消费方，具体编辑页面由前端组件实现。

### 虚拟字段、触发器与 UI

`Virtual[T]` 是计算字段，与 Entry 上的 `@virtual_field("Group.Field")` 同步方法配对；只读，不参与持久化。`Trigger[bool]` 或 `Trigger[Literal[...]]` 与 `@trigger_field(...)` 配对，用作动作入口；布尔触发器写入 `True` 执行动作，空闲值为 `False`，字面量触发器空闲值为 `None`。

触发器赋值立即分派处理方法，独立于普通字段的暂存流程。异步处理方法被安排为独立任务，其完成状态与回退边界独立于发起赋值的事务，`commit()` 仅等待自身提交链中的操作。普通信号回调则在同一执行任务内参与字段修改的事务。

`ui()` 负责组件、格式、选项展示和显隐提示；`select()` 可补充选项来源、顺序语义。显隐使用 `UiVisibility`：

- `SHOW`：正常显示和更新。
- `HIDE`：API 不返回该字段，默认更新路径跳过它。
- `DISABLE`：可返回，默认更新路径不允许修改。
- `MASKED`：API 返回 `UI_MASKED_VALUE` 占位符；允许写入新值，原样回传占位符表示保持原值。

显隐可静态声明，也可通过 `@ui_visibility("Group.Field")` 的同步只读方法动态决定。组级声明会作用于子字段；所有子项隐藏时，JSON API 输出会隐藏整个分组。`MASKED` 的声明范围为具体字段，组级声明会产生类型错误。

UI 显隐控制 API 展示和默认更新范围，加密由 `encrypted()` 独立声明。后端普通属性赋值按字段写入规则执行；`update()` 默认检查显隐，`check_visibility=False` 提供内部更新隐藏字段的入口。`ConfigTableColumn`、`ui.hints`、`ui.tables` 提供表格和字段元数据，前端可以通过这些元数据组织展示。

### 历史字段兼容

字段移动或改名通过 `legacy(group="Info", name="Mode", convert=...)` 声明历史位置，可选 `convert` 先转换历史值，再交给目标字段校验。输入中显式提供的目标字段具有优先级，包括值为 `None` 的情况。

该机制在冷态输入准备和激活载荷处理时统一应用，字段的位置映射与值转换集中于同一声明。历史文档的集合结构、时间口径和数据库版本由启动升级流程处理。

## 4. 冷态、激活与启动顺序

### 冷态与热态

构造或 `model_validate()` 产生未激活的冷态对象。冷态字段按 Pydantic 校验，直接赋值只更新冷态数据；运行时事务、字段信号、自动保存及引用目标存在性校验在热态流程中执行。接口请求校验使用冷态模型或纯契约模型，与配置激活分离。

`build(payload=...)` 保存待激活的原始文档，普通属性读取返回当前冷态字段值；载荷中的内容在 `activate()` 中应用。`model_validate({...})` 则立即填充传入的模型字段，适合构造经过校验的冷态更新对象。

`await node.activate()` 执行一次热化：

1. 选择输入载荷：显式 `payload`、关联文件，或当前冷态字段。
2. 在普通事务工作区中切换到 `INITIALIZING`。
3. 逐项应用字段或集合成员，通过 Init 事务隔离单项失败，发送 `init_set`、`init_add` 等初始化事件。
4. 激活嵌套集合，建立引用订阅，完成后切换为 `ACTIVE`。

节点的激活过程只执行一次，重复激活会抛出异常。热态普通字段赋值生成暂存操作，通过 `await commit()` 生效；集合结构操作采用相同的显式提交方式。

### Init 的部分成功

初始化保留成功字段和成员，汇总错误后抛出 `ConfigAggregateError`。根激活自己开启普通事务时，成功部分提交到 live，节点成为 `ACTIVE`，随后抛出聚合异常。此时异常描述的是部分加载失败，成功部分已经生效。

若激活位于已有父事务内，Init 的成功部分只并入父事务工作区；父事务随后失败时整体回退，节点恢复冷态及待加载载荷。Init 是初始化过程专用的单项隔离边界。

### 引用与文件登记

`file=` 用于根节点，持久化登记接受 `.yaml`、`.yml`。`payload` 与 `file` 互斥；`uid=` 在构造时确定节点身份，随后文件关联与运行时引用使用该身份。

启动编排按“登记引用目标 → 激活目标成员 → 激活依赖方”的顺序建立引用关系。根集合通过 `name=` 登记，嵌套集合在构造后通过 `register_collection()` 登记。`app/core/config.py` 组织完整加载过程，并在配置准备完成后启动业务服务。

`activate(regenerate_uuids=True)` 递归为载荷中的集合成员生成新 UUID；当前节点的 UUID 由构造或集合 `add()` 决定。引用字段保留输入值，关联结构的复制由调用方提供独立的 UUID 映射与引用转换。默认值为 `False`，用于按载荷身份加载。

## 5. 事务的完整运行过程

### 默认边界：一次操作及其信号链

一个热态字段赋值只向当前执行者的队列暂存操作，尚未改变生效值。`commit()` 取得执行资格后快照本作用域的队列，依次处理各个操作：

1. 先取得全局执行入口，再取得节点提交锁。
2. 没有有效事务时，为当前操作创建事务上下文；首次修改节点时建立工作区。
3. 在工作区应用字段或集合操作，执行校验，派发相应信号。
4. 普通信号回调及其直接调用、直接 `await` 的方法继续处于同一个 Task，复用该事务；关联节点的修改也进入各自工作区。
5. 回调正常结束且没有遗漏的暂存操作时，合并所有关联工作区；异常离开事务边界则丢弃它们。
6. 关闭事务上下文并清理作用域，再登记需要保存的持久化根。

默认情况下，**一个 `commit()` 批次中的每项操作分别构成事务**。各操作独立成功或回退；框架继续处理后续操作，最终通过 `ConfigAggregateError` 汇总失败。全局入口和节点锁覆盖整个批次，其他执行者的提交在批次结束后执行；各操作的回退边界保持独立。

例如，同时暂存 A、B 后提交，A 成功、B 失败时，A 可以已经生效。显式事务将多个操作组织为共同成功或共同回退的边界。

### 显式事务与嵌套

```python
from app.config import config_manager


async def rename_atomically(first: ExampleConfig, second: ExampleConfig) -> None:
    async with config_manager.transaction():
        first.Info.Name = "第一项"
        await first.commit()
        second.Info.Name = "第二项"
        await second.commit()
    # 外层事务退出时，两个对象的工作区一起并入 live。
```

同一 Task 中的嵌套 `transaction()` 复用已有事务，不建立新保存点。内部的 `commit()` 返回表示其操作已在工作区执行，不表示外层事务已经提交。若异常传播出最外层事务，则该事务的全部关联配置修改一起回退。

::: info 异常传播与回退边界
嵌套事务复用父事务工作区。整体回退发生在异常离开最外层 `transaction()` 时；若异常在事务内部被捕获，外层正常退出，工作区中的修改将进入正常提交路径。异常处理代码位于事务外时，可以在捕获异常后观察到回退后的 live 状态。
:::

事务保护范围为框架管理的配置状态及相应订阅工作区。已经发送的通知、设备操作、数据库写入和外部文件修改属于外部副作用，其生命周期与配置回退分离。

### 如何判定工作区读取

事务上下文同时校验生命周期和真实执行者：有 Task 时核对 Task 对象，否则核对 Thread 对象。仅继承了 `ContextVar` 不代表取得事务参与资格。

普通属性读取按以下优先级解析：有效 Init 工作区 → 有效普通工作区 → live。当前节点尚未建立工作区时，直接读取 live。集合成员身份及业务引用指向框架管理的 live 节点；工作区是事务期间的临时状态，随提交或回退结束。

`node.effective` 返回当前上下文的有效节点；`config.Info.Name` 等属性读取通过该有效状态解析字段。**对原始 live 对象调用 `model_dump()` 导出 live 存储值**，用于持久化和 FastAPI 输出。`node.effective.model_dump()` 则可导出当前事务的工作区内容；在最外层事务提交前，该内容属于待提交状态。

日期时间的存储字段也遵守这一序列化规则，直接导出该对象内存中的 UTC 值，不走属性读取的时区转换。API 的虚拟字段、UI 提示等计算结果仍按各自声明求值，不等同于普通存储字段快照。

### 排队、重入与后台任务

全局执行入口采用单事务模型，串行协调提交、显式事务、自动保存及 `flush()`。锁顺序为全局入口 → 节点锁，跨节点关联修改按同一顺序重入，消除了分别持有节点锁后互相申请执行资格的反向等待。

同一实际执行者可以重入，其他执行者按等待队列取得资格。异步入口挂起等待，普通工作线程的同步入口阻塞等待。事件循环线程中的 `transaction_sync()` 若遇到其他所有者占用，则抛出异常，事件循环保持可运行状态。

独立 `asyncio.create_task()` 使用自己的事务身份，读取 live，修改时申请执行资格并排队。若父事务持有入口并等待该子任务提交，子任务等待入口释放，双方会形成循环等待。同 Task 的直接调用或直接 `await` 将关联修改纳入父事务；事务退出后启动的独立任务则使用独立的提交边界。

没有工作区读取资格的执行者读取 live，另一个事务的暂存值保持隔离。普通属性读取反映每次访问时的有效状态；管理器导出入口通过全局执行入口提供跨根的稳定导出范围。

### 暂存归属、取消与收尾

暂存队列按“真实执行者 + 普通或 Init 作用域”隔离，只存在 live 节点中，不复制到工作区，不持久化，也不转移给其他 Task。

- 赋值和提交使用同一作用域：事务外暂存由事务外提交读取，显式事务内暂存由该事务内提交读取。
- 当前作用域为空、但同一执行者还有其他作用域的暂存时，`commit()` 抛出异常，其他作用域的队列保持原状。
- 信号回调通过 `commit()` 应用其产生的修改；回调返回或事务退出时存在本链未提交暂存，会报错并回退。
- 回退清理当前作用域残留，不清除其他任务队列；Task 结束后清理其未提交暂存。
- 等待执行入口被取消时，撤销排队或归还已经交接的资格。执行中的取消会回退当前操作，将已回退及未执行的操作归还相应队列；不会自动重试业务修改。事务作用域关闭后，其残留仍按作用域规则清理。

## 6. 业务锁与任务执行

全局执行入口负责配置操作排队，节点提交锁负责同节点批次；业务锁控制任务执行期间配置的可写范围，三者分别作用于不同层次。

- `await node.lock_s(cascade=True)`：可叠加的共享锁，与 X 互斥；锁覆盖范围内的热态写入均被拒绝，包括 S 持有者发起的写入。
- `await node.lock_x(cascade=True)`：独占锁，与其他 S/X 互斥；持有 X token 的执行上下文可以正常修改并提交。
- `await node.try_lock_x(...)`：冲突返回 `None`，不等待业务锁释放。
- `await node.unlock(ticket)`：在原签发节点使用原 `LockTicket` 解锁。

默认级联覆盖后代；`cascade=False` 只锁本节点。加锁会预检完整范围，冲突时直接报错，所有节点保持加锁前状态。X token 是执行上下文凭据，子 Task 可以继承该凭据；事务参与资格则单独核对真实 Task 身份。

运行任务通过 X 锁保护 live 配置，持票上下文直接赋值和提交，`finally` 负责释放票据：

```python
async def run_with_config(config: ExampleConfig) -> None:
    ticket = await config.lock_x()
    try:
        config.Info.Enabled = False
        await config.commit()
        # 任务期间的配置写入通过赋值与 commit 生效。
    finally:
        await config.unlock(ticket)
```

业务锁的持续时间可以覆盖整个任务，每次提交的事务边界独立确定。显式事务将其中有关联的多个修改组织为一个回退单元；任务的其他执行阶段只持有业务锁，全局事务入口可供其他配置操作使用。

删除、类型替换等结构操作还有目标未锁定等独立前置条件；X token 提供的是受保护字段的写权限，结构操作按各自前置条件校验。

## 7. 信号订阅与关联修改

### 订阅方式与过滤

`SomeEntry.connect(...)` 订阅该具体类型的事件；`entry.connect(...)` 仅订阅指定实例。各具体子类具有独立信号，类级订阅作用于该具体类型。`disconnect()` 通过注册时的接收者与过滤参数定位订阅。

过滤参数包括 `phase`、`kind`、`group`、`field`；集合事件不支持 `group`、`field`。默认 `phase="runtime"`，初始化订阅使用 `phase="init"`。`kind="set"` 可与初始化阶段过滤组合匹配 `init_set`，`add` 同理。

```python
from app.config import FieldChangeEvent


def on_name_changed(sender: object, event: FieldChangeEvent) -> None:
    # 事件携带发生变更的分组和字段名。
    assert event.group == "Info"
    assert event.field == "Name"


ExampleConfig.connect(on_name_changed, group="Info", field="Name", kind="set")

# 原函数和相同过滤参数定位对应订阅。
ExampleConfig.disconnect(on_name_changed, group="Info", field="Name", kind="set")
```

公开订阅使用弱引用，订阅的有效期随接收者生命周期变化。保存在模块、配置实例或业务对象中的函数和可调用对象可以维持接收者引用。框架在接收者上挂载包装器；直接传入无法附加属性的绑定方法时，弱引用注册可能抛出异常。

### 事件内容与执行方式

`FieldChangeEvent` 包含 `node`、`group`、`field`、`value`、`old_value`，事件类型为 `init_set` 或 `set`。运行时普通字段值相等时不重复发送；初始化仍发送初始化事件。

`CollectionChangeEvent` 包含对应的 `collection`、`uid`、`entry`、顺序或类型信息，覆盖 `init_add`、`add`、`remove`、`set_order`、`add_type`、`remove_type`、`reload_type`、`replace_type`。成员、顺序和类型字段按事件种类填充。

信号由 Blinker 派发：先同步调用接收者包装器，再逐个等待返回的 awaitable。接收者顺序由 Blinker 决定，框架的派发契约只保证等待返回的异步处理结果。有严格先后关系的步骤可以由一个接收者内的顺序调用表达。

异步接收者中直接修改其他配置并 `await other.commit()`，继续参与当前事务；回调异常沿事务边界传播时，该操作关联的所有工作区一起回退。`create_task()` 或将协程交给 `gather()` 执行会形成独立 Task，使用独立事务身份，并受全局入口排队约束。

### 订阅也有工作区

事务内的订阅、解订操作先作用于独立信号工作区，正常提交后生效，回退则丢弃。建立工作区时复刻全部有效订阅，工作区中的订阅变化与 live 信号隔离。

Blinker 没有公开的完整订阅枚举接口。框架在建立信号工作区的函数中自行枚举接收者、发送者与关联索引，再通过 `connect()` 重建独立索引及弱引用清理。订阅索引属于框架与 Blinker 的内部兼容边界，业务订阅通过公开的 `connect()`、`disconnect()` 接口表达。

## 8. 持久化、错误与内存导出

### 稳定后防抖保存

持久化范围由 `config_manager` 的根节点与文件关联信息确定。嵌套集合和成员随根保存，没有文件关联的普通节点不单独落盘。

普通事务成功合并工作区后，管理器递增涉及根的私有修改代次；关闭上下文后登记保存请求。保存采用单执行器和约 50ms 防抖，将短时间内的多次修改合并为一次正常全量扫描，未激活根跳过。

有待保存请求时，后续事务结束会重算安静等待期限。回退不产生新的保存请求，先前成功事务留下的请求继续保留。执行器等待期间不持入口；到期后取得全局入口，重新检查期限，从导出到该次写入结束保持入口占用，整个保存过程读取稳定的 live 状态。

写入采用同步原子文件替换，在保存执行器取得入口后直接完成。新的保存请求更新等待期限，正在执行的写入继续完成。没有运行中的事件循环时，管理器保留待保存状态，由后续异步入口或 `flush()` 接续处理。

这里的原子替换是单文件保证；多个配置文件之间没有跨文件原子提交。保存失败不会回退已提交的内存配置。

### 失败隔离与重试

管理器分别捕获各根的导出、序列化或写入失败，一个根失败后继续处理其他根。

- IO 类错误首次失败后分别等待 1、2、4、8、16 秒，各自动重试一次；每次重新读取最新稳定配置，只处理到期失败根。
- 导出、序列化等非 IO 错误不定时重试；对应根的修改代次变化或显式 `flush()` 时再尝试。
- 其他根的修改不重置失败预算；IO 自动重试耗尽后暂停自动尝试，保留失败状态。
- `flush()` 可以立即尝试全部可保存根，失败不会重新发放整组重试预算；成功后清除该根失败记录。
- 根解除登记或被新实例替代时清理旧实例记录。

`config_manager.persistence_errors` 返回只读快照，包含根 UUID、路径、失败阶段、错误类型、重试次数与下次重试时间。时间是调度使用的单调时钟值，不是日期时间戳；快照不包含配置内容。首次失败、耗尽和恢复会记录日志，不自动添加 HTTP 响应字段或前端提示。

### `flush()` 的保证

`await config_manager.flush()` 跳过防抖，等待全局执行入口，尝试全部可保存根；结束后用 `ConfigAggregateError` 汇总该次保存的失败。自动保存和 `flush()` 复用同一保存逻辑，由全局入口保证串行执行。

`flush()` 的有效调用位置是事务之外。在当前事务或其普通信号回调中调用时，管理器抛出异常。最外层事务退出后的 `flush()` 确认稳定配置已写入文件；`commit()`、`update()`、`activate()` 的完成状态则描述各自的内存阶段。

### 序列化受众

`node.model_dump()` 默认 `mode="json"`、`audience="api"`，不同用途显式选择 `ExportContext`：

- `api`：普通存储字段、明文加密字段及响应式值，尊重 UI 隐藏与掩码；供 API 输出。
- `persist`：完整持久化字段、密文，不包含虚拟字段与触发器；供运行配置落盘。
- `export`：完整持久化字段、明文，不包含虚拟字段与触发器；供配置迁移与备份导出。

```python
from app.config import ExportContext


def export_payload(config: ExampleConfig) -> dict[str, object]:
    return config.model_dump(context=ExportContext(audience="export"))
```

`await node.to_dict()` 检查节点已激活且未删除，固定使用持久化受众，并不直接写文件。

`mode="python"` 保留原生类型，跳过 JSON 模式下的响应式注入及 UI 裁剪，主要用于内部对象处理。Entry 的 Python 模式分支按各组的默认上下文处理数据；显式加密受众通过 JSON 模式或管理器导出接口传递。

路径采用 Pydantic 原生序列化：JSON 中 `Path` 为字符串、`None` 为 `null`。日期时间直接导出 UTC 存储值。普通 `model_dump()` 导出调用对象的数据，管理器接口则在取得全局执行入口后导出跨根的稳定配置。

### 从内存导出全部配置

`await config_manager.export(target)` 只接受目标**目录**，根据已登记文件确定范围，导出已激活根的稳定明文 YAML，保留相对目录结构：

```python
from pathlib import Path

from app.config import config_manager


async def export_configuration(target: Path) -> None:
    await config_manager.export(target)
```

该方法取得全局入口，先完成全部序列化再写导出文件，运行配置文件和待保存请求保持原状。它直接读取内存，独立于 `flush()`；当前事务内调用或目标覆盖正在使用的配置文件时会抛出异常。ZIP 打包及其他备份材料由外层备份服务负责，管理器负责配置文件导出。

导出为明文是为了跨设备迁移，导出文件可能包含凭据。仅 `encrypted()` 标记的字段按框架受众解密；业务自己封装在字符串里的密文不保证能跨设备使用。文件写入失败时也不具备整个导出目录的原子性。

`unregister_root(node)` 解除文件登记并清理失败状态；`flush()` 后再解除登记，可以保留最后一次修改。引用池登记与文件登记相互独立，解除文件登记后，引用池中的集合继续存在。

## 9. 配置操作与 API 契约

### 可变字段的整字段赋值

对列表、字典等可变字段，复制、修改后整字段赋值，再提交：

```python
async def append_task(config: TaskConfig, name: str) -> None:
    tasks = [*config.Run.Tasks, name]
    config.Run.Tasks = tasks
    await config.commit()
```

字段赋值将整个新值送入配置写入链。`config.Run.Tasks.append(...)`、字典下标赋值及嵌套对象修改属于 Python 对象的原地修改，其调用路径独立于配置字段赋值，因此处于校验、锁、信号、暂存和回退的保护范围之外。嵌套可变值的复制范围包含实际被修改的内部对象时，待提交值与原始值才能保持隔离。

当前的可变字段事务支持范围为整字段赋值。深层可变值代理与读取引用隔离属于待完善能力，框架源码通过 TODO 记录这一边界。

### 更新 Entry 与操作集合

`await target.update(other)` 接收同一具体 Entry 类型的冷态对象，根据 Entry 和分组的 `model_fields_set` 只提交实际提供的字段，并自动 `commit()`；跳过虚拟字段，默认检查 UI 显隐。它不负责更新嵌套集合，也不把整个请求看作隐含的原子事务。

显式事务中的赋值和 `update()` 共享外层回退边界，异常传播出该边界时整体回退。`check_visibility=False` 供内部更新隐藏字段使用；接口请求使用默认的显隐检查。

集合结构使用专门方法，随后 `await collection.commit()`：

- `add(EntryType, payload=...)`：暂存新增，立即返回预分配 UUID；提交成功后才可读取该成员。新增成员默认新 UUID，传入 `uid=` 可以指定身份。
- `remove(uid)`：删除成员，执行守卫、锁检查和关联事件。
- `set_order(...)`：通过 UUID 或 `CollectionOrderItem` 序列调整顺序。
- `add_type(...)`、`remove_type(...)`：变更允许类型，移除类型时处理其成员。
- `reload_type(...)`：按类型重建成员，保留 UUID 与顺序；传入类型名可强制按当前注册类重建。
- `replace_type(uid, NewType, payload=...)`：调用方准备转换后的载荷，替换一个成员，保留其 UUID、顺序及载荷内嵌套 UUID。

类型变化使被替换实例进入软删除状态，新实例拥有独立的实例订阅。消费方通过类型变更事件重新取得成员及其类型信息。`replace_type` 发送专门的类型替换事件，remove 守卫和 remove 事件属于删除操作的处理链。

`add(..., payload=..., regenerate_uuids=True)` 支持按载荷复制配置并递归生成成员身份。引用字段保留输入 UUID，关联复制中的引用转换由调用方提供。

### 请求、响应与部分更新

接口通过 `app.config.wire` 的 `ConfigInput[ConfigType]`、`ConfigPayload[ConfigType]` 从配置类派生缓存的纯 Pydantic 契约。配置类集中声明字段和分组，接口契约复用这些声明。

专用 `*In`、`*Out` 及其专用子模型位于对应 API 模块顶层，按“导入 → 接口模型 → 路由”排列；跨模块包络、选项、消息等位于单文件 `app/models/schema.py`。依赖方向由 API 指向公共契约、业务层和配置层。

```python
from pydantic import BaseModel

from app.config.wire import ConfigInput, ConfigPayload


class ExampleUpdateIn(BaseModel):
    data: ConfigInput[ExampleConfig]


class ExampleGetOut(BaseModel):
    data: ConfigPayload[ExampleConfig]


async def apply_request(config: ExampleConfig, body: ExampleUpdateIn) -> None:
    # exclude_unset 保留字段缺省信息及用户明确提交的 null。
    payload = body.data.model_dump(exclude_unset=True)
    patch = ExampleConfig.model_validate(payload)
    await config.update(patch)
```

派生输入模型保留缺省信息：省略表示不修改，显式 `null` 进入具体配置字段的校验或纠正规则。`model_dump(exclude_unset=True)` 只保留实际提供的字段，同时保留显式空值。普通 `model_dump()` 可能包含缺省字段的默认 `None`；`exclude_none=True` 则会过滤显式空值。这三个序列化选项表达不同语义。

掩码占位符回传表示保留原敏感值；遗漏敏感字段同样保留。普通字段、虚拟字段、禁用字段、锁和集合写入范围仍由各自契约及配置层检查，不因使用派生模型而放宽。

派生响应明确描述实际配置载荷，包含递归分组和嵌套集合，排除运行时状态。集合文档形状为 `{"order": [{"uid": "...", "type": "..."}], "data": {"<uuid>": {...}}}`，类型名参与加载和索引，也是历史文档兼容关系的一部分。

OpenAPI 描述接口路径、方法、外层字段、包络及 MCP 标签，`frontend` 的 OpenAPI 生成器据此生成客户端。前端页面通过生成的类型访问配置载荷，字段元数据与页面组件之间的映射由各页面实现。

## 10. 配置文件的一次性升级

运行期使用 YAML。历史 JSON 安装在启动业务服务前，依次完成历史数据库版本升级、专项预处理和文档结构转换，按引用依赖激活并确认保存，最后进入配置版本 `v2.0`。

固定映射为：

- `Config.json` → `setting.yaml`
- `ScriptConfig.json` → `scripts.yaml`
- `PlanConfig.json` → `plans.yaml`
- `QueueConfig.json` → `queues.yaml`
- `EmulatorConfig.json` → `emulators.yaml`
- `ToolsConfig.json` → `tools.yaml`
- `GameSignAccounts.json` → `game_sign_accounts.yaml`

升级覆盖专项及其嵌套用户、Webhook、队列项和时间字段，保留 UUID、类型、顺序、关联和凭据；独立账号文件优先于重复的嵌套账号数据。历史无时区日期和时刻按其原业务时区解释后转为 UTC。一次性升级负责还原历史时间的实际含义；运行期输入的无时区日期时间则按 UTC 解释。

原始文件保存在 `config/legacy-json/`。迁移记录 `.config-migration-v2.json` 跟踪文件归属和进度，采用临时写入、校验、替换，支持中断重试；已完成文件不重复转换。无法确认归属的既有 YAML 会报冲突，不静默覆盖或合并。

`v1.11 → v2.0` 在整套文件迁移、激活和保存成功后推进；失败时业务启动中止，版本停留在此前完成的检查点。更早的历史数据库升级具有各自的版本检查点。无数据库的历史安装也执行配置升级；首次安装直接创建默认 YAML。

完成迁移或已进入正常 YAML 加载流程后，YAML 是配置读取来源，目录中的 JSON 文件保持归档数据身份。Electron 的启动读取在首次升级前支持 JSON 回退，之后读取 YAML；问题报告、备份与恢复使用相同的配置来源规则。

早期格式转换所需的历史配置实现由升级适配代码延迟加载，其调用范围限于历史版本处理。正常运行使用 `app.config` 定义的模型与公开方法。历史兼容由文件升级流程和字段级 `legacy()` 声明共同承接。

## 11. 行为验证范围

框架的隔离验证覆盖字段声明、事务执行、文件保存和接口契约，验证结果对应以下技术特性：

1. 默认值：各配置实例独立创建分组和可变字段，默认值经过字段校验。
2. 标准类型：路径按存在性和目录边界归一化，日期时间写入 UTC，敏感字段按受众序列化。
3. 冷态与请求：校验过程与激活、保存分离，省略字段与显式空值具有不同含义。
4. 暂存隔离：整字段赋值与集合操作按执行者、作用域分别排队，提交只读取匹配的暂存。
5. 事务回退：逐操作事务独立回退，显式事务及同 Task 信号链共享外层回退边界。
6. 业务锁：S 锁拒绝热态写入，X 持票上下文可以提交，解锁按票据释放覆盖范围。
7. 信号与引用：有效订阅在工作区完整复刻，目标删除和类型变更采用一致的引用判定。
8. 持久化：防抖合并保存请求，失败根独立重试，`flush()` 与自动保存串行执行。
9. 内存导出：导出读取稳定 live 状态，配置文件布局和明文受众由管理器统一处理。
10. 兼容与契约：字段级兼容集中于 `legacy()`，文件升级支持进度恢复，接口契约从配置声明派生。

这些验证在临时目录中使用隔离文件及设备、通知替身，真实用户配置与外部服务处于验证范围之外。
