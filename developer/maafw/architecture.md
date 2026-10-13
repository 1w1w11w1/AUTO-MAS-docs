# 总体架构

## 要点

- MFW 是**通用引擎**：任何带 `interface.json` 的 MaaFramework 项目都能直接作为 MFW 脚本运行。M9A、MSS 是它的风味，不是专项。
- 依赖方向：核心包 `MaaFW/tools/core/`（零宿主耦合）← 宿主接缝 `MaaFW/tools/embedded/` 与 `MaaFW/embedded_manager.py` ← API 业务 `MaaFW/api_service/` ← 薄端点 `app/api/scripts.py`。
- worker 子进程的导入闭包只能落在 `MaaFW/tools/core/` 之内，由 `tests/task/test_maafw_core.py` 守住。
- 项目永远在 MAS 自己的视图（`data/mfw/<脚本 id 前 12 位>/`）上运行；用户选的目录只是导入来源。
- 并发只靠两种机制：进程内的视图预约（拿不到就快速失败、不排队）与跨进程的谱系锁。

## MFW 在 AUTO-MAS 里的位置

| 层面 | 做法 | 为什么 |
| --- | --- | --- |
| 脚本类型 | `MaaFWConfig` / `MaaFWUserConfig`；风味是同形子类（`M9AConfig`、`MSSConfig`） | 风味不该有自己的配置面 |
| 调度 | `app/core/task_manager.py` 的 `_MANAGER_BOOK` 把三种类型都映射到 `MaaFWEmbeddedManager`；按类型精确查表，子类要单独登记 | — |
| 任务来源 | 用户页的任务队列是唯一来源；专项通用的配置来源三态 `Info.Base`（shared / independent / native，[#1338][1338]）与 `Info.IfQuickConfig` 没有任何 MFW 运行代码消费，只在配置备份恢复里原样带着（[#788][788]） | MFW 没有可退回的原生配置，三态对它没有所指 |
| 原生编辑器会话 | 没有 | 同上 |
| 配置备份恢复 | 接入通用备份恢复（`MaaFW/tools/restore_service.py`，[#799][799]） | — |
| 何时立专项 | 需要原生编辑器会话、登录切号、按游戏语义组织的专属界面、动态读上游资源时才立专项（MaaEnd 是例子）；否则一律 MFW + 风味 | 引擎的价值在于「一个引擎跑所有 interface 项目」 |

给某个项目加行为之前先问：这是不是所有 MaaFW 项目都该有的？是就做进引擎；不是就只能经风味钩子进入，`app/task/MaaFW/` 里不出现具体项目名。

## 三层边界

```text
frontend（MFW 脚本页 / 用户页 / 新建对话框 / 风味注册表）
   │ HTTP + WebSocket
app/api/scripts.py（薄端点：取参数 → 调 api_service 的一个函数 → 构造响应）
   │ 只允许 app.api → api_service，反向导入禁止
MaaFW/api_service/（common / embedded / interface / update / agent_env / shell_instances）
   │
MaaFW/embedded_manager.py + MaaFW/tools/embedded/（宿主接缝：唯一能读 Config、发通知、碰宿主模型的地方）
   │
MaaFW/tools/core/（interface / runner / runtime_pool / agent_env / project_update / controller_win32）
   └─ worker 子进程只导入这一层
```

| 约束 | 为什么 |
| --- | --- |
| MFW 的 API 业务一律在 `api_service/` 实现；端点只取参、调用、映射错误；端点 docstring 原样保留（会进 OpenAPI） | 端点文件曾堆积大量 MFW 私有逻辑（[#973][973]） |
| `tools/core/` 零宿主耦合；唯一已知例外是 `project_update/updater.py` 引了 `app.utils.constants`（只在宿主进程里跑），不要再加 | worker 跑在运行池 venv 里，没有宿主依赖 |
| worker 导入闭包里的 `app.*` 只能落在 `tools/core/` 下（含函数体内延迟导入）；三方包只许 maafw 与 `BASE_RUNTIME_PACKAGES` | 曾有一处 `from app.utils import ...` 让 worker 拉起宿主日志依赖，所有 MFW 脚本一开跑就挂 |
| 要放宽上面一条：在 `tests/task/test_maafw_core.py` 里显式加白名单并在 PR 里说明 | 防止只改文字、守卫没跟上（[#1211][1211]） |
| worker 的工作目录是应用根，不能改；`PYTHONSAFEPATH=1` 只给 worker、不传给 agent | runner 用 `Path.cwd()` 定位用户数据；`PYTHONSAFEPATH` 会让 `python ./agent/main.py` 找不到同级模块 |

## 模块地图

| 位置 | 职责 |
| --- | --- |
| `MaaFW/embedded_manager.py` | 运行前检查（导入、组同步、投影补齐、锁配置）、运行前 / 运行后更新、运行环境确认、用户配置副本整表写回 |
| `MaaFW/api_service/embedded.py` | 视图状态、导入、克隆、候选来源、立即同步 |
| `MaaFW/api_service/interface.py` | 预览、游戏包名、图片资源、不可选任务原因 |
| `MaaFW/api_service/update.py` | 手动检查与更新 |
| `MaaFW/api_service/agent_env.py` | 编辑页「准备运行环境」 |
| `MaaFW/api_service/shell_instances.py` | 外壳配置实例：列出、导入成用户、覆盖到已有用户 |
| `MaaFW/tools/embedded/embedded_project.py` | 视图：有效项目根、导入、切换、克隆、采纳、开发者模式、回收 |
| `MaaFW/tools/embedded/runner_task.py` | 每个用户一次运行：建计划、起 worker、重试、收尾、history 落盘 |
| `MaaFW/tools/embedded/view_update.py` | 「一个组只更新一次」的编排与传播 |
| `MaaFW/tools/embedded/view_heal.py`、`view_audit.py` | 投影补齐、写穿巡检 |
| `MaaFW/tools/embedded/flavor.py` | 风味协议与可选钩子的契约、按项目定类型 |
| `MaaFW/tools/embedded/option_secrets.py` | 密码选项加密、日志打码 |
| `MaaFW/tools/embedded/project_logs.py` | 项目 agent 自写日志另存 |
| `MaaFW/tools/embedded/update_credentials.py`、`update_mirrors.py`、`update_progress.py` | 脚本级更新凭据与代理、GitHub 加速镜像、进度 |
| `MaaFW/tools/embedded/game_resolution.py`、`game_package.py` | Unity 分辨率、游戏包名推断 |
| `MaaFW/tools/core/interface/` | interface 加载器、模型、预览、任务配置（快照归一、全局选项、实例 id）、agent 入口兜底 |
| `MaaFW/tools/core/runner/` | 运行计划、pipeline override、worker 内 runner、打转检测、信号、热键、运行环境解析 |
| `MaaFW/tools/core/runtime_pool/` | 运行池：base venv、binding、原生库、架构判定、回收 |
| `MaaFW/tools/core/agent_env/` | agent 解释器规划、隔离 venv、健康检查、导入静态检查 |
| `MaaFW/tools/core/project_update/` | 投影、载荷、共用库、更新器、区间差量、传输、预检备忘、补齐 |
| `app/task/M9A/`、`app/task/MSS/` | 两个风味 |
| `frontend/src/views/EditView/Script/MaaFWScriptEdit*`、`User/MaaFWUserEdit*` | 脚本页、用户页 |
| `frontend/src/views/EditView/MaaFWFlavor/` | 风味描述对象、分节契约、页面宿主 |
| `frontend/src/composables/useMaaFWFlavor.ts` | 风味注册表 |
| `frontend/electron/services/maafwIssueReportService.ts` | 问题包导出 |

## 一次运行

1. 调度器为脚本创建 `MaaFWEmbeddedManager`，`main_task` 先调 `check()`。
2. 运行前检查：拿视图预约 → `ensure_embedded_copy`（视图不在或来源换了就导入；开发者模式按签名重导）→ 组同步（视图挂的载荷不是组的最新版就切过去）→ 投影补齐 → 锁定脚本配置 → 深拷贝用户配置副本。拿不到预约且正在切换版本时整个脚本跳过一次。
3. 运行前更新（见 [项目更新](./update.md)）；本轮切换过版本、或视图还欠一次运行环境确认时，在用户任务前补确认。
4. 逐用户运行：建运行计划（风味装饰、预检拦截）→ 启动模拟器或游戏 → 风味的游戏更新钩子 → 写 job 文件、起 worker → worker 连控制器、先截一张图、等启动画面、逐任务投递，按单任务时限、打转检测、信号收尾 → 结果回传 → 重试或结束 → 原生日志与项目日志落 history，截图进通知。
5. `final_task`：解锁、把用户配置副本整表写回 → 用户全部正常跑完时再做一次组同步 → 运行后更新。

## 一次导入

1. 脚本页「选择项目目录」调用 `/api/scripts/maafw/embedded/reimport`。复制前先用 `Info.Path` 自己的校验器检查来源，不合规直接 400，副本与来源都不动（[#1258][1258]）。
2. 投影：interface 白名单 + 不超过 64 MB 的未声明顶层条目，去掉确认的外壳；`debug/` 里的状态文件单独挑出作视图私有文件。
3. 认出源码形态就平铺、改走私有渠道；导入进度经 WebSocket 推送。
4. 建载荷（大文件进共用库）→ 登记进脚本所在渠道的组 → 视图切到组的最新版 → 同组空闲的脚本立即跟着切。
5. 按项目决定脚本类型（第一个认领它的风味，否则通用 MFW），类型变了原地换，uid 不变。

## 并发与锁

| 机制 | 范围 | 行为 |
| --- | --- | --- |
| 视图预约（`MaaFW/tools/embedded/project_path.py` 的 `try_reserve_project_path`） | 进程内，每个视图一把 | 运行、更新、环境准备、切换都先拿；拿不到就快速失败，不排队 |
| 谱系锁（`project_update/state.py` 的 `DurableFileLock`） | 跨进程 | 串行化同一项目的更新、登记与回收复核 |
| 脚本配置锁 | 运行前锁、收尾解锁 | 运行期间界面改动被拒，避免写回覆盖（[#737][737]） |

为什么是一个脚本一棵视图，而不是多个脚本共用一份副本：运行期项目 agent 往目录里写什么 MAS 管不住，共用一份等于把并发正确性交给每个项目；一个脚本一棵视图天然互不干扰，共用只在文件层用硬链接完成。

[737]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/737
[788]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/788
[799]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/799
[973]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/973
[1211]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1211
[1258]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1258
[1338]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1338
