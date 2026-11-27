import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { createColumnHelper } from '@tanstack/react-table'
import {
  REPORT_TYPES,
  REVIEW_STATUSES,
  SORTABLE_REVIEW_FIELDS,
  useReviewSearch,
  type Review,
  type ReviewSearch,
  type ReviewSortField,
  type ReviewStatus,
} from '@/api/reviews'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  Alert,
  Button,
  DataTable,
  PageHeader,
  Pagination,
  SearchField,
  Select,
  StatusBadge,
  type BadgeTone,
  type CoreFeatures,
} from '@/theme/components'
import { parseReviewSearch, writeReviewSearch } from './searchParams'
import styles from './ReviewsPage.module.css'

const STATUS_LABEL: Record<ReviewStatus, { label: string; tone: BadgeTone }> = {
  UPLOADING: { label: 'Uploading', tone: 'neutral' },
  EXTRACTING: { label: 'Extracting', tone: 'info' },
  EXTRACTED: { label: 'Extracted', tone: 'info' },
  COMPARING: { label: 'Comparing', tone: 'info' },
  NO_PRIOR: { label: 'No prior report', tone: 'warning' },
  READY_FOR_REVIEW: { label: 'Ready for review', tone: 'info' },
  SIGNED_OFF: { label: 'Signed off', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
}

const statusOptions = REVIEW_STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s].label }))
const typeOptions = REPORT_TYPES.map((t) => ({ id: t, label: t }))
const thisYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 6 }, (_, i) => String(thisYear - i)).map((y) => ({ id: y, label: y }))

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

const col = createColumnHelper<CoreFeatures, Review>()
const columns = col.columns([
  col.accessor('vendorName', {
    header: 'Vendor',
    cell: (info) => (
      <Link to={`/reviews/${info.row.original.reportId}`} className={styles.vendor}>
        {info.getValue()}
      </Link>
    ),
  }),
  col.accessor('system', { header: 'System' }),
  col.accessor((r) => `${r.reportType} ${r.reportKind}`, { id: 'report', header: 'Report' }),
  col.accessor('periodEnd', {
    header: 'Period',
    cell: (info) => `${formatDate(info.row.original.periodStart)} – ${formatDate(info.getValue())}`,
  }),
  col.accessor('exceptionCount', { header: 'Exceptions' }),
  col.accessor('negativeChangeCount', { header: 'Negative changes' }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const s = STATUS_LABEL[info.getValue()]
      return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
    },
  }),
])

const EMPTY: Review[] = []

export function ReviewsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const search = parseReviewSearch(params)
  const [query, setQuery] = useState(search.q)
  const debouncedQuery = useDebouncedValue(query, 300)

  const update = (patch: Partial<ReviewSearch>, resetPage = true) =>
    setParams(writeReviewSearch({ ...search, ...patch, ...(resetPage ? { page: 1 } : {}) }))

  useEffect(() => {
    if (debouncedQuery.trim() !== search.q) update({ q: debouncedQuery.trim() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const { data, isFetching, isError, refetch } = useReviewSearch(search)
  const hasFilters = Boolean(search.q || search.status || search.reportType || search.year)

  return (
    <>
      <PageHeader
        title="Reviews"
        lead="Search past and in-progress SOC report reviews by vendor, period, status and report type."
        actions={
          <Button variant="accent" onPress={() => navigate('/uploads')}>
            Upload report
          </Button>
        }
      />
      <div className="container">

      <section aria-label="Search and filters" className={styles.filters}>
        <div className={styles.search}>
          <SearchField label="Search vendor or system" value={query} onChange={setQuery} placeholder="e.g. Acme" />
        </div>
        <Select
          label="Status"
          options={statusOptions}
          value={search.status}
          onChange={(v) => update({ status: v as ReviewStatus | null })}
        />
        <Select
          label="Report type"
          options={typeOptions}
          value={search.reportType}
          onChange={(v) => update({ reportType: v as ReviewSearch['reportType'] })}
        />
        <Select
          label="Period end year"
          options={yearOptions}
          value={search.year ? String(search.year) : null}
          onChange={(v) => update({ year: v ? Number(v) : null })}
        />
        {hasFilters && (
          <div className={styles.clear}>
            <Button
              variant="text"
              size="sm"
              onPress={() => {
                setQuery('')
                setParams(new URLSearchParams())
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </section>

      {isError ? (
        <Alert tone="danger" title="Could not load reviews">
          <Button variant="secondary" size="sm" onPress={() => void refetch()}>
            Try again
          </Button>
        </Alert>
      ) : (
        <div className={styles.results}>
          <DataTable
            caption="Review search results"
            columns={columns}
            data={data?.items ?? EMPTY}
            getRowId={(r) => r.reportId}
            sortableColumnIds={SORTABLE_REVIEW_FIELDS}
            sort={{ id: search.sort, direction: search.dir }}
            onSortChange={(s) => update({ sort: s.id as ReviewSortField, dir: s.direction })}
            isLoading={isFetching}
            emptyMessage={hasFilters ? 'No reviews match these filters.' : 'No reviews yet.'}
          />
          {data && data.total > 0 && (
            <Pagination
              page={search.page}
              pageSize={search.pageSize}
              total={data.total}
              onPageChange={(page) => update({ page }, false)}
            />
          )}
        </div>
      )}
      </div>
    </>
  )
}
