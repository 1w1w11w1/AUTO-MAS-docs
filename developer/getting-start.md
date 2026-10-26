
# 开发起步

欢迎参与 AUTO-MAS 项目开发！本文档将帮助您快速搭建开发环境并了解项目结构。

##  技术栈

### 后端
- **Python**: 3.12.x
- **环境与依赖管理**: uv（`pyproject.toml` + `uv.lock`）
- **Web 框架**: FastAPI
- **实时通信**: WebSockets 15.0.1
- **日志系统**: Loguru 0.7.3
- **图像处理**: OpenCV, Pillow, PyAutoGUI
- **OCR**: RapidOCR (ONNX Runtime)

### 前端
- **框架**: Vue 3 + TypeScript
- **UI 组件库**: Ant Design Vue 4.x
- **桌面端**: Electron
- **构建工具**: Vite Plus（Vite）
- **路由**: Vue Router 4
- **状态管理**: Pinia 3.x


##  环境要求

### 必需软件

1. **uv**
   - 安装方式见 [uv 官方安装文档](https://docs.astral.sh/uv/getting-started/installation/)。Windows 可运行 `winget install --id=astral-sh.uv -e`，安装后重新打开终端。
   - Python 版本由仓库根目录的 `.python-version` 指定（当前为 3.12.13），uv 会在本机缺少该版本时自动下载，无需先手动安装 Python。
2. **Node.js 22.18+**
   - 下载地址: https://nodejs.org/
   - 推荐使用 Node.js 24 LTS，与当前前端检查环境一致。
3. **Yarn**(推荐)
   - 项目使用 Yarn 4，推荐通过 Corepack 启用：`corepack enable`
   - 进入 `frontend` 后可直接使用仓库声明的 Yarn 版本
4. **Git**
   - 下载地址: https://git-scm.com/downloads
5. **VC运行库**
	- 下载地址: [最新受支持的 Visual C++ 可再发行程序包](https://learn.microsoft.com/zh-cn/cpp/windows/latest-supported-vc-redist?view=msvc-170)


##  快速开始

下文提供 PowerShell 和 Bash 两套命令，按使用的终端选择对应标签。除明确进入 `frontend` 的步骤外，均在仓库根目录执行。

### 1. 克隆项目

::: code-group

```powershell [PowerShell]
git clone --branch dev https://github.com/AUTO-MAS-Project/AUTO-MAS.git
cd AUTO-MAS
```

```bash [Bash]
git clone --branch dev https://github.com/AUTO-MAS-Project/AUTO-MAS.git
cd AUTO-MAS
```

:::

开始修改前，按 [开发规范](./development-specifications.md) 从最新的上游 `dev` 创建开发分支。

::: tip Agent 开发前置要求

如果使用 AI 助手参与开发，必须先确认主仓存在并加载 `.agents/skills/mas-skills/SKILL.md`。缺少项目附属 Skills 时，应先补齐主仓内容，不能直接让 AI 助手开工。

:::

### 2. 后端环境搭建

1. **创建本地开发标记**

::: code-group

```powershell [PowerShell]
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item -LiteralPath .env.example -Destination .env
}
```

```bash [Bash]
if [ ! -e .env ]; then
    cp .env.example .env
fi
```

:::

`.env` 不纳入版本库。它用于标记本地开发环境：后端默认监听 `36164`，不会向 Sentry 上报错误与性能数据，也不会自行申请管理员权限。不要省略这一步，否则直接启动源码后端会按生产环境处理。

2. **同步 Python 环境与依赖**

::: code-group

```powershell [PowerShell]
uv --version
uv sync --locked
```

```bash [Bash]
uv --version
uv sync --locked
```

:::

uv 会按 `.python-version` 选择 Python，在仓库根目录创建或复用 `.venv`，并按 `uv.lock` 安装依赖。开发依赖组默认一并安装，包含 Ruff、pytest 等工具。`--locked` 会检查锁文件与 `pyproject.toml` 是否一致，不会自动改写锁文件。

日常开发以 `pyproject.toml` 和 `uv.lock` 为准，无需再手动创建、激活虚拟环境或运行 `pip install -r requirements.txt`。IDE 的 Python 解释器请选择仓库中的 `.venv\Scripts\python.exe`。拉取代码后重新执行 `uv sync --locked`，即可同步依赖。

### 3. 前端环境搭建

**进入前端目录并安装依赖**

::: code-group

```powershell [PowerShell]
cd frontend
yarn install
```

```bash [Bash]
cd frontend
yarn install
```

:::

如果 Electron 二进制下载缓慢或失败，可以使用 npmmirror 镜像执行一次性安装：

::: code-group

```powershell [PowerShell]
yarn cross-env ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" yarn install
```

```bash [Bash]
yarn cross-env ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" yarn install
```

:::

该命令只为本次 `yarn install` 设置下载源，不会修改全局配置。


### 4. 启动软件

::: tip 管理员权限

调试游戏控制、模拟器等需要管理员权限的功能时，请以管理员身份运行终端或 IDE；已有 `.env` 标记的本地后端不会自行提权。

如果你使用 jetbrains IDE 或 VScode，你可以直接以管理员权限启动 IDE，这样打开的命令行程序也具有管理员权限。

:::

以下两种方式都运行当前检出的本地后端代码，任选一种即可。

#### 4.1 分别启动后端与前端

1. **在仓库根目录启动后端服务**

::: code-group

```powershell [PowerShell]
uv run --locked python main.py
```

```bash [Bash]
uv run --locked python main.py
```

:::

完成 `.env` 配置后，后端默认在 `http://127.0.0.1:36164` 启动，可以访问 `http://127.0.0.1:36164/docs` 查看接口文档。保持该终端运行；正式版默认使用 `36163`，两者可同时运行。

2. **启动前端服务**

开启一个新的终端，在仓库根目录执行：

::: code-group

```powershell [PowerShell]
cd frontend
$env:AUTO_MAS_RUNTIME_MODE = "off"
yarn dev
```

```bash [Bash]
cd frontend
export AUTO_MAS_RUNTIME_MODE=off
yarn dev
```

:::

前端开发服务器将在 `http://localhost:5173` 启动，Electron 窗口会自动打开，并复用已启动、版本一致的开发后端。这里将 Runtime 启动方式设为 `off`，由终端管理本地后端；该环境变量只影响当前终端及其子进程。

仅运行 `yarn dev` 不会执行前面的 uv 环境同步和本地后端启动命令。请先确认后端终端启动成功，不要依赖旧教程中“等待启动失败后跳过”的流程。

#### 4.2 一次启动后端与前端

在仓库根目录打开终端并执行：

::: code-group

```powershell [PowerShell]
cd frontend
$env:AUTO_MAS_RUNTIME_MODE = "off"
yarn dev:fullstack
```

```bash [Bash]
cd frontend
export AUTO_MAS_RUNTIME_MODE=off
yarn dev:fullstack
```

:::

该命令会运行本地 `main.py`、Vite 开发服务器和 Electron 开发窗口，并在 `36164` 上的后端就绪后打开窗口。`dev:fullstack` 会通过 `uv run --project .. --locked` 启动后端，自动使用仓库的 `.venv`，无需在外层再运行 uv。


##  项目结构

```
AUTO-MAS/
├── app/                          # 后端核心代码
│   ├── api/                      # FastAPI 路由和接口
│   │   ├── core.py              # 核心 API
│   │   ├── dispatch.py          # 任务调度 API
│   │   ├── emulator.py          # 模拟器管理 API
│   │   ├── history.py           # 历史记录 API
│   │   ├── ocr.py               # OCR 相关 API
│   │   ├── plan.py              # 计划管理 API
│   │   ├── queue.py             # 队列管理 API
│   │   └── ...
│   ├── core/                     # 核心业务逻辑
│   │   ├── broadcast.py         # 广播系统
│   │   ├── config.py            # 配置管理
│   │   ├── emulator_manager.py  # 模拟器管理器
│   │   ├── task_manager.py      # 任务管理器
│   │   └── timer.py             # 定时器
│   ├── models/                   # 数据模型
│   │   ├── config.py            # 配置模型
│   │   ├── emulator.py          # 模拟器模型
│   │   ├── schema.py            # API Schema
│   │   └── task.py              # 任务模型
│   ├── services/                 # 外部服务
│   │   ├── matomo.py            # 统计服务
│   │   ├── notification.py      # 通知服务
│   │   ├── system.py            # 系统服务
│   │   └── update.py            # 更新服务
│   ├── task/                     # 任务实现
│   │   ├── general/             # 通用任务
│   │   └── MAA/                 # MAA 相关任务
│   └── utils/                    # 工具函数
│       ├── logger.py            # 日志工具
│       ├── ImageUtils.py        # 图像处理工具
│       ├── ProcessManager.py    # 进程管理
│       ├── emulator/            # 模拟器工具
│       ├── LogMonitor/          # 日志监控
│       └── OCR/                 # OCR 工具
│
├── frontend/                     # 前端代码
│   ├── src/                     # 源代码
│   │   ├── views/               # 页面组件
│   │   ├── components/          # 公共组件
│   │   ├── api/                 # API 调用，由插件生成
│   │   ├── router/              # 路由配置
│   │   ├── composables/         # 组合式函数
│   │   └── types/               # TypeScript 类型
│   ├── electron/                # Electron 主进程代码
│   │   ├── main.ts              # 主进程入口
│   │   ├── preload.ts           # 预加载脚本
│   │   └── ipc/                 # IPC 通信
│   └── public/                  # 静态资源
│
├── res/                          # 资源文件
│   ├── images/                  # 图片资源
│   ├── icons/                   # 图标
│   └── sounds/                  # 音效
│
├── main.py                       # 后端入口
├── .env.example                  # 本地开发标记模板
├── .python-version               # uv 使用的 Python 版本
├── pyproject.toml                # Python 项目与依赖声明
├── uv.lock                       # Python 依赖锁文件
├── requirements.txt              # 旧安装链路的依赖清单
└── README.md                    # 项目说明
```


##  常见问题

### Q: 还需要手动激活 Python 虚拟环境吗

**A**: 不需要。使用 `uv run --locked python main.py` 即可在项目环境中启动后端；IDE 请选择 `.venv\Scripts\python.exe`。

### Q: 提示找不到 uv 命令

**A**: 安装 uv 后重新打开终端，并运行 `uv --version` 检查。如果仍找不到命令，按 [uv 官方安装文档](https://docs.astral.sh/uv/getting-started/installation/) 检查安装路径是否已加入 PATH。

### Q: uv sync --locked 提示锁文件需要更新

**A**: 先确认 `pyproject.toml`、`uv.lock` 和 `.python-version` 来自同一份代码。如果是自己有意修改了依赖声明，在仓库根目录运行 `uv lock` 更新锁文件，再运行 `uv sync --locked` 验证，并将依赖声明与锁文件一起提交。不要为绕过报错删除 `uv.lock`。

### Q: yarn install 失败

**A**: 尝试以下方法:

1. 清理缓存: `yarn cache clean`
2. 删除 `node_modules`，保留仓库中的 `yarn.lock`
3. 重新安装: `yarn install`
4. Electron 二进制下载缓慢或失败时，使用镜像执行一次性安装:
   `yarn cross-env ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" yarn install`

### Q: 后端启动失败提示权限不足

**A**: AUTO-MAS 需要管理员权限运行。请以管理员身份运行:

- 以管理员身份打开 PowerShell 或 Git Bash
- 或在 VS Code 中以管理员身份启动

### Q: Electron 窗口无法打开

**A**: 检查:

1. 前端开发服务器是否正常运行（`http://localhost:5173`）
2. 后端服务是否正常启动（`http://127.0.0.1:36164/docs`），仓库根目录是否已有 `.env`
3. 查看终端输出的错误信息


##  许可证

本项目采用 [AGPL-3.0 License](https://www.gnu.org/licenses/agpl-3.0.txt) 开源。

在使用、分发或修改本软件时，请务必遵守 AGPL-3.0 协议和项目 README 中的补充条款。

---

**感谢您对 AUTO-MAS 项目的贡献！** 🎉
