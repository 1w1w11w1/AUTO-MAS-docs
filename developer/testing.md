# 测试与验证

主仓的验证分三层，各解决不同问题，不要用一种替代另一种。

| 层 | 覆盖什么 | 在哪跑 | 是否进 CI |
| --- | --- | --- | --- |
| pytest 回归 | 后端契约、配置往返、调度与专项适配的最小行为 | 本地 `uv run --no-sync python -m pytest` | 是，面向 `dev` 的 PR 在 Windows 与 Ubuntu 跑完整套件 |
| 浏览器 E2E | 前端经真实 HTTP/WebSocket 走完的用户路径 | 本地 `yarn e2e` | 否，只跑 E2E 基础设施契约自检（秒级） |
| `@real` 真实运行 | 真实脚本、模拟器、账号与一次真实调度 | 作者本机 | 永不 |

## pytest 回归

`tests/` 按被测边界归档：`tests/api/`、`tests/core/`、`tests/models/`、`tests/platform/`、`tests/services/`、`tests/task/`、`tests/tools/`。专项适配测试放 `tests/task/test_<script>_<behavior>.py`，不要堆在根目录。

```powershell
uv sync --locked --group dev
uv run --no-sync python -m pytest tests/api/test_config_roundtrip.py -q   # 改到哪层就跑哪个文件
uv run --no-sync python -m pytest tests -q                               # 与 CI 一致的完整回归
```

- pytest 在 `pyproject.toml` 的 `dev` 依赖组，使用上面的锁定环境安装和执行，不需要手动激活虚拟环境。
- **可重复的回归测试随实现提交并长期维护**：守护用户行为或公共契约的确定性、可隔离测试，与实现放在同一仓库、同一个 PR。Bug 有稳定复现时，测试应在修复前失败、修复后通过并随 PR 保留；一次性诊断留在本地或被忽略的 `.dev/` 目录。
- 新增测试应能证伪被测行为，在 PR 正文说明守护的行为、实际验证命令与结果；无法自动化时说明原因和替代验证。
- 完整 pytest 执行已包含收集，不另设 `--collect-only` 合并门槛。测试提交、维护与删除规则见[开发规范](/developer/development-specifications#测试提交与维护规范)，目录归属见主仓 `tests/AGENTS.md`。

## 浏览器 E2E

唯一入口是 `frontend/e2e/run.mjs`。它创建一次性运行根目录、启动后端与前端、按标签挑选用例，退出后删除该目录。不要绕过它直接运行 `playwright test`。

首次准备：

```powershell
uv sync --locked --group dev
Set-Location frontend
yarn install --immutable
yarn playwright install chromium
```

之后的命令都在 `frontend/` 下执行：

| 命令 | 范围 |
| --- | --- |
| `yarn e2e:check` | 基础设施契约自检 + E2E 的 TypeScript 检查，改入口或种子规则后先跑它 |
| `yarn e2e` | 全部非 `@real` 用例 |
| `yarn e2e:smoke` / `:init` / `:queue` / `:scheduler` / `:settings` / `:history` / `:recovery` / `:notify` | 单个标签 |
| `yarn e2e --grep '@queue\|@scheduler'` | 任意标签组合，参数是正则 |

现有标签：`@smoke` 页面导航、`@init` 后端冷启动、`@queue` 队列增改与刷新后持久化、`@scheduler` 无任务时禁止启动、`@settings` 保存持久化与失败回滚、`@history` 导航与筛选、`@recovery` 刷新后重建连接、`@notify` 测试通知投递与禁用渠道（系统通知用例会在 Windows 弹一次真实通知，其他平台跳过该条）、`@real` 真实调度。

入口默认**隔离**：运行根下的 `data/` 是新建的数据根，用例新建的队列、改动的设置、写出的历史和日志都落在那里，跑完随运行根删除，你的检出保持不动。普通浏览器模式不复制本机配置，后端在隔离根按默认值创建配置。

### 调试开关

| 变量 / 参数 | 作用 |
| --- | --- |
| `AUTO_MAS_E2E_KEEP_ROOT=1` | 跑完保留运行根并打印路径，用来对比测试到底写了什么 |
| `--in-place` 或 `AUTO_MAS_E2E_IN_PLACE=1` | 不隔离，直接把当前检出当数据根运行；会写入 `config/`、`data/`、`history/`、`debug/` 且不清理 |
| `AUTO_MAS_E2E_DATA_ROOT=<目录>` | 就地运行时改用别的数据根 |
| `AUTO_MAS_E2E_TEMPLATE_ROOT=<目录>` | 真实模式的配置种子源，默认是当前检出 |

要断言某个设置或脚本配置项时，不要依赖检出里的现状。三种定位办法：在隔离运行根用 UI 修改控件，比较修改前后保存的配置副本或 API 响应；从组件字段反查后端模型，例如 `frontend/src/views/setting/TabBasic.vue` 的 `UI.IfHideCloseButton` 定义在 `app/models/config/setting.py`；查运行根里的 `debug/app.log`。主仓忽略整个 `config/`，不能用普通 Git 工作区差异定位字段；比较配置文件副本时可用 `git diff --no-index <修改前副本> <修改后副本>`，发现差异时退出码为 1。种子按优先级选：用例里用 UI 或 API 自己造出来 > 在入口启动后端之前写配置文件 > 提交最小 profile。最后用 `AUTO_MAS_E2E_KEEP_ROOT=1` 保留运行根，确认测试真的写进去了，再把观察到的变化写进断言和清理步骤；配置副本留在本地，不提交账号或凭据。

### 用例准入：改坏必须变红

一条 E2E 只有被守代码真的坏掉时变红才算数。新增或修改用例后验证一次：改坏被测行为 → 跑这条用例 → 必须失败 → 还原。不能证伪时先补强断言；确需删除时按[开发规范](/developer/development-specifications#测试提交与维护规范)说明原因与替代覆盖，并在 PR 记录本次验证结论。流程清单见主仓 `docs/testing/e2e.md`。

### 失败时看哪里

- `frontend/test-results/browser/`：截图、trace、video。
- `frontend/playwright-report/browser/`：HTML 报告，`yarn e2e:report` 打开。
- `<数据根>/debug/app.log`：后端日志，数据根路径见入口输出；默认随运行根删除，`KEEP_ROOT=1` 时保留，`--in-place` 时写在指定数据根里。

## 本机真实运行

```powershell
Set-Location frontend
yarn e2e:real --grep '@real'
```

**默认自动选目标**：入口优先读当前检出的 `config/scripts.yaml`，仅对尚未完成配置迁移的数据根兼容旧 `config/ScriptConfig.json`；取第一个「用户已启用」的脚本与用户，并在启动日志打印选中目标。已完成迁移却缺少 YAML 文件时会报错，需要先在应用中恢复配置。在 worktree 中运行时，用 `AUTO_MAS_E2E_TEMPLATE_ROOT` 指向存有真实配置的主检出目录。仓库里只有代码和用例，不提供游戏资源、脚本安装包或测试账号——真实运行用的是你本机已装的脚本和 MAS 里已配好的用户。想指定账号时才需要 `AUTO_MAS_E2E_SCRIPT_ID`、`AUTO_MAS_E2E_USER_ID`、`AUTO_MAS_E2E_ACCOUNT_NAME`；目标不存在会直接报错，不会静默换成别的账号。

- 真实运行同样使用隔离运行根：只把被选中的脚本、用户与计划复制进去，并剥掉用户配置里的通知字段，所以不会推真实通知；对队列、设置、历史和数据库的改动随运行根删除。
- 机器级原子锁在 `%SystemRoot%\Temp\AUTO-MAS`，同一台电脑同时只允许一个真实运行。强杀进程后残留的锁文件，确认没有测试在跑再手动删除。
- 脚本安装目录与模拟器仍指向本机真实环境，配置注入和恢复可能改变游戏状态或消耗资源，选合适的脚本与用户再跑。
- 它验证 MAS 公开上报的任务终态与用户结果，不等于游戏内结果全部成功；失败不可重放，报告和终端输出可能含本机信息，分享前人工检查，不要上传整个结果目录。
- 单次真实运行的截图与 `real-e2e-summary.json` 在 `frontend/test-results/real/`，HTML 报告在 `frontend/playwright-report/real/`；从 `frontend/` 执行 `yarn playwright show-report playwright-report/real` 打开。

### 批量跑全部专项

```powershell
yarn e2e:real:all --list                       # 只列本机已启用用户目标，不跑
yarn e2e:real:all                              # 逐个串行跑全部目标
yarn e2e:real:all --only MaaConfig,SrcConfig   # 只跑指定专项的已启用用户
```

每个已启用用户都是一个目标，同一专项有多个用户时会逐个运行。每个目标各起一套隔离运行根、各自加锁，一份结果写到 `test-results/real-batch/<序号>-<专项>-<账号>/`，某个失败不中断其余。固定开销是每个目标重启一套服务，约 20-30 秒；不支持 `--in-place`，模拟器由各目标自己的脚本绑定决定。HTML 报告仅保留最后一个目标的运行。

## 让 AI 助手跑测试

助手按下面的说法执行即可，不要绕过 `run.mjs` 与 `real-batch.mjs` 直接调用 `playwright test`。

| 你说 | 助手执行 |
| --- | --- |
| 改完 UI，看有没有跑坏 | `yarn e2e --grep '@smoke\|@<相关标签>'` |
| 改过入口或种子规则 | `yarn e2e:check` |
| 改到调度、任务或某个专项 | `yarn e2e:real`，或 `yarn e2e:real:all --only <专项>` |
| 只想看本机有哪些真实目标 | `yarn e2e:real:all --list` |

**PR 开出来到等 review 之间，助手必须主动把这张表交出来**：按改动路径列出相关命令、每条产出什么（截图、HTML 报告、`real-e2e-summary.json`）、然后问「要我现在跑哪条」。非真实命令助手可以直接跑；`@real` 只能作者本机跑，助手不得代为声称结果。约定见主仓 `.agents/skills/mas-e2e/SKILL.md` 与 `.agents/skills/pr/SKILL.md`。

## PR 正文怎么写验证

```text
- E2E 场景：<验证的用户功能与路径>
- 命令：`<实际执行的命令>`
- Commit：`<完整 SHA>`；工作区：<clean / dirty（说明差异）>
- 结果：<通过/失败/未运行及实际观察>
- 证据：<截图和/或 real-e2e-summary.json 路径>
- 限制：<未覆盖场景、环境前置条件或无>
```

不要只写「E2E 通过」。按改动路径的要求：

| 改动路径 | 要求 |
| --- | --- |
| 纯前端交互 / UI | 建议跑相关标签用例并附截图 |
| `app/task/**`、专项适配、调度、模拟器 | 必须附 `@real` 自证：`real-e2e-summary.json` 关键字段加精选截图 |
| 纯文档 / CI / 测试 | 不需要 |

单条 E2E 或真实运行通过只说明被测场景在该 commit 上通过，不代替对未覆盖分支的判断。

## 相关文件

- 主仓 `docs/testing/e2e.md`：覆盖目标、用例清单与故障排查。
- 主仓 `.agents/skills/mas-e2e/SKILL.md`：给 AI 助手的 E2E 约定。
- 主仓 `frontend/e2e/run.mjs` 与 `frontend/e2e/fixtures.ts`：启动器与用例公共夹具。
- 主仓 `frontend/e2e/real-batch.mjs`：批量逐个跑各专项的真实运行入口。
