# 风味专项开发

MFW 是运行 MaaFramework 项目的通用引擎。项目已有 `interface.json`，只需要在 AUTO-MAS 中运行和配置任务时，直接使用 [MFW 项目指南](/docs/script-guide/maafw) 即可。只有项目确实需要自己的脚本类型、文案或少量运行前规则时，才需要做“风味专项”（代码中称为 flavor）。

本页是操作指南：照着步骤做一个风味。风味为什么这样设计、钩子与契约的全集、M9A 与 MSS 的逐项说明，见设计页 [风味](./maafw/flavor.md)；MFW 整体设计见 [MFW 设计总览](./maafw/index.md)。

M9A 和 MSS 是现有例子：它们复用 MFW 的项目导入、运行环境、更新、任务执行、通知与周期任务；各自只声明项目识别规则和项目独有行为。开始前先读主仓的 [`app/task/MaaFW/AGENTS.md`](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/AGENTS.md) 与 [`MaaFWFlavor` 契约](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/tools/embedded/flavor.py)（模块说明里写着全部可选钩子的契约）。

## 先判断要不要做风味

| 需求 | 放在哪里 |
| --- | --- |
| 项目已有的任务、控制器、资源和选项 | 项目的 `interface.json`；MFW 直接读取 |
| 所有 MaaFramework 项目都需要的能力 | MFW 通用引擎 |
| 某个项目独有的身份、提示、运行前任务编排、少量独有表单 | 风味配置与钩子 |
| 原生编辑器会话、登录切号、按游戏语义组织的专属界面 | 专项，不是风味 |
| 游戏内任务怎样执行、任务结果怎样判定 | 项目自身；AUTO-MAS 不重写项目逻辑 |

风味是主程序中的一种脚本类型，不是放进项目发行包的插件。一个普通 MFW 脚本导入被某个风味认领的项目后，会原地切换成该类型；换成其他项目时也会重新识别。脚本 ID 保持不变，但项目相关的任务队列需要重新检查。

`app/task/MaaFW/` 里不能出现具体风味的名字；风味的一切逻辑只经 `FLAVOR` 钩子进入。

## 第一步：后端配置类与登记

1. 在 `app/models/config.py` 中建立 `XConfig(MaaFWConfig)`，只设置类属性：`DEFAULT_SCRIPT_NAME`、`USER_CONFIG_CLASS`、`FLAVOR = "app.task.X.flavor:FLAVOR"`。`FLAVOR` 保持字符串，避免配置模型在导入时直接加载任务模块。用户字段没有差别时，`XUserConfig` 可以是空的 `MaaFWUserConfig` 子类。
2. 需要给某些任务内置单任务时限时，在 `XConfig` 上写类属性 `DEFAULT_TASK_TIME_LIMIT_OVERRIDES`（JSON 字符串，任务名 → 分钟）。
3. 把类型加入同文件的 `CLASS_BOOK`。引擎按 `CLASS_BOOK` 的登记顺序选择第一个认领项目的风味。
4. 在 `app/core/task_manager.py` 的 `_MANAGER_BOOK` 中把 `XConfig` 映射到 `MaaFWEmbeddedManager`（按类型精确查表，子类要单独登记）。`app/core/config.py` 里 `isinstance(…, MaaFWConfig)` 的分支已经覆盖子类，不要再加风味分支。
5. 为新配置类补齐 `app/models/schema.py` 中的请求和响应类型，再起开发后端通过 OpenAPI 生成流程更新前端 API；不要手改 `frontend/src/api/`。

## 第二步：后端钩子对象

在 `app/task/X/flavor.py` 中导出 `FLAVOR` 对象。它至少要满足 `MaaFWFlavor` 协议：一个 `type_key`、一个 `matches_project(interface_model)`、一个 `decorate_selection(...)`。最小示例：

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

- `matches_project` 只根据项目的 `interface.json` 识别身份。优先选稳定的项目标识，例如 `mirrorchyan_rid` 或仓库地址；名称适合作为兼容性判据。判据不能把其他项目误认进来。
- `decorate_selection` 在运行计划生成前接收**已经选中的任务实例 ID**和选项，返回新的 `(task_ids, task_options)`。可以插入、删去、排序项目独有任务，或按用户配置调整选项；不要在这里重做更新、重试、超时、游戏启停等通用流程。
  - 任务实例 ID 不一定等于任务名（同一任务重复入队时是 `<任务名>__MAS_DUP__<后缀>`），用 `resolve_task_instance_name` 解析；按 interface 任务的 `entry` 找任务，不按任务名。
  - 返回新列表和新字典，不要改写传入对象；项目缺少预期任务或选项时用 `send_log` 写一行可读日志后跳过。
  - 它在工作线程里运行；`send_log` 由引擎转回事件循环，直接用即可。
  - 抛异常等于这个用户的运行计划构建失败：该用户记异常、不运行，其他用户照常。只在确实不能运行时这样做。
- 资源名用传入的 `resource_name`，不要自己从配置里再推一遍（引擎已按控制器做过回落）。

### 可选钩子与声明

只在需要时实现。它们都按 `getattr` 探测，**不要加进 `MaaFWFlavor` 协议**——协议是 `runtime_checkable` 的，加进去后没实现它们的风味会整个退回通用 MFW。

| 名字 | 用途 |
| --- | --- |
| `sanitize_task_snapshot(...)` | 保存用户任务快照前整理风味接管的任务，可一并写入用户 `Info` 字段。仅在能读到项目、写入包含 `Task.TaskSnapshot` 时调用；运行前仍应按同一规则处理旧快照。M9A 的受管任务是参考实现 |
| `async ensure_game_updated(...)` | 需要检查游戏客户端版本时才实现。仅在 ADB 控制、脚本启用游戏更新时，在模拟器启动后、首个任务前调用；返回 `app.utils.game_update.GameUpdateResult`。项目发行包的更新仍由 MFW 通用流程管理，这两个“更新”不是同一件事 |
| `abort_round_entries = {entry: 说明}` | 关键任务：它失败或超时就结束本轮（照常重试） |
| `nonfatal_entries = {entry: 说明}` | 收尾任务：它失败、超时或被强停都不算本轮失败、不重试 |
| `skip_on_retry_entries = frozenset({entry, ...})` | 重试时本次运行里已经完成过的这些任务不再补跑。只列重跑纯属浪费、且不依赖本轮前面步骤的任务；逐个写出，新任务默认照旧补跑 |
| `unselectable_entries = {entry: 原因}` | 不可选任务：用户页不让选，运行时剔掉并记一行。用于 MAS 无人值守跑不了的任务 |
| `supports_mod_avd = True` | 声明能用魔改 AVD 模拟器 |

签名、调用时机与优先级见 [`flavor.py` 的模块说明](https://github.com/AUTO-MAS-Project/AUTO-MAS/blob/dev/app/task/MaaFW/tools/embedded/flavor.py)，设计说明见 [风味](./maafw/flavor.md)。

## 第三步：前端描述对象

脚本页、用户页、新建流程和路由都复用 MFW 的公共页面。新风味只写一个描述对象：

1. 在 `frontend/src/composables/maafwFlavorTypes.ts` 的 `MaaFWFlavorType` 加上 `'X'`。
2. 新建目录 `frontend/src/views/EditView/MaaFWFlavor/x/`，在 `index.ts` 里用 `defineMaaFWFlavor` 导出描述对象。**只写与 MFW 不同的部分**：身份字段、`routes.suffix`、`create.card` 必写；文案 key 只写要换的；没有独有区块就不写 `slots`。
3. 在 `frontend/src/composables/useMaaFWFlavor.ts` 的 `FLAVOR_REGISTRY` 里登记（漏登记 typecheck 会报错）。
4. 补齐全应用的脚本类型登记：`frontend/src/types/script.ts` 的类型、`frontend/src/utils/scriptLogos.ts` 的图标与显示名、`frontend/src/composables/useScriptApi.ts` 的创建类型映射、词表（zh-CN / en-US / ja-JP）里的类型名与类型描述。完整清单写在 `useMaaFWFlavor.ts` 文件顶部。

最小示例：

```ts
import { SCRIPT_LOGOS } from '@/utils/scriptLogos'
import { MAS_DOC_URLS } from '@/utils/openExternal'
import { defineMaaFWFlavor } from '../defineFlavor'

export const X_FLAVOR = defineMaaFWFlavor({
  type: 'X',
  scriptConfigType: 'XConfig',
  userConfigType: 'XUserConfig',
  defaultScriptName: '新 X 脚本',
  typeTagLabel: 'X',
  typeTagColor: 'blue',
  logo: SCRIPT_LOGOS.X,
  docUrl: MAS_DOC_URLS.scripts,
  routes: { suffix: 'x' },
  create: {
    card: {
      titleKey: 'scripts.type.X',
      descriptionKey: 'scripts.create.typeDesc.X',
      keywords: ['x'],
      group: 'specialized',
      after: null,
    },
  },
})
```

路由不用改：`frontend/src/router/maafwFlavorRoutes.ts` 会按注册表为每个类型生成脚本编辑、项目引导、添加用户、编辑用户四条路由，页面宿主按脚本实际类型选页面。

### 需要独有界面时

由浅到深，能用浅的就别用深的：

1. **插入点**：用 `defineMaaFWLazyComponent(() => import('./XField.vue'))` 写进 `scriptPage.slots` / `userPage.slots` / `create.slots`，组件以一个 `context` prop 接收上下文。现有插入点：
   - 脚本页：`afterBasicInfo`、`beforeControl`、`besidePackageName`、`afterControl`、`afterUpdate`、`afterRun`；
   - 用户页：`afterBasicInfo`、`beforeTaskQueue`、`afterTaskQueue`（都不进任务队列两栏）；
   - 新建流程：`afterSourceStep`（只读）。

   例如 MSS 在 `userPage.slots.beforeTaskQueue` 放计划表下拉与活动优先开关，M9A 在 `scriptPage.slots.besidePackageName` 放游戏更新下拉。需要预取数据时写 `scriptPage.prepare` / `userPage.prepare`。
2. **替换分节**：`defineMaaFWSection(part, key, load)` 写进 `sections`。替换组件必须接得住 `MaaFWFlavor/sectionContracts.ts` 里该分节的 props（接不住 typecheck 会报错），并按该分节的 `…Emits` 发出事件（或把 `$attrs` 透传给它包的 MFW 分节），否则改动不会保存。
3. **整页替换**：`scriptPage.page` / `userPage.page`，用 `views/EditView/Script/MaaFWScriptEdit/pageKit.ts`、`views/EditView/User/MaaFWUserEdit/pageKit.ts` 导出的分节与编排层拼，不要复制 MFW 页面。

需要一个现在没有的插入点：在 `maafwFlavorTypes.ts` 的 `MaaFWFlavorSlotContextMap` 加名字，并在公共页面对应位置放 `<MaaFWFlavorSlot>`。不要在公共页面里写 `type === 'X'` 分支，也不要往描述对象里加布尔开关（有测试会拦）。

## 检查清单

提交前逐条核对：

- [ ] 用目标项目和一个普通 MaaFramework 项目各导入一次，类型能正确切换，且没有误认。
- [ ] `app/task/MaaFW/` 里没有出现风味名字；公共前端页面里没有按类型分支；描述对象里没有布尔值。
- [ ] `decorate_selection` 处理过重复任务实例、空队列、缺失任务或选项、用户编辑后保存的队列；有快照整理钩子时还核对过恢复配置后的结果。
- [ ] 风味接管的任务（如果有）在后端整理规则与前端描述对象里是同一组 entry。
- [ ] 新增的可选钩子没有加进 `MaaFWFlavor` 协议。
- [ ] 验证过风味特有的运行顺序或选项，同时确认 MFW 通用的运行、项目更新和用户配置仍可使用。
- [ ] 在目标工作树用其本地依赖运行了 `tests/task/test_maafw_core.py` 与相关后端检查，以及前端 `typecheck`、`lint` 和相关测试；记录实际运行的命令与结果。改了 schema 的，从该树的开发后端重新生成了 OpenAPI。

只读参考：[M9A 风味](https://github.com/AUTO-MAS-Project/AUTO-MAS/tree/dev/app/task/M9A)、[MSS 风味](https://github.com/AUTO-MAS-Project/AUTO-MAS/tree/dev/app/task/MSS)、[前端风味目录](https://github.com/AUTO-MAS-Project/AUTO-MAS/tree/dev/frontend/src/views/EditView/MaaFWFlavor)。
