import { tableFeatures, useTable, type ColumnDef } from '@tanstack/react-table'
import styles from './DataTable.module.css'

/** Core-only table: sorting, filtering and paging are server-owned (FR-19 search API). */
export const coreFeatures = tableFeatures({})
export type CoreFeatures = typeof coreFeatures

export type SortDirection = 'asc' | 'desc'
export interface SortState {
  id: string
  direction: SortDirection
}

export interface DataTableProps<TData extends object> {
  caption: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<CoreFeatures, TData, any>[]
  data: TData[]
  getRowId: (row: TData) => string
  sortableColumnIds?: readonly string[]
  sort?: SortState | null
  onSortChange?: (sort: SortState) => void
  isLoading?: boolean
  emptyMessage?: string
}

/**
 * Responsive table. At widths under 768px each row renders as a stacked card,
 * using the column header as the cell label.
 */
export function DataTable<TData extends object>({
  caption,
  columns,
  data,
  getRowId,
  sortableColumnIds = [],
  sort,
  onSortChange,
  isLoading,
  emptyMessage = 'No results.',
}: DataTableProps<TData>) {
  const table = useTable({
    features: coreFeatures,
    columns,
    data,
    getRowId: (row: TData) => getRowId(row),
  })

  const headerLabel = (columnId: string) => {
    const def = table.getColumn(columnId)?.columnDef
    return typeof def?.header === 'string' ? def.header : columnId
  }

  return (
    <div className={styles.wrapper} aria-busy={isLoading || undefined}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const id = header.column.id
                const sortable = sortableColumnIds.includes(id) && onSortChange
                const active = sort?.id === id
                const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                return (
                  <th key={header.id} scope="col" aria-sort={sortable ? (ariaSort ?? 'none') : undefined}>
                    {header.isPlaceholder ? null : sortable ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() =>
                          onSortChange({ id, direction: active && sort.direction === 'asc' ? 'desc' : 'asc' })
                        }
                      >
                        <table.FlexRender header={header} />
                        <span aria-hidden="true" className={styles.sortIcon}>
                          {active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id} data-label={headerLabel(cell.column.id)}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!isLoading && data.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
      {isLoading && data.length === 0 && <p className={styles.empty}>Loading…</p>}
    </div>
  )
}
