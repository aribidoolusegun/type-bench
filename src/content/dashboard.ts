import type { ContentLength } from '../model/settings.ts'

/**
 * Acme Freight: a fictional shipping dashboard. All names, carriers and
 * figures are invented sample data. “Large numbers” swaps in longer,
 * realistically formatted values for the metrics, IDs and table totals.
 */

export type ShipmentStatus = 'In transit' | 'Delivered' | 'Delayed' | 'Exception'

export interface Metric {
  label: string
  value: string
  change: string
  direction: 'up' | 'down'
}

export interface ShipmentRow {
  id: string
  destination: string
  carrier: string
  status: ShipmentStatus
  value: string
}

export interface DashboardContent {
  workspace: string
  nav: string[]
  activeNav: string
  heading: string
  summary: string
  alert: string | null
  metrics: Metric[]
  tableTitle: string
  rows: ShipmentRow[]
  totalRows: number
  footnote: string
}

interface RowSource {
  id: number
  destination: string
  carrier: string
  status: ShipmentStatus
  value: number
  large: number
}

const ROWS: readonly RowSource[] = [
  { id: 20418, destination: 'Leeds, United Kingdom', carrier: 'Northway', status: 'In transit', value: 1240, large: 1240380.25 },
  { id: 20417, destination: 'Rotterdam, Netherlands', carrier: 'Coastline Cargo', status: 'Delivered', value: 3860.5, large: 38604112.5 },
  { id: 20415, destination: 'Lyon, France', carrier: 'Meridian Post', status: 'Delayed', value: 912.75, large: 912750.4 },
  { id: 20414, destination: 'Porto, Portugal', carrier: 'Northway', status: 'In transit', value: 2145, large: 2145098.0 },
  { id: 20412, destination: 'Malmö, Sweden', carrier: 'Bluebell Express', status: 'Delivered', value: 684.2, large: 684209.15 },
  { id: 20411, destination: 'Antwerp, Belgium', carrier: 'Coastline Cargo', status: 'Exception', value: 5302.1, large: 53021877.9 },
  { id: 20409, destination: 'Dublin, Ireland', carrier: 'Meridian Post', status: 'Delivered', value: 1018, large: 1018446.6 },
  { id: 20408, destination: 'Kraków, Poland', carrier: 'Bluebell Express', status: 'In transit', value: 2476.9, large: 2476905.35 },
  { id: 20406, destination: 'Hamburg, Germany', carrier: 'Northway', status: 'Delivered', value: 4190, large: 41902260.0 },
  { id: 20405, destination: 'Bilbao, Spain', carrier: 'Meridian Post', status: 'Delayed', value: 1355.4, large: 1355418.75 },
  { id: 20403, destination: 'Turin, Italy', carrier: 'Coastline Cargo', status: 'In transit', value: 2980.65, large: 2980652.2 },
  { id: 20402, destination: 'Aarhus, Denmark', carrier: 'Bluebell Express', status: 'Delivered', value: 760.3, large: 760301.45 },
]

const ROW_COUNTS: Record<ContentLength, number> = { short: 3, standard: 5, long: 8, extended: 12 }

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

function formatId(id: number, large: boolean): string {
  return large ? `SH-2026-${String(id).padStart(7, '0')}` : `SH-${id}`
}

export function dashboardContent(length: ContentLength, longHeadings: boolean, largeNumbers: boolean): DashboardContent {
  const count = ROW_COUNTS[length]
  const rows = ROWS.slice(0, count).map((r) => ({
    id: formatId(r.id, largeNumbers),
    destination: r.destination,
    carrier: r.carrier,
    status: r.status,
    value: money.format(largeNumbers ? r.large : r.value),
  }))

  const metrics: Metric[] = largeNumbers
    ? [
        { label: 'In transit', value: '1,284,906', change: '+118,240 vs last week', direction: 'up' },
        { label: 'Delivered this week', value: '4,207,315', change: '+6.8% vs last week', direction: 'up' },
        { label: 'Freight spend', value: '$12,480,915.62', change: '−$1,092,447.10 vs last week', direction: 'down' },
        { label: 'On-time rate', value: '96.47%', change: '+0.38 pts vs last week', direction: 'up' },
      ]
    : [
        { label: 'In transit', value: '1,284', change: '+112 vs last week', direction: 'up' },
        { label: 'Delivered this week', value: '3,912', change: '+6.8% vs last week', direction: 'up' },
        { label: 'Freight spend', value: '$48,210', change: '−$2,140 vs last week', direction: 'down' },
        { label: 'On-time rate', value: '96.4%', change: '+0.4 pts vs last week', direction: 'up' },
      ]

  const summary =
    length === 'short'
      ? 'Week of 12–18 October · All warehouses'
      : length === 'standard'
        ? 'Week of 12–18 October · All warehouses · Updated 4 minutes ago'
        : 'Week of 12–18 October across all warehouses and carrier partners. Figures update every five minutes from carrier tracking feeds, so totals may change slightly as late scans arrive.'

  const alert =
    length === 'long' || length === 'extended'
      ? `${formatId(20411, largeNumbers)} is held at customs in Antwerp: a commercial invoice is missing. Upload the document to release the shipment before the next collection window.`
      : null

  return {
    workspace: 'Acme Freight',
    nav: ['Overview', 'Shipments', 'Carriers', 'Invoices', 'Settings'],
    activeNav: 'Shipments',
    heading: longHeadings ? 'Shipments across every warehouse and carrier partner this week' : 'Shipments',
    summary,
    alert,
    metrics,
    tableTitle: 'Recent shipments',
    rows,
    totalRows: largeNumbers ? 1284906 : 1284,
    footnote: 'Sample data for a fictional company.',
  }
}
