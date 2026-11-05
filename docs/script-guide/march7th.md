---
title: 三月七用户指南
description: 在AUTO中调度三月七
date: 2025-11-08
---

# 三月七小助手用户指南

## 在AUTO中调度三月七

### 什么是 三月七小助手？

三月七小助手是一个崩坏星穹铁道的第三方软件，能够轻松完成崩坏星穹铁道日常代理、差分宇宙等重复性无趣工作。

**详情信息请查阅**：

<Box :items="[
{ name: '三月七小助手 官网', link: 'https://m7a.top/#/', image: 'https://m7a.top/assets/screenshot/March7th.png', },
{ name: '三月七小助手 GitHub', link: 'https://github.com/moesnow/March7thAssistant', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },]"/>

## 

### 安装 三月七

1. 前往 <Pill name="三月七小助手 官网" image="https://m7a.top/assets/screenshot/March7th.png" link="https://m7a.top/#/"/>、<Pill name="三月七小助手 仓库" :image="{ light: '/icons/github.svg', dark: '/icons/github-dark.svg', }" link="https://github.com/moesnow/March7thAssistant/releases/"/> 或 <Pill name="Mirror 酱" image="https://mirrorchyan.com/favicon.ico" link="https://mirrorchyan.com/zh/projects?scouce=AUTO-MAS-Web&rid=March7thAssistant&channel=stable"/> 下载软件压缩包。
2. 将 三月七小助手 压缩包解压至任意文件夹。

::: warning 别解压到中文路径
三月七小助手（以及其他通用脚本）都不要放在带中文的文件夹里，比如 `D:\脚本\`。中文路径容易引发莫名其妙的报错，用 `D:\M7A` 这样的纯英文路径。
:::


### 设置托管

::: tip 界面名称
历史截图中的“脚本管理／新建脚本／用户”对应当前的“托管管理／新建托管／账号”，以下步骤使用当前名称。
:::

1. 打开 `March7th Launcher.exe`，阅读并关闭三月七小助手的默认公告。
![AUTO_MAS配置1](/docs/img/script-guide/March7thAssistan/March7thAssistan-1.png)

2. 关闭 **三月七小助手**，打开**AUTO-MAS**，进入 **托管管理**，单击 **新建托管** 并选择 **通用脚本** 以添加托管配置页。
![AUTO_MAS配置2](/docs/img/script-guide/March7thAssistan/AUTO-MAA-1.png)

3. 在弹出的窗口里选择选择**从模板创建**，然后单击 **确定**
![AUTO_MAS配置3](/docs/img/script-guide/March7thAssistan/AUTO-MAA-2.png)

4. 接着在新的窗口界面找到并选择**三月七小助手的通用模板参考**，并点击**使用此模板**。
![AUTO_MAS配置4](/docs/img/script-guide/March7thAssistan/AUTO-MAA-3.png)

稍后会打开托管配置页，如下图：
![AUTO_MAS配置4](/docs/img/script-guide/March7thAssistan/AUTO-MAA-4-1.png)
![AUTO_MAS配置4](/docs/img/script-guide/March7thAssistan/AUTO-MAA-4-2.png)

5. 在 **打开的托管配置页** 中的 **脚本根目录** 单击 **选择文件夹**，打开 三月七小助手 软件所在目录。
![AUTO_MAS配置5](/docs/img/script-guide/March7thAssistan/AUTO-MAA-5.png)
::: warning 下面那些路径别手动改
选好脚本根目录之后，**脚本配置** 一栏的各个路径会自动填好。模板已经帮你配对了，不清楚每项是什么意思就别动它，改错了代理会各种出问题。
:::

6. 选择完 三月七小助手 的目录以后会自动修正**脚本配置**一栏的路径，无需手动选择。同时我们需要点击右下方的保存按钮
![AUTO_MAS配置6](/docs/img/script-guide/March7thAssistan/AUTO-MAA-6.png)

7. 点击**添加账号**，需要自己给添加的账号进行命名（在账号名称一栏输入你想要的账号名称（这仅仅只是个命名而已）），同时点击右上方的**创建账号**按钮
![AUTO_MAS配置7](/docs/img/script-guide/March7thAssistan/AUTO-MAA-7.png)

8. 找到刚刚创建的账号，点击**编辑**，进入**通用脚本**配置界面
![AUTO_MAS配置8](/docs/img/script-guide/March7thAssistan/AUTO-MAA-8.png)

9. 找到右上方的**通用配置**并点击，当出现正在配置通用脚本配置的界面并唤醒三月七小助手的时候，说明已经可以正常配置通用脚本了
![AUTO_MAS配置9](/docs/img/script-guide/March7thAssistan/AUTO-MAA-9.png)

10. 当配置完**三月七小助手**以后点击**保存配置**，然后再次点击**保存修改**就完成了对**三月七小助手**的在MAS内的全部配置
![AUTO_MAS配置10](/docs/img/script-guide/March7thAssistan/AUTO-MAA-10.png)

11. 如果需要全自动定时启动**三月七小助手**请查阅 [调度队列](/docs/task-scheduler)

现在立刻马上就要切换账号的功能？你可以试试[StarRailAutoLogin: 一个在AUTO-MAS项目中使用的崩坏：星穹铁道自动登录脚本](https://github.com/Alirea10/StarRailAutoLogin)

未完待续.....