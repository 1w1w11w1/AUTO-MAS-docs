import type { DefaultTheme } from "vitepress";

export const zhThemeConfig: DefaultTheme.Config = {
    nav: [
        { text: "首页", link: "/" },
        { text: "文档", link: "/docs/user-guide" },
        {
            text: "开发",
            items: [
                { text: "本体开发", link: "/developer/getting-start" },
                { text: "风味专项开发", link: "/developer/maafw-flavor" },
                { text: "插件开发", link: "/plugin/start/start" },
            ],
            activeMatch: "^/developer/",
        },
        { text: "下载", link: "/download/auto-mas" },
        { text: "公示", link: "/disclosure" },
    ],
    sidebar: {
        "/docs/": [
            {
                text: "使用文档",
                items: [
                    { text: "开始使用", link: "/docs/user-guide" },
                    {
                        text: "脚本配置",
                        link: "/docs/script-guide/",
                        items: [
                            { text: "MAA", link: "/docs/script-guide/maa" },
                            { text: "MAAEND", link: "/docs/script-guide/maaend" },
                            { text: "M9A", link: "/docs/script-guide/m9a" },
                            { text: "MFW 项目", link: "/docs/script-guide/maafw" },
                            { text: "OK-WW", link: "/docs/script-guide/okww" },
                            { text: "HSR", link: "/docs/script-guide/hsr" },
                            { text: "BetterGI", link: "/docs/script-guide/bettergi" },
                            { text: "通用脚本", link: "/docs/script-guide/general" },
                            { text: "SRA", link: "/docs/script-guide/sra" },
                            { text: "三月七", link: "/docs/script-guide/march7th" },
                        ],
                    },
                    { text: "任务调度", link: "/docs/task-scheduler" },
                    {
                        text: "进阶功能",
                        link: "/docs/advanced-features/",
                        items: [
                            { text: "游戏签到工具", link: "/docs/advanced-features/game-sign" },
                            { text: "模拟器管理", link: "/docs/advanced-features/emulator" },
                            { text: "推送通知", link: "/docs/advanced-features/notification" },
                            { text: "MCP 服务", link: "/docs/advanced-features/mcp" },
                            { text: "中国移动新消息（5G 消息）", link: "/docs/advanced-features/cmcc-newmsg" },
                            { text: "让电脑定时上班", link: "/docs/advanced-features/skip-password" },
                        ],
                    },
                    { text: "常见问题", link: "/docs/FAQ" },
                    { text: "提问的智慧", link: "/docs/howtoask" },
                ],
            },
        ],
        "/plugin/": [
            {
                text: "插件开发者指南",
                items: [
                    { text: "开发起步", link: "/plugin/start/start" },
                    { text: "配置文件", link: "/plugin/start/config" },
                    { text: "插件开发", link: "/plugin/start/develop" },
                    { text: "发布插件", link: "/plugin/start/publish" },
                ],
            },
            {
                text: "开发基础",
                items: [
                    { text: "核心能力", link: "/plugin/basic/core" },
                    { text: "事件系统", link: "/plugin/basic/event" },
                    { text: "配置声明", link: "/plugin/basic/schema" },
                    { text: "服务系统", link: "/plugin/basic/service" },
                ],
            },
        ],
        "/developer/": {
            base: "/developer/",
            items: [
                {
                    text: "MAS主程序开发者指南",
                    link: "",
                    items: [
                        { text: "开发起步", link: "getting-start" },
                        { text: "开发规范", link: "development-specifications" },
                        { text: "仓库与 Agent 规范", link: "agent-and-repository-rules" },
                        { text: "构筑与发布", link: "build-and-publish" },
                        {
                            text: "开发文档",
                            items: [
                                { text: "API 开发", link: "API" },
                                { text: "配置管理", link: "config" },
                                { text: "配置语义", link: "config-semantics" },
                                { text: "通知系统", link: "notification" },
                                { text: "计划表规范", link: "planbook" },
                                { text: "专项适配", link: "script_task" },
                                { text: "风味专项开发", link: "maafw-flavor" },
                            ],
                        },
                    ],
                },
            ],
        },
        "/download/": [
            {
                text: "软件下载",
                items: [
                    { text: "AUTO-MAS", link: "/download/auto-mas" },
                    { text: "MaaZFA", link: "/download/maa-zfa" },
                ],
            },
        ],
        "/disclosure/": [
            {
                text: "信息公开",
                link: "/disclosure/",
                items: [
                    { text: "图像与美术资源许可协议", link: "/disclosure/assets-license" },
                    { text: "云端服务用户协议", link: "/disclosure/cloud-service-agreement" },
                    { text: "项目收支", link: "/disclosure/income-and-expenditures" },
                    { text: "耻辱柱", link: "/disclosure/pillar-of-shame" },
                ],
            },
        ],
    },
    lastUpdated: {
        text: "最后更新于",
        formatOptions: { dateStyle: "full", timeStyle: "full", hourCycle: "h24" },
    },
    editLink: {
        pattern: "https://github.com/AUTO-MAS-Project/AUTO-MAS-docs/edit/master/:path",
        text: "为此页提供修改建议",
    },
    notFound: {
        title: "找不到页面",
        quote: "页面不见了，也许它去找寻新的冒险了！",
        linkLabel: "返回首页重新探索",
        linkText: "返回首页",
        code: "404",
    },
    docFooter: { prev: "上一篇", next: "下一篇" },
    returnToTopLabel: "返回顶部",
    sidebarMenuLabel: "文档",
    outline: {
        level: [2, 4],
        label: "目录",
    },
};
