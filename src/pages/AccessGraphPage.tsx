import { useState, useMemo, useRef, useEffect } from 'react'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import { mockRoles } from '../mock/mockRoles'
import { mockConsumers } from '../mock/mockConsumers'
import { buildGraphData, SYSTEM_LABELS } from '../utils/buildGraphData'
import type { GraphBuildOptions } from '../utils/buildGraphData'
import type { SystemType } from '../types/domain'
import { AccessGraph } from '../components/graph/AccessGraph'
import { GraphLegend } from '../components/graph/GraphLegend'

interface GraphOptions extends GraphBuildOptions {}

const defaultOptions: GraphOptions = {
  showEnvironmentNodes: false,
  showSystemNodes: true,
  showAclGroups: false,
  showSodEdges: true,
  filterPrincipal: '',
  filterRole: '',
  filterEnvironment: 'all',
  filterPrivilege: 'all',
  filterSystem: 'all',
  filterPrincipalType: 'all',
}

// Neo4j-style Cypher query preview
function buildCypherPreview(opts: GraphOptions): string {
  const lines: string[] = []
  lines.push('MATCH (p)-[r:HAS_ROLE]->(role:Role)')
  if (opts.showAclGroups) lines.push('MATCH (role)-[:MAPS_TO]->(acl:AclGroup)')
  const wheres: string[] = []
  if (opts.filterEnvironment !== 'all') wheres.push(`p.environment = '${opts.filterEnvironment}'`)
  if (opts.filterPrivilege !== 'all') wheres.push(`role.privilegeLevel = '${opts.filterPrivilege}'`)
  if (opts.filterSystem !== 'all') wheres.push(`role.system = '${opts.filterSystem}'`)
  if (opts.filterPrincipalType !== 'all') wheres.push(`p.type = '${opts.filterPrincipalType}'`)
  if (opts.filterPrincipal) wheres.push(`p.name CONTAINS '${opts.filterPrincipal}'`)
  if (opts.filterRole) wheres.push(`role.name CONTAINS '${opts.filterRole}'`)
  if (wheres.length) lines.push(`WHERE ${wheres.join('\n  AND ')}`)
  if (opts.showSodEdges) lines.push('OPTIONAL MATCH (role)-[:SOD_CONFLICT_WITH]->(r2:Role)')
  lines.push('RETURN p, r, role' + (opts.showAclGroups ? ', acl' : '') + (opts.showSodEdges ? ', r2' : ''))
  return lines.join('\n')
}

export function AccessGraphPage() {
  const [opts, setOpts] = useState<GraphOptions>(defaultOptions)
  const [showCypher, setShowCypher] = useState(false)
  const [showLegend, setShowLegend] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [graphSize, setGraphSize] = useState({ width: 900, height: 560 })

  // Responsive canvas size
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        setGraphSize({ width: Math.max(400, w), height: Math.max(400, Math.round(w * 0.6)) })
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  function set<K extends keyof GraphOptions>(key: K, value: GraphOptions[K]) {
    setOpts(prev => ({ ...prev, [key]: value }))
  }

  const graphData = useMemo(
    () => buildGraphData(mockRoleAssignments, mockRoles, mockConsumers, opts),
    [opts]
  )

  const cypher = useMemo(() => buildCypherPreview(opts), [opts])

  const stats = {
    nodes: graphData.nodes.length,
    edges: graphData.edges.length,
    consumers: graphData.nodes.filter(n => n.type === 'consumer').length,
    enterpriseUsers: graphData.nodes.filter(n => n.type === 'enterprise-user').length,
    roles: graphData.nodes.filter(n => n.type === 'role').length,
    sodEdges: graphData.edges.filter(e => e.type === 'sod_conflict').length,
    highPriv: graphData.nodes.filter(n => n.type === 'role' && n.meta.isHighPrivilege).length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Relationship Graph</h1>
          <p className="text-sm text-gray-500 mt-1">
            Node graph showing identity → role → system relationships across all connected platforms
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCypher(v => !v)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors ${
              showCypher
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showCypher ? '▼ Hide Cypher' : '▶ Show Cypher'}
          </button>
          <button
            onClick={() => setShowLegend(v => !v)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors ${
              showLegend
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showLegend ? 'Hide Legend' : 'Show Legend'}
          </button>
        </div>
      </div>

      {/* Cypher preview */}
      {showCypher && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Neo4j Cypher Query</span>
            <span className="text-xs text-gray-400">— equivalent query for a live Neo4j backend</span>
          </div>
          <pre className="text-xs text-indigo-700 font-mono leading-relaxed whitespace-pre-wrap">{cypher}</pre>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
        {[
          { label: 'Total Nodes',      value: stats.nodes,           color: 'text-indigo-600' },
          { label: 'Total Edges',      value: stats.edges,           color: 'text-gray-700' },
          { label: 'Enterprise Users', value: stats.enterpriseUsers, color: 'text-teal-600' },
          { label: 'Consumers',        value: stats.consumers,       color: 'text-indigo-500' },
          { label: 'Roles',            value: stats.roles,           color: 'text-purple-600' },
          { label: 'SoD Conflicts',    value: stats.sodEdges,        color: stats.sodEdges > 0 ? 'text-red-600' : 'text-gray-400' },
          { label: 'High-Privilege',   value: stats.highPriv,        color: stats.highPriv > 0 ? 'text-purple-600' : 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-center shadow-sm">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls + Graph */}
      <div className="flex gap-4 items-start">
        {/* Left panel: filters */}
        <div className="w-56 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Principal Type</label>
                <select
                  value={opts.filterPrincipalType ?? 'all'}
                  onChange={e => set('filterPrincipalType', e.target.value as 'all' | 'consumer' | 'enterprise-user')}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All principals</option>
                  <option value="enterprise-user">👤 Enterprise Users</option>
                  <option value="consumer">🤖 Consumers</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">System</label>
                <select
                  value={opts.filterSystem ?? 'all'}
                  onChange={e => set('filterSystem', e.target.value as SystemType | 'all')}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All systems</option>
                  {(Object.entries(SYSTEM_LABELS) as [SystemType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Principal name</label>
                <input
                  type="text"
                  value={opts.filterPrincipal ?? ''}
                  onChange={e => set('filterPrincipal', e.target.value)}
                  placeholder="Search user / consumer…"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Role</label>
                <input
                  type="text"
                  value={opts.filterRole ?? ''}
                  onChange={e => set('filterRole', e.target.value)}
                  placeholder="Search role…"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Environment</label>
                <select
                  value={opts.filterEnvironment ?? 'all'}
                  onChange={e => set('filterEnvironment', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Privilege Level</label>
                <select
                  value={opts.filterPrivilege ?? 'all'}
                  onChange={e => set('filterPrivilege', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="standard">Standard</option>
                  <option value="elevated">Elevated</option>
                  <option value="high-privilege">High Privilege</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setOpts(defaultOptions)}
              className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear filters
            </button>
          </div>

          {/* Display toggles */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Display</div>
            {[
              { key: 'showSystemNodes' as const,      label: 'System nodes' },
              { key: 'showEnvironmentNodes' as const, label: 'Environment nodes' },
              { key: 'showAclGroups' as const,        label: 'ACL Group nodes' },
              { key: 'showSodEdges' as const,         label: 'SoD conflict edges' },
            ].map(toggle => (
              <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opts[toggle.key] as boolean}
                  onChange={e => set(toggle.key, e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-xs text-gray-700">{toggle.label}</span>
              </label>
            ))}
          </div>

          {/* Legend */}
          {showLegend && <GraphLegend />}
        </div>

        {/* Graph canvas */}
        <div className="flex-1 min-w-0" ref={containerRef}>
          {graphData.nodes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center"
              style={{ height: graphSize.height }}>
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-sm">No nodes match the current filters.</div>
                <button
                  onClick={() => setOpts(defaultOptions)}
                  className="mt-3 text-indigo-600 hover:text-indigo-800 text-xs underline"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <AccessGraph
              data={graphData}
              width={graphSize.width}
              height={graphSize.height}
            />
          )}
        </div>
      </div>
    </div>
  )
}
