import { CodeBlock } from './CodeBlock.tsx'
import { CopyButton } from './controls/CopyButton.tsx'

interface CssPreviewProps {
  rootBlock: string
  onCopy: () => Promise<boolean>
  onOpenExport: (opener: HTMLElement) => void
}

export function CssPreview({ rootBlock, onCopy, onOpenExport }: CssPreviewProps) {
  return (
    <section className="css-preview" aria-labelledby="css-preview-title">
      <div className="panel-subhead">
        <h3 id="css-preview-title" className="panel-subtitle">
          CSS variables
        </h3>
        <button type="button" className="text-button panel-subhead__end" onClick={(e) => onOpenExport(e.currentTarget)}>
          Export options
        </button>
      </div>
      <CodeBlock code={rootBlock} language="css" label="CSS custom properties" className="code--compact" />
      <CopyButton label="Copy full CSS" onCopy={onCopy} className="button button--secondary button--block" />
    </section>
  )
}
