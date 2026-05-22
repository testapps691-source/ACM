import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { ApprovalRequest, RequestStatus } from '../types/domain'
import { mockApprovalRequests } from '../mock/mockApprovalRequests'
import { mockPolicyEvaluations } from '../mock/mockPolicyEvaluations'
import { mockCurrentUser } from '../mock/mockConfig'
import { applyApprovalDecision } from '../utils/approvalTransitions'
import { classifyWorkflowTemplate, WORKFLOW_TEMPLATES } from '../utils/workflowTemplates'
import { DataTable, type ColumnDef } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Drawer } from '../components/ui/Drawer'
import { RequestDetailDrawer } from '../components/approvals/RequestDetailDrawer'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'

const TABS: { key: RequestStatus | 'escalated'; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'escalated', label: 'Escalated' },
]

export function ApprovalQueuePage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<ApprovalRequest[]>(() =>
    mockApprovalRequests.map(r => ({
      ...r,
      policyEvaluation: mockPolicyEvaluations[r.id],
    }))
  )
  const [activeTab, setActiveTab] = useState<RequestStatus | 'escalated'>('pending')

  const selectedRequest = requestId ? requests.find(r => r.id === requestId) ?? null : null

  function openRequest(r: ApprovalRequest) {
    navigate(`/approvals/${r.id}`)
  }

  function closeDrawer() {
    navigate('/approvals')
  }

  function handleApprove(id: string) {
    setRequests(prev => applyApprovalDecision(prev, id, 'approved', mockCurrentUser.username))
    closeDrawer()
  }

  function handleReject(id: string, reason: string) {
    setRequests(prev => applyApprovalDecision(prev, id, 'rejected', mockCurrentUser.username, reason))
    closeDrawer()
  }

  const tabRequests = requests.filter(r => r.status === activeTab)

  const columns: ColumnDef<ApprovalRequest>[] = [
    {
      key: 'principal',
      header: 'Principal',
      render: row => (
        <div className="flex items-center gap-1.5">
          <span>{row.principalType === 'enterprise-user' ? '👤' : '🤖'}</span>
          <span className="font-medium text-gray-900">
            {row.enterpriseUser?.displayName ?? row.consumer?.username ?? row.principalId}
          </span>
        </div>
      ),
      sortable: true,
      getValue: row => row.enterpriseUser?.displayName ?? row.consumer?.username ?? '',
    },
    {
      key: 'role',
      header: 'Role',
      render: row => (
        <div className="flex items-center gap-1.5">
          {row.role.isHighPrivilege && <span title="High-privilege">🔐</span>}
          <span>{row.role.name}</span>
        </div>
      ),
      sortable: true,
      getValue: row => row.role.name,
    },
    {
      key: 'system',
      header: 'System',
      render: row => (
        <span className="text-xs font-medium text-white px-2 py-0.5 rounded-full"
          style={{ background: SYSTEM_COLORS[row.role.system] }}>
          {SYSTEM_LABELS[row.role.system]}
        </span>
      ),
    },
    {
      key: 'requestType',
      header: 'Type',
      render: row => <Badge value={row.requestType} variant="requestType" />,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: row => <Badge value={row.severity} variant="severity" />,
      sortable: true,
      getValue: row => row.severity,
    },
    {
      key: 'workflow',
      header: 'Workflow',
      render: row => {
        const tmpl = WORKFLOW_TEMPLATES[classifyWorkflowTemplate(row)]
        return (
          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${tmpl.color}`}>
            {tmpl.icon} {tmpl.badge}
          </span>
        )
      },
    },
    {
      key: 'policy',
      header: 'Policy Decision',
      render: row => {
        const pe = row.policyEvaluation
        if (!pe) return <span className="text-gray-300 text-xs">—</span>
        const styles = {
          AUTO_APPROVE:    'bg-green-100 text-green-800',
          MANUAL_APPROVAL: 'bg-yellow-100 text-yellow-800',
          DENY:            'bg-red-100 text-red-800',
        }[pe.decision] ?? 'bg-gray-100 text-gray-700'
        const icons = { AUTO_APPROVE: '🤖', MANUAL_APPROVAL: '👤', DENY: '🚫' }
        return (
          <div className="flex items-center gap-1.5">
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${styles}`}>
              {icons[pe.decision as keyof typeof icons]} {pe.decision.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs font-bold ${pe.riskScore >= 80 ? 'text-red-600' : pe.riskScore >= 50 ? 'text-orange-500' : 'text-green-600'}`}>
              {pe.riskScore}
            </span>
          </div>
        )
      },
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: row => <span className="text-xs text-gray-500">{row.submittedAt.split('T')[0]}</span>,
      sortable: true,
      getValue: row => row.submittedAt,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => (
        <div className="flex items-center gap-1.5">
          <Badge value={row.status} variant="status" />
          {row.status === 'escalated' && (
            <span title="Escalated" className="text-orange-500 text-xs">⬆️</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review and action pending role assignment requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(tab => {
          const count = requests.filter(r => r.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={tabRequests}
        rowKey={r => r.id}
        onRowClick={openRequest}
        emptyMessage={`No ${activeTab} requests.`}
      />

      <Drawer
        open={!!selectedRequest}
        onClose={closeDrawer}
        title="Request Details"
      >
        {selectedRequest && (
          <RequestDetailDrawer
            request={selectedRequest}
            currentUser={mockCurrentUser.username}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </Drawer>
    </div>
  )
}
