# 测试与验证

主仓的验证分三层，各解决不同问题，不要用一种替代另一种。

| 层 | 覆盖什么 | 在哪跑 | 是否进 CI |
| --- | --- | --- | --- |
| pytest 回归 | 后端契约、配置往返、调度与专项适配的最小行为 | 本地 `python -m pytest` | 否，CI 只跑格式、Lint、类型与打包检查 |
| 浏览器 E2E | 前端经真实 HTTP/WebSocket 走完的用户路径 | 本地 `yarn e2e` | 否，只跑 E2E 基础设施契约自检（秒级） |
| `@real` 真实运行 | 真实脚本、模拟器、账号与一次真实调度 | 作者本机 | 永不 |

## pytest 回归

`tests/` 按被测边界归档：`tests/api/`、`tests/core/`、`tests/models/`、`tests/platform/`、`tests/services/`、`tests/task/`、`tests/tools/`。专项适配测试放 `tests/task/test_<script>_<behavior>.py`，不要堆在根目录。

```bash
python -m pytest tests/api/test_config_roundtrip.py -q   # 改到哪层就跑哪个文件
python -m pytest tests --collect-only -q                 # 合并前的收集门槛，退出码必须为 0
```

- pytest 在 `pyproject.toml` 的 `dev` 依赖组，本地缺失时执行 `uv sync --group dev`。
- **功能实现与 bug 修复的测试是一次性验证产物**：实现改完、问题复现过就没有长期价值，留在仓库只会抬高每次跑测试的成本，默认不提交。只有跨功能通用的公共与纯逻辑测试进仓库，例如 `tests/task/test_maafw_core.py`。
- 进仓库的测试必须能证伪：把被守代码改坏后这条要变红，不红就删掉；新增时在 PR 正文写明守的是什么、破了怎么炸。
- 完整规则见主仓 `tests/AGENTS.md`。

## 浏览器 E2E

唯一入口是 `frontend/e2e/run.mjs`。它创建一次性运行根目录、启动后端与前端、按标签挑选用例，退出后删除该目录。不要绕过它直接运行 `playwright test`。

首次准备：

```powershell
uv sync --group dev
Set-Location frontend
yarn install --immutable
yarn playwright install chromium
```

之后的命令都在 `frontend/` 下执行：

| 命令 | 范围 |
| --- | --- |
| `yarn e2e:check` | 基础设施契约自检 + E2E 的 TypeScript 检查，改入口或种子规则后先跑它 |
| `yarn e2e` | 全部非 `@real` 用例 |
| `yarn e2e:smoke` / `:init` / `:queue` / `:scheduler` / `:settings` / `:history` / `:recovery` | 单个标签 |
| `yarn e2e --grep '@queue\|@scheduler'` | 任意标签组合，参数是正则 |

现有标签：`@smoke` 页面导航、`@init` 后端冷启动、`@queue` 队列增改与刷新后持久化、`@scheduler` 无任务时禁止启动、`@settings` 保存持久化与失败回滚、`@history` 导航与筛选、`@recovery` 刷新后重建连接、`@real` 真实调度。

入口默认**隔离**：运行根下的 `data/` 是空数据根，用例新建的队列、改动的设置、写出的历史和日志都落在那里，跑完随运行根删除，你的检出保持不动。入口还会固定写入 `config/ToolsConfig.json` 为 `{"ArknightsPC": {"Enabled": false}}`，所以 `@init` 不会初始化明日方舟 PC 工具。

### 调试开关

| 变量 / 参数 | 作用 |
| --- | --- |
| `AUTO_MAS_E2E_KEEP_ROOT=1` | 跑完保留运行根并打印路径，用来对比测试到底写了什么 |
| `--in-place` 或 `AUTO_MAS_E2E_IN_PLACE=1` | 不隔离，直接把当前检出当数据根运行；会写入 `config/`、`data/`、`history/`、`debug/` 且不清理 |
| `AUTO_MAS_E2E_DATA_ROOT=<目录>` | 就地运行时改用别的数据根 |
| `AUTO_MAS_E2E_TEMPLATE_ROOT=<目录>` | 真实模式的配置种子源，默认是当前检出 |

要断言某个设置或脚本配置项时，不要依赖检出里的现状。三种定位办法：用 `--in-place` 跑一条只做界面操作的临时用例，改完控件后 `git diff config/` 反查字段；从组件字段反查后端模型，例如 `frontend/src/views/setting/TabBasic.vue` 的 `UI.IfHideCloseButton` 落到 `app/models/schema.py` 与 `app/core/config.py`；查运行根里的 `debug/app.log`。种子按优先级选：用例里用 UI 或 API 自己造出来 > 在入口启动后端之前写配置文件 > 提交最小 profile。最后用 `AUTO_MAS_E2E_KEEP_ROOT=1` 确认测试真的写进去了，再把观察到的变化写进断言和清理步骤。

### 用例准入：改坏必须变红

一条 E2E 只有被守代码真的坏掉时变红才算数。新增或修改用例后验证一次：改坏被测行为 → 跑这条用例 → 必须失败 → 还原。永远不红的用例直接删掉，它只会拖慢每次运行。现有用例已按这个办法逐条验证，记录见主仓 `docs/testing/e2e.md`。

### 失败时看哪里

- `frontend/test-results/browser/`：截图、trace、video。
- `frontend/playwright-report/browser/`：HTML 报告，`yarn e2e:report` 打开。
- `<运行根>/debug/app.log`：后端日志，默认随运行根删除，`KEEP_ROOT=1` 时保留，`--in-place` 时写在检出里。

## 本机真实运行

```powershell
Set-Location frontend
yarn e2e:real --grep '@real'
```

**默认零配置**：入口读当前检出的 `config/ScriptConfig.json`，取第一个「用户已启用」的脚本与用户，并在启动日志打印选中目标。想指定账号时才需要 `AUTO_MAS_E2E_SCRIPT_ID`、`AUTO_MAS_E2E_USER_ID`、`AUTO_MAS_E2E_ACCOUNT_NAME`；目标不存在会直接报错并列出现有候选，不会静默换成别的账号。

- 真实运行同样使用隔离运行根：只把被选中的脚本、用户与计划复制进去，并剥掉用户配置里的通知字段，所以不会推真实通知；对队列、设置、历史和数据库的改动随运行根删除。
- 机器级原子锁在 `%SystemRoot%\Temp\AUTO-MAS`，同一台电脑同时只允许一个真实运行。强杀进程后残留的锁文件，确认没有测试在跑再手动删除。
- 脚本安装目录与模拟器仍指向本机真实环境，配置注入和恢复可能改变游戏状态或消耗资源，选合适的脚本与用户再跑。
- 它验证 MAS 公开上报的任务终态与用户结果，不等于游戏内结果全部成功；失败不可重放，报告和终端输出可能含本机信息，分享前人工检查，不要上传整个结果目录。

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

- 主仓 `docs/testing/e2e.md`：覆盖目标、用例清单、三道合并门槛与故障排查。
- 主仓 `.agents/skills/mas-e2e/SKILL.md`：给 AI 助手的 E2E 约定。
- 主仓 `frontend/e2e/run.mjs` 与 `frontend/e2e/fixtures.ts`：启动器与用例公共夹具。
