import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WhatsAppChatsView } from '@/components/whatsapp/whatsapp-chats-view'
import { getWhatsAppChats } from '@/lib/whatsapp/get-whatsapp-chats'

export const metadata: Metadata = { title: 'WhatsApp' }

export default async function WhatsAppPage() {
  const data = await getWhatsAppChats()

  if (!data) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
        Could not load your account.
      </div>
    )
  }
  if (data.me.role === 'receptionist') redirect('/dashboard')

  return <WhatsAppChatsView data={data} />
}
