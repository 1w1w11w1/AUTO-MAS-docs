import { defineConfig } from "vitepress";
import { enThemeConfig } from "./config/en";
import { sharedThemeConfig } from "./config/shared";
import { zhThemeConfig } from "./config/zh";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: "/",
    lang: "zh-CN",
    title: "AUTO-MAS",
    head: [
        // 添加图标
        ["link", { rel: "icon", href: "/icons/AUTO-MAS.ico" }],
    ],
    description: "AUTO-MAS",
    srcExclude: ["README.md", "public/**"],
    vite: {
        ssr: {
            noExternal: ["@theojs/lumen", "dayjs"],
        },
    },
    themeConfig: sharedThemeConfig,
    locales: {
        root: {
            label: "简体中文",
            lang: "zh-CN",
            link: "/",
            themeConfig: zhThemeConfig,
        },
        en: {
            label: "English",
            lang: "en-US",
            link: "/en/",
            title: "AUTO-MAS",
            description: "AUTO-MAS documentation",
            themeConfig: enThemeConfig,
        },
    },
});
