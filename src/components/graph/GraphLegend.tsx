import { NODE_COLORS, EDGE_COLORS, type NodeType, type EdgeType } from '../../utils/buildGraphData'

const nodeTypes: { type: NodeType; label: string; icon: string }[] = [
  { type: 'system',           label: 'System (Kong/AAD/BTP/ADO)', icon: '⚡' },
  { type: 'environment',      label: 'Environment',               icon: '🌐' },
  { type: 'enterprise-user',  label: 'Enterprise User',           icon: '👤' },
  { type: 'consumer',         label: 'Consumer / Service Acct',   icon: '🤖' },
  { type: 'role',             label: 'Role',                      icon: '🔑' },
  { type: 'aclGroup',         label: 'ACL Group / Permission',    icon: '🔒' },
]

const edgeTypes: { type: EdgeType; label: string; dashed?: boolean }[] = [
  { type: 'has_role',          label: 'Has Role' },
  { type: 'maps_to',           label: 'Maps To ACL' },
  { type: 'belongs_to_env',    label: 'Belongs To Env' },
  { type: 'belongs_to_system', label: 'Belongs To System' },
  { type: 'sod_conflict',      label: 'SoD Conflict', dashed: true },
]

export function GraphLegend() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-4">
      <div>
        <div className="text-gray-400 uppercase tracking-wide font-semibold mb-2">Node Types</div>
        <div className="space-y-1.5">
          {nodeTypes.map(n => (
            <div key={n.type} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0"
                style={{ background: NODE_COLORS[n.type] }}
              >
                {n.icon}
              </span>
              <span>{n.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-4 h-4 rounded-full border-2 border-purple-500 flex-shrink-0" />
            <span className="text-purple-400">High-privilege role</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-gray-400 uppercase tracking-wide font-semibold mb-2">Edge Types</div>
        <div className="space-y-1.5">
          {edgeTypes.map(e => (
            <div key={e.type} className="flex items-center gap-2">
              <svg width="24" height="10" className="flex-shrink-0">
                <line
                  x1="0" y1="5" x2="24" y2="5"
                  stroke={EDGE_COLORS[e.type]}
                  strokeWidth="2"
                  strokeDasharray={e.dashed ? '4 3' : undefined}
                />
              </svg>
              <span className={e.dashed ? 'text-red-400' : ''}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-gray-400 text-[10px] leading-relaxed border-t border-gray-100 pt-3">
        <div>🖱 Drag nodes to reposition</div>
        <div>🖱 Drag canvas to pan</div>
        <div>⚙ Scroll to zoom</div>
        <div>↺ Re-run layout</div>
      </div>
    </div>
  )
}
