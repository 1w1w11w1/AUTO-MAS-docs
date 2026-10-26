# Getting Started

Welcome to AUTO-MAS development. This document helps you quickly set up the development environment and understand the project structure.

## Technology Stack

### Backend

- **Python**: 3.12.x
- **Environment and dependency management**: uv (`pyproject.toml` + `uv.lock`)
- **Web framework**: FastAPI
- **Realtime communication**: WebSockets 15.0.1
- **Logging**: Loguru 0.7.3
- **Image processing**: OpenCV, Pillow, PyAutoGUI
- **OCR**: RapidOCR (ONNX Runtime)

### Frontend

- **Framework**: Vue 3 + TypeScript
- **UI component library**: Ant Design Vue 4.x
- **Desktop**: Electron
- **Build tool**: Vite Plus (Vite)
- **Routing**: Vue Router 4
- **State management**: Pinia 3.x

## Environment Requirements

### Required Software

1. **uv**
   - Follow the [official uv installation guide](https://docs.astral.sh/uv/getting-started/installation/). On Windows, run `winget install --id=astral-sh.uv -e`, then reopen your terminal.
   - The root `.python-version` file selects the Python version (currently 3.12.13). uv downloads it if it is missing, so a separate Python installation is not required.
2. **Node.js 22.18+**
   - Download: https://nodejs.org/
   - Node.js 24 LTS is recommended, matching the current frontend checks.
3. **Yarn** (recommended)
   - The project uses Yarn 4. Enable it through Corepack: `corepack enable`
   - After entering `frontend`, you can directly use the Yarn version declared by the repository.
4. **Git**
   - Download: https://git-scm.com/downloads
5. **VC runtime**
   - Download: [Latest supported Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)

## Quick Start

Commands below are provided for both PowerShell and Bash. Select the tab matching your terminal. Run commands from the repository root unless a step explicitly enters `frontend`.

### 1. Clone the Project

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

Before making changes, create a development branch from the latest upstream `dev` as described in the [development specifications](./development-specifications.md).

::: tip Agent Development Prerequisite

If an AI assistant participates in development, first confirm that the main repository contains and loads `.agents/skills/mas-skills/SKILL.md`. If project-owned Skills are missing, complete the main repository content first. Do not let the AI assistant start work directly.

:::

### 2. Backend Environment Setup

1. **Create the local development marker**

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

`.env` is not tracked by Git. It marks the checkout as a development environment: the backend defaults to port `36164`, does not send errors or performance data to Sentry, and does not request administrator privileges automatically. Do not skip this step, or a backend started directly from source will use production behavior.

2. **Sync the Python environment and dependencies**

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

uv selects Python from `.python-version`, creates or reuses `.venv` in the repository root, and installs dependencies from `uv.lock`. The development dependency group, including Ruff and pytest, is installed by default. `--locked` checks that the lockfile matches `pyproject.toml` without rewriting it.

Use `pyproject.toml` and `uv.lock` for development. You do not need to create or activate a virtual environment manually or run `pip install -r requirements.txt`. Select `.venv\Scripts\python.exe` as your IDE's Python interpreter. Run `uv sync --locked` again after pulling code to sync dependencies.

### 3. Frontend Environment Setup

**Enter the frontend directory and install dependencies**

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

If the Electron binary download is slow or fails, use npmmirror for a one-shot install:

::: code-group

```powershell [PowerShell]
yarn cross-env ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" yarn install
```

```bash [Bash]
yarn cross-env ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" yarn install
```

:::

This command sets the download source only for this `yarn install` run and does not change global configuration.

### 4. Start the App

::: tip Administrator Privileges

Run your terminal or IDE as administrator when debugging features that require elevated access, such as game or emulator control. A local backend with the `.env` marker will not elevate itself.

If you use a JetBrains IDE or VS Code, start the IDE as administrator so terminals opened inside it also have administrator privileges.

:::

Both options below run backend code from your current local checkout. Choose one.

#### 4.1 Start Backend and Frontend Separately

1. **Start the backend service from the repository root**

::: code-group

```powershell [PowerShell]
uv run --locked python main.py
```

```bash [Bash]
uv run --locked python main.py
```

:::

With `.env` in place, the backend defaults to `http://127.0.0.1:36164`. Visit `http://127.0.0.1:36164/docs` for API documentation. Keep this terminal running. Installed releases default to port `36163`, so both instances can run at the same time.

2. **Start the frontend service**

Open a new terminal at the repository root:

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

The frontend dev server starts at `http://localhost:5173`, and the Electron window opens automatically. The frontend reuses the running development backend when its version matches. Setting the Runtime launch mode to `off` leaves the local backend under terminal control; this environment variable affects only the current terminal and its child processes.

Running `yarn dev` alone does not execute the uv sync or local backend startup commands above. Confirm that the backend has started successfully instead of following the old flow of waiting for startup to fail and then skipping it.

#### 4.2 Start Backend and Frontend Together

Open a terminal at the repository root and run:

::: code-group

```powershell [PowerShell]
cd frontend
$env:AUTO_MAS_RUNTIME_MODE = "off"
uv run --locked pwsh -NoProfile -Command "yarn dev:fullstack"
```

```bash [Bash]
cd frontend
export AUTO_MAS_RUNTIME_MODE=off
uv run --locked bash -c "yarn dev:fullstack"
```

:::

This runs local `main.py`, the Vite dev server, and the Electron development window, opening the window after the backend on port `36164` is ready. uv discovers the Python project in the parent of `frontend` and makes the repository's `.venv` available to child processes. Invoking Yarn through the corresponding shell supports the Yarn launcher scripts installed by Corepack.

The backend script inside `dev:fullstack` still calls `python`, so keep the outer `uv run` command to ensure it uses the project environment.

## Project Structure

```text
AUTO-MAS/
├── app/                          # Backend core code
│   ├── api/                      # FastAPI routes and interfaces
│   │   ├── core.py               # Core API
│   │   ├── dispatch.py           # Task scheduling API
│   │   ├── emulator.py           # Emulator management API
│   │   ├── history.py            # History API
│   │   ├── ocr.py                # OCR-related API
│   │   ├── plan.py               # Plan management API
│   │   ├── queue.py              # Queue management API
│   │   └── ...
│   ├── core/                     # Core business logic
│   │   ├── broadcast.py          # Broadcast system
│   │   ├── config.py             # Configuration management
│   │   ├── emulator_manager.py   # Emulator manager
│   │   ├── task_manager.py       # Task manager
│   │   └── timer.py              # Timer
│   ├── models/                   # Data models
│   │   ├── config.py             # Configuration model
│   │   ├── emulator.py           # Emulator model
│   │   ├── schema.py             # API schema
│   │   └── task.py               # Task model
│   ├── services/                 # External services
│   │   ├── matomo.py             # Analytics service
│   │   ├── notification.py       # Notification service
│   │   ├── system.py             # System service
│   │   └── update.py             # Update service
│   ├── task/                     # Task implementations
│   │   ├── general/              # General tasks
│   │   └── MAA/                  # MAA-related tasks
│   └── utils/                    # Utility functions
│       ├── logger.py             # Logging utility
│       ├── ImageUtils.py         # Image processing utility
│       ├── ProcessManager.py     # Process management
│       ├── emulator/             # Emulator utilities
│       ├── LogMonitor/           # Log monitoring
│       └── OCR/                  # OCR utilities
│
├── frontend/                     # Frontend code
│   ├── src/                      # Source code
│   │   ├── views/                # Page components
│   │   ├── components/           # Shared components
│   │   ├── api/                  # API calls, generated by tooling
│   │   ├── router/               # Router configuration
│   │   ├── composables/          # Composables
│   │   └── types/                # TypeScript types
│   ├── electron/                 # Electron main process code
│   │   ├── main.ts               # Main process entry
│   │   ├── preload.ts            # Preload script
│   │   └── ipc/                  # IPC communication
│   └── public/                   # Static assets
│
├── res/                          # Resource files
│   ├── images/                   # Image assets
│   ├── icons/                    # Icons
│   └── sounds/                   # Sound effects
│
├── main.py                       # Backend entry point
├── .env.example                  # Local development marker template
├── .python-version               # Python version used by uv
├── pyproject.toml                # Python project and dependency declarations
├── uv.lock                       # Python dependency lockfile
├── requirements.txt              # Dependencies for the legacy install path
└── README.md                     # Project description
```

## FAQ

### Q: Do I still need to activate the Python virtual environment?

**A**: No. Start the backend in the project environment with `uv run --locked python main.py`. Select `.venv\Scripts\python.exe` as your IDE's interpreter.

### Q: The uv command cannot be found

**A**: Reopen your terminal after installing uv, then run `uv --version`. If it is still unavailable, check that its installation directory is on PATH using the [official uv installation guide](https://docs.astral.sh/uv/getting-started/installation/).

### Q: uv sync --locked says the lockfile needs updating

**A**: First confirm that `pyproject.toml`, `uv.lock`, and `.python-version` come from the same checkout. If you intentionally changed dependency declarations, run `uv lock` from the repository root, then verify with `uv sync --locked`. Commit the dependency declarations and lockfile together. Do not delete `uv.lock` to bypass the error.

### Q: yarn install fails

**A**: Try:

1. Clear cache: `yarn cache clean`
2. Delete `node_modules`, keeping the repository's `yarn.lock`
3. Install again: `yarn install`
4. If the Electron binary download is slow or fails, install once through the mirror:
   `yarn cross-env ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" yarn install`

### Q: Backend startup fails due to insufficient permissions

**A**: AUTO-MAS requires administrator privileges. Run as administrator:

- Open PowerShell or Git Bash as administrator
- Or start VS Code as administrator

### Q: Electron window cannot open

**A**: Check:

1. Whether the frontend dev server is running normally at `http://localhost:5173`
2. Whether the backend is available at `http://127.0.0.1:36164/docs` and `.env` exists in the repository root
3. Error output in the terminal

## License

This project is open source under the [AGPL-3.0 License](https://www.gnu.org/licenses/agpl-3.0.txt).

When using, distributing, or modifying this software, comply with AGPL-3.0 and the supplementary terms in the project README.

---

Thank you for contributing to AUTO-MAS.
