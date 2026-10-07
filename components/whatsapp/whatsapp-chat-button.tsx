'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { Button } from '@/components/ui/button'
import { openWhatsAppChat } from '@/lib/whatsapp/actions'

/**
 * Opens the CRM WhatsApp chat with this person on the caller's own connected
 * number. Without a connected number it offers to connect one, or to fall
 * back to the WhatsApp app via wa.me.
 */
export function WhatsAppChatButton({
  phone,
  name,
  leadId,
  customerId,
  variant = 'outline',
}: {
  phone: string | null | undefined
  name: string
  leadId?: string
  customerId?: string
  variant?: 'outline' | 'ghost'
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!phone || busy) return
    setBusy(true)
    const res = await openWhatsAppChat({ phone, name, leadId: leadId ?? null, customerId: customerId ?? null })
    setBusy(false)
    if (res.ok) {
      router.push(`/whatsapp?c=${res.conversationId}`)
      return
    }
    if ('notConnected' in res) {
      toast.message('Your WhatsApp isn’t connected to the CRM yet.', {
        action: { label: 'Connect', onClick: () => router.push('/settings?tab=whatsapp') },
        cancel: {
          label: 'Open WhatsApp',
          onClick: () => window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer'),
        },
      })
      return
    }
    toast.error(res.message)
  }

  return (
    <Button variant={variant} size="icon-sm" disabled={!phone || busy} aria-label={`WhatsApp ${name}`} onClick={handleClick}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <WhatsAppIcon className="size-3.5" />}
    </Button>
  )
}
