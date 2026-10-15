# 自定义外观包

外观包是一个 ZIP 文件，可以替换配色、整窗背景、侧栏菜单图标、鼠标光标，并在角落放一张装饰图。

::: tip 桌面桌宠
支持桌面桌宠的客户端会将主题附带的桌宠显示为独立悬浮窗口。支持独立桌宠的客户端还可以单独导入桌宠包，配置和动画素材的制作方式见[桌宠包制作与导入](./mascot)。下文关于窗体内角落装饰、预留布局空间和窄窗口隐藏的说明适用于旧版客户端。
:::

## 导入与切换

在「设置 → 界面设置 → 主题模式」点击「导入外观」，选择 ZIP 文件。导入成功后会弹出预览，点击「应用外观」即可生效。

- 已导入的外观会出现在「主题模式」下拉框里，和跟随系统、浅色模式、深色模式放在一起，随时可以切回内置外观。
- 选中自定义外观时，旁边会出现「移除外观」按钮。
- 再次导入相同 ID 的外观包时会询问是否替换。
- 外观包保存在用户数据目录，升级 AUTO-MAS 不会清除。
- 使用自定义外观时主题色由外观包决定，「主题色」选项不可用。

## 制作步骤

### 1. 建一个文件夹

```text
my-appearance/              ← 这一层只是你的工作目录，不进 ZIP
├── theme.json              # 必需，外观配置
├── preview.png             # 可选，导入后的预览图
└── assets/                 # 背景、装饰图、菜单图标、光标都放这里
    ├── background.jpg
    ├── mascot.png
    ├── menu-home.png
    └── cursor-pointer.png
```

文件名建议只用英文字母、数字和短横线。

### 2. 准备图片

只支持 PNG、JPEG、WebP。下面的尺寸是建议值，不强制（光标除外）：

| 用途 | 建议尺寸 | 建议格式 | 说明 |
| --- | --- | --- | --- |
| 背景 | 1920×1080 或更大，16:9 | JPEG / WebP | 默认贴在窗口右下角并铺满（`cover`），主体放右下，左上留出干净区域给内容 |
| 角落装饰 | 宽 300–600 像素 | 透明 PNG / WebP | 显示宽度由 `mascot.width` 决定，图片宽度取它的 2 倍左右更清晰 |
| 菜单图标 | 48×48 或 96×96 | 透明 PNG | 侧栏按 24px 显示，线条要粗、轮廓要简单 |
| 光标 | 32×32 | 透明 PNG | **必须** 1–64 像素见方以内；要记下指针尖端的像素坐标 |
| 预览图 | 960×540 | PNG / JPEG | 只在导入后的预览弹窗里显示，可以直接用应用后的截图 |

单张图片不能超过 8 MB，背景图优先用 JPEG 或 WebP 压缩。

### 3. 写 theme.json

从下面的示例改起，没有的图片就把对应字段整段删掉。文件用 UTF-8 编码保存。

```json
{
  "formatVersion": 1,
  "id": "my-appearance",
  "name": "我的外观",
  "description": "一个暖色外观示例",
  "mode": "light",
  "tokens": {
    "colorPrimary": "#1677ff",
    "colorBgLayout": "#f5f7fb",
    "colorBgContainer": "#ffffff",
    "colorBgElevated": "#ffffff",
    "colorText": "#1f2937",
    "colorTextSecondary": "#667085",
    "colorBorder": "#d0d5dd",
    "colorBorderSecondary": "#eaecf0",
    "borderRadius": 8
  },
  "background": {
    "path": "assets/background.jpg",
    "opacity": 1,
    "surfaceOpacity": 0.72,
    "position": "right bottom",
    "size": "cover"
  },
  "mascot": {
    "path": "assets/mascot.png",
    "width": 144,
    "opacity": 1,
    "position": "bottom-right"
  },
  "preview": "preview.png",
  "menuIcons": {
    "home": "assets/menu-home.png",
    "settings": "assets/menu-home.png"
  },
  "cursors": {
    "pointer": {
      "path": "assets/cursor-pointer.png",
      "hotspotX": 6,
      "hotspotY": 0
    }
  }
}
```

### 4. 打包成 ZIP

**选中 `theme.json`、`preview.png` 和 `assets` 这几项再压缩，不要压缩外层的 `my-appearance` 文件夹。** `theme.json` 必须在 ZIP 的最外层。

任选一种方式：

- **资源管理器**：选中这几项 → 右键 →「压缩为 ZIP 文件」（Windows 10 是「发送到 → 压缩(zipped)文件夹」）。
- **命令行**：在 `my-appearance` 文件夹里打开终端，运行下面的命令（Windows 10/11 自带 `tar`）：

  ```powershell
  tar -a -c -f ..\my-appearance.zip theme.json preview.png assets
  ```

- **7-Zip、Bandizip 等压缩软件**：同样选中这几项压缩为 ZIP。

::: warning
不要用 Windows 自带的 Windows PowerShell 5.1 里的 `Compress-Archive`：它在 ZIP 里写的是反斜杠路径，导入会被拒绝。PowerShell 7 的 `Compress-Archive` 没有这个问题。
:::

### 5. 导入试用，反复调整

导入后在预览里点「应用外观」看效果。改完图片或 `theme.json` 后重新打包、再次导入，遇到「外观已存在」时选择替换即可，不需要先删除旧的。

## 字段说明

### 基本信息

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `formatVersion` | 是 | 固定写 `1` |
| `id` | 是 | 外观的唯一标识，只能用小写字母、数字、下划线和短横线，以字母或数字开头，最长 64 字；不能用 `con`、`nul`、`com1` 这类 Windows 保留名 |
| `name` | 是 | 显示名称，最长 80 字 |
| `description` | 否 | 预览弹窗里的说明，最长 300 字 |
| `mode` | 是 | `light` 或 `dark`，决定界面按浅色还是深色绘制，应与背景图的明暗一致 |
| `tokens` | 是 | 配色，见下表 |
| `background` | 否 | 整窗背景 |
| `mascot` | 否 | 角落装饰图 |
| `preview` | 否 | 预览图路径，可以放在 ZIP 最外层，也可以放在 `assets/` 下 |
| `menuIcons` | 否 | 菜单图标 |
| `cursors` | 否 | 光标 |

### 配色 `tokens`

颜色一律写 `#rrggbb` 六位十六进制，不支持透明度、三位简写或颜色名。

| 字段 | 必填 | 作用 |
| --- | --- | --- |
| `colorPrimary` | 是 | 主色：按钮、选中项、链接 |
| `colorBgLayout` | 否 | 页面底色 |
| `colorBgContainer` | 否 | 卡片、输入框等容器底色 |
| `colorBgElevated` | 否 | 标题栏、侧栏、弹窗、下拉菜单的底色 |
| `colorText` | 否 | 正文文字 |
| `colorTextSecondary` | 否 | 次要文字 |
| `colorBorder` | 否 | 边框 |
| `colorBorderSecondary` | 否 | 分割线等浅边框 |
| `borderRadius` | 否 | 圆角，0 到 32 的数字 |

省略的颜色按 `mode` 和 `colorPrimary` 自动推算。

### 背景 `background`

整窗固定背景，覆盖标题栏、侧栏和内容区；切换页面、滚动内容时图片保持原位。

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `path` | — | 必填，必须在 `assets/` 下 |
| `opacity` | `1` | 图片本身的不透明度，0 到 1 |
| `surfaceOpacity` | `0.72` | 布局和卡片表面的不透明度，0 到 1；0 为全透明，1 为不透明 |
| `position` | `right bottom` | 先写水平方向 `left` / `center` / `right`，可再跟一个空格和垂直方向 `top` / `center` / `bottom` |
| `size` | `cover` | `cover` 铺满（会裁切）、`contain` 完整显示（会留边）、`auto` 原始尺寸 |

文字、图标、按钮和输入框不会跟着变透明；弹窗、抽屉和下拉菜单保持不透明。只有提供了背景图片才启用透明表面，纯配色的外观包沿用正常背景。

### 角落装饰 `mascot`

主题包附带桌宠时，将桌宠配置写在 `theme.json` 的 `mascot` 对象中，图片放在 `assets/` 下并由 `theme.json` 引用，不需要另外放入 `mascot.json`。在支持桌面桌宠的客户端中，它会显示为独立悬浮窗口；选择「跟随当前主题」并开启「显示桌面桌宠」即可使用主题附带的桌宠。

主题附带的桌宠也可以配置 `mascot.animation`，与独立桌宠使用相同的字段和图片排布。待机、工作、鼠标视线和结果动画的制作方式见[加入动画与鼠标视线](./mascot#加入动画与鼠标视线)；可复制[完整配置示例](./mascot#完整配置示例)中的整个 `mascot` 对象到 `theme.json`，并保留主题的其他字段。

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `path` | — | 必填，必须在 `assets/` 下 |
| `width` | `144` | 显示宽度（像素），16 到 1024；实际最多占窗口宽度的 35%、高度的 30% |
| `opacity` | `1` | 0 到 1 |
| `position` | `bottom-right` | `top-left`、`top-right`、`bottom-left`、`bottom-right` |

旧版客户端会在装饰图所在一侧留出空间，避免遮挡内容，窗口宽度不超过 800px 时隐藏装饰图。初始化页面和独立日志窗口使用外观包的配色与背景，但不显示装饰图。桌面悬浮桌宠的显示尺寸和行为见[桌宠包制作与导入](./mascot#角色显示)。

### 菜单图标 `menuIcons`

每个值指向 `assets/` 下的图片，没写的键保留内置图标，同一张图片可以给多个键复用。

| 键 | 菜单 |
| --- | --- |
| `home` | 主页 |
| `scripts` | 托管管理 |
| `plans` | 计划管理 |
| `emulators` | 模拟器管理 |
| `queue` | 调度队列 |
| `scheduler` | 调度中心 |
| `gameSign` | 游戏社区 |
| `history` | 历史记录 |
| `tools` | 工具 |
| `settings` | 设置 |

开发版另有 `testRouter`、`ocrDev`、`overlayMaskDev`、`updateDownloadDev` 四个开发菜单键。

### 光标 `cursors`

| 键 | 用在哪里 |
| --- | --- |
| `default` | 普通指针 |
| `pointer` | 悬停在按钮、链接等可点击元素上 |
| `text` | 悬停在输入框、可选中文字上 |

- `path` 必须是 `assets/` 下的 PNG，宽高都在 1 到 64 像素之间。
- `hotspotX`、`hotspotY` 是点击生效的那个像素坐标，从图片左上角 `(0, 0)` 算起，默认都是 0，必须落在图片范围内。普通箭头通常是 `0, 0`；手形指针填食指尖的位置；文本光标填竖线中点。
- 没写的键继续使用系统光标。

## 限制

| 项目 | 上限 |
| --- | --- |
| ZIP 文件大小 | 16 MB |
| 解压后总大小 | 32 MB |
| ZIP 内条目数（含文件夹） | 32 |
| 单个文件 | 8 MB |
| `theme.json` | 256 KB |
| 路径长度 | 240 字符 |

ZIP 里的每个文件都必须被 `theme.json` 引用，不能有多余文件，也不能有空文件。

## 常见导入错误

| 提示 | 原因与解决 |
| --- | --- |
| theme.json 必须在 ZIP 根目录 | 压缩了外层文件夹。打开文件夹，选中里面的文件再压缩 |
| 缺少 theme.json | ZIP 里没有 `theme.json`，或文件名大小写不对 |
| ZIP 中包含绝对路径或 Windows 路径 | 用了 Windows PowerShell 5.1 的 `Compress-Archive`，换一种打包方式 |
| 不支持的图片类型 / 包含未声明文件 | ZIP 里混进了 `Thumbs.db`、`desktop.ini`、`.DS_Store`、`__MACOSX` 或没在 `theme.json` 里引用的图片，删掉后重新打包 |
| 缺少资源 | `theme.json` 里写的路径和 ZIP 里的文件对不上，检查大小写和扩展名 |
| 图片内容与扩展名不匹配 | 例如把 JPEG 改名成了 `.png`，用图片软件重新导出 |
| 光标图片尺寸必须在 1 到 64 像素之间 | 把光标图片缩到 64×64 以内 |
| 热点必须位于图片范围内 | `hotspotX` / `hotspotY` 超出了图片宽高 |
| ……必须是 #rrggbb 颜色 | 颜色写成了 `#fff`、`rgb(...)` 或带透明度的八位色值 |
| theme.json 无法解析 | JSON 语法错误，常见的是多了末尾逗号或用了中文引号 |
| id 只能包含小写字母、数字、下划线和短横线 | `id` 里有大写字母、空格或中文 |

## 用 AI 辅助制作

可以让 AI 帮你写 `theme.json`、画素材。下面的提示词可以直接复制，把尖括号里的内容换成你自己的。

### 生成 theme.json

把下面整段发给对话式 AI（ChatGPT、Claude、DeepSeek 等）：

```text
你是 AUTO-MAS 自定义外观包的制作助手。请根据我的描述生成 theme.json，只输出 JSON，不要解释。

我的外观：<描述风格和配色，例如：奶油黄配浅棕，可爱风，浅色界面>
外观名称：<例如：奶油布丁>
我已经准备好的文件（ZIP 内路径）：
- 背景：<assets/background.jpg，图片偏亮 / 偏暗，主体在右下角>
- 角落装饰：<assets/mascot.png，没有就写“无”>
- 预览图：<preview.png，没有就写“无”>
- 菜单图标：<例如 home → assets/menu-home.png，settings → assets/menu-settings.png；没有就写“无”>
- 光标：<例如 default → assets/cursor-default.png，32×32，尖端在 (0,0)；没有就写“无”>

格式要求：
1. formatVersion 固定为 1。
2. id 只用小写字母、数字、下划线、短横线，以字母或数字开头，64 字以内；name 80 字以内；description 300 字以内。
3. mode 为 "light" 或 "dark"，必须和背景图的明暗一致。
4. tokens 只能包含 colorPrimary（必填）、colorBgLayout、colorBgContainer、colorBgElevated、colorText、colorTextSecondary、colorBorder、colorBorderSecondary、borderRadius。颜色一律写 #rrggbb 六位十六进制；borderRadius 是 0 到 32 的数字。正文文字与背景色的对比度至少 4.5:1。
5. background：path 必须以 assets/ 开头；opacity、surfaceOpacity 为 0 到 1（surfaceOpacity 是卡片表面不透明度，背景图越花越要调高，建议 0.6 到 0.85）；position 写 "left"、"center" 或 "right"，可再跟空格和 "top"、"center" 或 "bottom"；size 为 "cover"、"contain" 或 "auto"。
6. mascot：path 以 assets/ 开头；width 为 16 到 1024；opacity 为 0 到 1；position 为 "top-left"、"top-right"、"bottom-left"、"bottom-right" 之一。
7. menuIcons 的键只能是 home、scripts、plans、emulators、queue、scheduler、gameSign、history、tools、settings。
8. cursors 的键只能是 default、pointer、text；path 必须是 assets/ 下的 .png；hotspotX、hotspotY 为 0 到 63 的整数，并且在图片尺寸以内。
9. 只引用我列出的文件，我写了“无”的字段整段省略，不要编造任何路径或字段。
```

### 生成图片素材

图片模型（Midjourney、DALL·E、通义万相、即梦等）一般给不出精确像素尺寸，生成后用图片软件裁切、缩放到上面「准备图片」里的尺寸。

**背景**

```text
<风格和主题>的插画，用作桌面软件的全屏背景，横版 16:9。画面主体集中在右下角，左侧和上半部分留出大面积简洁、低对比度的区域，方便叠放文字和卡片。<浅色 / 深色>整体色调，以<主色>为主。不要文字、水印、界面元素和边框。
```

**角落装饰**

```text
<角色或物件>的全身形象，<风格>，透明背景，主体完整不裁切，四周留少量空白，边缘干净，不要文字和阴影底座。
```

**菜单图标**

```text
一套 10 个风格统一的软件侧栏图标，分别表示：主页、托管管理、计划管理、模拟器管理、调度队列、调度中心、游戏社区、历史记录、工具、设置。<风格>，<主色>配色，透明背景，每个图标单独居中、大小一致，轮廓简单、线条粗，缩小到 24 像素仍能辨认。不要文字。
```

生成的通常是一整张拼图，需要逐个裁成单独的 PNG，再在 `menuIcons` 里对应到各个键。

**光标**

```text
鼠标指针图标，<风格>，透明背景，方形画布，箭头尖端位于画面左上角，造型简洁，缩小到 32 像素仍然清晰。不要文字。
```

缩到 32×32 后，用图片软件查看尖端所在的像素坐标，填进 `hotspotX` 和 `hotspotY`。
