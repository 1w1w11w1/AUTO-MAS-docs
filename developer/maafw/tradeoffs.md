# 设计取舍

下面每一条都是「看起来像缺陷、其实是有意的取舍」。审查或修复 MFW 前先在这里查一遍；要推翻其中任何一条，请在 PR 里说明理由，并先与维护者讨论。

## 导入、副本与版本

| 行为 | 为什么 | 相关 PR 或代码 |
| --- | --- | --- |
| 导入后来源目录可以删、可以挪，运行时不读 `Info.Path` | 导入只是第一次选目录，之后完全在副本上运行 | [#973][973]；`embedded_project.resolve_maafw_project_root` |
| 导入后目录字段锁定，显示的是 MAS 内部的副本路径 | 导入后来源只是记录；换项目请新建脚本 | [#973][973] |
| 副本目录名只取脚本 id 前 12 位，不能手改 | 避免字节码前缀树的长路径超过 MAX_PATH | `embedded_project.embedded_copy_dir_name` |
| 没有「钉在某个版本」：同一项目、同一渠道的脚本永远同一版本，自动更新设为「不更新」的脚本也会被组里其他脚本的更新带着切 | 组 = 项目 + 渠道；「不更新」的含义是「这个脚本自己不联网查」 | [#973][973]；`view_update.run_view_update` |
| 「不更新」的文案保持不变 | 与既有界面一致；真实含义写在文档里 | — |
| 改渠道会降级（例如从测试版改回稳定版） | 改渠道就是换组，切换方向无关 | `embedded_project.switch_view` |
| 本地导入同版本或更旧版本时不登记，脚本立即用组的当前版本 | 组里容不下领先或落后的成员 | `payloads.register` |
| 远端渠道回滚不跟随 | 组的最新版只前进 | `payloads.register` |
| 脚本运行中不能手动更新，只会被同组其他脚本的更新在跑完后带着切 | 运行中不动文件 | `api_service/update.py` |
| 一个脚本一棵视图，不做多个脚本共用一份副本 | 运行期项目往目录里写什么 MAS 管不住 | [#973][973] |
| 不用只读属性保护共用文件 | 只读会让删除、替换、pip 卸载全部失败；改用尺寸、排除表与事后巡检 | `projection.is_shared_path`；`view_audit.py` |
| 回收只在启动时做，不保留「最近 N 版」 | 有引用就留、无引用就删 | `embedded_project.collect_payload_garbage` |
| 最后一个脚本删掉后，整个项目的版本（含最新版）一起回收 | 最新版不该永远占着盘 | 同上 |
| 换版本时账号记录这类运行期状态原样带走，但项目热更新缓存只取新版本那份 | 前者是用户状态；后者与随版本发布的数据成对 | `contracts.RUNTIME_STATE_FILES`、`VERSION_BOUND_STATE_FILES` |
| 换版本时被本地改过的受管文件以新版本为准，旧内容留档；钉回过的 maafw binding 不留档 | 项目热更新改写自己的文件是常态 | [#810][810]、[#1024][1024] |

## 投影

| 行为 | 为什么 | 相关 PR 或代码 |
| --- | --- | --- |
| 不带外壳程序、.NET 托管库、Qt 运行时、顶层运行期目录 | 内置运行从不启动外壳 | `project_update/projection.py` |
| 项目自带的 `maafw/`、`python/` 原样带走，不由运行池按版本重建 | 自带原生库可能是自定义构建，自带 Python 可能是特定版本 | [#973][973] |
| 未在 interface 里声明、不超过 64 MB 的顶层条目也带走 | agent 运行时会读这些文件 | `projection.UNDECLARED_KEEP_LIMIT` |
| 能确认是外壳才剔，确认不了一律保留；不按 `runtime`、`python`、`debug` 这类名字剔 | 按名字剔曾误删项目代码与资源 | [#1104][1104]、[#1117][1117] |
| `debug/` 不进载荷，但其中的非日志状态文件作为视图私有文件带上 | 有项目会读回放在 `debug/` 的状态 | [#1117][1117] |
| 导入时检测到混装原生库只提示、不删 | 删用户导入的东西风险大，清理放到全量更新时按新包判断 | [#1144][1144] |
| 不剔任何架构的文件 | 剔了就找不回 | [#1102][1102] |
| 源码形态不改写 interface，越界的 agent 入口由运行时兜底 | 一处兜底全对 | [#1294][1294]；`interface/agent_entry.py` |
| `child_exec: uv` 不支持 | uv 按项目锁文件另建环境，maafw 版本不可控 | `agent_entry.describe_uv_agent` |

## 更新

| 行为 | 为什么 | 相关 PR 或代码 |
| --- | --- | --- |
| 下载源、CDK、渠道、时机只看脚本级设置，不用全局兜底 | 全局那份服务 MAS 自身更新 | `tools/embedded/update_credentials.py` |
| 只有代理带全局兜底；GitHub 加速镜像只有全局一项 | 代理与镜像是网络环境属性 | [#943][943]、[#945][945] |
| 没有 sha256 摘要的资产不走镜像；区间差量只直连 github.com | 第三方转发的字节必须能校验 | [#945][945]、[#1157][1157] |
| 「检查更新」只查版本、不带 CDK，因此从不验证 CDK；CDK 状态另走专门的查询 | 带 CDK 会换下载地址、扣当日额度 | [#1330][1330] |
| 没有 `mirrorchyan_rid` 的项目无法检查更新（选 GitHub 源也一样） | 版本一律向 Mirror 酱查询 | `project_update/updater.py` |
| 下载没有整体超时，只有每次读取超时 | 慢但还在传的下载不该被砍 | [#945][945] |
| 新版本登记之后点停止不再响应 | 切换只要约 2 秒 | `view_update.run_view_update` |
| 一个脚本预检某版本失败后，同组谁也不再自动为它下载；手动更新可以强制重试 | 不重复白下 | `project_update/precheck_memo.py` |
| 全量更新会删掉导入时用户手动装进项目自带解释器的包 | 新包整体接管解释器目录，不清会新旧混装 | [#1157][1157] |
| 资源目录与接管目录之外的导入文件永远不清 | 曾误删用户放在 `preset/` 里的预设 | [#659][659] |
| 首次全量更新会清掉用户手放在资源目录里的覆写 | 没有基线时分不清旧版装的与用户放的 | [#659][659] |
| 开发者模式与源码形态的脚本不参与项目更新 | 以来源目录为准 | [#1294][1294] |
| 不采用下载 tag 源码包的「源码热更新」 | 结果与发行包不一致 | [#1157][1157] |

## 运行与选项

| 行为 | 为什么 | 相关 PR 或代码 |
| --- | --- | --- |
| 资源级、控制器级选项按任务各存一份（与 MXU 一致） | 与外壳的存法一致；只有全局组按用户一份 | [#1294][1294] |
| 同一选项既是全局选项又被任务引用时，任务的值生效 | 与 PI 示例的结果一致 | [#1294][1294] |
| 保存时把只属于全局的值抄到每个任务实例上，新版本不读这些副本 | 降级到旧版本后仍能读到、再升级回来能找回 | `task_config.mirror_global_options_to_tasks` |
| `pipeline_override` 递归深合并（不同于 MFAA / MXU 的整体替换） | 不丢作者分头写的字段，与 CFA 一致 | `pipeline_override.deep_merge_pipeline_override` |
| select 的私有 `default` 不认 | 作者自己的外壳都不认 | [#973][973] |
| 字符串 input 没填时目前不回退 `default`（口径已定改为与数字 / 布尔输入一致地回落，尚未合入） | 有项目把 `default` 写成字面量「占位」 | [#973][973] |
| 长度小于 4 的密码不打码 | 一两个字符全局替换会毁掉整份日志 | `option_secrets.MIN_REDACTED_SECRET_LENGTH` |
| 框架自己写的 `debug/maafw.log` 里密码是原文，问题包因此不收它 | 框架直接写，MAS 管不了 | [#1039][1039] |
| `logging` 固定为 `true` | 上游默认；框架只有日志开关，没有文件日志级别 | `runner/runner.py` |
| 整轮时限是硬超时，不做日志停滞超时 | 有没有日志与卡没卡住无关 | [#880][880] |
| 原地打转检测默认关闭、标为实验性 | 判据由统计得来，先让用户自己开 | [#1223][1223] |
| 打转豁免写在 `attach.auto_mas_loop_guard`，不放进 `attach.auto_mas` | 后者遇到未知键会忽略整个信号节点，且节点会被强制启用 | [#1223][1223] |
| 重试默认重跑全部非周期任务；只有风味显式列出的才不补跑，新任务默认补跑 | 启动类任务在游戏崩溃后必须重跑 | [#1296][1296] |
| 一处任务失败就关掉 MAS 启动的游戏 / 模拟器、整轮重来 | 接回卡住的窗口只会白等 | [#880][880]、[#1295][1295] |
| M9A 的关闭游戏失败不算本轮失败、不重试 | 只因收尾失败就整轮重来不值得 | [#1296][1296] |
| 单任务超时：第一个任务超时结束本轮，其余记失败后继续 | 第一个任务通常是前置步骤 | [#1180][1180] |
| 中间尝试失败、最终成功不推送通知，截图只留在 history | 只有最终失败才带截图，不轰炸 | [#841][841] |
| 有失效任务时照常算完成，但报告标出并计入未完成数 | 不让改名后的任务静默消失 | [#1147][1147] |
| 运行日志用 interface 的任务名，不用用户改的显示名 | 显示名只影响界面 | [#1301][1301] |
| 应用预设、应用自定义模板都不再确认，直接替换队列 | 与预设既有行为一致 | [#855][855]、[#1260][1260] |
| 从其他用户导入队列不带全局选项、不带密码 | 只换队列；密文不跨用户 | [#1260][1260]、[#1294][1294] |
| 停服维护时用户记「跳过」、不扣次数，不弹任务页提示 | 维护不是用户或脚本的错 | [#1091][1091] |
| 信号节点被 MAS 强制启用 | 项目自带的开关在 MAS 下不起作用 | [#1091][1091] |
| 运行期间脚本与用户配置被锁，界面改动会被拒绝 | 运行结束的整表写回会覆盖运行中的改动 | [#737][737] |
| 架构不符、运行环境不可用时不重试 | 每次结果都一样 | [#1024][1024] |

## PC 启停、控制与热键

| 行为 | 为什么 | 相关 PR 或代码 |
| --- | --- | --- |
| 没有「结束后是否关闭游戏」开关：MAS 启动的一律关，其他方式启动的一律不碰 | 没有第三种组合需要用户选 | [#843][843] |
| DirectExe 下发现游戏已在运行只接管、不关 | 不是 MAS 启动的 | [#843][843] |
| MAS 收尾时关掉它启动的模拟器，即使那个实例开跑前就在运行 | 既有行为，与其他专项一致 | `runner_task` |
| Unity 分辨率只改 Unity 层，不做逐游戏适配，日志写「已尝试」 | 游戏自有的分辨率层由该游戏的风味或专项负责 | [#1146][1146]、[#1231][1231] |
| 脚本页没有 ADB 地址直连 | 只填地址多数情况连不上；真机支持在模拟器管理里统一做 | [#1215][1215] |
| 热键只在 Win32 下叠加，且是脚本级一份 | 键位跟游戏客户端走 | [#1174][1174] |
| 自动推断出的游戏包名写进包名字段：首次只补空、切换资源一律覆盖 | 不同服的包名不同 | [#855][855] |
| 魔改 AVD 只放行声明支持它的风味（目前只有 M9A） | 内测只适配 M9A | [#1238][1238] |

## 界面

| 行为 | 为什么 | 相关 PR 或代码 |
| --- | --- | --- |
| 用户页在没导入项目时不加引导按钮 | 没导入项目时本来就不能正常使用，提示在脚本页 | — |
| 用户页没有「读取 interface」按钮 | 编辑用户时 interface 不会变 | [#855][855] |
| 结论只作为日志最后一行整行标色，不另弹提示、不加进度条 | 一个地方看结论 | [#843][843] |
| 输入框下不留说明行，解释都放进问号（CDK 剩余天数这类状态小字除外） | 版面整洁；状态是用户必须知道的信息 | [#943][943]、[#1330][1330] |
| 用户页任务队列两栏框架不动，新区块放插入点 | 整体版面整洁 | [#1163][1163] |
| 热键与 setting 分区不进用户页两栏 | 热键是脚本级的 | [#1174][1174] |
| 「复用已导入的项目」入口只在新建对话框，只列同类型项目 | 复用是新建阶段的决定 | [#973][973] |
| 风味页面要等读到脚本详情（几毫秒）才渲染 | 第一帧就是正确的风味 | [#1163][1163] |
| 风味描述对象里不许有布尔开关 | 布尔开关就是换了写法的类型分支 | [#1013][1013]；`useMaaFWFlavor.test.ts` |
| 日志只往详细里加：不把英文排障日志改中文、不去重、不删行 | 排障需要的是更多信息 | — |
| 显示名的编号分组以显示出来的文字为准 | 用户看到什么就按什么区分 | [#1301][1301] |

## 风味

| 行为 | 为什么 | 相关 PR 或代码 |
| --- | --- | --- |
| M9A 的启动游戏、切换账号、关闭游戏不许留在队列，也不能手动添加 | 顺序由 MAS 全权控制 | [#1023][1023]；`app/task/M9A/managed.py` |
| M9A 官服用户队列里有效切号 ≥ 2 时照原样保留，但运行时拒绝该用户 | 一个用户对应一个账号，要求用户拆分 | [#1023][1023] |
| 队列里的账号与「账号」栏冲突时以队列为准，原值记进备注 | 那才是之前实际切换的账号 | [#1023][1023] |
| 旧版 M9A 归档不再列出、不支持恢复 | 归档根不同 | [#973][973] |
| M9A 游戏更新只查官服；本机装的是版本号更高的渠道包时直接判失败、不下载 | 官网包永远装不上 | [#1010][1010] |
| M9A 游戏安装包下载与安装各 60 分钟上限，写死不做配置 | 不为低频场景加配置 | [#1010][1010] |
| MSS 只适配桌面端，但引擎不拦 ADB | 只提示原因 | [#959][959] |
| MSS 队列里只剩活动任务、又没有活动时不摘空 | 摘空会被判成异常 | [#959][959] |
| MSS 计划表改写队列里**所有**悬赏试炼实例 | 计划表按天生效，不区分实例 | [#959][959] |
| 风味的可选钩子不进协议 | 缺可选成员会被判不满足协议 | `MaaFW/tools/embedded/flavor.py` |

[659]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/659
[737]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/737
[810]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/810
[841]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/841
[843]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/843
[855]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/855
[880]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/880
[943]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/943
[945]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/945
[959]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/959
[973]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/973
[1010]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1010
[1013]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1013
[1023]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1023
[1024]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1024
[1039]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1039
[1091]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1091
[1102]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1102
[1104]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1104
[1117]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1117
[1144]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1144
[1146]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1146
[1147]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1147
[1157]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1157
[1163]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1163
[1174]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1174
[1180]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1180
[1215]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1215
[1223]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1223
[1231]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1231
[1238]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1238
[1260]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1260
[1294]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1294
[1295]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1295
[1296]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1296
[1301]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1301
[1330]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1330
