# 运行环境

## 要点

- 两类解释器：**runner** 一律跑在运行池的 base venv 里（每种宿主 Python 身份一套）；**agent** 按项目落在 `project_python` / `isolated_venv` / `project_binary` / `external` 之一。
- 铁律：**binding 必须与 runner 实际加载的原生库同版本**。两边的 Agent 协议版本对不上时，表面上只有一句「AgentClient 连接超时」。所有钉版都朝「跟原生库走」。
- 原生库：项目自带的优先，多份时先按本机架构、再按版本最高；runner 与 agent 用**同一份**。
- 运行环境确认按项目指纹缓存；编辑页「准备运行环境」强制不走缓存。
- 子进程命令一律用绝对路径，裸 `python` 不交给 PATH。

## agent 解释器的四种落法

由 `MaaFW/tools/core/agent_env/planner.py` 决定。

| 落法 | 何时 | 为什么 |
| --- | --- | --- |
| `project_python` | 项目自带 `python/python.exe` | 自带解释器可能是特定版本，site-packages 里可能有依赖清单没写的包 |
| `isolated_venv` | 声明了自带 Python 但文件不存在，或裸写 `python / python3 / pythonw`（[#793][793]） | Windows 的 `CreateProcess` 先按父进程（venv 的基解释器）所在目录找、用父进程的 PATH，传给子进程的 PATH 不参与查找，裸 `python` 永远落到没装 `maa` 的解释器 |
| `project_binary` | 原生 agent（Go / C++ 可执行文件） | — |
| `external` | 其余（如 `node`） | — |

- 目录里没有 Python 不是错误。
- 隔离 venv 按项目路径的哈希定位，只装 `requirements.txt` 写的；**没有 requirements.txt 时按原生库版本补一条 `maafw`**（[#884][884]），写了清单但没声明 maafw 的不追加。原因：MFW-PyQt6「嵌入式 Agent」项目把 maa 冻进外壳，发行包不写依赖。
- 自带 Python 是 embeddable、没有 pip 时，改用 `uv pip install --python <exe>`。
- agent 的环境里剔除宿主专用的变量（`runtime_pool/host_environment.py` 的 `ISOLATED_HOST_KEYS`），设 `PYTHONUTF8`、`PYTHONUNBUFFERED=1`，以及把字节码写到项目根 `.pycache` 的 `PYTHONPYCACHEPREFIX`（路径会超过 MAX_PATH 时不设）。

## 钉版

| 设计 | 为什么 |
| --- | --- |
| 隔离 venv 的 maafw 钉成 runner 加载的原生库的**确切版本**，不照抄 requirements 里的范围（`runner/environment.py` 的 `resolve_project_maafw_requirement`） | maafw 5.13.0 把 Agent 协议号从 7 升到 8；让 pip 自己挑会落到协议不同的版本 |
| 没自带原生库的项目同样钉确切版本（[#1294][1294]） | 同上；这类项目升级后会重建一次隔离 venv |
| 钉的版本进 venv 清单哈希，一变就自动重建 | 已装错的 venv 不用让用户手动删 |
| `project_python` 里的 binding 也钉回原生库版本，只对**内嵌视图与更新暂存目录**做；用户自己的目录只说明、不改（[#885][885]） | 项目的部署脚本可能把 maafw 升到 PyPI 最新 |
| site-packages 里残留多份 `maafw-*.dist-info` 时，钉回前先把非最高版本的记录暂时挪开；只有 pip 成功且复读版本一致才删，否则原样挪回（`agent_env/env.py` 的 `_stale_maafw_dist_infos`，[#1024][1024]） | pip 按目录顺序取第一份、我们取最高版本，不挪开两边认的不是同一个；失败时必须回到原样，离线也能照常准备 |
| 钉回的任何一步失败只记日志，不拦准备 | 离线时照样能跑 |

## 原生库选择

| 设计 | 为什么 |
| --- | --- |
| `runner/environment.py` 的 `project_maafw_runtime_path`：项目自带优先，先给本机 rid 并用 PE 头核对架构；本机能加载的有多份时取版本最高的（[#1024][1024]、[#1140][1140]） | 按名字排序会在 x64 机器上选中 arm64；旧布局的残留会被优先选中 |
| 本机架构的单一来源是 `runtime_pool/architecture.py` 的 `host_architecture()`，按解释器构建平台判断；非 x64 只在运行前提示一次「目前只支持 x64」，不做 arm64 适配（[#1102][1102]、[#1117][1117]） | Python 3.12 的 `platform.machine()` 在仿真环境下会报错架构 |
| 插件目录按 PE 头跳过与 worker 架构不符的 DLL；显式点名的插件架构不符直接报错、不重试（[#1102][1102]） | 混架构发行包一个失败整轮失败 |
| runner 与 agent 用同一份：项目自带 Python 里没有 `maa/bin` 时，给 agent 注入 `MAAFW_BINARY_PATH` 指向 runner 用的那份；agent 的 PATH 里这份排最前（`agent_env/env.py` 的 `project_python_agent_binary_path`，[#1143][1143]） | 项目里同时有两份原生库时，MAS 与项目 agent 的取序可能相反，结果协议不一致 |
| 原生 agent 固定从 `<项目>/maafw` 加载，指不过去：runner 选的不是它且版本不同时，启动 agent 之前就报混装 | 不等满连接超时 |
| agent 输出里出现 `Protocol version mismatch` 立即失败，报出两端的版本与协议号（[#1140][1140]） | 原来要等满 600 秒 |
| 项目自带 Python 的健康检查用与 agent 真跑时同一份原生库（[#1082][1082]） | 有的发行包不在 `maa/bin` 放库，由 agent 自己指路径；检查不照做就一律误报不可用 |
| 健康检查失败时界面只给 traceback 的最后一行，完整输出只进详情日志（[#1088][1088]） | 任务结果与通知只取第一行 |

## 运行池

位置 `config/maafw_runtime_pool/`。

| 设计 | 为什么 |
| --- | --- |
| runner 只有一套 base venv：身份 = 常量包集合 `BASE_RUNTIME_PACKAGES`（不含 maafw）+ 宿主 Python 身份；**不装项目的 requirements.txt** | worker 不执行项目代码；原来同一 maafw 版本会因依赖不同裂成多份 |
| binding 按版本存在 `bindings/maafw-<版本>/`（纯 Python，`maa/bin` 只放占位文件）；没自带原生库的项目用 `native/maafw-<版本>/` 里的官方原生库（`runtime_pool/binding.py` 的 `ensure_binding`） | worker 按项目钉的原生库版本挑 binding |
| binding 来源依次：PyPI / 镜像的官方平台 wheel → MaaFramework tag 源码自行打包（只对自带原生库的项目有意义）→ 都不行就不升级；所有候选都连不上时报网络错误，不走源码（[#901][901]） | 曾有项目带了 PyPI 上不存在的 maafw 版本 |
| 自行打包的 wheel 必须带 `maa/bin` 占位文件，必须保留对 `maaagentbinary` 的依赖 | `import maa` 时就会打开 `<maa>/bin`；`MaaAgentBinary` 是 ADB 控制器的默认 agent 路径，剔了会静默丢掉触控与截图组件 |
| 版本范围或裸 `maafw` 的选版：记住每个项目上次选中的版本，仍满足就沿用；否则取本地已有的最高满足版本，再否则取索引里的最高满足版本（预发布只在范围明确包含预发布时考虑） | 不因兄弟项目或索引出了新版就悄悄漂移 |
| `MAAFW_BINARY_PATH` 与 runner 实际打开的原生库路径必须同源 | binding 每次初始化前都会重设路径 |
| 回收：按 MFW 脚本算出在用的版本集合；没人用的 binding / 原生库 24 小时宽限后删；进程内引用计数覆盖整个运行；删除一律先改名再删；脚本表没加载完整时整轮跳过 | 运行中懒加载的模块被删会半路失败；空集合会把一切判成孤儿 |
| 宿主是 embeddable Python 时不拿它当 venv 引导（[#531][531]） | embeddable 复制进 venv 时缺 `._pth`，注册表回退会混入系统 Python 的扩展模块 |
| 受 Runtime 监督时复用它注入的 uv、缓存与镜像列表，不清理注入的共享缓存 | 主程序也依赖那份缓存 |
| 代理：脚本级 `Update.ProxyAddress` 留空跟随全局，同时管 uv / pip 安装；回环地址不走代理（[#943][943]） | 用户在 MAS 里填了代理就必须走代理 |

## 运行环境确认与缓存

| 设计 | 为什么 |
| --- | --- |
| 准备结果按项目指纹缓存（`MaaFW/tools/embedded/env_cache.py`）：指纹含 interface、依赖清单、锁文件、自带原生库版本、binding 记录名，以及宿主解释器身份；命中还要求记下的解释器与 venv 仍在（[#610][610]） | 「每次进页面都重新确认」只是空转；换了随包 Python 不能命中旧结果 |
| 缓存只检查存在、不验内容；兜底是运行前起解释器核一次 ABI，以及编辑页「准备运行环境」强制重来 | 有意的成本取舍 |
| 运行前 / 运行后更新之后、任何一次版本切换之后都接一次确认，**更新失败也确认** | 隔离 venv 重建要几分钟、要联网，拖到运行中时模拟器与游戏都已经起来，用户只看到任务卡住 |
| 编辑页把结果分成「准备完成 / 更新完成 / 无需更新 / 失败」 | 结论作为日志最后一行整行标色 |

## 限制

- 只支持 x64。
- 项目 agent 首次运行时自己安装依赖，可能超过 runner 等待连接的时间窗口。
- 导入时用户手动装进自带解释器的包，第一次全量更新就会被清掉，MAS 不负责重装（见 [项目更新](./update.md)）。

[531]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/531
[610]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/610
[793]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/793
[884]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/884
[885]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/885
[901]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/901
[943]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/943
[1024]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1024
[1082]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1082
[1088]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1088
[1102]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1102
[1117]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1117
[1140]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1140
[1143]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1143
[1294]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1294
