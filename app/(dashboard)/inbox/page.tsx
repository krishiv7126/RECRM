import type { Metadata } from 'next'
import { InboxView } from '@/components/inbox/inbox-view'
import { getInboxData } from '@/lib/inbox/get-inbox-data'

export const metadata: Metadata = { title: 'Inbox' }

export default async function InboxPage() {
  const { me, conversations, teammates } = await getInboxData()

  if (!me) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
        Could not load your account.
      </div>
    )
  }

  return <InboxView me={me} initialConversations={conversations} teammates={teammates} />
}
