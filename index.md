---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "AUTO-MAS"
  text: "游戏脚本多账号管理与自动化软件"
  tagline: "优化脚本多账号体验，提高代理稳定性"
  image:
    src: /icons/AUTO-MAS.ico
    alt: "AUTO-MAS Logo"
  actions:
    - theme: brand
      text: 新手上路
      link: /docs/user-guide
    - theme: alt
      text: 托管配置
      link: /docs/script-guide/
    - theme: alt
      text: 任务调度
      link: /docs/task-scheduler
    - theme: alt
      text: 进阶功能
      link: /docs/advanced-features/
    - theme: alt
      text: 常见问题
      link: /docs/FAQ

features:
  - title: 多账号统一管理
    details: 统一管理多个托管及其账号的配置
  - title: 异常自动重试
    details: 持续监看脚本日志，失败自动重试，实现无人值守。
  - title: 灵活的调度队列
    details: 用调度队列有序运行多个托管，支持开机自动运行与定时运行。
  - title: 结果全程留痕
    details: 代理的结果和关键日志都留档，通知渠道丰富可自定义。
---

## 为什么选择 AUTO-MAS？

如果你有多个脚本需要代理，以下体验实在令人头疼：一个个手动改脚本配置、跑到一半卡住了没人管、第二天发现某个号漏了但不知道为什么。

**AUTO-MAS** 是兼容几乎全部脚本的调度器：切换账号配置、按顺序启动、根据日志判断成功或失败、失败自动重试，并记录每次运行结果。

- **稳**：全程监看日志，可以检测脚本的任务是否全部完成
- **省事**：不用一个个改配置文件，一个托管所有的账号可以共用配置，或每个托管直接使用原生配置，无需额外配置。
- **简单**：对于主流的脚本，AUTO-MAS内有专项支持，配置简单，功能更强；通用脚本亦有MaaFw脚本的详细指引和模版分享站的一键使用
- **通用**：几乎所有自动化脚本都能接，只要它能"启动后自动运行"、会在哪个地方写日志。
- **增强**：提供调度队列、定时启动、虚拟显示器等便利功能，并将不断更新！

## 特别声明

免费代码签名由 [SignPath.io](https://signpath.io/) 提供，证书由 [SignPath Foundation](https://signpath.org/) 提供。

开发者 AI API 额度由 <a href="https://www.packyapi.ai/register?aff=zKkA"><img src="https://camo.githubusercontent.com/c6e2cac1447e67d9f6c882b2faf234aed2e4d8a14fdc5bc1071d335cb6b5a32c/68747470733a2f2f7777772e7061636b796170692e61692f6c6f676f2d66756c6c2e737667" alt="PackyCode" style="display:inline-block;width:120px;height:auto;vertical-align:middle;"></a> 赞助。PackyCode 是一家稳定、高效的 API 中转服务商，提供 Claude Code、Codex、Gemini 等多种中转服务，具备自动故障转移、智能路由和无限并发等功能。[免费注册 PackyCode](https://www.packyapi.ai/register?aff=zKkA)。
