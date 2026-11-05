---
title: SRA用户指南
description: 在AUTO中调度SRA
date: 2025-11-08
---

# StarRailAssistant用户指南

## 在AUTO中调度SRA

### 什么是 SRA？

StarRailAssistant是一个崩坏星穹铁道的第三方软件，能够轻松完成崩坏星穹铁道日常代理、差分宇宙等重复性无趣工作。

**详情信息请查阅**：

<Box :items="[
{ name: 'SRA 官网', link: 'https://starrailassistant.top/#/', image: 'https://starrailassistant.top/img/SRAico.png', },
{ name: 'SRA GitHub', link: 'https://github.com/Shasnow/StarRailAssistant', image: { light: '/icons/github.svg', dark: '/icons/github-dark.svg', }, },]"/>

## 安装 SRA

1. 前往 <Pill name="SRA 官网" image="https://starrailassistant.top/img/SRAico.png" link="https://starrailassistant.top/#/"/>、<Pill name="SRA 仓库" :image="{ light: '/icons/github.svg', dark: '/icons/github-dark.svg', }" link="https://github.com/Shasnow/StarRailAssistant/releases/"/> 或 <Pill name="Mirror 酱" image="https://mirrorchyan.com/favicon.ico" link="https://mirrorchyan.com/zh/projects?scouce=AUTO-MAS-Web&rid=StarRailAssistant&channel=stable"/> 下载软件压缩包。
2. 将 SRA 压缩包解压至任意文件夹。

::: warning 别解压到中文路径
SRA（以及其他通用脚本）都不要放在带中文的文件夹里，比如 `D:\脚本\`。中文路径容易引发莫名其妙的报错，用 `D:\SRA` 这样的纯英文路径。
:::


## 设置托管

::: tip 界面名称
历史截图中的“脚本管理／新建脚本／用户”对应当前的“托管管理／新建托管／账号”，以下步骤使用当前名称。
:::

SRA 自己能管多账号，AUTO-MAS 也能管多账号，所以这里有两条路可走。**先选一条，别两边都配**：

| | 谁来管账号 | 适合 |
| --- | --- | --- |
| **方式一** | AUTO-MAS 管 | 想在 AUTO-MAS 里看到每个号的代理结果、单独启停某个号 |
| **方式二** | SRA 管 | 已经在 SRA 里配好多个账号了，不想重新配一遍 |

两种方式的区别见页面底部的[对比图](#差异)。

### 方式一：用 AUTO-MAS 的多账号功能

1. 打开 **AUTO-MAS**，进入 **托管管理**，单击 **新建托管** 并选择 **通用脚本** 以添加托管配置页。
   ![SRA配置1](/docs/img/script-guide/March7thAssistan/AUTO-MAA-1.png)
2. 在弹出的窗口里选择选择**从模板创建**，然后单击 **确定**
   ![SRA配置2](/docs/img/script-guide/March7thAssistan/AUTO-MAA-2.png)
3. 接着在新的窗口界面找到并选择 适用于SRAv2.14及以上版本的 **StarRailAssistant** 模板，并点击**使用此模板**。
4. 稍后会打开托管配置页，如下图：
   ![SRA配置3](/docs/img/script-guide/sra/mas1.png)
5. 在 **打开的托管配置页** 中的 **脚本根目录** 单击 **选择文件夹**，打开 SRA 软件所在目录。
   ![SRA配置4](/docs/img/script-guide/sra/mas2.png)
   ::: warning 下面那些路径别手动改
   选好脚本根目录之后，**脚本配置** 一栏的各个路径会自动填好。模板已经帮你配对了，不清楚每项是什么意思就别动它，改错了代理会各种出问题。
   :::
6. 选择完 SRA 的目录以后会自动修正**脚本配置**一栏的路径，无需手动选择。
   ![SRA配置5](/docs/img/script-guide/sra/mas3.png)
7. SRA 约定选择 `C:\Users\用户名\AppData\Roaming\SRA` 作为默认配置目录，因此无需修改 **配置文件路径** 一栏。
   ![SRA配置6](/docs/img/script-guide/sra/mas4.png)
8. 脚本配置将自动保存，接下来退出托管配置页面。
9. 点击**添加账号**，需要自己给添加的账号进行命名（在账号名称一栏输入你想要的账号名称（这仅仅只是个命名而已）），然后点击右上方的**通用配置**按钮
   ![SRA配置7](/docs/img/script-guide/sra/mas5.png)
10. 这会启动 SRA 窗口，在里面配置 SRA 本身。
   ::: warning 配置文件名保持 Default
   用 AUTO-MAS 管多账号时，不要改配置文件名，保持默认的 `Default`。
   :::
   ![SRA配置8](/docs/img/script-guide/sra/sra1.png)
11. 配置完成后，点击SRA窗口主页启动按钮右侧的箭头，展开启动选项，选择**仅保存配置**
   ![SRA配置9](/docs/img/script-guide/sra/sra2.png)
12. 点击**仅保存配置**后，关闭 SRA 窗口并点击 AUTO-MAS 中的保存配置按钮，就完成了一个账号的配置。
   ![SRA配置10](/docs/img/script-guide/sra/sra3.png)
13. 要加更多账号就重复步骤 9-12。第 10 步启动 SRA 时，它会自动载入上一次的配置，这是正常的，你只要改成新账号的设置就行。
   ::: warning 每个账号都一样
   配置文件名统一保持默认的 `Default`，不要改。
   :::

### 方式二：用 SRA 的多配置功能

前 7 步和方式一一样，从第 8 步开始不同。

8. 把 **启动参数** 改成 `-e task run`。这样 SRA 启动后会把它自己保存的所有配置跑一遍，而不是只跑某一个。
   ![修改启动参数](/docs/img/script-guide/sra/mas6.png)
9. 配置将自动保存，接下来退出托管配置页面。
10. 点击**添加账号**，需要自己给添加的账号进行命名（在账号名称一栏输入你想要的账号名称（这仅仅只是个命名而已）)，然后点击右上方的**通用配置**按钮
   ![SRA配置7](/docs/img/script-guide/sra/mas5.png)
11. 这将启动 SRA 窗口，你可以在此界面中进行 SRA 的相关配置。
   你可以直接使用Default配置文件，如果你有多个账号，请**在SRA中**创建新的配置，并切换到对应的配置进行修改
   ![SRA配置8](/docs/img/script-guide/sra/sra4.png)
   ![SRA配置8](/docs/img/script-guide/sra/sra5.png)
   ![SRA配置8](/docs/img/script-guide/sra/sra6.png)
12. 每个配置完成后，都需要点击SRA窗口控制面板启动按钮右侧的箭头，展开启动选项，选择**仅保存配置**
   ![SRA配置9](/docs/img/script-guide/sra/sra2.png)
13. 保存好每个配置后，关闭 SRA 窗口并点击 AUTO-MAS 中的保存配置按钮，就完成了所有账号的配置。

### 差异

两种方式的区别一图说明：

![对比](/docs/img/script-guide/sra/compare.png)

简单说：方式一是 AUTO-MAS 每次换上一个账号的配置、启动 SRA 跑一轮；方式二是 AUTO-MAS 只启动 SRA 一次，由 SRA 自己把所有配置跑完。