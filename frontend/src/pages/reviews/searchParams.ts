import {
  REPORT_TYPES,
  REVIEW_STATUSES,
  SORTABLE_REVIEW_FIELDS,
  type ReviewSearch,
} from '@/api/reviews'

const PAGE_SIZE = 20

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

/** The URL is the source of truth for search state: shareable links and back-button support. */
export function parseReviewSearch(params: URLSearchParams): ReviewSearch {
  const year = Number(params.get('year'))
  const page = Number(params.get('page'))
  return {
    q: params.get('q') ?? '',
    status: oneOf(params.get('status'), REVIEW_STATUSES),
    reportType: oneOf(params.get('reportType'), REPORT_TYPES),
    year: Number.isInteger(year) && year > 2000 ? year : null,
    sort: oneOf(params.get('sort'), SORTABLE_REVIEW_FIELDS) ?? 'updatedAt',
    dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE,
  }
}

export function writeReviewSearch(s: ReviewSearch): URLSearchParams {
  const p = new URLSearchParams()
  if (s.q) p.set('q', s.q)
  if (s.status) p.set('status', s.status)
  if (s.reportType) p.set('reportType', s.reportType)
  if (s.year) p.set('year', String(s.year))
  if (s.sort !== 'updatedAt') p.set('sort', s.sort)
  if (s.dir !== 'desc') p.set('dir', s.dir)
  if (s.page > 1) p.set('page', String(s.page))
  return p
}
