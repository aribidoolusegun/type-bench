import { memo } from 'react'
import { dashboardContent, type ShipmentStatus } from '../../content/dashboard.ts'
import type { ContentLength } from '../../model/settings.ts'

interface DashboardSpecimenProps {
  length: ContentLength
  longHeadings: boolean
  largeNumbers: boolean
}

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  'In transit': 'is-transit',
  Delivered: 'is-delivered',
  Delayed: 'is-delayed',
  Exception: 'is-exception',
}

const count = new Intl.NumberFormat('en-US')

export const DashboardSpecimen = memo(function DashboardSpecimen({ length, longHeadings, largeNumbers }: DashboardSpecimenProps) {
  const c = dashboardContent(length, longHeadings, largeNumbers)
  return (
    <div className="sp-dashboard">
      <header className="sp-dashboard__top" data-diag-label="Top navigation">
        <span className="sp-body sp-strong">{c.workspace}</span>
        <nav className="sp-dashboard__nav" aria-label="Sample product navigation">
          {c.nav.map((item) => (
            <a
              key={item}
              href="#preview"
              tabIndex={-1}
              className={`sp-body sp-dashboard__navlink${item === c.activeNav ? ' is-current' : ''}`}
              aria-current={item === c.activeNav ? 'page' : undefined}
              onClick={(e) => e.preventDefault()}
            >
              {item}
            </a>
          ))}
        </nav>
        <span className="sp-caption sp-tag">Sample data</span>
      </header>

      <div className="sp-dashboard__main" data-diag-label="Dashboard layout">
        <div className="sp-dashboard__heading" data-diag-label="Heading row">
          <div>
            <h1 className="sp-h2" data-diag-heading="Main heading">
              {c.heading}
            </h1>
            <p className="sp-body sp-muted" data-diag-body>
              {c.summary}
            </p>
          </div>
          <div className="sp-actions" data-diag-label="Buttons">
            <button type="button" tabIndex={-1} className="sp-button sp-button--secondary sp-body">
              Export CSV
            </button>
            <button type="button" tabIndex={-1} className="sp-button sp-button--primary sp-body">
              New shipment
            </button>
          </div>
        </div>

        {c.alert && (
          <p className="sp-alert sp-body" role="note" data-diag-body>
            <span className="sp-strong">Action needed: </span>
            {c.alert}
          </p>
        )}

        <ul className="sp-metrics" aria-label="Key figures" data-diag-label="Metric cards">
          {c.metrics.map((m) => (
            <li key={m.label} className="sp-metric" data-diag-label="Metric card">
              <span className="sp-caption sp-muted">{m.label}</span>
              <span className="sp-h3 sp-metric__value sp-num" data-diag-label="Metric value">
                {m.value}
              </span>
              <span className={`sp-caption sp-num sp-metric__change is-${m.direction}`}>{m.change}</span>
            </li>
          ))}
        </ul>

        <section className="sp-table-card" aria-labelledby="sp-table-title" data-diag-label="Shipments card">
          <div className="sp-table-card__head">
            <h2 id="sp-table-title" className="sp-body sp-strong">
              {c.tableTitle}
            </h2>
            <span className="sp-caption sp-muted sp-num">
              Showing {c.rows.length} of {count.format(c.totalRows)}
            </span>
          </div>
          <div className="sp-table-scroll" data-diag-label="Shipments table" tabIndex={0} aria-label="Shipments table, scrolls sideways">
            <table className="sp-table">
              <thead>
                <tr>
                  <th scope="col" className="sp-caption">Shipment</th>
                  <th scope="col" className="sp-caption">Destination</th>
                  <th scope="col" className="sp-caption">Carrier</th>
                  <th scope="col" className="sp-caption">Status</th>
                  <th scope="col" className="sp-caption sp-align-end">Value</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="sp-body sp-num sp-nowrap">{row.id}</td>
                    <td className="sp-body">{row.destination}</td>
                    <td className="sp-body">{row.carrier}</td>
                    <td className="sp-body sp-nowrap">
                      <span className={`sp-status sp-caption ${STATUS_CLASS[row.status]}`}>{row.status}</span>
                    </td>
                    <td className="sp-body sp-num sp-nowrap sp-align-end">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <p className="sp-caption sp-muted">{c.footnote}</p>
      </div>
    </div>
  )
})
