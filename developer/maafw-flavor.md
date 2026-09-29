# 风味专项开发

MFW 是运行 MaaFramework 项目的通用引擎。项目已有 `interface.json`，只需要在 AUTO-MAS 中运行和配置任务时，直接使用 [MFW 项目指南](/docs/script-guide/maafw) 即可。只有项目确实需要自己的脚本类型、文案或少量运行前规则时，才需要做“风味专项”（代码中称为 flavor）。

M9A 和 MSS 是现有例子：它们复用 MFW 的项目导入、运行环境、更新、任务执行、通知与周期任务；各自只声明项目识别规则和项目独有行为。开始前先读主仓的 [`app/task/MaaFW/AGENTS.md`](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/AGENTS.md) 与 [`MaaFWFlavor` 契约](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/tools/embedded/flavor.py)。

## 先判断要不要做风味

| 需求 | 放在哪里 |
| --- | --- |
| 项目已有的任务、控制器、资源和选项 | 项目的 `interface.json`；MFW 直接读取 |
| 所有 MaaFramework 项目都需要的能力 | MFW 通用引擎 |
| 某个项目独有的身份、提示、运行前任务编排 | 风味配置与钩子 |
| 游戏内任务怎样执行、任务结果怎样判定 | 项目自身；AUTO-MAS 不重写项目逻辑 |

风味是主程序中的一种脚本类型，不是放进项目发行包的插件。一个普通 MFW 脚本导入被某个风味认领的项目后，会原地切换成该类型；换成其他项目时也会重新识别。脚本 ID 保持不变，但项目相关的任务队列需要重新检查。

## 后端：声明类型和钩子

1. 在 `app/models/config.py` 中建立 `XConfig(MaaFWConfig)`。通常只需设置 `DEFAULT_SCRIPT_NAME`、`USER_CONFIG_CLASS`、`FLAVOR = "app.task.X.flavor:FLAVOR"`。用户字段没有差别时，`XUserConfig` 可以是空的 `MaaFWUserConfig` 子类。`FLAVOR` 保持字符串，避免配置模型在导入时直接加载任务模块。
2. 把类型加入同文件的 `CLASS_BOOK`，并在 `app/core/task_manager.py` 的 `_MANAGER_BOOK` 中将 `XConfig` 映射到 `MaaFWEmbeddedManager`。为新配置类补齐 `app/models/schema.py` 中的请求和响应类型，再通过项目的 OpenAPI 生成流程更新前端 API；不要手改 `frontend/src/api/`。
3. 在 `app/task/X/flavor.py` 中导出 `FLAVOR` 对象。它至少要满足 `MaaFWFlavor` 协议：一个 `type_key`、一个 `matches_project(interface_model)`、一个 `decorate_selection(...)`。

`matches_project` 只根据项目的 `interface.json` 识别身份。优先选稳定的项目标识，例如 `mirrorchyan_rid` 或仓库地址；名称适合作为兼容性判据。引擎按 `CLASS_BOOK` 登记顺序选择第一个匹配的风味，因此判据不能把其他项目误认进来。

`decorate_selection` 在运行计划生成前接收**已经选中的任务实例 ID**和选项，返回新的 `(task_ids, task_options)`。可以插入、删去、排序项目独有任务，或按用户配置调整选项；不要在这里重做更新、重试、超时、游戏启停等通用流程。任务实例 ID 不一定等于任务名，处理重复任务时参考现有 M9A/MSS 实现。返回新列表和新字典，避免直接改写传入对象；项目缺少预期任务或选项时给出可读日志。

下面是接口形状示意，具体类型与调用约定以主仓的 `MaaFWFlavor` 为准：

```python
class XFlavor:
    type_key = "X"

    def matches_project(self, interface_model) -> bool:
        return str(interface_model.mirrorchyan_rid or "").casefold() == "x"

    def decorate_selection(
        self, interface_model, task_ids, task_options, *,
        script_config, user_config, resource_name, send_log,
    ):
        return list(task_ids), dict(task_options)


FLAVOR = XFlavor()
```

### 可选钩子

- `sanitize_task_snapshot`：保存用户任务快照前整理风味接管的任务，并可一并写入用户 `Info` 字段。仅在项目能读到、写入包含 `Task.TaskSnapshot` 时调用；运行前仍应按同一规则处理旧快照。签名和返回值见 [`flavor.py` 的契约说明](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/tools/embedded/flavor.py)。M9A 的受管任务是参考实现。
- `ensure_game_updated`：需要检查游戏客户端版本时才实现。它是异步钩子，仅在 ADB 控制、脚本启用游戏更新时，在模拟器启动后、首个任务前调用；返回 `GameUpdateResult`。项目发行包的更新仍由 MFW 通用流程管理，这两个“更新”不是同一件事。

可选钩子不要加进 `MaaFWFlavor` 的必需协议。缺少可选钩子的风味也必须能正常加载。

## 前端：登记一个描述对象

脚本页、用户页、新建流程和路由复用 MFW 页面。新风味在 `frontend/src/views/EditView/MaaFWFlavor/x/index.ts` 导出符合 `MaaFWFlavor` 类型的描述对象，再登记到 `frontend/src/composables/useMaaFWFlavor.ts`。它统一提供类型名、配置类名、图标、默认名、创建卡、文案 key、受管任务，以及需要时的独有区块。

还需补齐 `frontend/src/types/script.ts` 中的类型、`frontend/src/utils/scriptLogos.ts` 的图标与显示名、`frontend/src/composables/useScriptApi.ts` 的创建类型映射和词表。`maafwFlavorTypes.ts` 的 `MaaFWFlavorType` 与注册表也要包含新类型。具体清单写在 [`useMaaFWFlavor.ts`](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/frontend/src/composables/useMaaFWFlavor.ts) 文件顶部。

只有项目独有表单控件才使用 `slots`。现有 `userBeforeTaskQueue` 可以在用户任务队列前放额外字段；MSS 的计划表和活动开关展示了做法。没有独有区块时写 `slots: {}`。不要复制整张 MFW 脚本页或用户页。

## 验证与提交前检查

1. 用目标项目和一个普通 MaaFramework 项目各导入一次，确认类型能正确切换，且没有误认。
2. 核对重复任务实例、空队列、缺失任务或选项，以及用户编辑后保存的队列；有快照整理钩子时还要核对恢复配置后的结果。
3. 验证风味特有的运行顺序或选项，同时确认 MFW 通用的运行、项目更新和用户配置仍可使用。
4. 在目标工作树使用其本地依赖运行相关后端检查，以及前端 `typecheck`、`lint` 和相关测试；记录实际运行的命令与结果。若改了 schema，从该树的开发后端重新生成 OpenAPI。

只读参考：[M9A 风味](https://github.com/AUTO-MAS-Project/AUTO-MAS/tree/dev/app/task/M9A)、[MSS 风味](https://github.com/AUTO-MAS-Project/AUTO-MAS/tree/dev/app/task/MSS)。
