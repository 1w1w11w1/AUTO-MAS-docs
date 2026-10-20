# 运行

## 要点

- 任务只来自用户页的任务队列（`Task.TaskSnapshot`）；宿主建好运行计划，随 job 文件交给 worker 子进程。
- 选项覆盖顺序照 PI / MXU / MaaPiCli：全局组按用户的全局表，资源 / 控制器 / 任务组按任务自己的值；同一任务内多份覆盖**递归深合并**。
- 三级时限：整轮硬超时 `Run.RunTimeLimit`、单任务时限 `Run.TaskTimeLimit`、实验性的原地打转检测 `Run.LoopGuard`（默认关）。MFW **不做日志停滞超时**。
- 一处失败就关掉 MAS 启动的游戏 / 模拟器、整轮重来；非周期任务默认全部重跑，只有风味显式声明的才不补跑。
- 风味可声明关键任务、收尾任务、不可选任务；项目可在节点上声明停服维护 / 需要更新信号与打转豁免。

## 任务快照

| 设计 | 为什么 |
| --- | --- |
| `Task.TaskSnapshot` 是 JSON 字符串：`taskOrder / taskChecked / taskOptions / globalOptions`，可选 `taskLabels` | 用户页是唯一任务来源 |
| 队列元素是**实例 id**：第一份沿用任务名，之后是 `<任务名>__MAS_DUP__<随机后缀>`；解析时先查整串是不是合法任务名（[#660][660]） | 同一任务可重复入队、旧配置零迁移；任务名本身带分隔符也不误判 |
| MFAA 私有扩展 `repeatable + repeat_count` 与任务表里的同名任务，都展开成重复实例（上限 99），不做 runner 内循环（[#973][973]） | 失败按 MAS 规则继续下一份 |
| 「每日 / 每周 / 每月仅一次」按任务名记，同一轮内也只安排一次（`runner_task._filter_period_once_tasks`） | 先跑的那份成功会把整个任务名记成完成，同轮还没跑的副本会被误跳过 |
| 显示名 `taskLabels` 只存在那一份实例上，不改任务名；运行与项目更新仍按实例 id 匹配，运行日志仍用 interface 的 label（[#1301][1301]） | 显示名只影响界面 |
| 快照为空时按 `Task.SelectedPreset` 套项目预设；套模板、导入其他用户队列时把它写空（[#1260][1260]） | 避免空快照误套预设 |
| 保存的选项值对不上当前 interface（项目改了 case 名）时退回默认，并在运行日志开头的「运行计划提示」里各列一句（`run_plan.describe_stale_option_values`） | 不静默 |
| interface 里已经没有的任务：队列里留成虚影；运行时记跳过并写进运行总览；有失效任务时照常算完成，但报告标出「有失效任务」并算进汇总的未完成数（[#1147][1147]） | 改名后旧任务曾静默消失，一编辑就永久丢失 |

## 全局选项

| 设计 | 为什么 |
| --- | --- |
| `global_option`（连同 case 下挂的子选项）每个用户只存一份，在 `globalOptions`；用户页在队列上方只显示一次（[#1294][1294]） | PI 语义就是全局的 |
| 同一选项也被任务 / 资源 / 控制器引用时，它按任务存值、任务的值生效；只有「只属于全局」的选项，任务上的值不生效 | 与 PI 示例的结果一致 |
| 判「只属于全局」要用**不按当前资源 / 控制器过滤**的选项表 | 否则一个还被未选中资源引用的全局选项会被误判，盖掉用户的全局值 |
| 风味走 `task_ids` 建计划时必须把 `global_options` 一并传给 `build_plan` | 漏传不报错，全局选项会静默回到默认值 |
| 旧配置迁移：全局表里缺或坏的项，取队列里第一个勾选的、带合法值的实例；前后端同一口径 | 升级不丢值 |
| **降级兼容双写**：保存时把只属于全局的值抄到每个任务实例上（`task_config.mirror_global_options_to_tasks`），新版本不读这些副本 | 旧版本运行期按任务读；旧版本保存会丢掉 `globalOptions`，升级回来靠副本找回 |
| 从同脚本其他用户导入队列不带全局选项 | 导入只换队列 |

资源组、控制器组里的选项与任务选项一样**按任务各存一份**，与 MXU 一致。

## 预设、自定义模板与导入

| 设计 | 为什么 |
| --- | --- |
| 「应用预设」直接替换队列，不再确认 | 预设的既有语义 |
| 自定义模板存在脚本级 `Task.Templates`，同脚本的用户共用，风味子类自动继承，不写进项目目录（[#1260][1260]） | 模板属于 MAS 配置，不属于项目 |
| 存模板时去掉虚影、受管任务与**密码值**；同名不覆盖；失效的模板照常显示并标出数量，全部失效时「应用」置灰但仍可删 | 密文不跨用户；模板不该静默消失 |
| 从同脚本其他用户导入：覆盖当前队列，当前的前置任务留在最前，失效与受管任务跳过，密码值不带 | 同上 |
| 运行器只读快照，不读 `Task.Templates` | 模板只是快照的一种来源 |

## 运行计划

| 设计 | 为什么 |
| --- | --- |
| `run_plan.build_maafw_run_plan` 产出每个任务的 pipeline override；`run_plan.resolve_run_selection` 是选控制器与资源的唯一口径（脚本资源留空时按控制器回落） | 运行期、保存钩子与风味整理三处要一致 |
| `pipeline_override.deep_merge_pipeline_override`：子键逐层合并，数组与标量后者覆盖前者 | 深合并不丢作者分头写的字段，与 CFA 一致；**不要为了与 MFAA / MXU 一致改成整体替换** |
| select 的私有 `default` 故意不认 | 作者自己的 MXU / MFAA 外壳都不认，认了反而比作者更激进 |
| 字符串 input 没填时目前不回退 `default` | 有项目把 `default` 写成字面量「占位」，当值发出去任务会卡住。口径已定要改：空字符串视为未填、运行时回落 `default`，与数字 / 布尔输入一致；尚未合入，以代码为准 |
| 数字 / 布尔输入没填或填错：跳过这个选项的覆盖并告警，不让整轮失败 | 发行包的小毛病能降级就降级 |
| checkbox 的 `min_count / max_count` 不满足时报错（`MaaFWCheckboxCountError`），不静默截断 | — |
| 加载器容错：缺 import 文件、`scan_dir` 不在、缺 `interface_version`（按 2 处理）都只告警，告警进运行日志开头与导入报告 | interface 由别的客户端写出，读不出来就是整个项目用不了 |
| `agent.timeout`（秒）只决定等 agent 连上的预算（不写或 -1 为 10 分钟），连上之后不限时；写死的 `agent.identifier` 运行时拼上实例后缀，纯数字（端口）原样用 | 与 PI 语义一致；多开不撞名 |

## worker 与 job 文件

| 设计 | 为什么 |
| --- | --- |
| worker 以 `python -m` 启动，工作目录是应用根，并设 `PYTHONSAFEPATH=1` | 受监督布局下应用根还有一棵随安装包带来的旧源码，不设会导入旧代码 |
| job 文件新增字段要求宿主与 worker 同版本；旧 worker 遇到不认识的字段会静默忽略 | 混跑时优雅退化 |
| worker 每完成一个任务就上报一次，宿主累计；周期任务的完成标记放在收尾的 `finally` 里 | 超时、取消、崩溃都不丢进度 |
| 连上控制器后先截一张图（`runner._prime_first_screencap`），每次连接一次，失败只记日志（[#1029][1029]） | 控制器没截过图时 `cached_image` 会抛错、`resolution` 是 (0, 0)，有的项目在第一个任务开始时就读它们并停掉自己；MFAAvalonia 也这样做 |
| 用户配置在运行前深拷贝成副本使用，收尾解锁后**整表写回**（[#737][737]） | 代理次数、剩余天数、上次状态、周期记录才能落盘 |
| 在工作线程里跑的钩子与回调写日志，一律经 `loop.call_soon_threadsafe` 转回事件循环 | 直接写会抛「no running event loop」，又被容错吞成一句「失败继续」 |

## 时限

| 设计 | 为什么 |
| --- | --- |
| `Run.RunTimeLimit`（MFW 默认 120 分钟）是套在单个用户整次运行上的**硬超时**，与其他专项的「日志停滞超时」同名不同义 | MFW 里有没有日志与卡没卡住无关：卡住时照样刷日志，正常时长动作可以很久不出声 |
| 截止时刻随 job 下发，worker 到点自己停下当前任务、截一张超时图，带着已完成的任务正常回传；宿主只在其后加一段宽限兜底，worker 没停下才强杀（[#880][880]） | 以前强杀既没截图也没进度 |
| `Run.TaskTimeLimit`（默认 45 分钟，0 表示不限）与按任务名覆盖的 `Run.TaskTimeLimitOverrides`；风味可用类属性 `DEFAULT_TASK_TIME_LIMIT_OVERRIDES` 内置几条（[#1180][1180]） | 一个卡住的任务不该吃掉整轮 |
| 单任务超时只停那一个、截图：计划里第一个任务或风味的关键任务超时就结束本轮，其余记一条失败后继续；**继续之前先等停止真正生效**（上限 60 秒）（[#1296][1296]） | `post_stop` 后当前任务还要跑完手上的节点，这期间新投的任务会被框架拒掉 |
| 「本任务超时」的判断必须放在「脚本侧强停」判断之前 | 我们自己的 `post_stop` 也会让 tasker 进入停止状态，顺序反了会被当成脚本侧强停，跳过本轮剩余任务 |
| 分钟到秒的换算只有一处 `runner_task.task_time_limits_from_config`，宿主算好随 job 下发 | worker 是独立进程，读不到配置 |

## 原地打转检测

| 设计 | 为什么 |
| --- | --- |
| `Run.LoopGuard`，**实验性、默认关**；开关在「按任务设置时限」弹窗第一行（[#1223][1223]） | 判据是统计得来的，先让用户自己开 |
| 判据：节点名以不超过 8 步为周期连续重复、各轮都有物理动作（Custom 与 DoNothing 不算，没有物理动作的一轮让计数从头数）、至少 200 轮且持续至少 10 分钟、最近 30 轮的识别结果指纹不超过 4 种、单轮中位耗时不超过 20 秒；到 100 轮 / 5 分钟先写一行预警（`runner/loop_guard.py`） | 用生产运行记录回放标定：正常运行零误报，选关死循环约 10 分钟检出，设计上的轮询不判 |
| 命中后与单任务超时同一套收尾，截 `loop` 图 | — |
| 豁免写 `"attach": {"auto_mas_loop_guard": false}`，**不放进 `attach.auto_mas`** | `attach.auto_mas` 遇到不认识的键会忽略整个信号节点，而且写了它的节点会被 MAS 强制启用 |
| MaaFramework 通知里缺识别 / 动作详情（老版本）时整次运行不检测 | 缺失会被当成「指纹不变」而必中 |
| 覆盖不到「只等不动」型卡住 | 由单任务时限兜底 |

## 重试

| 设计 | 为什么 |
| --- | --- |
| 任一轮失败（不只超时）且还有下一轮：关掉**由 MAS 启动的**游戏 / 模拟器，下一轮重新启动；不是 MAS 启动的不碰；关模拟器时清掉缓存的连接信息（[#880][880]、[#1028][1028]） | 接回同一个卡住的窗口只会白等；模拟器重开后旧的进程号已经失效 |
| `Run.RunTimesLimit` 新建默认 3 | 脚本自己的加载超时偶尔抖一次就整轮失败 |
| 非周期任务**默认全部重跑**；风味可用 `skip_on_retry_entries` 显式列出「重跑纯属浪费」的任务，没列的照旧补跑（[#1296][1296]） | 启动类任务在游戏崩溃后必须重跑，只有作者知道哪些可以不重跑 |
| 每次尝试单独一份日志；新一次尝试开头写「上一次（第 N 次）：原因」，确实关过客户端才补「已重启游戏/模拟器」（[#1011][1011]、[#1295][1295]） | 否则失败原因被新日志冲掉，用户只看到莫名其妙的重试 |
| 架构不符、运行环境不可用、信号、需要更新客户端等不重试 | 每次都一样，重试只会多起停一次模拟器 |
| 任务前 / 后脚本每个用户各跑一次（[#638][638]） | 重试三次各跑三遍不对 |

## 关键任务、收尾任务、不可选任务

由风味声明，契约写在 `MaaFW/tools/embedded/flavor.py` 的模块说明里，详见 [风味](./flavor.md)。

| 声明 | 效果 |
| --- | --- |
| `abort_round_entries`（关键任务） | 失败或单任务超时即结束本轮，照常重试 |
| `nonfatal_entries`（收尾任务） | 失败、超时、打转、被脚本侧强停都只截图记一行，不算本轮失败、不重试；优先于「第一个任务超时就结束本轮」。用户停止、整轮时限、信号、游戏没能启动先于它处理 |
| `unselectable_entries`（不可选任务） | 预览返回 `unselectableReason`；用户页不让选，已在队列里的照常显示可删；运行时在风味装饰之前剔掉并记一行，因此上面两种声明对它不起作用 |

## 停服维护与需要更新信号

| 设计 | 为什么 |
| --- | --- |
| 项目在节点写 `attach.auto_mas`：字符串 `server_maintenance` / `client_update_required`，或对象 `{信号: [OCR 文本]}`，按识别结果里的文字匹配，固定先认维护（[#1091][1091]） | 维护画面常是没有出口的循环节点，原来会一直循环到硬超时再失败重试；引擎代码里不出现任何项目名 |
| MAS 在所有覆盖之后强制启用信号节点 | 项目自带的开关在 MAS 下不起作用 |
| 停服维护：用户记「跳过」、不扣次数、不重试，同脚本同资源的后续用户直接跳过；需要更新：判失败、不重试、不连带跳过 | 客户端版本跟设备走 |
| 不弹任务页提示，只在运行日志写一行并在收尾发一条正式通知；全员因维护跳过时不再发代理结果汇总 | 不打扰 |

## 热键映射

| 设计 | 为什么 |
| --- | --- |
| PI v2.8 的 `hotkey` 选项做成**脚本级** `Game.Hotkeys`（只存与默认不同的字段），弹窗配置，**仅 Win32**（[#1174][1174]） | 键位跟着游戏客户端走，不跟用户 |
| 运行时脚本级 > 任务快照 > interface 默认；坏值只回落那一个字段并告警 | 一个坏键位不该让整轮失败 |
| 弹窗按项目常驻一行说明支持几个修饰键，个数不符时标红并禁止保存 | — |

## PC 游戏启停

| 设计 | 为什么 |
| --- | --- |
| `Game.LaunchMode` 只有两态：`DirectExe`（默认，MAS 启动，结束后**一律关闭**）与 `AttachOnly`（其他方式启停，只接管窗口）。没有「结束后是否关闭」开关；DirectExe 下发现游戏已在运行也只接管、不关（[#843][843]） | 由 MAS 启动的由 MAS 关，别人启动的不碰，没有第三种组合需要用户选 |
| `Game.UnityResolution`（关 / 1920x1080 / 1280x720）：按 `<exe>_Data/app.info` 反查注册表，只改 Unity 播放器那一层，游戏关闭后恢复；日志写「已尝试」（[#1146][1146]、[#1231][1231]） | 这是通用选项，**不做逐游戏适配**；游戏自有的那层分辨率由该游戏的风味或专项自己调 |
| 启动后的等待没有单独的配置项，上限就是 `Game.WaitTime`；只在游戏是本轮刚启动时生效，从窗口出现起算；画面连续 5 秒不变，或连续 20 秒有内容（哪怕一直在动）就提前下发（[#889][889]、[#899][899]） | 固定等待太慢；动态登录页「不变」永远不成立 |
| ADB 下启动模拟器时按包名一并拉起游戏；包名从 pipeline 的 `StartApp` 推断，推不出或有多个候选就不猜，`Game.PackageName` 填了即手动覆盖（[#638][638]、[#855][855]） | interface 规范里没有包名字段 |

## 截图、日志与打码

| 设计 | 为什么 |
| --- | --- |
| 失败截图都落 history，只有**最终失败**的运行才随通知发出（最多 4 张）；中间尝试失败、最终成功不推送（[#841][841]） | 不轰炸 |
| history 里的 `.maafw.log` 是原生日志本次运行部分的按字节原样副本；MAS 自己的输出另存 `.worker.log`；项目 agent 自写的日志另存 `.project.log`（[#881][881]、[#1117][1117]） | 可以原样转交脚本作者 |
| `maa_option.json` 里 `logging` 写 `true` | 这是上游默认；MaaFramework 没有文件日志级别，只有开和关 |
| PI `password: true` 的输入值在快照里是带 `mas-dpapi:` 前缀的密文；MAS 自己的日志出口对长度不少于 4 的密码打码，更短的**不打码** | 一两个字符全局替换会让整份日志没法看；框架自己写的 `debug/maafw.log` 里是原文，MAS 管不了 |
| 带 `[MaaFW 详情]` 前缀的行只进 `.worker.log` 与后端日志，界面只给结论 | 新增日志出口也要拦 |
| 子进程输出进日志一律按**结尾**截 | 截开头会正好丢掉异常那一行 |
| 资源 hash 不一致只进详情日志（[#1151][1151]） | 用户没法处理 |

[638]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/638
[660]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/660
[737]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/737
[841]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/841
[843]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/843
[855]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/855
[880]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/880
[881]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/881
[889]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/889
[899]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/899
[973]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/973
[1011]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1011
[1028]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1028
[1029]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1029
[1091]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1091
[1117]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1117
[1146]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1146
[1147]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1147
[1151]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1151
[1174]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1174
[1180]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1180
[1223]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1223
[1231]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1231
[1260]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1260
[1294]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1294
[1295]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1295
[1296]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1296
[1301]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1301
