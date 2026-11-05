# 脚本专项适配

脚本专项适配需要同时打通配置、Schema、API、任务调度、前端入口与运行验证。当前项目的详细工程规则以内置在主仓 `.agents/skills/mas-script-specialized-adapter` 的 Skill 为准；本文档只保留开发者阅读时最容易遗漏的流程入口。

## 黑箱前提

先判定能力归属，再决定 MAS 能否实现：**上游领域**（游戏内操作、脚本任务的执行与成败、脚本配置语义）只允许复用上游入口；**MAS 领域**（托管与账号管理、多脚本/多实例调度、计划表、通知、统计、模拟器生命周期、跨脚本编排）可自行实现；**上游私有格式**（配置内部字段、计划/队列/运行记录、资源文件）只允许透传。适配层只依赖上游对外契约，以降低上游变更导致的适配失效。

- **推进顺序**：先降低配置门槛（消除安装导入、路径选择、首次配置与高频任务编排中的手工步骤，减少需调整的选项），再补本体缺位（缺口须属 MAS 领域且上游无任何等效入口）。立项前须答出该改动消除了用户当前哪一步手工操作；把上游配置面板搬进 MAS 不算降低门槛。
- **允许依赖**：CLI 参数与退出码、上游文档化的 JS/API、原生 GUI 与配置会话、进程与目录结构、日志与运行报告。
- **禁止复制**：不在上游私有布局之上建 MAS 语义层——上游配置字段的映射表、计划/队列/运行记录的格式副本、资源文件结构的再解析、取代上游结果面的自造判定信号（对上游执行的任务自行打标记判成败）。判定依据是「执行权与判定权归谁」和「写入的是上游字段还是 MAS 模型」，不是「是否读写上游文件」；写入上游字段而执行与判定仍归上游属透传，允许。
- **上游领域**：上游已有入口必须复用；上游没有时先评估向上游提 PR。上游不受理（作者认为不需要而适配层判断必要）或审核与发布周期过长时，适配层可临时补位，但须标注「临时补位 + 上游实现后移除」；上游补齐同能力入口后按存量越界处理：改为复用，并移除适配层实现及其配置项、前端入口与判定逻辑，不留两套语义。
- **MAS 领域**：可自行实现，但不得读取或反推上游内部状态，且判定权归自己。**「补位」只在 MAS 领域成立**；替上游补出其领域能力不是补位。
- **必须提示**：上游领域能力由 MAS 实现、在上游私有格式之上建语义层、存量越界任一命中时，加载 Skill 的 Agent 应输出「这可能违背了 MAS 的开发规范」，并给出命中条目、证据与替代方案；提示不阻断开工，是否继续由开发者决定。
- **例外**：仅当有证据表明上游无任何等效入口（CLI、文档化接口、日志、退出码），且耦合集中到单一模块并标注失效表现时，才解析上游内部字段。

完整判据、允许与禁止清单、提示要求见主仓 `.agents/skills/mas-script-specialized-adapter/references/blackbox-boundary.md`。

## 适配前先确认架构

新增或重构 `ScriptType` 前，先确认外部脚本属于哪条架构线：

| 架构线 | 本仓参照 |
|--------|----------|
| MAA 线 | `MAA` |
| SRC 线 | `SRC` |
| MXU 线 | `MaaEnd` |
| MFAA 线 | `M9A` |
| General | `General` |
| ok-script 家族 | `Okww`（鸣潮）、`OkNte`（异环），按子项目分别确认契约 |

推荐先让用户提供脚本或 GUI 壳的仓库 URL，再根据 README、启动参数、配置落盘方式和 Release 产物判断架构线。没有仓库时，应先向用户确认脚本形态、正式 `ScriptType`、展示文案、图标来源、自启动方式和配置落盘方式。

## 落地顺序

专项适配按“前端表面优先，然后补齐后端”的顺序推进：

1. **架构确认**
   - 确认上游仓库、正式 `ScriptType`、路由片段、用户可见文案与图标。
   - 确认自动跑任务靠 CLI 参数、写 JSON，还是启动外置配置会话。

2. **前端表面**
   - `Scripts.vue` 与 `ScriptTable.vue`：Hub 入口、卡片、图标、操作按钮。
   - `router/index.ts`：新增与 Hub 一致的路由片段。
   - `frontend/src/types/script.ts`：补充 `ScriptType` 与默认结构。
   - `frontend/src/composables/useScriptApi.ts`：补齐托管类型分支和 `UserConfig -> users[]` 分支。
   - `EditView/Script/`、`EditView/User/`：新增或调整托管编辑页、账号编辑页和 Section。

3. **后端注册**
   - `app/models/config.py`：新增 `XxxConfig` / `XxxUserConfig`，注册到对应配置集合。
   - `app/models/schema.py`：补齐 API Schema。
   - `app/core/config.py`、`app/api/scripts.py`、`app/utils/constants.py`：补齐配置、API、展示文案和类型映射。
   - 后端 schema 变更后，启动当前本地后端并在 `frontend` 运行 `yarn openapi`。禁止手改 `frontend/src/api` 生成目录。

4. **任务模块**
   - `app/task/Xxx/`：按架构线实现 `Manager`、`AutoProxy`，按需补 `config_schema.py` 或 `ScriptConfig.py`。
   - `Manager` 与任务执行类必须实现 `final_task` / `on_crash`。
   - `check()` 返回信息应告诉用户该怎么处理，不要只给技术描述。

5. **验证与清理**
   - 先用 `General` 跑通启动、日志和配置可行性时，专项落地后应删除临时入口。
   - 对照主仓 `.agents/skills/mas-script-specialized-adapter/references/adapter-code-norms.md` 做提交前自检。
   - 确认 Hub、路由、编辑页、API、任务调度、日志和历史记录都已打通。

## 代码质量底线

- 不要简单复制 `app/task/General` 后全局替换变量名；应对齐最接近的架构线和现有表面模板。
- 配置写入和恢复使用原子化思路，避免任务中断后损坏配置。
- `final_task` 和 `on_crash` 共用的恢复逻辑应提取复用。
- 进程清理、文件清理等副作用操作应分别捕获异常，避免一个失败阻塞后续清理。
- 实例属性在 `__init__` 中显式初始化并带类型注记，不依赖 `hasattr()` 兜底。
- 状态、日志、进程管理、pre/post 脚本等优先对齐 `General`，只有架构确认后才引入专项差异。

## 进一步阅读

AI 助手执行专项适配时，应加载主仓 `.agents/skills/mas-script-specialized-adapter/SKILL.md`，并按需阅读其中的：

- `references/script-frontend-architectures.md`
- `references/blackbox-boundary.md`
- `references/adapter-code-norms.md`
- 对应架构线的 `examples-*.md`
