import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: "/",
    title: "AUTO-MAS",
    head: [
        // 添加图标
        ['link', { rel: 'icon', href: '/icons/AUTO-MAS.ico' }]
    ],
    description: "AUTO-MAS",
    themeConfig: {
        logo: { src: '/icons/AUTO-MAS.ico', width: 24, height: 24, alt: 'AUTO-MAS LOGO' },
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "首页", link: "/" },
            { text: "文档", link: "/docs/user-guide" },
            {
                text: "开发", items: [
                    { text: "本体开发", link: "/developer/getting-start" },
                    { text: "插件开发", link: "/plugin/start/start" }
                ],
                activeMatch: "^/developer/"
            },
            { text: "下载", link: "/download/auto-mas" },
            { text: "公示", link: "/disclosure" },
        ],

        sidebar: {
            //文档
            '/docs/': [
                {
                    text: "使用文档 ",
                    items: [
                        { text: "开始使用", link: "/docs/user-guide" },
                        {
                            text: "脚本配置",
                            link: "/docs/script-guide",
                            items: [
                                { text: "MAA", link: "/docs/script-guide/maa" },
                                { text: "MAAEND", link: "/docs/script-guide/maaend" },
                                { text: "M9A", link: "/docs/script-guide/m9a" },
                                { text: "OK-WW", link: "/docs/script-guide/okww" },
                                { text: "通用脚本", link: "/docs/script-guide/general" },
                                { text: "三月七", link: "/docs/script-guide/march7th" },
                            ]
                        },
                        { text: "任务调度", link: "/docs/task-scheduler" },
                        {
                            text: "进阶功能",
                            link: "/docs/advanced-features",
                            items: [
                                { text: "模拟器管理", link: "/docs/advanced-features/emulator" },
                                { text: "推送通知", link: "/docs/advanced-features/notification" },
                                { text: "MCP 服务", link: "/docs/advanced-features/mcp" },
                            ]
                        },
                        { text: "常见问题", link: "/docs/FAQ" },
                    ],
                },
            ],
            'plugin/': [
                {
                    text: "插件开发者指南",
                    items: [

                        { text: "开发起步", link: "/plugin/start/start" },
                        { text: "配置文件", link: "/plugin/start/config" },
                        { text: "插件开发", link: "/plugin/start/develop" },
                        { text: "发布插件", link: "/plugin/start/publish" },
                    ]
                }, {
                    text: "开发基础",
                    items: [
                        { text: "核心能力", link: "/plugin/basic/core" },
                        { text: "事件系统", link: "/plugin/basic/event" },
                        { text: "配置声明", link: "/plugin/basic/schema" },
                        { text: "服务系统", link: "/plugin/basic/service" },
                    ]
                }
            ],
            //开发者指南
            '/developer/': {
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
                                text: "开发文档", items: [
                                    { text: "API 开发", link: "API" },
                                    { text: "配置管理", link: "config" },
                                    { text: "专项适配", link: "script_task" },
                                ]
                            },
                        ],
                    },
                ],
            },
            //下载渠道
            '/download/': [
                {
                    text: "软件下载",
                    items: [
                        { text: "AUTO-MAS", link: "/download/auto-mas" },
                        { text: "MaaZFA", link: "/download/maa-zfa" },
                    ],
                },
            ],
            //信息公开
            '/disclosure/': [
                {
                    text: "信息公开",
                    link: "/disclosure/",
                    items: [
                        { text: "云端服务用户协议", link: "/disclosure/cloud-service-agreement" },
                        { text: "项目收支", link: "/disclosure/income-and-expenditures" },
                        { text: "耻辱柱", link: "/disclosure/pillar-of-shame" },
                    ],
                },
            ],
        },
        search: {
            provider: 'local'
        },
        socialLinks: [
            { icon: "github", link: "https://github.com/AUTO-MAS-Project/AUTO-MAS" },
        ],
        lastUpdated: {
            text: '最后更新于',
            formatOptions: { dateStyle: 'full', timeStyle: 'full', hourCycle: 'h24' }
        },
        // 修改链接
        editLink: {
            pattern: 'https://github.com/AUTO-MAS-Project/AUTO-MAS-docs/edit/master/:path',
            text: '为此页提供修改建议'
        },
        notFound: {
            title: '找不到页面',
            quote: '页面不见了，也许它去找寻新的冒险了！',
            linkLabel: '返回首页重新探索',
            linkText: '返回首页',
            code: '404'
        },
        docFooter: { prev: '上一篇', next: '下一篇' },
        // 移动端 - 返回顶部
        returnToTopLabel: '返回顶部',

        // 移动端 - menu
        sidebarMenuLabel: '文档',
        // markdown 外部链接图标
        externalLinkIcon: true,
        // 右侧目录（TOC）配置
        outline: {
            level: [2, 4], // 允许 h2 到 h4 级别的标题出现在右侧目录
            label: "目录", // 自定义目录标题
        },
    },
});
