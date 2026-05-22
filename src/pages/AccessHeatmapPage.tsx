import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockEnterpriseUsers } from '../mock/mockEnterpriseUsers'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import type { SystemType, EnvironmentType } from '../types/domain'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'

const SYSTEMS: SystemType[] = ['kong', 'azure-ad', 'sap-btp', 'ado-pipelines']
const ENVS: EnvironmentType[] = ['production', 'staging', 'development']

type CellStatus = 'admin' | 'write' | 'read' | 'none' | 'orphaned'

interface CellData {
  status: CellStatus
  roleCount: number
  hasHighPriv: boolean
  hasSod: boolean
  isExpiring: boolean
}

function getCell(userId: string, system: SystemType, env: EnvironmentType): CellData {
  const assignments = mockRoleAssignments.filter(a =>
    a.principalId === userId &&
    a.role.system === system &&
    a.role.environment === env &&
    a.isActive
  )
  if (assignments.length === 0) return { status: 'none', roleCount: 0, hasHighPriv: false, hasSod: false, isExpiring: false }

  const user = mockEnterpriseUsers.find(u => u.id === userId)
  const isOrphaned = user && (user.status === 'inactive' || user.status === 'suspended')

  const hasHighPriv = assignments.some(a => a.role.isHighPrivilege)
  const hasSod = assignments.some(a => a.role.sodConflicts.length > 0)
  const isExpiring = assignments.some(a => a.expiresAt)

  let status: CellStatus = 'read'
  if (isOrphaned) status = 'orphaned'
  else if (hasHighPriv || assignments.some(a => a.role.privilegeLevel === 'high-privilege')) status = 'admin'
  else if (assignments.some(a => a.role.privilegeLevel === 'elevated')) status = 'write'

  return { status, roleCount: assignments.length, hasHighPriv, hasSod, isExpiring }
}

function Cell({ data, onClick }: { data: CellData; onClick: () => void }) {
  if (data.status === 'none') {
    return <div className="w-10 h-8 rounded bg-gray-50 border border-gray-100" />
  }

  const bg = {
    admin:    'bg-purple-100 border-purple-300',
    write:    'bg-blue-100 border-blue-300',
    read:     'bg-green-100 border-green-300',
    orphaned: 'bg-red-100 border-red-400',
    none:     'bg-gray-50 border-gray-100',
  }[data.status]

  const icon = {
    admin:    '🔐',
    write:    '✏️',
    read:     '👁',
    orphaned: '🚨',
    none:     '',
  }[data.status]

  return (
    <button
      onClick={onClick}
      title={`${data.roleCount} role${data.roleCount > 1 ? 's' : ''}${data.hasSod ? ' · SoD conflict' : ''}${data.isExpiring ? ' · Expiring' : ''}`}
      className={`w-10 h-8 rounded border text-xs flex items-center justify-center relative hover:opacity-80 transition-opacity ${bg}`}
    >
      <span className="text-[10px]">{icon}</span>
      {data.hasSod && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
      {data.isExpiring && !data.hasSod && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />}
    </button>
  )
}

export function AccessHeatmapPage() {
  const navigate = useNavigate()
  const [filterDept, setFilterDept] = useState('all')
  const [filterUserType, setFilterUserType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const departments = useMemo(() => ['all', ...Array.from(new Set(mockEnterpriseUsers.map(u => u.department)))], [])

  const filteredUsers = useMemo(() => mockEnterpriseUsers.filter(u => {
    if (filterDept !== 'all' && u.department !== filterDept) return false
    if (filterUserType !== 'all' && u.userType !== filterUserType) return false
    if (filterStatus !== 'all' && u.status !== filterStatus) return false
    return true
  }), [filterDept, filterUserType, filterStatus])

  // Stats
  const orphanedCount = mockEnterpriseUsers.filter(u =>
    (u.status === 'inactive' || u.status === 'suspended') &&
    mockRoleAssignments.some(a => a.principalId === u.id && a.isActive)
  ).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Heatmap</h1>
        <p className="text-sm text-gray-500 mt-1">Cross-application access matrix — user × system × environment</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {[
          { color: 'bg-purple-100 border-purple-300', icon: '🔐', label: 'High-Privilege / Admin' },
          { color: 'bg-blue-100 border-blue-300',   icon: '✏️', label: 'Elevated / Write' },
          { color: 'bg-green-100 border-green-300',  icon: '👁',  label: 'Standard / Read' },
          { color: 'bg-red-100 border-red-400',      icon: '🚨', label: 'Orphaned (inactive user)' },
          { color: 'bg-gray-50 border-gray-100',     icon: '',   label: 'No access' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-5 h-4 rounded border ${l.color} flex items-center justify-center text-[9px]`}>{l.icon}</div>
            <span className="text-gray-600">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-gray-600">SoD conflict</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-orange-400 rounded-full" />
          <span className="text-gray-600">Expiring access</span>
        </div>
      </div>

      {orphanedCount > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
          🚨 <strong>{orphanedCount} orphaned account{orphanedCount > 1 ? 's' : ''}</strong> detected — inactive/suspended users with active role assignments
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
        <select value={filterUserType} onChange={e => setFilterUserType(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All User Types</option>
          <option value="employee">Employees</option>
          <option value="contractor">Contractors</option>
          <option value="partner">Partners</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <span className="text-xs text-gray-400 self-center">{filteredUsers.length} users</span>
      </div>

      {/* Heatmap table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-gray-500 font-semibold border-b border-r border-gray-200 min-w-[200px]">
                User
              </th>
              {SYSTEMS.map(sys => (
                <th key={sys} colSpan={ENVS.length}
                  className="px-2 py-2 text-center border-b border-r border-gray-200 font-semibold"
                  style={{ color: SYSTEM_COLORS[sys] }}>
                  {SYSTEM_LABELS[sys]}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 bg-gray-50 z-10 px-4 py-2 border-b border-r border-gray-200" />
              {SYSTEMS.map(sys =>
                ENVS.map(env => (
                  <th key={`${sys}-${env}`} className="px-1 py-1.5 text-center text-gray-400 font-normal border-b border-gray-100 capitalize min-w-[44px]">
                    {env.slice(0, 3)}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, i) => (
              <tr key={user.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="sticky left-0 bg-inherit z-10 px-4 py-2 border-r border-gray-200">
                  <button
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="flex items-center gap-2 hover:text-indigo-600 transition-colors text-left"
                  >
                    <span>{user.userType === 'contractor' ? '🔧' : user.userType === 'partner' ? '🤝' : '👤'}</span>
                    <div>
                      <div className="font-medium text-gray-900 text-xs">{user.displayName}</div>
                      <div className="text-[10px] text-gray-400">{user.department}</div>
                    </div>
                    {(user.status === 'inactive' || user.status === 'suspended') && (
                      <span className={`text-[9px] px-1 rounded ${user.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                        {user.status}
                      </span>
                    )}
                    {user.riskScore !== undefined && (
                      <span className={`text-[9px] px-1 rounded font-bold ${
                        user.riskScore >= 80 ? 'bg-red-100 text-red-700' :
                        user.riskScore >= 50 ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        R{user.riskScore}
                      </span>
                    )}
                  </button>
                </td>
                {SYSTEMS.map(sys =>
                  ENVS.map(env => {
                    const cell = getCell(user.id, sys, env)
                    return (
                      <td key={`${sys}-${env}`} className="px-1 py-1.5 text-center">
                        <Cell data={cell} onClick={() => navigate(`/users/${user.id}`)} />
                      </td>
                    )
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
