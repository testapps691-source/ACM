import type { ApprovalRequest } from '../../types/domain'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { useState } from 'react'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../../utils/buildGraphData'
import { classifyWorkflowTemplate, WORKFLOW_TEMPLATES, getApproverChain } from '../../utils/workflowTemplates'

interface RequestDetailDrawerProps {
  request: ApprovalRequest
  currentUser: string
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
}

export function RequestDetailDrawer({ request, currentUser, onApprove, onReject }: RequestDetailDrawerProps) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const isSelfApproval = request.requester === currentUser
  const isPending = request.status === 'pending'

  // Resolve principal display values safely
  const principalName = request.enterpriseUser?.displayName ?? request.consumer?.username ?? request.principalId
  const principalSub  = request.enterpriseUser
    ? `${request.enterpriseUser.jobTitle} · ${request.enterpriseUser.department}`
    : request.consumer?.system ?? ''
  const environment   = request.consumer?.environment ?? request.enterpriseUser?.environment ?? '—'
  const principalIcon = request.principalType === 'enterprise-user' ? '👤' : '🤖'

  function handleReject() {
    if (!rejectReason.trim()) return
    onReject(request.id, rejectReason)
    setShowRejectModal(false)
    setRejectReason('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Request ID</div>
          <div className="font-mono text-sm text-gray-700">{request.id}</div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Badge value={request.status} variant="status" />
          <Badge value={request.requestType} variant="requestType" />
        </div>
      </div>

      {/* High-privilege dual-approver notice */}
      {request.role.isHighPrivilege && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2" data-testid="dual-approver-indicator">
          <span className="text-purple-600 mt-0.5">🔐</span>
          <div className="text-sm text-purple-800">
            <strong>Dual approval required</strong> — this role is classified as high-privilege and requires a minimum of two independent approvers.
          </div>
        </div>
      )}

      {/* Escalation notice */}
      {request.status === 'escalated' && request.escalatedAt && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800" data-testid="escalation-badge">
          ⬆️ Escalated on {request.escalatedAt.split('T')[0]} — pending review by next-level approver.
        </div>
      )}

      {/* SoD conflicts */}
      {request.sodConflicts.length > 0 ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-xs font-semibold text-red-700 uppercase mb-2">SoD Conflicts Detected</div>
          <ul className="space-y-1">
            {request.sodConflicts.map(c => (
              <li key={c.id} className="text-sm text-red-700">
                ⚠️ <strong>{c.classification}</strong> — roles {c.roleA} and {c.roleB}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
          ✅ No SoD conflicts detected
        </div>
      )}

      {/* Workflow template */}
      {(() => {
        const tmplId = classifyWorkflowTemplate(request)
        const tmpl = WORKFLOW_TEMPLATES[tmplId]
        const chain = getApproverChain(request)
        return (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tmpl.color}`}>
                {tmpl.icon} {tmpl.name}
              </span>
              <span className="text-xs text-gray-400">SLA: {tmpl.sla}</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">{tmpl.description}</div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-gray-400">Approver chain:</span>
              {chain.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">→</span>}
                  <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">{step}</span>
                </span>
              ))}
            </div>
            {!tmpl.autoApproveEligible && (
              <div className="mt-1.5 text-[10px] text-red-600 font-medium">⚠️ Auto-approval not eligible for this workflow</div>
            )}
          </div>
        )
      })()}

      {/* Policy evaluation */}
      {request.policyEvaluation && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Policy Engine Decision</div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {(() => {
                const pe = request.policyEvaluation!
                const styles = { AUTO_APPROVE: 'bg-green-100 text-green-800', MANUAL_APPROVAL: 'bg-yellow-100 text-yellow-800', DENY: 'bg-red-100 text-red-800' }[pe.decision] ?? 'bg-gray-100 text-gray-700'
                const icons = { AUTO_APPROVE: '🤖', MANUAL_APPROVAL: '👤', DENY: '🚫' }
                return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles}`}>{icons[pe.decision as keyof typeof icons]} {pe.decision.replace(/_/g, ' ')}</span>
              })()}
              {request.policyEvaluation.appliedPolicy && (
                <span className="text-xs font-mono text-indigo-600">{request.policyEvaluation.appliedPolicy}</span>
              )}
            </div>
            <span className={`text-sm font-bold ${request.policyEvaluation.riskScore >= 80 ? 'text-red-600' : request.policyEvaluation.riskScore >= 50 ? 'text-orange-500' : 'text-green-600'}`}>
              Risk: {request.policyEvaluation.riskScore}
            </span>
          </div>
          <ul className="space-y-0.5">
            {request.policyEvaluation.reasons.map((r, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-gray-300 mt-0.5">•</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-400 mb-1">Principal</div>
          <div className="font-medium text-gray-900 flex items-center gap-1" data-testid="consumer-identity">
            <span>{principalIcon}</span>
            <span>{principalName}</span>
          </div>
          {principalSub && <div className="text-xs text-gray-400 mt-0.5">{principalSub}</div>}
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Role</div>
          <div className="font-medium text-gray-900" data-testid="role-name">{request.role.name}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">System</div>
          <span
            className="text-xs font-medium text-white px-2 py-0.5 rounded-full"
            style={{ background: SYSTEM_COLORS[request.role.system] }}
          >
            {SYSTEM_LABELS[request.role.system]}
          </span>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Severity</div>
          <Badge value={request.severity} variant="severity" />
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Environment</div>
          <span className="capitalize text-gray-700" data-testid="environment">{environment}</span>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Privilege</div>
          <Badge value={request.role.privilegeLevel} variant="privilege" />
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Requester</div>
          <div className="text-gray-700 text-xs" data-testid="requester">{request.requester}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Submitted</div>
          <div className="text-gray-700 text-xs" data-testid="submitted-at">{request.submittedAt.replace('T', ' ').slice(0, 16)} UTC</div>
        </div>
      </div>

      {/* Justification */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Justification</div>
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200" data-testid="justification">
          {request.justification}
        </div>
      </div>

      {/* Approval history */}
      {request.approvers.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-2">Approval History</div>
          <div className="space-y-2">
            {request.approvers.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                <Badge value={d.decision} variant="status" />
                <div>
                  <div className="font-medium text-gray-800">{d.approver}</div>
                  {d.reason && <div className="text-gray-500 text-xs mt-0.5">{d.reason}</div>}
                  <div className="text-gray-400 text-xs">{d.decidedAt.split('T')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy DENY block */}
      {request.policyEvaluation?.decision === 'DENY' && request.status === 'pending' && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
          <span className="text-red-600 text-lg">🚫</span>
          <div>
            <div className="text-sm font-semibold text-red-800">Policy Engine: DENY</div>
            <div className="text-xs text-red-700 mt-0.5">
              This request has been automatically denied by the policy engine. Manual approval is not permitted. The requester has been notified.
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {isPending && request.policyEvaluation?.decision !== 'DENY' && (
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => onApprove(request.id)}
            disabled={isSelfApproval}
            title={isSelfApproval ? 'You cannot approve your own request' : 'Approve this request'}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="approve-button"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            data-testid="reject-button"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {isSelfApproval && isPending && request.policyEvaluation?.decision !== 'DENY' && (
        <p className="text-xs text-orange-600 text-center">
          You submitted this request and cannot approve it.
        </p>
      )}

      {/* Reject modal */}
      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Request">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for rejecting this request.</p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Rejection reason..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => setShowRejectModal(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
