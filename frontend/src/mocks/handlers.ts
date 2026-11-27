import { http, HttpResponse } from 'msw'
import type { Review } from '@/api/reviews'
import { buildReviews } from './data'

const reviews = buildReviews()

export const handlers = [
  http.get('*/api/reviews', ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const status = url.searchParams.get('status')
    const reportType = url.searchParams.get('reportType')
    const year = url.searchParams.get('year')
    const sort = (url.searchParams.get('sort') ?? 'updatedAt') as keyof Review
    const dir = url.searchParams.get('dir') === 'asc' ? 1 : -1
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)

    const filtered = reviews
      .filter((r) => !q || r.vendorName.toLowerCase().includes(q) || r.system.toLowerCase().includes(q))
      .filter((r) => !status || r.status === status)
      .filter((r) => !reportType || r.reportType === reportType)
      .filter((r) => !year || r.periodEnd.startsWith(year))
      .sort((a, b) => String(a[sort]).localeCompare(String(b[sort])) * dir)

    return HttpResponse.json({
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    })
  }),
]
