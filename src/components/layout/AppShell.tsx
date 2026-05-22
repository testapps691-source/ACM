import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { usePersona, PERSONAS, type PersonaId } from '../../utils/personaContext'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard',   label: 'Dashboard',          icon: '📊', minPersona: 'all' },
      { to: '/heatmap',     label: 'Access Heatmap',     icon: '🔥', minPersona: 'canViewAllUsers' },
      { to: '/risk',        label: 'Risk Scores',        icon: '🎯', minPersona: 'canViewAllUsers' },
    ],
  },
  {
    label: 'Access Management',
    items: [
      { to: '/approvals',   label: 'Approval Queue',     icon: '✅', minPersona: 'all' },
      { to: '/jit',         label: 'JIT Access',         icon: '⏱',  minPersona: 'all' },
      { to: '/review',      label: 'Access Reviews',     icon: '🔄', minPersona: 'canApprove' },
    ],
  },
  {
    label: 'Identity',
    items: [
      { to: '/users',       label: 'User Profiles',      icon: '👤', minPersona: 'all' },
      { to: '/roles',       label: 'Role Explorer',      icon: '🔑', minPersona: 'all' },
      { to: '/lifecycle',   label: 'Role Lifecycle',     icon: '📈', minPersona: 'all' },
      { to: '/graph',       label: 'Access Graph',       icon: '🕸️', minPersona: 'canViewAllUsers' },
    ],
  },
  {
    label: 'Governance',
    items: [
      { to: '/reports',     label: 'Compliance Reports', icon: '📑', minPersona: 'canViewReports' },
      { to: '/connectors',  label: 'Connectors',         icon: '🔌', minPersona: 'canManageConnectors' },
      { to: '/config',      label: 'App Config',         icon: '⚙️', minPersona: 'canManageConnectors' },
      { to: '/audit',       label: 'Audit Log',          icon: '📋', minPersona: 'canExportAudit' },
    ],
  },
]

function PersonaSwitcher() {
  const { persona, setPersonaId } = usePersona()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <span className="text-lg">{persona.icon}</span>
        <div className="flex-1 text-left overflow-hidden">
          <div className="text-white text-xs font-medium truncate">{persona.name}</div>
          <div className="text-gray-400 text-[10px]">Click to switch persona</div>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-700 text-xs text-gray-400 font-medium uppercase">
            Switch Persona
          </div>
          {(Object.values(PERSONAS)).map(p => (
            <button
              key={p.id}
              onClick={() => { setPersonaId(p.id as PersonaId); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-700 transition-colors ${
                persona.id === p.id ? 'bg-indigo-900/50' : ''
              }`}
            >
              <span className="text-base">{p.icon}</span>
              <div>
                <div className="text-white text-xs font-medium">{p.name}</div>
                <div className="text-gray-400 text-[10px]">{p.description}</div>
              </div>
              {persona.id === p.id && <span className="ml-auto text-indigo-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppShell() {
  const { persona } = usePersona()

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col flex-shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="text-white font-bold text-sm leading-tight">ACMP</div>
              <div className="text-gray-400 text-xs">Access Control Platform</div>
            </div>
          </div>
        </div>

        {/* Persona banner */}
        <div className={`mx-3 mt-3 px-2 py-1.5 rounded-lg text-xs font-medium text-center ${persona.color}`}>
          {persona.icon} {persona.name}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-3 space-y-4">
          {navGroups.map(group => {
            const visibleItems = group.items.filter(item => {
              if (item.minPersona === 'all') return true
              if (item.minPersona === 'canViewAllUsers') return persona.canViewAllUsers
              if (item.minPersona === 'canApprove') return persona.canApprove
              if (item.minPersona === 'canViewReports') return persona.canViewReports
              if (item.minPersona === 'canManageConnectors') return persona.canManageConnectors
              if (item.minPersona === 'canExportAudit') return persona.canExportAudit
              return true
            })
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider px-3 mb-1">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Persona switcher */}
        <div className="px-3 py-3 border-t border-gray-700 flex-shrink-0">
          <PersonaSwitcher />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">Access Control Management Platform</div>
            {!persona.canApprove && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">
                Read-only mode ({persona.name})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Environment:</span>
            <select className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Production</option>
              <option>Staging</option>
              <option>Development</option>
            </select>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
