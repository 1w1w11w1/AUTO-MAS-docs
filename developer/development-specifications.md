# 开发规范

## Git 分支

### 1. 主分支

- **分支名**：`main`
- **描述**：用于存储稳定版代码，保证所有功能稳定，能够直接跑通。
- **规范**：主分支不允许 `force push` 或 `push`，仅接受来自 `dev` 分支的 `pull request`，不接受来自开发分支的 `pull request`。


### 2. 主开发分支

- **分支名**：`dev`
- **描述**：用于存储包含当前最新功能的代码，仅保证能够直接跑通。
- **规范**：项目维护者可以按权限直接维护 `dev`；外部贡献者应从上游 `dev` 拉出开发分支，并通过 Pull Request 合入 `AUTO-MAS-Project/AUTO-MAS:dev`。较大的功能开发应建立开发分支，测试完成后再合入。
- **开工基线**：拉分支前先 `git fetch`，从**最新**的上游 `dev` 拉出，不要在旧的本地 `dev` 或旧分支上接着改。从旧 `dev` 开工的分支在同步时会把期间别人合入的改动整份盖掉，git 不报冲突、类型检查也照过。


### 3. 发行版分支

- **分支名**：`release/{version}`
- **描述**：用于存储各个发行版的最新后端代码，由版本发布工作流自动创建，各个发行版软件自动从各自对应的发行版分支拉取最新后端代码，以实现部分功能更新与问题修复的热更。
- **规范**：在 `dev` 分支提交功能更新或问题修复后，通过 `cherry-pick` 将更改同步到发行版分支。
- **cherry-pick 规范**：本项目前后端分离，发行版软件的后端代码从 `release/{version}` 分支热更，而前端随安装包一起分发、无法通过该分支热更。因此只有**改动小、且为纯后端（不关联任何前端）**的 `dev` 修复才允许 `cherry-pick` 到已发行的 `release/{version}` 分支；摘带前端逻辑的提交属于**违规操作**。

  违反该规范时按下列方式处理，不因改动本身正确而豁免：

  1. 对相关的 PR 执行 close。
  2. 对相关的 commit 执行 revert。
  3. 若违规提交已随发行版发布，需回退发行版代码并向用户说明。

  判定依据是该提交实际触碰的文件，而不是提交信息里的 `type` 或 `scope`：只要同时触碰前端路径（如 `frontend/`）与后端路径（如 `app/`），即视为带前端逻辑，不得摘入发行版分支。


### 4. 开发分支

- **分支名**：`随意，别和其他分支或标签冲突就行~`
- **描述**：项目核心开发者用于存储开发中的功能，不一定能跑通，当功能开发完成后，将会合并到 `dev` 分支。
- **规范**：完成开发以及合并后，记得删除该分支。


## Git 提交信息

Git 提交采用Conventional Commits 标准，即：

```
<type>(<scope>): <subject>
```

### 1. type

| 类型         | 说明                                     |
| ------------ | ---------------------------------------- |
| **feat**     | 新功能（feature）                        |
| **fix**      | 修复 bug                                 |
| **docs**     | 文档修改（例如 README）                  |
| **style**    | 代码格式调整（不影响逻辑，如空格、缩进） |
| **refactor** | 代码重构（既不是新功能，也不是修复）     |
| **perf**     | 性能优化                                 |
| **test**     | 增加或修改测试                           |
| **chore**    | 构建流程或依赖管理上的调整               |
| **build**    | 影响构建系统或外部依赖的变更             |
| **ci**       | CI/CD 配置修改                           |

### 2. scope

1. **只修改了某个文件**

    填入去掉后缀的修正文件名称，保留大小写。

    - 例如：修改 `logger.py`，使用 `logger`

        ```fix(logger): 修改logger日志等级 ```

2. **修改了多个文件**

    优先填入这组修改共同所属的 **父文件夹名**；若涉及多个目录，选择最能代表本次变更意图的业务范围，避免把多个零散目录机械拼成 scope。

    - 例如：修改 `app/api/a.py`、`app/api/b.py`，使用 `api`

        ```fix(api): 修改api模块 ```

### 3. subject

**所做修改的一句话总结**，可隔一行书写详细修改内容

```
feat(core): 改进数据库连接模块

- 优化连接池初始化逻辑
- 减少启动时间约 30%
- 修复可能导致连接泄漏的问题
```


## 测试提交与维护规范

测试是代码变更的可复核证据。可重复运行、守护用户行为或公共契约的自动化回归测试，应与被测改动放在同一仓库、同一个 PR 中，并随产品代码长期维护。

### 测试归属

- **长期自动化测试**：确定性、可隔离、可重复运行的单元、契约和回归测试放在对应测试目录或被测模块附近，随对应实现一起提交。优先断言用户可观察行为或公共契约，避免绑定私有函数调用顺序、内部数据布局等实现细节。
- **作者本机真实流程**：需要真实账号、游戏、脚本安装或模拟器的流程，按主仓 `docs/testing/e2e.md` 在作者环境运行，并在 PR 提供经过检查的命令与脱敏证据。不要提交凭据、账号数据、游戏资源或机器专属配置。
- **临时诊断**：只用于一次性排查的用例和脚本留在本地或被忽略的 `.dev/` 目录；只有确有重复使用价值的诊断工具才进入 `scripts/`。

### PR 验证记录

- 记录测试命令、通过/失败结果、测试的 commit SHA、运行环境和未覆盖范围；真实流程还应记录必要前置条件与精选证据。
- Bug 有稳定复现时，回归测试应在修复前失败、修复后通过，并随 PR 保留。若无法稳定复现或无法自动化，在 PR 中说明原因和替代验证，不要只报告未提交测试的通过数量。
- 没有新增或修改自动化测试时，说明原因和替代验证；纯文档、CI 或测试维护改动可注明不适用。

### 修改、删除与不稳定测试

- 行为或公共契约改变时，同步更新相关测试期望。删除测试需要说明被测行为已移除、已有更强测试替代、测试重复，或无法以合理成本维持可靠性的原因及替代覆盖。
- 不稳定测试应关联跟踪问题、负责人和复查日期，并临时隔离；之后必须修复、替换或删除。不要依赖自动重试掩盖失败，也不要让隔离或 `xfail` 长期没有负责人和复查时间。
- 按失败率、定位成本和运行耗时维护测试。测试行数、文件数或测试与业务代码的比例不作为质量门槛；耗时升高时先定位和优化慢测试及共享 setup。

### 本地与 CI 命令

pytest 属于主仓开发依赖。使用锁定环境运行：

```powershell
uv sync --locked --group dev
uv run --no-sync python -m pytest tests/<path> -q
uv run --no-sync python -m pytest tests -q
```

面向 `dev` 的 PR CI 在 Windows 与 Ubuntu 执行完整 pytest 套件。完整执行已经包含测试收集，不需要再设置独立的 `--collect-only` 合并门槛。真实游戏、账号和模拟器流程继续按作者本机 E2E 规范验证，不放进 pytest CI。

## 版本记录

本项目依靠 `res/version.json` 文件记录版本信息，文件格式为：

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

- 版本更新信息与公告都根据该文件生成，为了保证您所做的修改被正确登记，当您完成某项任务时，需要自行修改该文件并提交。
- 若 `version` 对应版本已经完成发布，您不能直接在对应版本条目下新增 `修改条目`，而应该在 `version_info` 中添加下个版本的版本条目，并在新版本条目下添加您的 `修改条目`。
- 每个 PR 只新增一条 changelog 条目：将本次 PR 的所有改动浓缩为一条 `修改条目`，写入最匹配的分类下，避免同一 PR 的改动拆成多条条目堆叠。


## 后端注释

::: tip 总览
后端注释应该采用 **Google Python Style Guide – Docstring Conventions**，简称 **Google Docstring** 。
:::

### 方法注释
```
def add_numbers(a: int, b: int) -> int:
    """相加两个数字并返回它们的和。

    Args:
        a: 第一个数字。
        b: 第二个数字。

    Returns:
        数字之和。

    Raises:
        ValueError: 输入的参数不是整数。
    """

    if not all(isinstance(x, int) for x in (a, b)):
        raise ValueError("形参必须是整数。")
    return a + b

```

### 配置类注释

配置对象继承 `ConfigEntry`，按语义分组的字段块继承 `ConfigGroup`。类型注解定义字段类型，`Field` 描述默认值、约束和中文说明；分组、列表等通过 `default_factory` 为各实例独立创建。

```python
from typing import Literal

from pydantic import Field

from app.config import ConfigEntry, ConfigGroup


class GlobalConfig(ConfigEntry):
    """全局配置的声明示例。"""

    class FunctionFields(ConfigGroup):
        HistoryRetentionTime: Literal[7, 15, 30, 60, 90, 180, 365, 0] = Field(
            default=0, description="历史记录保留天数，0 表示不清理"
        )
        IfAllowSleep: bool = Field(default=False, description="是否允许睡眠")
        IfSilence: bool = Field(default=False, description="是否启用静默模式")

    class NotifyFields(ConfigGroup):
        IfSendStatistic: bool = Field(default=False, description="是否发送运行结果")

    Function: FunctionFields = Field(default_factory=FunctionFields)
    Notify: NotifyFields = Field(default_factory=NotifyFields)
```

配置字段及其校验规则只在配置模型声明一份，接口输入、输出契约从模型派生。运行时私有状态不作为持久化字段。完整定义方式、标准字段类型与调用约定见[配置管理](./config.md)。



## 后端函数调用

::: tip 总览
能一眼理解的用位置参数；否则用关键字参数。布尔和多参数强制使用关键字。
:::

为了提高代码可读性、减少误用、提升协作效率，项目中调用函数时应该遵循以下规则：

####  1. 简单且含义明确的函数 → 使用位置参数

当参数少（通常 ≤2 个）且含义清晰时，可直接使用位置参数。

**示例：**

```
add(1, 2)
math.sqrt(4)
```

------

####  2. 含义不够直观、参数较多、或容易混淆的函数 → 使用关键字参数

关键字参数能提升可读性，不依赖位置顺序，更安全。

**示例：**

```
UserItem(user_id=str(uid), name=config.get("Info", "Name"), status="等待")
```

------

####  3. 所有布尔参数必须使用关键字参数

避免出现可读性极差的调用。

不推荐：

```
send_notification(True, False)
```

推荐：

```
send_notification(enable=True, urgent=False)
```

------

####  4. 当参数数量超过 2 个时，优先使用关键字参数

提升可维护性，减少顺序错误风险。

**示例：**

```
connect(host="localhost", port=3306, timeout=5)
```



