import { ApprovalsList } from '@/components/approvals/approvals-list'
import { getApprovalsData } from '@/lib/approvals/get-approvals-data'

export default async function ApprovalsPage() {
  const data = await getApprovalsData()

  if (!data) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
        Could not load your account.
      </div>
    )
  }

  if (data.role !== 'admin' && data.role !== 'super_admin') {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
        Only admins can view login approvals.
      </div>
    )
  }

  return <ApprovalsList initialPending={data.pending} initialDecided={data.decided} />
}
