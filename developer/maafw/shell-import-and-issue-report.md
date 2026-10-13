# 外壳配置导入与问题包

## 要点

- 外壳配置导入只**读**外壳文件（MFAAvalonia、MXU、MFW-PyQt6），不写不删；读的是脚本记下的来源目录，因为外壳的 `config/` 不会进视图。
- 两个落点：新建引导最后一步「每份配置建一个用户」；用户页「配置导入」弹窗把一份配置的队列覆盖到当前用户。键位可以一并导入到脚本级。
- 换算统一走 `MaaFW/tools/embedded/shell_instances.py` 的 `plan_instance_import` → interface 预设形状 → `build_interface_preset_snapshot`，与「应用预设」同一条路；对不上的任务和选项跳过并逐条列出，不猜。
- 问题包按 `.worker.log` 里的视图路径认领 history；项目有密码输入框时，只收写入时就已打码的日志。

## 外壳配置导入

| 设计 | 为什么 |
| --- | --- |
| 支持 MFAAvalonia（`config/instances/*.json`，上次使用取 `appsettings.json`）、MXU（`config/mxu-<项目>.json`，含前置任务与全局选项）、MFW-PyQt6（`config/multi_config.json` + `config/configs/*.json`）；没有真实样本的外壳（如 MaaPiCli）不支持（[#997][997]） | 只支持核对过真实配置形状的外壳 |
| 一个项目有多种外壳配置时全部列出；读不懂的文件只跳过它自己并记日志 | 不因一份坏文件挡住其他 |
| 外壳存的是 case **下标**的要翻回 case 名；布尔开关归一成 Yes / No；子选项平铺；不写用户的控制器与资源字段 | 生成的快照与用户页保存的形状一致 |
| 新建引导里：默认全选，每份配置各建一个用户，用户名就是配置名（重名自动加序号）；取列表失败或没有配置 → 不显示这一块；部分失败 → 报错、成功的照常；全部失败 → 报错后退回「创建第一个用户！」；导不全 → 逐用户列出跳过项 | 不影响体验的静默处理，影响体验的报错但不卡流程 |
| 用户页「配置导入」弹窗的「外壳」页签：`/api/scripts/maafw/shell-instances/apply` 把一份配置覆盖到当前用户；算好的快照随响应返回，界面直接替换本地状态（[#1195][1195]） | 回头重拉用户配置会冲掉还没保存的其他改动 |
| 键位：实例列表带上键位与来源目录；引导导入用户时「同时把键位导入到脚本」默认勾选，只写与默认不同的键（[#1174][1174]） | 键位是脚本级的 |
| 来源目录没设或已删 → 提示先在脚本页选择项目目录；键位弹窗另给「选择其他目录…」，只读一次 | 导入后来源目录不再更新 |

## 问题包

| 设计 | 为什么 |
| --- | --- |
| 设置 → 高级 →「导出 MFW 问题包」（下拉选脚本，含各风味）、「导出 M9A 问题包」（一键收全部 M9A 脚本）（[#1039][1039]） | 普通「导出日志」不含运行记录 |
| 内容：最近 5 次加最近 3 次失败运行的 history（`.log`、`.json`、`.worker.log`、`.maafw.log`、`.project.log`、失败截图），项目 `debug/` 里 history 没有的 agent 日志，脱敏后的脚本配置与项目版本，MAS 日志，以及说明收了什么、截断了什么的 `manifest.json`（含运行时检查结果） | 一次拿全排障所需 |
| history 按用户显示名分目录，靠 `.worker.log` 开头记录的视图路径认领属于哪个脚本 | 不同脚本的同名用户会混在一起 |
| 项目 `debug/` 顶层的 `maafw.log` 含密码原文，不收；项目有密码输入框时，`.worker.log` 第一行会写打码标记（`option_secrets.LOG_REDACTION_MARKER`），只收带这一行的那次日志 | MAS 写 history 时已经打码，缺的是「哪份打过码」的标记 |
| 快照是 JSON 字符串，先解析成对象再递归脱敏；`globalOptions` 与 `taskOptions` 同样打码 | 按值前缀找密文会漏掉嵌在字符串里的 |
| 大小上限按导出设定；超限的文本只读末尾、从完整行开始再脱敏；导出分段让出主进程 | 单次原生日志可达几十 MB |
| 运行时检查按后端健康检查同一判据选原生库、跑一次 import，路径换成 `<视图>`、`<安装目录>`、`<HOME>`，不写字节码（[#1088][1088]） | 排查「项目 Python 不可用」不必让用户手敲命令 |

## 限制

- 问题包会原样带出任务的显示名。
- 项目 agent 自己写的日志不在 MAS 控制内；只有另存进 `.project.log` 时才按该脚本全部用户的密码打码。
- MFAAvalonia 的资源级选项、MFW-PyQt6 的 checkbox 与全局选项的配置形状缺少真实样本，对不上时整体跳过，不会静默写错。

[997]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/997
[1039]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1039
[1088]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1088
[1174]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1174
[1195]: https://github.com/AUTO-MAS-Project/AUTO-MAS/pull/1195
