interface FilterOption {
  label: string
  value: string
}

interface FilterConfig {
  id: string
  label: string
  type: 'select' | 'text' | 'date'
  options?: FilterOption[]
  value: string
}

interface FilterBarProps {
  filters: FilterConfig[]
  onChange: (id: string, value: string) => void
  onClear?: () => void
}

export function FilterBar({ filters, onChange, onClear }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {filters.map(f => (
        <div key={f.id} className="flex flex-col gap-1 min-w-[140px]">
          <label htmlFor={f.id} className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {f.label}
          </label>
          {f.type === 'select' ? (
            <select
              id={f.id}
              value={f.value}
              onChange={e => onChange(f.id, e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {f.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              id={f.id}
              type={f.type}
              value={f.value}
              onChange={e => onChange(f.id, e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={f.label}
            />
          )}
        </div>
      ))}
      {onClear && (
        <button
          onClick={onClear}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium self-end pb-1.5"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
