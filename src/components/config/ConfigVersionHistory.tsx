import type { KongConfig } from '../../types/domain'

interface ConfigVersionHistoryProps {
  history: KongConfig[]
  onRollback: (index: number) => void
}

export function ConfigVersionHistory({ history, onRollback }: ConfigVersionHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">No saved configurations yet.</div>
    )
  }

  return (
    <div className="space-y-2">
      {[...history].reverse().map((cfg, reversedIdx) => {
        const originalIdx = history.length - 1 - reversedIdx
        const isLatest = reversedIdx === 0
        return (
          <div
            key={cfg.id}
            className={`p-4 rounded-lg border ${isLatest ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{cfg.baseUrl}</span>
                  {isLatest && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Auth: <span className="capitalize">{cfg.authMethod.replace('-', ' ')}</span>
                  {' · '}
                  Credential: {cfg.credential}
                  {' · '}
                  TLS: {cfg.tlsEnabled ? 'enabled' : 'disabled'}
                </div>
                <div className="text-xs text-gray-400">
                  Saved {cfg.savedAt.replace('T', ' ').slice(0, 16)} UTC by {cfg.savedBy}
                </div>
              </div>
              {!isLatest && (
                <button
                  onClick={() => onRollback(originalIdx)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-4 flex-shrink-0"
                  data-testid={`rollback-btn-${originalIdx}`}
                >
                  Rollback
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
