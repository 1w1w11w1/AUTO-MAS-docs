# 通知系统

通知系统统一处理业务通知的目标选择、内容适配、渠道发送与失败统计。业务提供内容，具体投递目标声明能力，中间层选择合适的表达，再由渠道封装协议发送。

本文面向主程序开发者，用户配置方式见[消息通知](/docs/advanced-features/notification)。

## 1. 职责与调用链

```text
业务模块：任务报告、六星喜报、社区签到等
    │ NotifyPayload（正文、摘要、图片资源）
    ▼
dispatch() ← NotifyTarget / ChannelTarget（配置、能力、投递策略）
    │ 逐目标调用 render_for_target()
    ▼
RenderedNotification（已选定的格式与内容）
    │ Notify.send_channel() → NotifyChannel.send()
    ▼
渠道适配 → 渠道 Sender → SMTP / HTTP / WebSocket / 系统接口
```

这里的“中间层”包括内容渲染器和分发器。

| 层次 | 负责 | 不负责 |
| --- | --- | --- |
| 业务模块 | 组织业务正文、摘要和图片 | 根据渠道名称生成专用字段、编码 Base64 或 CID |
| 消息模型 | 表达内容与资源之间的关系 | 读取配置、执行网络请求 |
| 目标构造 | 读取配置、选择具体收件目标、声明有效能力 | 生成业务报告 |
| 分发编排 | 跳过目标、隔离失败、发送重试、统计结果 | 解释渠道请求体 |
| 内容适配 | 选择格式、组合标题与签名、处理图片引用和降级 | 获取远程资源、上传图床 |
| 渠道与服务 | 协议编码、请求组装、发送和结果判断 | 重新决定业务通知时机 |

渠道声明与传输实现位于 `app/notification_channels/<id>/`，宿主负责发现、装配与编排。

## 2. 维护位置

下列路径均相对 AUTO-MAS 主程序仓库根目录。

| 位置 | 用途 |
| --- | --- |
| `app/models/notification.py` | 内部消息、图片、能力、渲染结果与 Webhook 快照类型 |
| `app/models/notification_channel.py` | 渠道声明、配置视图、目标与传输依赖契约 |
| `app/core/notify.py` | 目标组装、分发、重试、任务报告与社区摘要投递状态 |
| `app/core/notify_render.py` | 按目标能力渲染内容 |
| `app/core/notify_channels.py` | 宿主渠道目录、配置视图与传输依赖装配 |
| `app/notification_channels/` | 内置渠道清单、发现、注册与发送器绑定 |
| `app/notification_channels/<id>/__init__.py` | 渠道设置元数据、目标构造器与单次发送适配器 |
| `app/notification_channels/<id>/transport.py` | 渠道协议编码、发送和结果判断 |
| `app/services/notification.py` | 持有已装配发送器，提供统一发送及系统提示、Webhook 测试的直接入口 |
| `app/services/openclaw_qq.py` | Claw QQ 官方机器人的绑定及具体发送能力 |
| `app/task/notify_core.py` | 专项代理结果通知的公共入口 |
| `app/task/<专项>/tools/notify.py` | 专项通知正文与发送时机；部分专项使用子目录组织 |
| `app/tools/community_notify.py` | 社区结果的正文、HTML、图片与摘要组合 |
| `res/html/` | HTML 通知模板 |

内部消息类型放在 `models`，供编排、渠道和服务共用。不允许渠道或服务反向导入通知编排，不允许把内部消息模型加入公开 API Schema。

## 3. 消息与图片模型

### NotifyPayload

| 字段 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `title` | `str` | 必填 | 通知标题 |
| `text` | `str` | 必填 | 可独立阅读的纯文本正文 |
| `summary` | `NotificationSummary \| None` | `None` | 紧凑摘要及超限备用内容 |
| `markdown` | `str \| None` | `None` | Markdown 正文；`None` 表示未提供 |
| `html` | `str \| None` | `None` | HTML 正文；`None` 表示未提供 |
| `images` | `tuple[NotificationImage, ...]` | `()` | 图片资源集合 |
| `append_signature` | `bool` | `True` | 是否请求附加统一签名`AUTO-MAS 敬上` |
| `signature_sep` | `str` | `"\n\n"` | 签名分隔符 |
| `body_title` | `str \| None` | `None` | 正文内使用的可选标题 |

`markdown` 和 `html` 的空字符串与 `None` 不同：当前格式选择以是否为 `None` 判断，空字符串仍视为已提供该格式。

业务只提供 `NotifyPayload` 中的通用正文、摘要与图片，不传渠道专用正文或预编码图片。

### NotificationSummary

| 字段 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `text` | `str` | 必填 | 紧凑摘要正文 |
| `title` | `str \| None` | `None` | 目标启用摘要标题策略时使用的标题 |
| `overflow_text` | `str \| None` | `None` | 正文超限后的备用文字；未提供或为空时回退到 `text` |

`NotificationSummary.text` 是紧凑摘要，`title` 是可选摘要标题，`overflow_text` 是正文超限后的备用文字。紧凑统计和超限备用内容不一定相同，例如系统通知只需成功/失败数量，超限报告仍需保留账号结果。

### NotificationImage

| 字段 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `id` | `str` | 必填 | 正文引用的资源 ID，在一份消息内唯一 |
| `data` | `bytes \| None` | `None` | 图片原始字节，不是 Base64 字符串 |
| `url` | `str \| None` | `None` | 同一图片的现有 URL |
| `alt` | `str` | `""` | 图片替代文字 |
| `mime_type` | `str` | `"image/png"` | 图片 MIME 类型，例如 `"image/jpeg"` |

图片使用 `id` 关联正文，提供 `data`、`url`、`alt` 和 `mime_type`。`data` 与 `url` 至少存在一个；同时提供时应表示同一张图片。资源 ID 在一份消息内必须唯一，使用字母或数字开头，后续可包含字母、数字、下划线、点和连字符。

正文用 `image_reference(id)` 生成内部引用，例如：

```html
<img src="notify-image://result-image" alt="任务结果" />
```

```markdown
![任务结果](notify-image://result-image)
```

- HTML 示例使用带引号的 `src`，Markdown 使用简单图片语法。

- 邮件适配将可用字节编码为 MIME/CID 内嵌图片。
- Markdown 图片表达需要现有 URL；本地字节不会自动上传。
- Webhook 图片槽位使用本地字节，在服务层编码。
- 图片来源或目标能力不满足时，渲染器保留可读文字并记录降级信息。

不要假定把图片加入 `images` 就会自动出现在所有渠道：HTML/Markdown 需要正文引用；当前 Webhook 的单图片槽位使用可用图片中的最后一张。

## 4. 业务接入

### 普通通知

以下示例在异步业务函数中调用，`dispatch()` 会执行真实投递，测试时必须注入假发送器。

```python
from app.core.notify import dispatch, global_target
from app.models.notification import NotifyPayload


async def send_finished_notification():
    return await dispatch(
        payload=NotifyPayload(
            title="任务完成",
            text="本次完成 3 个账号，失败 0 个。",
        ),
        targets=[global_target(include_system=True)],
    )
```

按用途选择入口：

| 入口 | 用途与注意点 |
| --- | --- |
| `global_target()` | 根据全局配置选渠道；默认不包含系统通知 |
| `user_target(user_config)` | 根据用户配置构造独立目标；调用方仍需负责业务通知时机 |
| `statistic_targets(user_config)` | 根据全局与用户统计开关选择目标；`compact_summary=True` 为 Webhook 选择紧凑摘要策略 |
| `push_proxy_result()` | 专项代理结果优先复用，统一处理结果推送条件及社区摘要 |
| `dispatch_task_report()` | 已构造报告时使用，维护社区摘要的逐目标投递状态 |
| `dispatch()` | 通用投递入口，不替业务判断“仅失败时推送”等条件 |

### 带图片的消息

下面只构造消息，不发送；`image_bytes` 由业务在调用前读取或生成。

```python
from app.models.notification import NotificationImage, NotifyPayload, image_reference


def build_image_notification(image_bytes: bytes) -> NotifyPayload:
    reference = image_reference("result-image")
    return NotifyPayload(
        title="任务结果",
        text="任务执行失败，详情见失败截图。",
        html=f'<p>任务执行失败。</p><img src="{reference}" alt="失败截图" />',
        images=(
            NotificationImage(
                id="result-image",
                data=image_bytes,
                alt="失败截图",
                mime_type="image/png",
            ),
        ),
    )
```

动态账号名、错误信息等嵌入 HTML 时必须转义。需要 Markdown 图片时，提供同一资源的可用 URL 和对应 Markdown 引用；不要为了支持某个渠道在业务中生成 Base64。

## 5. 目标、能力与渲染

`NotifyChannel` 表示渠道种类，并共用一份设置页描述与发送注册信息。`ChannelTarget` 表示一次实际投递，例如一个邮箱或一条 Webhook 配置。`NotifyTarget` 则是一组渠道与目标的配对，另带空收件人策略。

目标 ID 用于补发和跳过记录，标签用于用户可见提示。修改显示名不能随意改变投递 ID；Webhook ID 使用配置 UID，而非可修改的名称。

`ChannelTarget.capabilities` 保存最终有效能力，不再叠加一套静态能力覆盖规则。当前 `NotificationCapabilities` 的主要字段如下：

| 字段 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `formats` | `tuple[NotificationFormat, ...]` | `("text",)` | 按顺序选择消息实际提供的第一种格式，例如 `("html", "text")` |
| `image_presentations` | `frozenset[ImagePresentation]` | `frozenset()` | 支持的图片呈现路径；默认不声明图片支持 |
| `append_signature` | `bool` | `True` | 是否由中间层附加签名；消息的 `append_signature` 也必须开启 |
| `max_content_utf8_bytes` | `int \| None` | `None` | 正文 UTF-8 字节预算；`None` 表示未声明预算，不是无限长度保证 |
| `body_title_policy` | `BodyTitlePolicy` | `"never"` | 正文标题的组合策略 |
| `title_in_template` | `bool` | `False` | 模板是否已有标题位置，供 `when_title_missing` 策略使用 |
| `double_text_newlines` | `bool` | `False` | 是否将纯文本换行加倍，主要用于 Server 酱 |

以上类型别名均为字符串 `Literal`，可选值如下：

| 类型 | 可选值 | 说明 |
| --- | --- | --- |
| `NotificationFormat` | `"text"`、`"markdown"`、`"html"` | 正文格式；元组顺序表示选择优先级 |
| `ImagePresentation` | `"html"`、`"markdown"`、`"base64"`、`"rich_media"` | HTML 图片引用、Markdown URL 图片、由渠道编码的图片槽位、独立富媒体图片 |
| `BodyTitlePolicy` | `"never"`、`"always"`、`"when_title_missing"` | 不补正文标题、按需补标题、模板没有标题位置且消息提供 `body_title` 时补标题 |

`body_title_policy` 当前作用于非 HTML 正文；`always` 会跳过已经以 `【消息标题】` 开头的正文。HTML 的标题由模板及渠道适配处理。

摘要策略、是否采用摘要标题和系统显示时长保存在目标上。`render_for_target()` 接收能力及摘要策略，不读取全局配置、不执行网络请求。

格式选择不会自动把 Markdown 转成 HTML。正文超限回退也不是所有目标的通用保证：当前需要目标启用 `if_over_limit`、设置字节预算，并且消息提供摘要。此时优先使用 `overflow_text`，否则用摘要文字；备用文字仍超限时按 UTF-8 预算截断。

`RenderedNotification` 包含选定标题、正文、格式、图片、可选纯文本备用内容、摘要使用标记及诊断信息。它是渠道适配的输入，尚不是 SMTP 或 HTTP 请求体。

### 当前渠道

| 注册键 | 渠道 | 内容路径 |
| --- | --- | --- |
| `system` | 系统通知 | 纯文本，优先摘要，服务层处理系统长度限制 |
| `mail` | 邮件 | HTML 优先，纯文本回退，支持内嵌图片 |
| `serverchan` | Server 酱 | Markdown 优先，URL 图片，声明 30 KiB 正文预算 |
| `cmcc` | 中国移动新消息 | 纯文本，正文带标题 |
| `webhook` | 自定义 Webhook | 根据具体模板及地址解析格式与图片槽位 |
| `koishi` | Koishi | HTML/文本；完整邮件文档另做适配，见下文 |
| `openclaw_qq` | Claw QQ 官方机器人 | 纯文本与独立图片，经 `openclaw_qq_manager.send()` 发送 |

这张表描述当前适配实现，不代表第三方平台的全部能力。格式和图片声明不能随意组合，新增组合必须有实际发送路径。

## 6. HTML、Webhook 与社区摘要

### HTML 兼容要求

重构必须保留原功能，包括社区 HTML、图片、标题、签名和摘要。邮件完整页面与聊天 HTML 片段具有不同的展示需求，不能因为都叫 HTML 就直接互换，也不能为简化代码统一降级为纯文本。

::: warning 当前实现边界
当前消息只有一个 `html` 字段。Koishi 适配器会检查完整文档标记：若识别为邮件文档，则把 `text_fallback` 重新排为 HTML 片段；否则直接使用 HTML，并按需补标题。社区消息目前提供邮件模板，因此走前一种路径。

这并非原社区 HTML 片段的直接透传。修改相关代码时，必须对照原有社区输出验证结构和信息完整性；不能仅以 `msgtype="html"` 判断兼容。区分完整文档与片段属于后续设计需要明确的语义，不应伪装成已有独立字段。
:::

### Webhook

每条启用配置生成 `WebhookTargetSnapshot`，能力解析和发送使用同一份 URL、模板、请求头及方法。当前按模板特征、部分已知域名和企业微信机器人地址识别能力，并非在线探测。

兼容自定义模板时保留 `{title}`、`{content}`、`{image_base64}` 及时间变量的既有行为。新增平台适配应集中处理协议规则，不把平台字段带回业务消息。

当前企业微信保留正文后补发图片的既有行为：模板未自行使用图片占位符时补发；图片超过限制或补发失败只记录警告，已成功正文仍算送达。这是渠道内部的特殊语义，不是通用多消息事务。首版不提供自动拆分长消息或跨请求去重机制。

### 社区摘要

`dispatch_task_report()` 在报告的可用表达中组合社区摘要，并通过任务上的已送达 ID 记录决定哪些目标需要摘要：

- 已收到摘要的目标，只接收后续原始报告。
- 尚未收到摘要的目标，接收报告与摘要。
- 成功目标更新记录，失败目标保留补发依据。

业务不要绕过这一入口分别发送摘要和报告，也不要自行维护第二套按渠道名称去重的记录。

## 7. 扩展渠道

1. 在 `app/notification_channels/<id>/` 新建 `manifest.json`，声明接口版本、渠道 ID、注册入口与必需依赖。清单格式见主仓 `app/notification_channels/README.md`；只加载随应用交付的可信内置渠道。
2. 在 `__init__.py` 提供 `register() -> NotifyChannel`，声明设置元数据、作用域、启用字段，并绑定 `target_builder`、`send_adapter` 和 `sender_factory`。描述不携带密钥值；发现、注册或构造发送器时不得发送、联网或启动任务。
3. 目标构造器只读取宿主提供的 `ChannelConfig`，按显式启用配置生成稳定 ID、收件配置与 `ChannelTarget.capabilities`。能力只保存在具体目标上，重试复用同一份目标快照。
4. 在 `transport.py` 的发送器中实现协议编码、发送和业务结果判断，通过 `ChannelDependencies` 使用宿主注入的传输能力。发送适配器接收 `RenderedNotification`，只执行一次发送；新增发送方法时同步测试注入使用的 `Notifier` 协议。
5. 若增加持久配置或公开 API 字段，按[配置管理](/developer/config)和 [API 开发](/developer/API)完成全链路接入，不手改生成的前端 API 文件。
6. 验证全局/用户作用域、启用开关、空收件人、失败统计与既有渠道输出。

仅新增渠道时，已有业务消息通常无需修改。确有新内容需求时，先定义与渠道无关的内容语义；不要提前增加没有消费方的能力开关或通用插件框架。

业务通知使用 `dispatch()` 及相关编排入口。`Notify.push_plyer()` 和 `Notify.WebhookPush()` 仅保留系统提示与 Webhook 测试的直接发送入口，不需要再向 `Notification` 添加逐渠道转发方法。

## 8. 结果、重试与验证

发送函数抛异常或显式返回 `False` 表示失败；正常返回（包括 `None`）表示成功。不能吞掉发送失败后正常返回，也不能只检查 HTTP 状态而忽略渠道返回的业务错误。

`attempts` 是包含首次发送在内的总尝试次数，默认 1。渲染失败只记当前目标失败，不做网络重试；渲染成功后，重试复用同一份内容。`skip_channel_ids` 用稳定 ID 跳过已送达目标。

`DispatchResult.attempted` 是计入本轮尝试的目标数，不是网络请求次数；空收件人采用 `warn` 时也计入失败。`succeeded` / `failed` 保存显示标签，`succeeded_ids` 保存成功目标 ID。零目标或全部跳过不能解释为已送达。

空收件人策略：`send` 继续交发送层处理，`warn` 告警并记失败，`skip` 跳过。只有声明了空收件人检查的目标受此策略影响。

开发验证使用 `notifier` 注入假发送器，邮件、HTTP 和 WebSocket 调用不得真实外发。重点覆盖：

- 纯文本与富文本选择、原有社区 HTML 展示、标题和签名不重复。
- 多图引用、相同前缀资源 ID、无图与缺少来源时的文字降级。
- 自定义 Webhook 图片模板、Claw QQ 和全局/用户开关。
- 单目标渲染失败、发送重试、零目标与社区摘要部分送达。
- 正文字节预算、紧凑摘要与超限备用文字的差异。

在主仓根目录安装锁定的开发依赖，再运行与改动相关的最小测试，例如：

```powershell
uv sync --locked --group dev
uv run --no-sync python -m pytest tests/core/test_notify.py -q
```

测试入口与临时验证产物的提交规则以主仓 `tests/AGENTS.md` 和[开发规范](/developer/development-specifications)为准。测试通过仅说明已覆盖场景通过，不替代重构前后实际内容的兼容性核对。
