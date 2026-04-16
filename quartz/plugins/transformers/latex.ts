import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeMathjax from "rehype-mathjax/svg"
//@ts-ignore
import rehypeTypst from "@myriaddreamin/rehype-typst"
import { QuartzTransformerPlugin } from "../types"
import { KatexOptions } from "katex"
import { Options as MathjaxOptions } from "rehype-mathjax/svg"
//@ts-ignore
import { Options as TypstOptions } from "@myriaddreamin/rehype-typst"

interface Options {
  renderEngine: "katex" | "mathjax" | "typst"
  customMacros: MacroType
  katexOptions: Omit<KatexOptions, "macros" | "output">
  mathJaxOptions: Omit<MathjaxOptions, "macros">
  typstOptions: TypstOptions
}

// mathjax macros
export type Args = boolean | number | string | null
interface MacroType {
  [key: string]: string | Args[]
}

export const Latex: QuartzTransformerPlugin<Partial<Options>> = (opts) => {
  const engine = opts?.renderEngine ?? "mathjax"
  const macros = opts?.customMacros ?? {}
  return {
    name: "Latex",
    markdownPlugins() {
      return [remarkMath]
    },
    htmlPlugins() {
      switch (engine) {
        case "katex": {
          return [[rehypeKatex, { output: "html", macros, ...(opts?.katexOptions ?? {}) }]]
        }
        case "typst": {
          return [[rehypeTypst, opts?.typstOptions ?? {}]]
        }
        default:
        case "mathjax": {
          return [
            [
              rehypeMathjax,
              {
                ...(opts?.mathJaxOptions ?? {}),
                tex: {
                  ...(opts?.mathJaxOptions?.tex ?? {}),
                  macros,
                },
              },
            ],
          ]
        }
      }
    },
    externalResources() {
      switch (engine) {
        case "katex":
          return {
            css: [{ content: "https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" }],
            js: [
              {
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js",
                loadTime: "afterDOMReady",
                contentType: "external",
              },
              {
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js",
                loadTime: "afterDOMReady",
                contentType: "external",
              },
              {
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/copy-tex.min.js",
                loadTime: "afterDOMReady",
                contentType: "external",
              },
              {
                script: `
                  document.addEventListener('DOMContentLoaded', function() {
                    renderMathInElement(document.body, {
                      delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\\\[', right: '\\\\]', display: true},
                        {left: '\\\\(', right: '\\\\)', display: false}
                      ],
                      throwOnError: false
                    });
                  });
                `,
                loadTime: "afterDOMReady",
                contentType: "inline",
              },
            ],
          }
        case "mathjax":
          return {
            js: [
              {
                script: `
                  window.MathJax = {
                    tex: {
                      inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                      displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                      processEscapes: true,
                      macros: ${JSON.stringify(macros)}
                    },
                    startup: {
                      ready: function() {
                        MathJax.startup.defaultReady();
                        MathJax.startup.promise.then(function() {
                          document.dispatchEvent(new Event('MathJaxReady'));
                        });
                      }
                    }
                  };
                `,
                loadTime: "beforeDOMReady",
                contentType: "inline",
              },
              {
                src: "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js",
                loadTime: "beforeDOMReady",
                contentType: "external",
              },
            ],
          }
      }
    },
  }
}
