# MFW 设计总览

本组页面汇总 MFW（MaaFramework 通用引擎、内嵌项目、M9A / MSS 等风味）**现行**的设计：每条先写「是什么」，再写「为什么」，最后给出处（上游 PR 与仓库内代码路径）。它面向维护者与贡献者，用途有两个：

- 读懂 MFW 怎么设计、为什么这样设计；
- 审查和修复时判断某个行为是缺陷还是有意的取舍——很多看起来像缺陷的行为其实是写明的取舍，先查 [设计取舍](./tradeoffs.md)。

想做一个新风味，直接看操作指南 [风味专项开发](../maafw-flavor.md)；风味的设计说明在 [风味](./flavor.md)。

::: tip 读之前
- 代码是唯一权威，本组页面与代码不一致时以代码为准。改 MFW 代码前，先读主仓的 `app/task/MaaFW/AGENTS.md`；改风味前再读 `app/task/M9A/AGENTS.md`、`app/task/MSS/AGENTS.md`。
- 文中路径相对主仓根目录。`MaaFW/` 是 `app/task/MaaFW/` 的简写。
:::

## 页面

| 页面 | 内容 |
| --- | --- |
| [总体架构](./architecture.md) | MFW 在 AUTO-MAS 里的位置、三层边界、模块地图、一次运行与一次导入的流程 |
| [导入与载荷视图](./import-and-payload.md) | 导入即投影、载荷与视图、谱系与组、切换、复用、开发者模式、源码形态、回收 |
| [运行](./run.md) | 任务快照、全局选项、运行计划、worker、时限与打转检测、重试、收尾、信号、热键、PC 启停 |
| [运行环境](./runtime-env.md) | agent 解释器的落法、钉版、原生库选择、运行池、环境缓存 |
| [项目更新](./update.md) | 一个组只更新一次、下载源与代理、全量与差量、GitHub 区间差量、预检、投影补齐 |
| [风味](./flavor.md) | 后端钩子全集、前端注册表与分节契约、M9A 与 MSS |
| [前端与交互](./frontend.md) | 脚本页与用户页、新建对话框、显示名、提示文案原则 |
| [外壳配置导入与问题包](./shell-import-and-issue-report.md) | MFAAvalonia / MXU / MFW-PyQt6 配置导入、问题包与打码 |
| [设计取舍](./tradeoffs.md) | 「看起来像缺陷、其实是有意的」逐条表 |

## 术语

| 术语 | 含义 |
| --- | --- |
| MFW / MaaFW | 运行任何带 `interface.json` 的 MaaFramework 项目的通用引擎，代码在 `app/task/MaaFW/`。面向用户一律叫「MFW」，指框架本身写「MaaFramework」 |
| interface | 项目根的 `interface.json`，遵循 ProjectInterface（PI）v2 协议 |
| 外壳 | 项目自带的界面程序：MFAAvalonia、MXU、MFW-PyQt6（CFA）、MaaPiCli。MAS 内置运行从不启动它们 |
| 来源目录 | 用户在脚本页选的目录（`Info.Path`），只是导入来源，运行时不读 |
| 投影 | 导入或更新时，按 interface 白名单挑出要带走的文件 |
| 载荷 | 按「谱系 + 版本 + 内容哈希」登记的不可变项目文件树，全局一份 |
| 视图 | 每个脚本一棵完整目录树，大文件是载荷的硬链接；面向用户叫「副本」 |
| 谱系 | 项目身份：`mirrorchyan_rid` > `github` > `name` |
| 组 | 谱系 + 更新渠道；同组的脚本永远挂同一个载荷 |
| 风味（flavor） | `MaaFWConfig` 的同形子类加一个钩子对象，只承担少量项目独有行为（M9A、MSS） |
| 受管任务 | 风味全权控制、不许出现在用户队列里的任务（M9A 的启动游戏、切换账号、关闭游戏） |
| 运行池 | 一套 runner 用的 base venv，加按版本存放的 maafw binding 与原生库 |
| binding | Python 包 `maafw`，必须与加载的 MaaFramework 原生库同版本 |
| worker | 运行器子进程，跑在运行池 venv 里，只导入核心包 |
| agent | 项目自己的自定义识别 / 动作进程（Python、Go、C++） |
| 预检 | 更新时在新版本上真建一次运行环境，建不出来就放弃新版本 |

## 沿革（贡献者需要知道的）

- **插件化暂停**：MaaFW 曾计划以插件包形式发布，现已暂停，全部代码回到主仓 `app/task/MaaFW/`。核心包 `MaaFW/tools/core/` 下的子包名不再带插件时代的 `automas_maafw_` 前缀（[#973][973]）。
- **旧 M9A 专项已并入 MFW**：M9A 不再是独立专项，而是 MFW 的风味；旧版 M9A 配置在启动时自动迁移，脚本 uid、队列、计划表引用保持不变（[#973][973]、[#1012][1012]、[#1023][1023]）。MSS 同样以风味接入，不再拉起外壳（[#959][959]）。
- **没有「路径模式」**：项目一律在 MAS 的视图上运行，没有直接在用户目录上跑的模式，也没有开关（[#973][973]）。
- **没有托管 Store**：曾设计过项目仓库、版本列表、迁移向导一类的托管层，已放弃；载荷与视图是内部簿记，不对用户展示版本列表。
- **脚本页 ADB 地址直连已撤回**：真机支持改在模拟器管理里统一做（[#1215][1215]）。`Device.AdbAddress` 字段保留但运行时不读。

[959]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/959
[973]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/973
[1012]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1012
[1023]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1023
[1215]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1215
