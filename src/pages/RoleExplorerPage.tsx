import { useState } from 'react'
import type { Role } from '../types/domain'
import { mockRoles } from '../mock/mockRoles'
import { DataTable, type ColumnDef } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'
import { LiveDataBadge } from '../components/ui/LiveDataBadge'
import { useKongRoles, useKongPlugins, useKongConsumerGroups } from '../hooks/useKongData'

// Plugin name → colour
const PLUGIN_COLORS: Record<string, string> = {
  'acl':              'bg-amber-100 text-amber-700',
  'key-auth':         'bg-blue-100 text-blue-700',
  'oauth2':           'bg-indigo-100 text-indigo-700',
  'jwt':              'bg-purple-100 text-purple-700',
  'rate-limiting':    'bg-orange-100 text-orange-700',
  'request-transformer': 'bg-teal-100 text-teal-700',
  'response-transformer': 'bg-teal-100 text-teal-700',
  'cors':             'bg-green-100 text-green-700',
  'ip-restriction':   'bg-red-100 text-red-700',
  'bot-detection':    'bg-red-100 text-red-700',
}

export function RoleExplorerPage() {
  const [search, setSearch] = useState('')
  const [systemFilter, setSystemFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'roles' | 'plugins' | 'groups'>('roles')

  // Live Kong data
  const kongRoles = useKongRoles()
  const kongPlugins = useKongPlugins()
  const kongGroups = useKongConsumerGroups()

  const allRoles: Role[] = kongRoles.isLive
    ? [...kongRoles.data, ...mockRoles.filter(r => r.system !== 'kong')]
    : mockRoles

  const filteredRoles = allRoles.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesSystem = systemFilter === 'all' || r.system === systemFilter
    return matchesSearch && matchesSystem
  })

  const filteredPlugins = kongPlugins.data.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredGroups = kongGroups.data.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  // ─── Role columns ───────────────────────────────────────────────────────────

  const roleColumns: ColumnDef<Role>[] = [
    {
      key: 'name',
      header: 'Role / ACL Group',
      render: row => (
        <div className="flex items-center gap-2">
          {row.isHighPrivilege && <span title="High-privilege" className="text-purple-600">🔐</span>}
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      ),
      sortable: true,
      getValue: row => row.name,
    },
    {
      key: 'system',
      header: 'System',
      render: row => (
        <span className="text-[10px] font-medium text-white px-1.5 py-0.5 rounded-full"
          style={{ background: SYSTEM_COLORS[row.system] ?? '#6366f1' }}>
          {SYSTEM_LABELS[row.system] ?? row.system}
        </span>
      ),
      sortable: true,
      getValue: row => row.system,
    },
    {
      key: 'privilegeLevel',
      header: 'Privilege',
      render: row => <Badge value={row.privilegeLevel} variant="privilege" />,
      sortable: true,
      getValue: row => row.privilegeLevel,
    },
    {
      key: 'owner',
      header: 'Owner',
      render: row => row.owner
        ? <span className="text-sm text-gray-700">{row.owner}</span>
        : <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium" data-testid="unowned-indicator"><span>⚠️</span> Unowned</span>,
      sortable: true,
      getValue: row => row.owner ?? '',
    },
    {
      key: 'assignmentCount',
      header: 'Assignments',
      render: row => <span className="text-sm text-gray-700">{row.assignmentCount}</span>,
      sortable: true,
      getValue: row => row.assignmentCount,
    },
    {
      key: 'environment',
      header: 'Environment',
      render: row => <span className="text-xs text-gray-500 capitalize">{row.environment}</span>,
      sortable: true,
      getValue: row => row.environment,
    },
    {
      key: 'sodConflicts',
      header: 'SoD',
      render: row => row.sodConflicts.length > 0
        ? <span className="text-xs text-red-600 font-medium">⚠️ {row.sodConflicts.length} conflict{row.sodConflicts.length > 1 ? 's' : ''}</span>
        : <span className="text-xs text-green-600">✓ None</span>,
    },
  ]

  function roleExpandedRow(row: Role) {
    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-400 mb-1">ACL Group</div>
          <div className="font-mono text-gray-700">{row.aclGroup}</div>
        </div>
        {row.description && (
          <div>
            <div className="text-xs text-gray-400 mb-1">Description</div>
            <div className="text-gray-600 text-xs">{row.description}</div>
          </div>
        )}
        {row.sodConflicts.length > 0 && (
          <div className="col-span-2">
            <div className="text-xs text-gray-400 mb-1">SoD Conflicts</div>
            <ul className="space-y-1">
              {row.sodConflicts.map(c => (
                <li key={c.id} className="text-red-700 text-xs">
                  ⚠️ {c.classification} (roles {c.roleA} ↔ {c.roleB})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // ─── Plugin columns ─────────────────────────────────────────────────────────

  type PluginRow = typeof kongPlugins.data[number]

  const pluginColumns: ColumnDef<PluginRow>[] = [
    {
      key: 'name',
      header: 'Plugin',
      render: row => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLUGIN_COLORS[row.name] ?? 'bg-gray-100 text-gray-700'}`}>
          {row.name}
        </span>
      ),
      sortable: true,
      getValue: row => row.name,
    },
    {
      key: 'enabled',
      header: 'Status',
      render: row => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.enabled ? '● Active' : '○ Disabled'}
        </span>
      ),
      sortable: true,
      getValue: row => row.enabled ? 'active' : 'disabled',
    },
    {
      key: 'scope',
      header: 'Scope',
      render: row => (
        <span className="text-xs text-gray-600">
          {row.service ? `Service: ${row.service.id.slice(0, 8)}…` :
           row.route ? `Route: ${row.route.id.slice(0, 8)}…` :
           row.consumer ? `Consumer: ${row.consumer.id.slice(0, 8)}…` :
           'Global'}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Plugin ID',
      render: row => <span className="font-mono text-xs text-gray-400">{row.id.slice(0, 12)}…</span>,
    },
  ]

  // ─── Consumer Group columns ─────────────────────────────────────────────────

  type GroupRow = typeof kongGroups.data[number]

  const groupColumns: ColumnDef<GroupRow>[] = [
    {
      key: 'name',
      header: 'Group Name',
      render: row => (
        <div className="flex items-center gap-2">
          <span className="text-amber-500">👥</span>
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      ),
      sortable: true,
      getValue: row => row.name,
    },
    {
      key: 'id',
      header: 'Group ID',
      render: row => <span className="font-mono text-xs text-gray-400">{row.id.slice(0, 16)}…</span>,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: row => (
        <span className="text-xs text-gray-500">
          {new Date(row.created_at * 1000).toLocaleDateString()}
        </span>
      ),
      sortable: true,
      getValue: row => row.created_at,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: row => row.tags?.length
        ? <div className="flex gap-1 flex-wrap">{row.tags.map(t => <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>)}</div>
        : <span className="text-xs text-gray-300">—</span>,
    },
  ]

  const tabs = [
    { id: 'roles' as const,   label: 'Roles / ACL Groups', count: filteredRoles.length,  icon: '🔑' },
    { id: 'plugins' as const, label: 'Plugins',            count: filteredPlugins.length, icon: '🔌', liveOnly: true },
    { id: 'groups' as const,  label: 'Consumer Groups',    count: filteredGroups.length,  icon: '👥', liveOnly: true },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Explorer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Roles, ACL groups, plugins and consumer groups from connected systems
          </p>
        </div>
        <LiveDataBadge
          isLive={kongRoles.isLive}
          isLoading={kongRoles.state === 'loading'}
          error={kongRoles.error}
          onRefetch={kongRoles.refetch}
        />
      </div>

      {/* Search + system filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {activeTab === 'roles' && (
          <select
            value={systemFilter}
            onChange={e => setSystemFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Systems</option>
            <option value="kong">Kong API GW</option>
            <option value="azure-ad">Azure AD</option>
            <option value="sap-btp">SAP BTP</option>
            <option value="ado-pipelines">ADO Pipelines</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(tab => {
          const disabled = tab.liveOnly && !kongRoles.isLive
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-700'
                  : disabled
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
              {tab.liveOnly && !kongRoles.isLive && (
                <span className="text-[10px] text-gray-300">live only</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'roles' && (
        <DataTable
          columns={roleColumns}
          data={filteredRoles}
          rowKey={r => r.id}
          expandedRowRender={roleExpandedRow}
          emptyMessage="No roles match your search."
        />
      )}

      {activeTab === 'plugins' && kongRoles.isLive && (
        kongPlugins.state === 'loading' ? (
          <div className="text-center py-12 text-gray-400">Loading plugins…</div>
        ) : filteredPlugins.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No plugins found.</div>
        ) : (
          <DataTable
            columns={pluginColumns}
            data={filteredPlugins}
            rowKey={r => r.id}
            emptyMessage="No plugins found."
          />
        )
      )}

      {activeTab === 'groups' && kongRoles.isLive && (
        kongGroups.state === 'loading' ? (
          <div className="text-center py-12 text-gray-400">Loading consumer groups…</div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No consumer groups found.
            <div className="text-xs mt-1 text-gray-300">Consumer Groups require Kong Gateway 3.x+</div>
          </div>
        ) : (
          <DataTable
            columns={groupColumns}
            data={filteredGroups}
            rowKey={r => r.id}
            emptyMessage="No consumer groups found."
          />
        )
      )}
    </div>
  )
}
