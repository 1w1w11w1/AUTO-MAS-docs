import type { DefaultTheme } from "vitepress";

export const enThemeConfig: DefaultTheme.Config = {
    nav: [
        { text: "Home", link: "/en/" },
        { text: "Docs", link: "/en/docs/user-guide" },
        {
            text: "Development",
            items: [
                { text: "Core App", link: "/en/developer/getting-start" },
                { text: "Flavor Development", link: "/en/developer/maafw-flavor" },
                { text: "Plugin Development", link: "/en/plugin/start/start" },
            ],
            activeMatch: "^/en/(developer|plugin)/",
        },
        { text: "Download", link: "/en/download/auto-mas" },
        { text: "Disclosure", link: "/en/disclosure/" },
    ],
    sidebar: {
        "/en/docs/": [
            {
                text: "User Guide",
                items: [
                    { text: "Getting Started", link: "/en/docs/user-guide" },
                    {
                        text: "Script Configuration",
                        link: "/en/docs/script-guide/",
                        items: [
                            { text: "MAA", link: "/en/docs/script-guide/maa" },
                            { text: "MAAEND", link: "/en/docs/script-guide/maaend" },
                            { text: "M9A", link: "/en/docs/script-guide/m9a" },
                            { text: "MFW Projects", link: "/en/docs/script-guide/maafw" },
                            { text: "OK-WW", link: "/en/docs/script-guide/okww" },
                            { text: "HSR", link: "/en/docs/script-guide/hsr" },
                            { text: "BetterGI", link: "/en/docs/script-guide/bettergi" },
                            { text: "General Scripts", link: "/en/docs/script-guide/general" },
                            { text: "SRA", link: "/en/docs/script-guide/sra" },
                            { text: "March 7th", link: "/en/docs/script-guide/march7th" },
                        ],
                    },
                    { text: "Task Scheduler", link: "/en/docs/task-scheduler" },
                    {
                        text: "Advanced Features",
                        link: "/en/docs/advanced-features/",
                        items: [
                            { text: "Game Check-in", link: "/en/docs/advanced-features/game-sign" },
                            { text: "Emulator Management", link: "/en/docs/advanced-features/emulator" },
                            { text: "Notifications", link: "/en/docs/advanced-features/notification" },
                            { text: "MCP Service", link: "/en/docs/advanced-features/mcp" },
                        ],
                    },
                    { text: "FAQ", link: "/en/docs/FAQ" },
                    { text: "How to Ask Questions", link: "/en/docs/howtoask" },
                ],
            },
        ],
        "/en/plugin/": [
            {
                text: "Plugin Developer Guide",
                items: [
                    { text: "Getting Started", link: "/en/plugin/start/start" },
                    { text: "Configuration File", link: "/en/plugin/start/config" },
                    { text: "Plugin Development", link: "/en/plugin/start/develop" },
                    { text: "Publishing Plugins", link: "/en/plugin/start/publish" },
                ],
            },
            {
                text: "Development Basics",
                items: [
                    { text: "Core Capabilities", link: "/en/plugin/basic/core" },
                    { text: "Event System", link: "/en/plugin/basic/event" },
                    { text: "Configuration Schema", link: "/en/plugin/basic/schema" },
                    { text: "Service System", link: "/en/plugin/basic/service" },
                ],
            },
        ],
        "/en/developer/": {
            base: "/en/developer/",
            items: [
                {
                    text: "MAS Core App Developer Guide",
                    link: "",
                    items: [
                        { text: "Getting Started", link: "getting-start" },
                        { text: "Development Standards", link: "development-specifications" },
                        { text: "Repository and Agent Rules", link: "agent-and-repository-rules" },
                        { text: "Build and Release", link: "build-and-publish" },
                        {
                            text: "Development Docs",
                            items: [
                                { text: "API Development", link: "API" },
                                { text: "Configuration Management", link: "config" },
                                { text: "Configuration Semantics", link: "config-semantics" },
                                { text: "Plan Table Specification", link: "planbook" },
                                { text: "Script Adaptation", link: "script_task" },
                                { text: "Flavor Development", link: "maafw-flavor" },
                            ],
                        },
                    ],
                },
            ],
        },
        "/en/download/": [
            {
                text: "Downloads",
                items: [
                    { text: "AUTO-MAS", link: "/en/download/auto-mas" },
                    { text: "MaaZFA", link: "/en/download/maa-zfa" },
                ],
            },
        ],
        "/en/disclosure/": [
            {
                text: "Disclosure",
                link: "/en/disclosure/",
                items: [
                    { text: "Visual Assets License Agreement", link: "/en/disclosure/assets-license" },
                    { text: "Cloud Service Agreement", link: "/en/disclosure/cloud-service-agreement" },
                    { text: "Income and Expenses", link: "/en/disclosure/income-and-expenditures" },
                    { text: "Pillar of Shame", link: "/en/disclosure/pillar-of-shame" },
                ],
            },
        ],
    },
    lastUpdated: {
        text: "Last updated",
        formatOptions: { dateStyle: "full", timeStyle: "full", hourCycle: "h24" },
    },
    editLink: {
        pattern: "https://github.com/AUTO-MAS-Project/AUTO-MAS-docs/edit/master/:path",
        text: "Suggest changes to this page",
    },
    notFound: {
        title: "Page not found",
        quote: "The page may have moved, or the link may be outdated.",
        linkLabel: "Return to the home page",
        linkText: "Return home",
        code: "404",
    },
    docFooter: { prev: "Previous page", next: "Next page" },
    returnToTopLabel: "Return to top",
    sidebarMenuLabel: "Docs",
    outline: {
        level: [2, 4],
        label: "On this page",
    },
};
