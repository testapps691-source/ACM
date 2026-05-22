import type { ApprovalRequest } from '../types/domain'

export function applyApprovalDecision(
  requests: ApprovalRequest[],
  id: string,
  decision: 'approved' | 'rejected',
  currentUser: string,
  reason?: string
): ApprovalRequest[] {
  return requests.map(r => {
    if (r.id !== id) return r
    if (r.status !== 'pending') throw new Error(`Request ${id} is not pending`)
    if (r.requester === currentUser) throw new Error('Self-approval is not permitted')
    return {
      ...r,
      status: decision,
      approvers: [
        ...r.approvers,
        {
          approver: currentUser,
          decision,
          reason,
          decidedAt: new Date().toISOString(),
        },
      ],
    }
  })
}
