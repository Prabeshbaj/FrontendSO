import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthProvider'
import { apiGet } from './client'

/*
 * ASSUMED CONTRACT. architecture-v2 does not define API routes yet.
 * GET /reviews?q&status&reportType&year&sort&dir&page&pageSize
 * Statuses follow architecture-v2 (UPLOADING ... READY_FOR_REVIEW, FAILED, NO_PRIOR).
 * SIGNED_OFF is an assumption for a finished review.
 */
export const REVIEW_STATUSES = [
  'UPLOADING',
  'EXTRACTING',
  'EXTRACTED',
  'COMPARING',
  'NO_PRIOR',
  'READY_FOR_REVIEW',
  'SIGNED_OFF',
  'FAILED',
] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const REPORT_TYPES = ['SOC 1', 'SOC 2'] as const

export const ReviewSchema = z.object({
  reportId: z.string(),
  vendorId: z.string(),
  vendorName: z.string(),
  system: z.string(),
  reportType: z.enum(REPORT_TYPES),
  reportKind: z.enum(['Type I', 'Type II']),
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
  status: z.enum(REVIEW_STATUSES),
  exceptionCount: z.number().int().nonnegative(),
  negativeChangeCount: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime(),
})
export type Review = z.infer<typeof ReviewSchema>

export const ReviewPageSchema = z.object({
  items: z.array(ReviewSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
})
export type ReviewPage = z.infer<typeof ReviewPageSchema>

export const SORTABLE_REVIEW_FIELDS = ['vendorName', 'periodEnd', 'status', 'updatedAt'] as const
export type ReviewSortField = (typeof SORTABLE_REVIEW_FIELDS)[number]

export interface ReviewSearch {
  q: string
  status: ReviewStatus | null
  reportType: (typeof REPORT_TYPES)[number] | null
  year: number | null
  sort: ReviewSortField
  dir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export function toQueryString(s: ReviewSearch): string {
  const p = new URLSearchParams()
  if (s.q) p.set('q', s.q)
  if (s.status) p.set('status', s.status)
  if (s.reportType) p.set('reportType', s.reportType)
  if (s.year) p.set('year', String(s.year))
  p.set('sort', s.sort)
  p.set('dir', s.dir)
  p.set('page', String(s.page))
  p.set('pageSize', String(s.pageSize))
  return p.toString()
}

export function useReviewSearch(search: ReviewSearch) {
  const { getAccessToken } = useAuth()
  return useQuery({
    queryKey: ['reviews', search],
    queryFn: ({ signal }) => apiGet(`/reviews?${toQueryString(search)}`, ReviewPageSchema, getAccessToken, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
