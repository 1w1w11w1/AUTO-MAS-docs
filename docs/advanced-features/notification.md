# 通知

代理跑完了、某个号失败了，让 AUTO-MAS 发消息告诉你。可在通知设置中选择邮件、Server 酱、企业微信机器人、中国移动新消息等渠道。

## 两级通知：全局和账号

::: info 示例版本与演示范围
本节界面基于 **AUTO-MAS v5.8.0-beta.3**。示例账号和收件地址用于演示，未向外部发送通知。
:::

### 全局通知：先打开渠道，再填写配置

在 **设置 > 通知设置** 中选择需要的渠道。当前页面以渠道卡片或列表项展示入口，点击 **邮件** 等渠道后才会打开配置弹窗。

要接收任务结果，还需在 **通知内容 > 推送任务结果时机** 中选择需要的时机。截图中的 **不推送** 不会发送任务结果通知。

[![从通知设置中打开邮件渠道](/docs/img/tutorial-20261104/notification-channels.png)](/docs/img/tutorial-20261104/notification-channels.png)

以邮件为例，在弹窗中填写 SMTP 服务器地址、发信邮箱、收件人和授权码，再开启渠道。修改会即时保存，完成后点击右上角 **关闭** 返回渠道列表。

[![邮件渠道的配置弹窗](/docs/img/tutorial-20261104/notification-email.png)](/docs/img/tutorial-20261104/notification-email.png)

可以在通知设置页发送测试通知，核对接收端是否实际收到。不要把“配置已保存”当作“消息已经送达”。

### 账号通知：给指定账号额外发送

在 **托管管理** 中打开账号配置，找到 **通知配置**。先打开 **启用通知**，再开启需要的渠道；例如开启 **邮件通知**，填写该账号的收件人。

[![账号通知中的邮件开关和示例收件人](/docs/img/tutorial-20261104/notification-user.png)](/docs/img/tutorial-20261104/notification-user.png)

::: tip 账号通知是额外多发一份
全局通知仍按全局设置发送，账号通知额外发送该账号的结果。账号收件人不会替代全局的发信邮箱与授权码；使用邮件渠道前，仍需完成全局邮件配置。
:::

<span id="smtp-邮件推送渠道"></span>

## 邮件推送

用邮箱收通知需要填三样：**SMTP 服务器地址**、**发信邮箱**、**授权码**。下面分别说怎么拿到。

### SMTP 服务器地址

按你的发信邮箱是哪家的，照抄一行：

| 邮箱                | SMTP 服务器地址       |
| ------------------- | --------------------- |
| **QQ邮箱**          | smtp.qq.com           |
| **163邮箱**         | smtp.163.com          |
| **Gmail**           | smtp.gmail.com        |
| **Yahoo Mail**      | smtp.mail.yahoo.com   |

表里没有你的邮箱？去它的帮助中心搜"SMTP 服务器地址"。

::: warning 使用 Outlook.com / Hotmail 发信
微软要求 Outlook.com SMTP 使用 587 端口、STARTTLS 和 OAuth2。本节版本的内置邮件渠道使用 465 端口的 SSL 连接及密码认证，填写 Outlook 服务器地址和应用密码无法补齐这些要求。请使用兼容的发信邮箱或其他通知渠道，参见 [微软的 SMTP 要求](https://support.microsoft.com/en-us/outlook/pop-imap-and-smtp-settings-for-outlook-com)。
:::

### 获取授权码

**授权码不是你的邮箱登录密码**，是邮箱专门发给第三方软件用的一串码，得单独去开。填错这个是配邮件通知最常见的失败原因。

各家的开启位置：

1. **QQ 邮箱**

<Pill name="QQ邮箱官方教程" image="https://res.wx.qq.com/t/webmail/webmail/res/static/images/projects/login/loginpage/qqmail_logo_default_35h.e071fb4.png" link="https://service.mail.qq.com/detail/0/75"/>

- 登录到您的 [QQ 邮箱账号与安全中心](https://wx.mail.qq.com/account)。
- 在 **账号与安全 > 安全设置 > SMTP/IMAP服务** 中开启服务并获取授权码。

2. **163 邮箱**

<Pill name="163邮箱官方教程" image="https://help.mail.163.com/style/img/logo-163.png" link="https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4f8e49998b374173cfe9171305fa1ce630d7f67ac2a5feb28b66796d3b"/>

- 登录到您的 [163 邮箱](https://email.163.com)。
- 进入 **设置 > POP3/SMTP/IMAP**，找到 **IMAP/SMTP服务** 并点击开启。
- 在弹窗中点击 **继续开启**，根据指示在手机中发送短信。
- 弹窗生成 **授权密码**，该密码便为您的授权码。

3. **Gmail**

- 登录到您的 [Gmail](https://mail.google.com)。
- 进入 **设置 > 查看所有设置 > 转发和 POP/IMAP > IMAP 访问**，选择 **启用 IMAP**。
- 进入 **用户 > 管理您的 Google 账号 > 安全性 > 两步验证**，按提示开启 **两步验证**。
- 进入 **两步验证 > 应用专用密码**，按提示创建 **应用专用密码**，该密码便为您的授权码。

4. **Yahoo Mail**

- 登录到您的 **Yahoo 账户**。
- 前往账户的 **安全设置**。
- 找到 **生成应用程序密码** 或类似选项以创建应用密码。

::: tip 只有一个邮箱也能用
发信和收信可以填同一个地址，自己发给自己，完全没问题。
:::

::: warning 关于授权码

- 别告给别人，定期换一次。
- 有些邮箱的授权码**只显示一次**，拿到就存好；有些有有效期，到期了通知就发不出去，记得换。
- 授权码在本地是加密存的（和你的 Windows 账号绑定），所以**换电脑或重装系统后，需要重新填一次**。
  :::

<span id="serverchan-通知推送渠道"></span>

## Server 酱推送（发到手机）

**Server 酱**（ServerChan）是个把消息转发到手机的中转服务。你在 AUTO-MAS 里填一个它给的 Key，代理结果就会推到你手机上。

<Box :items="[
{ name: 'Server酱Turbo版', link: 'https://sct.ftqq.com/', image: 'https://the7.ft07.com/sct/images/favicon.png' },
{ name: 'Server酱³', link: 'https://sc3.ft07.com/', image: 'https://the7.ft07.com/sct/images/favicon.png' },
]"/>

::: warning 它有两个版本，别搞混
Server 酱在 2024 年出了新版，和老版是两套东西：

- **SCT** = Server酱·Turbo 版（老版），支持微信、钉钉、飞书等多种渠道
- **SC3** = Server酱³（新版），**只支持它自己的 App 推送**

在 AUTO-MAS 中只需填写对应平台的 SendKey，两个平台使用同一个配置入口。
:::

### SendKey（必填）

SendKey 就是 Server 酱认你这个人的凭据，填了它消息才知道往哪推。按你用的版本去对应页面拿，**两个平台选一个就行**：

- SCT 用户：<Pill name="SCT SendKey" image="https://the7.ft07.com/sct/images/favicon.png" link="https://sct.ftqq.com/sendkey"/>
- SC3 用户：<Pill name="SC3 SendKey" image="https://the7.ft07.com/sct/images/favicon.png" link="https://sc3.ft07.com/sendkey"/>

在 AUTO-MAS 的通知设置中打开 **Server 酱**，填写 SendKey 并启用渠道，再发送测试通知确认接收。当前版本不提供渠道代码或 Tag 输入框；SCT 的接收渠道请在 Server 酱平台配置。

## 企业微信机器人推送（发到微信）

::: info 配一次就好，之后直接在微信里收消息
虽然要注册企业微信，但只是为了拿一个机器人地址，之后消息会直接进你的微信。
:::

1. **注册企业账号**：打开 <Pill name="企业微信官网" link="https://work.weixin.qq.com/" image="https://open.work.weixin.qq.com/favicon.ico" />，按指引注册，然后用绑定的微信号登录企业微信客户端。

2. **建一个群，加机器人**：进群聊 → 右上角 **···** → **添加群机器人**。名字头像随便填。手机端电脑端都能操作。

3. **拿 Webhook 地址**：

   - 电脑端：在群里右键机器人 → **查看资料**。
   - 手机端：群聊 → 右上角 **···** → **群机器人** → 点进那个机器人。

4. **填进 AUTO-MAS**：把 Webhook 地址粘贴到 **推送企业微信机器人通知** 里，完成。

## 中国移动新消息

### 使用条件

使用中国移动新消息前，请确认以下条件：

1. 当前手机卡为中国移动号码；
2. 手机系统支持 5G 消息；
3. 已开通 5G 消息服务；

### 第一步：获取 Channel API Key

Channel API Key 是连接中国移动新消息服务的凭证，可以选择以下任一种方式获取。

#### 方法一：通过「新消息ClawBot」应用号获取

**注：图片以小米手机为例，其他品牌手机可能略有差异。**

1. 确认当前手机卡为中国移动号码。

2. 打开系统短信设置，进入「应用号」。
   ![cmcc-1](../img/cmcc-nermsg/1.jpg)
3. 搜索并打开「新消息ClawBot」应用号。
   ![cmcc-2](../img/cmcc-nermsg/2.jpg)
   如果尚未开通 5G 消息，请按照手机页面提示完成开通。

4. 在「新消息ClawBot」应用号中找到并复制 Channel API Key。
   ![cmcc-3](../img/cmcc-nermsg/3.jpg)

   合法的 Channel API Key 通常以 `ak_` 或 `app_` 开头。复制时请确保内容完整，不要包含空格、换行或短信中的其他文字。

#### 方法二：通过短信授权获取

1. 使用中国移动号码编辑短信，发送“绑定龙虾”到 `12520098`。

2. 等待回复短信。

3. 打开回复短信，点击其中的「立即授权」按钮。

4. 按照页面提示完成授权，并获取 Channel API Key。


### 第二步：配置中国移动新消息

获取 Channel API Key 后，在 AUTO-MAS 的通知设置中填写中国移动新消息配置。

1. 打开 AUTO-MAS。

2. 进入「设置」>「通知设置」。

3. 打开「中国移动5G短信」渠道，填写配置后启用。

4. 将上一步复制的 Channel API Key 粘贴到对应输入框中。


::: tip 关于配置范围

中国移动新消息当前仅支持全局通知，没有账号级配置入口。任务结果是否发送仍受全局「推送任务结果时机」控制。

:::

### 安全注意事项

- Channel API Key 属于敏感凭证，请勿发布到截图、日志、代码仓库或公开聊天中；
- 复制 Key 时不要在前后附加空格或其他字符；
