import { useState, type ReactNode } from 'react'

export interface ColumnDef<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  getValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  rowKey: (row: T) => string
  expandedRowRender?: (row: T) => ReactNode
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No records found.',
  rowKey,
  expandedRowRender,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  function handleSort(col: ColumnDef<T>) {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const col = columns.find(c => c.key === sortKey)
    if (!col?.getValue) return 0
    const av = col.getValue(a)
    const bv = col.getValue(b)
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none ${col.sortable ? 'cursor-pointer hover:text-gray-700' : ''}`}
              >
                {col.header}
                {col.sortable && sortKey === col.key && (
                  <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map(row => {
              const key = rowKey(row)
              const isExpanded = expandedRow === key
              return (
                <>
                  <tr
                    key={key}
                    onClick={() => {
                      if (expandedRowRender) setExpandedRow(isExpanded ? null : key)
                      onRowClick?.(row)
                    }}
                    className={`transition-colors ${onRowClick || expandedRowRender ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                  >
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                  {expandedRowRender && isExpanded && (
                    <tr key={`${key}-expanded`} className="bg-indigo-50">
                      <td colSpan={columns.length} className="px-6 py-4">
                        {expandedRowRender(row)}
                      </td>
                    </tr>
                  )}
                </>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
