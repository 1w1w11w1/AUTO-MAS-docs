# 风味（特调）

本页是风味的**设计说明**：为什么这样设计、钩子与契约的全集、两个现有风味逐项是什么样。要动手做一个新风味，按操作指南 [风味专项开发](../maafw-flavor.md) 的步骤走。

## 要点

- 风味 = `MaaFWConfig` 的**同形子类** + 类属性 `FLAVOR = "模块路径:属性名"` 指向一个钩子对象。它不是专项：运行、更新、内嵌副本、通知、失败截图、周期任务、代理次数全部是 MFW 引擎的既有语义，风味一行不重写。
- 后端协议只有三个必需成员（`type_key`、`matches_project`、`decorate_selection`）；其余全部是**按 `getattr` 探测的可选钩子与可选声明**，不进协议。
- `app/task/MaaFW/` 里不出现任何风味的名字（注释举例除外）；风味逻辑只能经 `FLAVOR` 进入。
- 前端注册表是唯一事实来源：描述对象只写与 MFW 不同的部分；定制由浅到深分三级——差异字段、分节替换 / 插入点、整页；**描述对象里不许有布尔行为开关**。
- 脚本类型由项目决定：导入后按 `matches_project` 原地换类型，uid 不变，双向自动。

## 什么时候做风味

| 需求 | 放在哪里 |
| --- | --- |
| 所有 MaaFramework 项目都需要的能力 | MFW 引擎 |
| 某个项目独有的身份、文案、运行前任务编排、少量独有表单 | 风味 |
| 原生编辑器会话、登录切号、按游戏语义组织的专属界面 | 专项（不是风味） |
| 游戏内任务怎样执行、结果怎样判定 | 项目自身；AUTO-MAS 不重写项目逻辑 |

## 后端：协议与可选钩子全集

协议与全部契约写在 `MaaFW/tools/embedded/flavor.py` 的模块说明里，下表是摘要。M9A 的实现在 `app/task/M9A/flavor.py`，MSS 在 `app/task/MSS/flavor.py`。

| 成员 | 必需 | 何时调用 / 效果 |
| --- | --- | --- |
| `type_key: str` | 是 | 脚本类型键，日志与通知里用 |
| `matches_project(interface_model) -> bool` | 是 | 导入后决定脚本类型。`flavor.decide_project_config_class` 按 `CLASS_BOOK` 的登记顺序取第一个认领者，否则通用 `MaaFWConfig`；抛异常只告警 |
| `decorate_selection(interface_model, task_ids, task_options, *, script_config, user_config, resource_name, send_log)` | 是 | 队列归一化（并剔掉不可选任务）之后、建运行计划之前调一次，返回新的 `(task_ids, task_options)`。在工作线程里运行 |
| `sanitize_task_snapshot(interface_model, snapshot, *, script_config, resource_name, user_info)` | 否 | 用户页保存、外壳配置导入建用户、配置恢复写 `Task.TaskSnapshot` 之前调用；返回整理后的快照与要一并写进 `Info` 的字段。读不到 interface 时不调用 |
| `async ensure_game_updated(*, script_config, resource_name, package_name, adb_path, adb_address, if_auto_install, progress)` | 否 | `Run.GameUpdateMode` 不是关闭、控制器是 ADB 时，在启动模拟器之后、第一个任务之前每个用户每次运行调一次。返回 `app.utils.game_update.GameUpdateResult`：需要手动更新时本用户判失败且**不重试**；抛异常只告警，`CancelledError` 必须向上传 |
| `abort_round_entries: dict[str, str]` | 否 | 关键任务（entry → 失败时的说明）：失败或单任务超时即结束本轮，照常重试 |
| `nonfatal_entries: dict[str, str]` | 否 | 收尾任务：失败、超时、原地打转、被脚本侧强停都只截图记一行，不计入本轮失败、不触发重试；优先于「第一个任务超时就结束本轮」；与关键任务重复声明时按收尾处理。用户停止、整轮时限、信号、游戏没能启动先于它处理（[#1296][1296]） |
| `skip_on_retry_entries: frozenset[str]` | 否 | 重试时，本次运行里任一次尝试已完成过的这些任务不再补跑（按份数计）；worker 崩溃、拿不到结果的那次尝试不参与（[#1296][1296]） |
| `unselectable_entries: dict[str, str]` | 否 | 不可选任务（entry → 原因）：预览返回 `unselectableReason`；用户页不让选，已在队列里的照常显示可删；运行时在 `decorate_selection` 之前剔掉并记一行。因此优先于上面三种声明（[#1296][1296]） |
| `supports_mod_avd: bool` | 否 | 声明能用魔改 AVD 模拟器；没声明的风味与通用 MFW 在保存和运行时都会被拒绝（[#1238][1238]） |
| 配置类属性 `DEFAULT_TASK_TIME_LIMIT_OVERRIDES` | 否 | 风味内置的按任务时限（JSON 字符串，任务名 → 分钟）；通用 MFW 脚本因导入项目换成该风味时，用户覆盖表还是空的才补上（`flavor.user_config_type_transform`） |

### 为什么可选成员不进协议

`MaaFWFlavor` 是 `runtime_checkable` 的 Protocol。把可选钩子写进协议，没实现它的风味在 `isinstance` 检查时就不满足协议，整个退回通用 MFW。所以可选成员一律用 `getattr` 探测（`resolve_game_update_hook`、`resolve_snapshot_sanitizer`、`unselectable_entries` 等），缺了就当没有。`skip_on_retry_entries` 用集合而另几个用字典，是因为它没有逐任务的话要说——跳过原因统一是「前面的尝试已完成」。

### 接线约束

| 约束 | 为什么 |
| --- | --- |
| `XConfig(MaaFWConfig)` 只改 `DEFAULT_SCRIPT_NAME`、`USER_CONFIG_CLASS`、`FLAVOR`；`FLAVOR` 是字符串，由引擎按需导入 | `app.models` 不能反向导入 `app.task`；`ConfigBase` 子类不能在 `super().__init__()` 之后覆盖条目，所以用类属性 |
| `app/core/task_manager.py` 的 `_MANAGER_BOOK` 按类型精确查表，`XConfig` 要单独登记到 `MaaFWEmbeddedManager`；`app/core/config.py` 里 `isinstance(…, MaaFWConfig)` 的分支天然覆盖子类，不要再加风味分支 | — |
| 凡是按类装用户子配置的地方都用 `type(script_config).USER_CONFIG_CLASS` | 写死 `MaaFWUserConfig` 会让子类用户全部丢失，只报「没有可运行的用户」 |
| `decorate_selection` 在工作线程里：`send_log` 由引擎转回事件循环；检查阶段的提示会在本用户日志建好后并入（[#1197][1197]） | 直接写界面日志会抛「no running event loop」 |
| 风味在 `decorate_selection` 里抛异常 = 运行计划构建失败：该用户记异常、发错误通知、不运行，其他用户照常 | M9A 用它拒绝需要拆分的用户 |
| 返回新的列表与字典，不改写入参；按 entry 找不到任务时写一行用户日志后跳过 | 任务名可能随项目版本变 |

## 前端：注册表、描述对象与契约

| 设计 | 为什么 |
| --- | --- |
| 注册表 `frontend/src/composables/useMaaFWFlavor.ts`：`FLAVOR_REGISTRY satisfies Record<MaaFWFlavorType, MaaFWFlavor>`，类型加了成员却没登记 typecheck 直接报错；公共代码只按描述对象取值，不写 `type === 'X'`（[#1013][1013]） | 散落的类型分支曾在新增风味时漏改 |
| 描述对象用 `views/EditView/MaaFWFlavor/defineFlavor.ts` 的 `defineMaaFWFlavor` 声明，只写差异：身份字段、`routes.suffix`、`create.card` 必写；`scriptPage.text`、`userPage.text`、`userPage.managed` 按字段浅合并（不写沿用 MFW、写 `null` 明确关掉）；`page`、`sections`、`slots`、`prepare` 不继承 | 风味只维护自己的一小段 |
| 分节替换：`defineMaaFWSection(part, key, load)`；替换组件必须接得住 `MaaFWFlavor/sectionContracts.ts` 里该分节的 props（接不住 typecheck 报错）；事件不在类型检查内，要按该分节的 `…Emits` 发出，或把 `$attrs` 透传给它包的 MFW 分节（[#1163][1163]） | 页面对默认分节与替换分节传同一组属性与监听 |
| 分节：脚本页 `basicInfo / control / update / run / shellImport`；用户页 `header / basicInfo / queueHeader / taskQueue`；新建流程 `source` | — |
| 插入点（`defineMaaFWLazyComponent`，组件以单个 `context` prop 接收上下文）：脚本页 `afterBasicInfo / beforeControl / besidePackageName / afterControl / afterUpdate / afterRun`；用户页 `afterBasicInfo / beforeTaskQueue / afterTaskQueue`（**都不进任务队列两栏**）；新建流程 `afterSourceStep`（只读） | 用户页两栏框架不动 |
| 整页替换：`scriptPage.page` / `userPage.page`，用 `views/EditView/Script/MaaFWScriptEdit/pageKit.ts`、`views/EditView/User/MaaFWUserEdit/pageKit.ts` 导出的分节与编排层（`useMaaFWScriptPage` / `useMaaFWUserPage`）拼，不复制 MFW 页面 | 这两个文件刻意不叫 `index.ts`：vite 解析时 `.vue` 排在目录之前，按目录名引入会拿到同名页面本身，而 typecheck 照样通过 |
| `prepare` 钩子：页面加载期间预取整页、分节、插入点组件与数据，失败不往外抛 | 避免独有区块先空一下再冒出来；独有区块失败不拖垮页面 |
| 需要新的插入点：在 `maafwFlavorTypes.ts` 的 `MaaFWFlavorSlotContextMap` 加名字，在公共页面对应位置放 `<MaaFWFlavorSlot>` | 不在公共页面里按类型分支 |

### 路由与页面宿主

- 路由由 `frontend/src/router/maafwFlavorRoutes.ts` 按注册表生成，每个类型四条：脚本编辑、项目引导、添加用户、编辑用户。新增风味不用改路由。
- 页面宿主 `MaaFWFlavor/MaaFWPageHost.vue`（逻辑在 `useMaaFWPageHost.ts`）读到脚本详情后按**实际类型**选页面：地址后缀与类型不符时 `replace` 到正确那条；导入后同一会话里类型变了，不跳转、就地换页面，引导进度不丢（[#1163][1163]）。
- 代价：页面要等读到脚本详情（几毫秒）才渲染；换来第一帧就是正确风味的图标与标题。

### 为什么描述对象里不许有布尔开关

描述对象只承载身份、文案、受管任务这类数据与独有组件，不承载「这个风味要不要做某种通用行为」的布尔量。行为差异要么是数据（受管任务列表、插入点组件），要么由脚本实际类型推出。加一个布尔开关，等于把 `type === 'X'` 换个写法塞回公共代码，几个开关一组合，公共页面又变回按类型分支。`useMaaFWFlavor.test.ts` 会遍历描述对象，出现布尔值就失败。

## M9A

后端 `app/task/M9A/`（`flavor.py`、`managed.py`、`game_update.py`、`migration.py`），前端 `MaaFWFlavor/m9a/`。

| 项 | 设计 | 为什么 |
| --- | --- | --- |
| 认领 | `mirrorchyan_rid == M9A`、`github` 指向 `MAA1999/M9A`、`name == m9a` 任一 | 已用通用 MFW 跑 M9A 项目的脚本也会自动切成 M9A |
| 受管任务 | entry `StartUp`（启动游戏）、`SwitchAccount`（切换账号）、`Close1999`（关闭游戏）由 MAS 全权控制，不许留在用户队列，不能手动添加；按 entry 判，不按任务名。规则只写在 `managed.py` 一处，运行前装饰、启动整理、旧版迁移、保存入口都调它（[#1023][1023]） | 用户手动排的顺序会与自动加入冲突 |
| 切号换算 | 只数「勾选且账号非空」的：1 个 → 账号进上方「账号」（`Info.Account`）并移出队列，原值不同时队列优先、原值进备注；0 个 → 直接移出；2 个及以上且资源是官服 → 原样保留，备注与启动通知写明要拆成几个用户，运行时拒绝该用户；2 个及以上但不是官服 → 直接移出 | 一个用户对应一个账号；切号只在官服生效 |
| 保留态 | 判据是队列内容本身（有效切号 ≥ 2 且官服），不靠标记；前端不许过滤掉已在队列里的受管任务再保存 | 普通保存交回同一份队列照样判成保留 |
| 官服判断 | 一律取引擎的 `run_plan.resolve_run_selection`（资源留空时按控制器回落），风味里不另写回落 | 三处入口要一致 |
| 运行前装饰 | 先把三类受管任务全部剔掉，再按固定顺序补：启动游戏放最前 → 官服且有账号时切换账号紧跟其后（账号填进它第一个输入项）→ … → 关闭游戏放最后；剔完为空就什么都不补。不碰重试、周期、超时、更新 | 用户排的顺序不影响这三项 |
| 关键 / 收尾 | 切换账号是关键任务；关闭游戏是收尾任务 | 切号失败后的任务都会跑在错误账号上；只因关闭失败就整轮重来不值得 |
| 重试不补跑 | 逐个列出当前版本全部非受管任务的 entry；M9A 新增的任务默认照旧补跑 | 确认重跑无意义再加 |
| 不可选 | 5 个小游戏（`8bit`、`CritterCrash`、`MusesBoxStartParty`、`PreStormProtocolStart`、`CompleteInduction`） | 要用户先手动停在对应页面，M9A 没有导航 |
| 内置时限 | 智能均衡刷材料 45、自动深眠 60、自动醒梦 60 分钟（`M9AConfig.DEFAULT_TASK_TIME_LIMIT_OVERRIDES`） | 这几个任务耗时波动大 |
| 魔改 AVD | `supports_mod_avd = True` | 魔改 AVD 目前只适配 M9A |
| 游戏客户端更新 | `Run.GameUpdateMode`（关闭 / 仅检查 / 自动下载安装，默认关闭；字段放在 `MaaFWConfig` 上保持同形）；只检查官服且包名 `com.shenlan.m.reverse1999`；直链取自官网接口，版本用 HTTP Range 只读安装包清单；本机 versionCode 高于官网包（其他渠道装的）时直接判失败、不下载；下载与安装各 60 分钟上限（[#1010][1010]） | 强制更新后旧客户端一启动就弹窗，整轮失败且没有任何提示 |
| 前端 | 「游戏更新」下拉挂插入点 `besidePackageName`；`userPage.managed.entries` 与 `managed.py` 的 `MANAGED_ENTRIES` 同一组，受管任务被挡在「添加任务」与预设之外；`accountTask`（切换账号 + 官服）是拆分判据：只有页面上生效的资源是官服、有效切号 ≥ 2 才给「拆分前不会运行」警告，其余残留只给轻提示（`views/EditView/User/maafwManagedTasks.ts`） | 前后端改一边要同步另一边 |
| 旧版迁移 | 在 `ScriptConfig.connect()` **之前**改原始 JSON，改写前备份并只保留三份，幂等；`Run.RunTimeLimit` 固定 120；自动更新模式显式写入；用户级服务器转成脚本级资源（不一致的用户停用并写备注）；CDK 依次从外壳配置、MAS 全局、GitHub 推导；输入值只清「占位」这一个哨兵（[#973][973]、[#1012][1012]） | 配置加载器只认声明过的条目，旧键在加载那一刻就丢；旧的运行时限是日志停滞阈值，语义不同 |
| 启动整理 | 每次启动按 `managed.py` 整理全部 M9A 用户，有改动才写盘、备份并发一条通知 | 收齐各种来源的残留 |
| 备份恢复 | 走 MFW 的备份池；旧版 M9A 归档不再列出、不支持恢复，原地保留 | 归档根不同 |

## MSS（星塔旅人 / MaaStellaSora）

后端 `app/task/MSS/flavor.py`（另有只读的 `api_service.py` 给用户页取灾变防线状态），前端 `MaaFWFlavor/mss/`。

| 项 | 设计 | 为什么 |
| --- | --- | --- |
| 认领 | `mirrorchyan_rid == SSAH`，或 `github` 仓库名 / `name` 等于 `MaaStellaSora` 或以 `MaaStellaSora-` 开头；只给组织主页时取不到仓库名，不认领（[#1141][1141]） | 官方版与个人版等衍生版都认；同前缀但没有连字符的不认 |
| 认领只定类型 | 更新谱系仍按 interface 里的原文 `mirrorchyan_rid` / `github` / `name` 各自分开 | 衍生版不会被官方更新覆盖——除非它照抄了官方的 `mirrorchyan_rid` |
| 计划表 | 用户 `Info.PlanMode` 引用了 MSS 计划表时，按当天的槽位改写 entry `战斗_入口`（悬赏试炼快速战斗）的五个选项；队列里没有这个任务就补上；关卡名不在 interface 的 case 里就整条跳过；选「固定」时不动（[#959][959]） | 保留原专项的计划表能力 |
| 活动 | 队列里有 `活动快速战斗_入口` 时查一次官网排期（`app/tools/stella_official.py`）：有活动就挪到悬赏试炼前，确实没有就摘掉，取不到数据就原样跑；队列里只剩活动任务时不摘空。`Info.IfActivityFirst`（默认开）开着且确认在活动期时，队列里没加也会自动补上 | 摘空会让引擎判「无法构建运行计划」；取不到数据时乱加会多跑一个不该跑的任务 |
| 周常 | `星塔_入口_agent`（新版爬塔）挪到队尾；每周一次靠通用的 `Run.WeeklyOnceTasks` | 不在风味里记周 |
| 个人版灾变防线 | 全局的个人版开关（`Function.IfPersonalMss`，默认关，入口在设置页的「神秘入口」）打开、且项目是个人版时生效：按官网那一期公告的开始时刻记账（`Data.PersonalMssDefense`），这一期没打过就补进队列（爬塔之前），整轮成功才算打过；失败按天记一笔，攒够三天放弃这一期；记录写不进去就不编排（[#1166][1166]） | 一期只能打一次，游戏里没有可读的状态，脚本自己也不幂等 |
| 只适配桌面端 | 脚本页控制方式一步顶部写明原因；引擎不拦 ADB | 模拟器端启动不了游戏 |
| 配置 | `MSSConfig` 与 `MaaFWConfig` 同形；`MSSUserConfig` 多 `Info.PlanMode`、`Info.IfActivityFirst`、`Data.PersonalMssDefense` | — |
| 前端 | 脚本页 `beforeControl` 挂「只支持桌面端」提示；用户页 `beforeTaskQueue` 挂计划表下拉、活动优先开关、灾变防线区块；`prepare` 预取计划表选项。灾变防线整块只在个人版开关打开后才渲染，开关值与本期记账一起由只读接口 `app/task/MSS/api_service.py` 的 `defense_status` 返回（[#1309][1309]） | 独有区块按需加载；普通用户看不到与自己无关的控件；「这一期」只有后端一处算法，前端不复刻 |
| 管理员权限 | 不需要原专项的「以管理员启动」：安装包本身要求管理员权限，Runtime、后端、worker、游戏一路继承 | 内置运行不再拉起外壳 |

## 检查清单（审查风味相关改动时）

- `app/task/MaaFW/` 里有没有出现风味名字或按类型分支？
- 新增的可选钩子 / 声明有没有写进 `MaaFW/tools/embedded/flavor.py` 的模块说明，且用 `getattr` 探测？
- 前端描述对象里有没有布尔值？公共页面里有没有 `type === 'X'`？
- 受管任务在前后端是不是同一组 entry？
- 改了 `decorate_selection` 的地方，有没有返回新对象、按 entry 找任务、找不到时写日志？

[959]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/959
[973]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/973
[1010]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1010
[1012]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1012
[1013]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1013
[1023]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1023
[1141]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1141
[1163]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1163
[1166]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1166
[1197]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1197
[1238]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1238
[1296]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1296
[1309]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1309
