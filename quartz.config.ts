import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Wally Valley",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "wally-valley",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        title: "Great Vibes",
        header: "LXGW WenKai",
        body: "LXGW WenKai",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#FAF7F2",
          lightgray: "#EDE4DA",
          gray: "#8B7355",
          darkgray: "#4A3728",
          dark: "#2C1810",
          secondary: "#A67B5B",
          tertiary: "#6B4423",
          highlight: "rgba(166, 123, 91, 0.12)",
          textHighlight: "rgba(107, 68, 35, 0.15)",
        },
        darkMode: {
          light: "#1E1411",
          lightgray: "#3D2E24",
          gray: "#C4A484",
          darkgray: "#E8DDD0",
          dark: "#F5F0EA",
          secondary: "#C9A66B",
          tertiary: "#A67B5B",
          highlight: "rgba(201, 166, 107, 0.1)",
          textHighlight: "rgba(166, 123, 91, 0.12)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "mathjax" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
