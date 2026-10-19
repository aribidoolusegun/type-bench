import { memo } from 'react'
import { editorialContent } from '../../content/editorial.ts'
import type { ContentLength } from '../../model/settings.ts'

interface EditorialSpecimenProps {
  length: ContentLength
  longHeadings: boolean
  colophon: string
}

export const EditorialSpecimen = memo(function EditorialSpecimen({ length, longHeadings, colophon }: EditorialSpecimenProps) {
  const c = editorialContent(length, longHeadings)
  return (
    <article className="sp-editorial">
      <header className="sp-editorial__masthead" data-diag-label="Masthead">
        <span className="sp-caption sp-strong">{c.publication}</span>
        <span className="sp-caption sp-muted">{c.section}</span>
      </header>

      <div className="sp-editorial__head">
        <p className="sp-caption sp-kicker">Typography</p>
        <h1 className="sp-display" data-diag-heading="Main heading">
          {c.headline}
        </h1>
        <p className="sp-h3 sp-editorial__intro">{c.intro}</p>
        <p className="sp-caption sp-muted sp-editorial__byline">
          By <span className="sp-strong sp-ink">{c.author}</span>
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {c.readingMinutes} min read
        </p>
      </div>

      <div className="sp-editorial__body">
        {c.blocks.map((block, i) => {
          if (block.kind === 'h2')
            return (
              <h2 key={i} className="sp-h2" data-diag-heading="Section heading">
                {block.text}
              </h2>
            )
          if (block.kind === 'h3')
            return (
              <h3 key={i} className="sp-h3" data-diag-heading="Subheading">
                {block.text}
              </h3>
            )
          return (
            <p key={i} className="sp-body" data-diag-body>
              {block.text}
            </p>
          )
        })}
      </div>

      <footer className="sp-editorial__footer">
        <p className="sp-caption sp-muted">{colophon}</p>
      </footer>
    </article>
  )
})
