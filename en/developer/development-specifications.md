# Development Standards

## Git Branches

### 1. Main Branch

- **Branch name**: `main`
- **Description**: stores stable code. All features should be stable and runnable.
- **Rules**: `force push` and direct `push` are not allowed. It accepts only pull requests from `dev`, not pull requests from development branches.

### 2. Main Development Branch

- **Branch name**: `dev`
- **Description**: stores the latest feature code. It only guarantees that the project can run.
- **Rules**: maintainers may maintain `dev` directly according to permission. External contributors should create development branches from upstream `dev` and merge through Pull Requests to `AUTO-MAS-Project/AUTO-MAS:dev`. Larger features should use development branches and be merged after testing.

### 3. Release Branch

- **Branch name**: `release/{version}`
- **Description**: stores the latest backend code for each release. It is created automatically by the release workflow. Each released app pulls the latest backend code from its corresponding release branch to support hot updates for some features and fixes.
- **Rules**: after submitting feature updates or fixes to `dev`, synchronize changes to release branches through `cherry-pick`.
- **Cherry-pick rules**: AUTO-MAS separates its frontend and backend, and released apps hot-update backend code from the `release/{version}` branch, while the frontend ships inside the installer and cannot be hot-updated through that branch. Only small `dev` fixes that are **pure backend (unrelated to any frontend code)** may be cherry-picked to an already released `release/{version}` branch. Cherry-picking a commit that carries frontend logic is a **violation**.

  Handle a violation as follows, with no exemption for the change being otherwise correct:

  1. Close the related PR.
  2. Revert the related commit.
  3. If the violating commit has already shipped in a release, roll the released code back and explain the situation to users.

  Judge by the files the commit actually touches, not by the `type` or `scope` in its message: a commit that touches both frontend paths (such as `frontend/`) and backend paths (such as `app/`) carries frontend logic and must not be cherry-picked to a release branch.

### 4. Development Branch

- **Branch name**: any name that does not conflict with other branches or tags
- **Description**: used by core developers to store features in development. It may not run. After development is complete, it is merged into `dev`.
- **Rules**: delete the branch after development and merge are complete.

## Git Commit Messages

Git commits use the Conventional Commits standard:

```text
<type>(<scope>): <subject>
```

### 1. type

| Type | Description |
| ---- | ----------- |
| **feat** | New feature |
| **fix** | Bug fix |
| **docs** | Documentation changes, such as README |
| **style** | Code style changes that do not affect logic, such as spacing or indentation |
| **refactor** | Refactoring that is neither a feature nor a fix |
| **perf** | Performance optimization |
| **test** | Add or modify tests |
| **chore** | Build process or dependency management changes |
| **build** | Changes affecting the build system or external dependencies |
| **ci** | CI/CD configuration changes |

### 2. scope

1. **Only one file is modified**

   Use the modified file name without extension, preserving case.

   - Example: when modifying `logger.py`, use `logger`

     ```text
     fix(logger): adjust logger level
     ```

2. **Multiple files are modified**

   Prefer the common **parent folder name** of the modified files. If multiple directories are involved, choose the business scope that best represents the intent of the change. Do not mechanically concatenate unrelated directories into the scope.

   - Example: when modifying `app/api/a.py` and `app/api/b.py`, use `api`

     ```text
     fix(api): adjust api module
     ```

### 3. subject

Use one sentence to summarize the change. Detailed changes may be written after a blank line.

```text
feat(core): improve database connection module

- Optimize connection pool initialization
- Reduce startup time by about 30%
- Fix a possible connection leak
```

## Version Records

This project records version information in `res/version.json`:

```json
{
    "version": "v5.4.0.beta1",
    "version_info": {
        "v5.4.0.beta1": {
            "新增功能": [
                "全新架构升级"
            ],
            "修复BUG": [
                "修复某项用户可见问题"
            ],
            "程序优化": [
                "优化某项使用体验"
            ]
        }
    }
}
```

- Version update information and announcements are generated from this file. To ensure your changes are recorded correctly, update and commit this file after finishing a task.
- If the version corresponding to `version` has already been released, do not add `change entries` directly under that version. Add the next version entry in `version_info`, then add your `change entries` under the new version.
- Each PR adds exactly one changelog entry: condense all of the PR's changes into a single `change entry` under the best-matching category, instead of splitting them into multiple stacked entries.

## Backend Comments

::: tip Overview
Backend comments should follow **Google Python Style Guide - Docstring Conventions**, also called **Google Docstring**.
:::

### Method Comments

```python
def add_numbers(a: int, b: int) -> int:
    """Add two numbers and return their sum.

    Args:
        a: The first number.
        b: The second number.

    Returns:
        The sum of the numbers.

    Raises:
        ValueError: The input arguments are not integers.
    """

    if not all(isinstance(x, int) for x in (a, b)):
        raise ValueError("arguments must be integers.")
    return a + b
```

### Configuration Class Comments

Configuration objects inherit from `ConfigEntry`, and semantic field blocks
inherit from `ConfigGroup`. Type annotations define field types, while
`Field` describes defaults, constraints, and Chinese descriptions. Use
`default_factory` so groups and lists are independent for each instance.

```python
from typing import Literal

from pydantic import Field

from app.config import ConfigEntry, ConfigGroup


class GlobalConfig(ConfigEntry):
    """Example declaration of global configuration."""

    class FunctionFields(ConfigGroup):
        HistoryRetentionTime: Literal[7, 15, 30, 60, 90, 180, 365, 0] = Field(
            default=0, description="History retention in days; 0 means no cleanup"
        )
        IfAllowSleep: bool = Field(default=False, description="Whether sleep is allowed")
        IfSilence: bool = Field(default=False, description="Whether silent mode is enabled")

    class NotifyFields(ConfigGroup):
        IfSendStatistic: bool = Field(default=False, description="Whether to send runtime results")

    Function: FunctionFields = Field(default_factory=FunctionFields)
    Notify: NotifyFields = Field(default_factory=NotifyFields)
```

Configuration fields and their validation rules are declared once in the
configuration model. API input and output contracts are derived from that
model. Runtime private state is not persisted. See
[Configuration Management](./config.md) for field types and calling
conventions.

## Backend Function Calls

::: tip Overview
Use positional arguments only when the meaning is obvious at a glance. Otherwise, use keyword arguments. Boolean and multi-argument calls must use keyword arguments.
:::

To improve readability, reduce misuse, and improve collaboration efficiency, follow these function-call rules:

### 1. Simple functions with clear meaning -> use positional arguments

When there are few parameters, usually no more than two, and the meaning is clear, positional arguments are acceptable.

Example:

```python
add(1, 2)
math.sqrt(4)
```

### 2. Less obvious, many-parameter, or easily confused functions -> use keyword arguments

Keyword arguments improve readability, do not rely on positional order, and are safer.

Example:

```python
UserItem(user_id=str(uid), name=config.get("Info", "Name"), status="waiting")
```

### 3. All boolean parameters must use keyword arguments

Avoid unreadable calls.

Not recommended:

```python
send_notification(True, False)
```

Recommended:

```python
send_notification(enable=True, urgent=False)
```

### 4. When there are more than two arguments, prefer keyword arguments

This improves maintainability and reduces the risk of order mistakes.

Example:

```python
connect(host="localhost", port=3306, timeout=5)
```
