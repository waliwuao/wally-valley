export interface ColorScheme {
  light: string
  lightgray: string
  gray: string
  darkgray: string
  dark: string
  secondary: string
  tertiary: string
  highlight: string
  textHighlight: string
}

interface Colors {
  lightMode: ColorScheme
  darkMode: ColorScheme
}

export type FontSpecification =
  | string
  | {
      name: string
      weights?: number[]
      includeItalic?: boolean
    }

export interface Theme {
  typography: {
    title?: FontSpecification
    header: FontSpecification
    body: FontSpecification
    code: FontSpecification
  }
  cdnCaching: boolean
  colors: Colors
  fontOrigin: "googleFonts" | "local"
}

export type ThemeKey = keyof Colors

export function getFontSpecificationName(spec: FontSpecification): string {
  if (typeof spec === "string") {
    return spec
  }

  return spec.name
}

function formatFontSpecification(
  type: "title" | "header" | "body" | "code",
  spec: FontSpecification,
) {
  if (typeof spec === "string") {
    spec = { name: spec }
  }

  const defaultIncludeWeights = type === "header" ? [400, 700] : [400, 600]
  const defaultIncludeItalic = type === "body"
  const weights = spec.weights ?? defaultIncludeWeights
  const italic = spec.includeItalic ?? defaultIncludeItalic

  const features: string[] = []
  if (italic) {
    features.push("ital")
  }

  if (weights.length > 1) {
    const weightSpec = italic
      ? weights
          .flatMap((w) => [`0,${w}`, `1,${w}`])
          .sort()
          .join(";")
      : weights.join(";")

    features.push(`wght@${weightSpec}`)
  }

  if (features.length > 0) {
    return `${spec.name}:${features.join(",")}`
  }

  return spec.name
}

export function googleFontHref(theme: Theme) {
  const { title, header, body, code } = theme.typography
  const titleFont = formatFontSpecification("title", title || header)
  const headerFont = formatFontSpecification("header", header)
  const bodyFont = formatFontSpecification("body", body)
  const codeFont = formatFontSpecification("code", code)
  const fallbackMono = formatFontSpecification("code", "Noto Sans Mono")

  return `https://fonts.googleapis.com/css2?family=${titleFont}&family=${headerFont}&family=${bodyFont}&family=${codeFont}&family=${fallbackMono}&display=swap`
}

export function googleFontSubsetHref(theme: Theme, text: string) {
  const title = theme.typography.title || theme.typography.header
  const titleFont = formatFontSpecification("title", title)

  return `https://fonts.googleapis.com/css2?family=${titleFont}&text=${encodeURIComponent(text)}&display=swap`
}

export interface GoogleFontFile {
  url: string
  filename: string
  extension: string
}

const fontMimeMap: Record<string, string> = {
  truetype: "ttf",
  woff: "woff",
  woff2: "woff2",
  opentype: "otf",
}

export async function processGoogleFonts(
  stylesheet: string,
  baseUrl: string,
): Promise<{
  processedStylesheet: string
  fontFiles: GoogleFontFile[]
}> {
  const fontSourceRegex =
    /url\((https:\/\/fonts.gstatic.com\/.+(?:\/|(?:kit=))(.+?)[.&].+?)\)\sformat\('(\w+?)'\);/g
  const fontFiles: GoogleFontFile[] = []
  let processedStylesheet = stylesheet

  let match
  while ((match = fontSourceRegex.exec(stylesheet)) !== null) {
    const url = match[1]
    const filename = match[2]
    const extension = fontMimeMap[match[3].toLowerCase()]
    const staticUrl = `https://${baseUrl}/static/fonts/${filename}.${extension}`

    processedStylesheet = processedStylesheet.replace(url, staticUrl)
    fontFiles.push({ url, filename, extension })
  }

  return { processedStylesheet, fontFiles }
}

export function joinStyles(baseUrl: string, theme: Theme, ...stylesheet: string[]) {
  const monoWithChinese = '"JetBrains Mono", "Noto Sans Mono CJK SC", "Source Han Mono", ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace'
  const serifChinese = '"LXGW WenKai", "Noto Serif SC", "Songti SC", "SimSun", serif'
  const titleWithChinese = '"Great Vibes", cursive'
  const headerWithChinese = '"LXGW WenKai", "Noto Serif SC", "Songti SC", "SimSun", serif'

  // 构建字体路径前缀（如果 baseUrl 不为空，则添加 baseUrl 路径）
  const fontPathPrefix = baseUrl ? `/${baseUrl}` : ""

  // 只有当 fontOrigin 为 "local" 时才生成 @font-face 规则
  // 使用 WOFF2 格式的字体文件（已压缩，比 TTF 小约 70%）
  const localFontFace = theme.fontOrigin === "local" ? `
@font-face {
  font-family: 'LXGW WenKai';
  src: url('${fontPathPrefix}/static/fonts/LXGWWenKai-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'LXGW WenKai';
  src: url('${fontPathPrefix}/static/fonts/LXGWWenKai-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
` : ""

  return `
${stylesheet.join("\n\n")}
${localFontFace}
:root {
  --light: ${theme.colors.lightMode.light};
  --lightgray: ${theme.colors.lightMode.lightgray};
  --gray: ${theme.colors.lightMode.gray};
  --darkgray: ${theme.colors.lightMode.darkgray};
  --dark: ${theme.colors.lightMode.dark};
  --secondary: ${theme.colors.lightMode.secondary};
  --tertiary: ${theme.colors.lightMode.tertiary};
  --highlight: ${theme.colors.lightMode.highlight};
  --textHighlight: ${theme.colors.lightMode.textHighlight};

  --titleFont: ${titleWithChinese};
  --headerFont: ${headerWithChinese};
  --bodyFont: ${serifChinese};
  --codeFont: ${monoWithChinese};
}

:root[saved-theme="dark"] {
  --light: ${theme.colors.darkMode.light};
  --lightgray: ${theme.colors.darkMode.lightgray};
  --gray: ${theme.colors.darkMode.gray};
  --darkgray: ${theme.colors.darkMode.darkgray};
  --dark: ${theme.colors.darkMode.dark};
  --secondary: ${theme.colors.darkMode.secondary};
  --tertiary: ${theme.colors.darkMode.tertiary};
  --highlight: ${theme.colors.darkMode.highlight};
  --textHighlight: ${theme.colors.darkMode.textHighlight};
}
`
}
