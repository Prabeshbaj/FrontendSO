import type { Review, ReviewStatus } from '@/api/reviews'

/*
 * SYNTHETIC data only. Vendor names are invented. Never put real SOC report
 * content or real vendor details in this repository.
 */
const VENDORS = [
  'Acme Cloud Hosting', 'Bluefin Payroll', 'Cobalt Data Centers', 'Delta Ledger Services',
  'Evergreen HR Systems', 'Fjord Analytics', 'Granite Custody Tech', 'Harbor Print & Mail',
  'Ion Identity', 'Juniper Backup Co', 'Kestrel Messaging', 'Lumen Market Data',
]
const SYSTEMS = ['Core Platform', 'Managed Hosting', 'Payroll Processing', 'Data Warehouse', 'Statement Printing']
const STATUSES: ReviewStatus[] = ['READY_FOR_REVIEW', 'SIGNED_OFF', 'EXTRACTING', 'NO_PRIOR', 'FAILED', 'READY_FOR_REVIEW', 'SIGNED_OFF']

function seeded(n: number) {
  let x = n
  return () => {
    x = (x * 1103515245 + 12345) % 2 ** 31
    return x / 2 ** 31
  }
}

export function buildReviews(count = 64): Review[] {
  const rand = seeded(42)
  return Array.from({ length: count }, (_, i) => {
    const vendorIdx = i % VENDORS.length
    const year = 2023 + (i % 4)
    const start = `${year - 1}-10-01`
    const end = `${year}-09-30`
    const status = STATUSES[Math.floor(rand() * STATUSES.length)]
    return {
      reportId: `rpt-${String(i + 1).padStart(4, '0')}`,
      vendorId: `ven-${String(vendorIdx + 1).padStart(3, '0')}`,
      vendorName: VENDORS[vendorIdx],
      system: SYSTEMS[Math.floor(rand() * SYSTEMS.length)],
      reportType: rand() > 0.35 ? 'SOC 2' : 'SOC 1',
      reportKind: rand() > 0.2 ? 'Type II' : 'Type I',
      periodStart: start,
      periodEnd: end,
      status,
      exceptionCount: Math.floor(rand() * 4),
      negativeChangeCount: status === 'NO_PRIOR' ? 0 : Math.floor(rand() * 3),
      updatedAt: new Date(Date.UTC(year, 10, 1 + (i % 27), 12)).toISOString(),
    }
  })
}
