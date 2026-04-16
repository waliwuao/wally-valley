import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return children.length > 0 ? <header>{children}</header> : null
}

Header.css = `
header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 2.5rem 0;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--lightgray);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, var(--secondary), transparent);
  }
}

header h1 {
  margin: 0;
  flex: auto;
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--dark);
  letter-spacing: -0.02em;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
