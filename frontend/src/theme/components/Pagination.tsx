import { Button } from './Button'
import styles from './Pagination.module.css'

export interface PaginationProps {
  page: number // 1-based
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <p className={styles.summary} aria-live="polite">
        {from}–{to} of {total}
      </p>
      <div className={styles.controls}>
        <Button variant="secondary" size="sm" isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className={styles.page}>
          Page {page} of {pages}
        </span>
        <Button variant="secondary" size="sm" isDisabled={page >= pages} onPress={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  )
}
