import { memo } from 'react'
import { mobileContent } from '../../content/mobile.ts'
import type { ContentLength } from '../../model/settings.ts'

interface MobileSpecimenProps {
  length: ContentLength
  longHeadings: boolean
}

export const MobileSpecimen = memo(function MobileSpecimen({ length, longHeadings }: MobileSpecimenProps) {
  const c = mobileContent(length, longHeadings)
  return (
    <div className="sp-mobile">
      <header className="sp-mobile__bar" data-diag-label="App bar">
        <button type="button" tabIndex={-1} className="sp-link sp-body">
          <span aria-hidden="true">‹ </span>
          {c.appBarBack}
        </button>
        <button type="button" tabIndex={-1} className="sp-link sp-body">
          {c.appBarAction}
        </button>
      </header>

      <div className="sp-mobile__content">
        <p className="sp-caption sp-kicker">{c.eyebrow}</p>
        <h1 className="sp-h2" data-diag-heading="Main heading">
          {c.heading}
        </h1>
        <p className="sp-body sp-muted" data-diag-body>
          {c.summary}
        </p>

        <dl className="sp-mobile__meta" data-diag-label="Details list">
          {c.meta.map((m) => (
            <div key={m.label}>
              <dt className="sp-caption sp-muted">{m.label}</dt>
              <dd className="sp-body sp-strong">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="sp-mobile__actions" data-diag-label="Buttons">
          <button type="button" tabIndex={-1} className="sp-button sp-button--primary sp-body">
            {c.primaryAction}
          </button>
          <button type="button" tabIndex={-1} className="sp-button sp-button--secondary sp-body">
            {c.secondaryAction}
          </button>
        </div>

        {c.sections.map((section) => (
          <section key={section.heading} className="sp-mobile__section">
            <h2 className="sp-h3" data-diag-heading="Section heading">
              {section.heading}
            </h2>
            {section.paragraphs.map((p) => (
              <p key={p} className="sp-body" data-diag-body>
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="sp-list">
                {section.list.map((item) => (
                  <li key={item} className="sp-body">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <nav className="sp-mobile__tabs" aria-label="Sample app tabs" data-diag-label="Tab bar">
        {c.tabs.map((tab) => (
          <span key={tab} className={`sp-caption${tab === c.activeTab ? ' sp-strong is-current' : ''}`}>
            {tab}
          </span>
        ))}
      </nav>
    </div>
  )
})
