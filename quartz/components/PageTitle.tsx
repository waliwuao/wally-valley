import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir}>{title}</a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.5rem;
  margin: 0;
  font-family: var(--titleFont);
  color: var(--dark);
  font-weight: 600;
  letter-spacing: -0.01em;
  
  a {
    transition: all 0.25s ease;
    
    &:hover {
      color: var(--tertiary);
      transform: translateX(3px);
      display: inline-block;
    }
  }
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
