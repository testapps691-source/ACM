import { useState, useEffect } from 'react'
import { mockJitRequests } from '../mock/mockJitRequests'
import { mockRoles } from '../mock/mockRoles'
import type { JitRequest } from '../types/domain'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'
import { Spinner } from '../components/ui/Spinner'

// ─── Countdown timer ──────────────────────────────────────────────────────────

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h}h ${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isUrgent = new Date(expiresAt).getTime() - Date.now() < 30 * 60000
  return (
    <span className={`font-mono text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
      {remaining}
    </span>
  )
}

// ─── Policy decision badge ────────────────────────────────────────────────────

function PolicyBadge({ decision }: { decision: string }) {
  const styles = {
    AUTO_APPROVE:     'bg-green-100 text-green-800 border-green-200',
    MANUAL_APPROVAL:  'bg-yellow-100 text-yellow-800 border-yellow-200',
    DENY:             'bg-red-100 text-red-800 border-red-200',
  }[decision] ?? 'bg-gray-100 text-gray-700'

  const icons = { AUTO_APPROVE: '🤖', MANUAL_APPROVAL: '👤', DENY: '🚫' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${styles}`}>
      {icons[decision as keyof typeof icons]} {decision.replace(/_/g, ' ')}
    </span>
  )
}

// ─── JIT Request card ─────────────────────────────────────────────────────────

function JitCard({ req }: { req: JitRequest }) {
  const [showPolicy, setShowPolicy] = useState(false)
  const principalName = req.enterpriseUser?.displayName ?? req.consumer?.username ?? req.principalId

  const statusColors = {
    active:  'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    expired: 'bg-gray-100 text-gray-600 border-gray-200',
    rejected:'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${req.status === 'active' ? 'border-green-200' : req.status === 'pending' ? 'border-yellow-200' : 'border-gray-200'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">{principalName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[req.status]}`}>
                {req.status === 'active' ? '🟢' : req.status === 'pending' ? '⏳' : req.status === 'expired' ? '⌛' : '❌'} {req.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white px-2 py-0.5 rounded-full"
                style={{ background: SYSTEM_COLORS[req.role.system] }}>
                {SYSTEM_LABELS[req.role.system]}
              </span>
              <span className="text-xs text-gray-600 font-medium">{req.role.name}</span>
              {req.role.isHighPrivilege && <span title="High-privilege">🔐</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-0.5">Duration</div>
            <div className="text-sm font-bold text-gray-800">{req.durationHours}h</div>
          </div>
        </div>

        {/* Active countdown */}
        {req.status === 'active' && req.expiresAt && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
            <span className="text-xs text-orange-700 font-medium">⏱ Time remaining</span>
            <Countdown expiresAt={req.expiresAt} />
          </div>
        )}

        <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded-lg">
          <span className="text-gray-400">Justification: </span>{req.justification}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Requested by {req.requester}</span>
          <span>{req.submittedAt.split('T')[0]}</span>
        </div>

        {/* Policy evaluation */}
        {req.policyEvaluation && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <PolicyBadge decision={req.policyEvaluation.decision} />
              <button onClick={() => setShowPolicy(v => !v)} className="text-xs text-indigo-600 hover:text-indigo-800">
                {showPolicy ? '▲ Hide' : '▼ Policy details'}
              </button>
            </div>
            {showPolicy && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Risk Score</span>
                  <span className={`font-bold ${req.policyEvaluation.riskScore >= 80 ? 'text-red-600' : req.policyEvaluation.riskScore >= 50 ? 'text-orange-500' : 'text-green-600'}`}>
                    {req.policyEvaluation.riskScore}
                  </span>
                </div>
                {req.policyEvaluation.appliedPolicy && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Policy</span>
                    <span className="font-mono text-indigo-700">{req.policyEvaluation.appliedPolicy}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  <div className="text-gray-400 mb-1">Reasons:</div>
                  <ul className="space-y-0.5">
                    {req.policyEvaluation.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-gray-300 mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {req.status === 'pending' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <button className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium">
              ✓ Approve JIT
            </button>
            <button className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 font-medium">
              ✗ Reject
            </button>
          </div>
        )}
        {req.status === 'active' && (
          <button
            onClick={() => alert(`JIT access for ${principalName} has been revoked early. The connector will remove access within 60 seconds.`)}
            className="w-full mt-3 pt-3 border-t border-gray-100 text-xs text-red-600 hover:text-red-800 font-medium">
            🚫 Revoke Early
          </button>
        )}
      </div>
    </div>
  )
}

// ─── New JIT Request form ─────────────────────────────────────────────────────

function NewJitForm({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState('')
  const [duration, setDuration] = useState('4')
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const highPrivRoles = mockRoles.filter(r => r.isHighPrivilege || r.privilegeLevel === 'elevated')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setSubmitted(true) }, 1200)
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✅</div>
        <div className="font-semibold text-gray-900 mb-1">JIT Request Submitted</div>
        <div className="text-sm text-gray-500 mb-4">Your request is being evaluated by the policy engine.</div>
        <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
          Close
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
        <select required value={role} onChange={e => setRole(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Select a role...</option>
          {highPrivRoles.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({SYSTEM_LABELS[r.system]})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
        <div className="flex gap-2">
          {['1', '2', '4', '8'].map(h => (
            <button key={h} type="button" onClick={() => setDuration(h)}
              className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                duration === h ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {h}h
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Justification <span className="text-red-500">*</span></label>
        <textarea required value={justification} onChange={e => setJustification(e.target.value)}
          rows={3} placeholder="Explain why you need this temporary access..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        🤖 The policy engine will evaluate your request automatically. Low-risk requests may be auto-approved. High-privilege requests require manual approval.
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
          {submitting && <Spinner size="sm" />}
          Submit JIT Request
        </button>
        <button type="button" onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function JitAccessPage() {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'expired' | 'rejected'>('all')

  const filtered = mockJitRequests.filter(r => filter === 'all' || r.status === filter)

  const counts = {
    active:   mockJitRequests.filter(r => r.status === 'active').length,
    pending:  mockJitRequests.filter(r => r.status === 'pending').length,
    expired:  mockJitRequests.filter(r => r.status === 'expired').length,
    rejected: mockJitRequests.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">JIT Access</h1>
          <p className="text-sm text-gray-500 mt-1">Just-In-Time temporary access — time-bound, auto-expiring, policy-evaluated</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium">
          + Request JIT Access
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active JIT Sessions', value: counts.active, color: 'text-green-600' },
          { label: 'Pending Approval', value: counts.pending, color: 'text-yellow-600' },
          { label: 'Expired Today', value: counts.expired, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-center shadow-sm">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['all', 'active', 'pending', 'expired', 'rejected'] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              filter === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
            {tab !== 'all' && counts[tab] > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${filter === tab ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* JIT cards */}
      {showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New JIT Access Request</h2>
          <NewJitForm onClose={() => setShowForm(false)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">⏱</div>
              <div>No {filter === 'all' ? '' : filter} JIT requests.</div>
            </div>
          ) : (
            filtered.map(req => <JitCard key={req.id} req={req} />)
          )}
        </div>
      )}
    </div>
  )
}
