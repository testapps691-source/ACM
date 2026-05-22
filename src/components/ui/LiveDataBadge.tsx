// Shows whether data is coming from a live API or mock fallback.

interface LiveDataBadgeProps {
  isLive: boolean
  isLoading?: boolean
  error?: string | null
  onRefetch?: () => void
}

export function LiveDataBadge({ isLive, isLoading, error, onRefetch }: LiveDataBadgeProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Fetching live data…
      </span>
    )
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
        <span>⚠</span>
        Mock data (API error)
        {onRefetch && (
          <button onClick={onRefetch} className="underline hover:no-underline ml-1">retry</button>
        )}
      </span>
    )
  }

  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Live — Kong API
        {onRefetch && (
          <button onClick={onRefetch} className="underline hover:no-underline ml-1">↻</button>
        )}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
      <span>📦</span>
      Mock data
    </span>
  )
}
