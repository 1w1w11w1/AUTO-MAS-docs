# 仓库分工与 Agent 规范

AUTO-MAS 将应用主体、开发文档与 Agent Skill 分开维护。分仓是项目的长期规范，目标是让每个仓库只承担自己的权威内容，避免同一规则在多个地方漂移。

## 仓库分工

| 仓库 | 职责 | 权威内容 |
|------|------|----------|
| `AUTO-MAS-Project/AUTO-MAS` | 主程序、构建配置、最小 Agent 入口 | 应用代码与仓内入口 |
| `AUTO-MAS-Project/AUTO-MAS-docs` | 用户文档、开发文档、贡献流程 | 分支、提交、版本记录、Issue/PR 正文规范 |
| `AUTO-MAS-Project/skills` | Agent Skill 与工程规则 | `mas-*` Skill、专项适配路由、Agent 执行清单 |

主程序仓库不维护完整文档站或完整 Skill 副本。若本地为了开发方便检出了 `AUTO-MAS-docs` 或 `skills`，它们只应作为相邻仓库或本地缓存存在，不应随主程序提交。

## 贡献流程

外部贡献者应使用 fork 工作流：

1. fork `AUTO-MAS-Project/AUTO-MAS`。
2. 从上游 `dev` 同步代码。
3. 在自己的 fork 中从 `dev` 拉出开发分支。
4. 完成修改并推送到 fork。
5. 向 `AUTO-MAS-Project/AUTO-MAS:dev` 发起 Pull Request。

`main` 只接受维护者从 `dev` 合入用于发布，不接受外部开发分支直接 PR。`release/{version}` 由发布流程和 cherry-pick 维护，外部贡献者不要直接修改。

## Agent 工作规则

AI 助手在 AUTO-MAS 相关仓库工作时：

- 先读当前仓库的 `AGENTS.md` 最小入口。
- 开发规范、分支、提交、版本记录以本文档站为准。
- 工程细则、代码风格、模块边界、专项适配以 `AUTO-MAS-Project/skills` 中的 `mas-*` Skill 为准。
- 选择最小必要 Skill；不要把所有 Skill 套到每个任务上。
- 本地工具权限不等于项目授权。即使工具允许 push、checkout 或发布 PR，也必须遵守仓库规范和用户授权。
- 不要回滚、覆盖或格式化与当前任务无关的用户改动。

## Issue 正文规范

AI 助手可以按用户要求撰写 Issue 正文，但应只描述用户可观察的信息：

- 目标、问题现象或功能需求。
- 实际结果与预期结果。
- 复现步骤、截图、日志、环境信息。
- 无法稳定复现时，说明已知触发条件。

Issue 正文不应要求用户提供实现步骤、API/Schema 设计、代码路径、行号、冗长验收清单或“供开发参考”类元评论。

## PR 正文规范

AI 助手可以按用户要求撰写 PR 正文。正文应保持简洁：

```md
## 摘要
-

Closes #
```

规则：

- 摘要通常 1 到 4 条。
- 有关联 Issue 时使用 `Closes #n`；没有时删除该行。
- 用户可见变更应提醒更新 `res/version.json`。
- 未运行的检查要如实说明，不要编造测试结果、性能数据、审核结论或用户没有提供的事实。

## OpenAPI 与生成文件

后端 schema 变更后，应按 [API 开发流程](/developer/API) 启动本地后端并运行前端生成命令。OpenAPI 生成文件只能由生成器更新，不能为了修类型或接口手改生成目录。

## 冲突处理

若多个仓库中的规则发生冲突：

1. 分支、提交、版本、Issue/PR 正文规则以文档站为准。
2. Agent Skill、工程路由、专项适配规则以 `AUTO-MAS-Project/skills` 为准。
3. 主程序仓库的 `AGENTS.md` 只作为入口和指路牌，不作为完整权威规范。
