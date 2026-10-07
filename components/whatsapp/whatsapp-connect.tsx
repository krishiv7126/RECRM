'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Smartphone, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/use-confirm'
import { completeWhatsAppSignup, disconnectWhatsAppAccount } from '@/lib/whatsapp/actions'
import { cn } from '@/lib/utils'

export interface WhatsAppAccountRow {
  id: string
  platform_user_id: string
  display_phone_number: string | null
  verified_name: string | null
  quality_rating: string | null
  is_coexistence: boolean
  status: string
  connected_at: string
}

interface FacebookSdk {
  init(opts: Record<string, unknown>): void
  login(cb: (res: { authResponse?: { code?: string } | null }) => void, opts: Record<string, unknown>): void
}

declare global {
  interface Window {
    FB?: FacebookSdk
    fbAsyncInit?: () => void
  }
}

const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID
const CONFIG_ID = process.env.NEXT_PUBLIC_META_ES_CONFIG_ID

let sdkPromise: Promise<FacebookSdk> | null = null

function loadFacebookSdk(): Promise<FacebookSdk> {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB)
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: false, version: 'v23.0' })
      resolve(window.FB!)
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('Could not load Facebook. Check your connection or ad blocker.'))
    }
    document.body.appendChild(script)
  })
  return sdkPromise
}

/**
 * Meta Embedded Signup. The popup posts the WABA / phone number IDs back via
 * window.postMessage, and FB.login's callback carries a one-time code; both
 * are needed, in either order, to finish on the server.
 */
function useEmbeddedSignup(onDone: () => void) {
  const session = useRef<{ wabaId?: string; phoneNumberId?: string; code?: string; coexistence: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const finish = useCallback(async () => {
    const s = session.current
    if (!s?.code || !s.wabaId || !s.phoneNumberId) return
    session.current = null
    const result = await completeWhatsAppSignup({
      code: s.code,
      wabaId: s.wabaId,
      phoneNumberId: s.phoneNumberId,
      coexistence: s.coexistence,
    })
    setBusy(false)
    if (result.ok) {
      toast.success(result.message ?? 'WhatsApp connected.')
      onDone()
    } else {
      toast.error(result.message)
    }
  }, [onDone])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!event.origin.endsWith('facebook.com')) return
      let data
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      if (data?.type !== 'WA_EMBEDDED_SIGNUP' || !session.current) return
      if (String(data.event).startsWith('FINISH')) {
        session.current.wabaId = data.data?.waba_id
        session.current.phoneNumberId = data.data?.phone_number_id
        void finish()
      } else if (data.event === 'CANCEL' || data.event === 'ERROR') {
        const step = data.data?.current_step
        const msg = data.data?.error_message
        session.current = null
        setBusy(false)
        if (msg) toast.error(msg)
        else if (step) toast.message(`Signup closed at “${step}”.`)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [finish])

  async function start(coexistence: boolean) {
    if (!APP_ID || !CONFIG_ID) {
      toast.error('WhatsApp signup is not configured yet — ask your platform admin.')
      return
    }
    setBusy(true)
    let FB: FacebookSdk
    try {
      FB = await loadFacebookSdk()
    } catch (err) {
      setBusy(false)
      toast.error(err instanceof Error ? err.message : 'Could not load Facebook.')
      return
    }
    session.current = { coexistence }
    FB.login(
      (res) => {
        const code = res.authResponse?.code
        if (!code) {
          session.current = null
          setBusy(false)
          return
        }
        if (session.current) {
          session.current.code = code
          void finish()
        }
      },
      {
        config_id: CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          sessionInfoVersion: '3',
          ...(coexistence ? { featureType: 'whatsapp_business_app_onboarding' } : {}),
        },
      },
    )
  }

  return { start, busy }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function WhatsAppConnectPanel({
  meId,
  isAdmin,
  accounts,
  team,
}: {
  meId: string
  isAdmin: boolean
  accounts: WhatsAppAccountRow[]
  team: { id: string; full_name: string; role: string }[]
}) {
  const router = useRouter()
  const { confirm, ConfirmDialog } = useConfirm()
  const [useBusinessApp, setUseBusinessApp] = useState(true)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const refresh = useCallback(() => router.refresh(), [router])
  const { start, busy } = useEmbeddedSignup(refresh)

  const connected = accounts.filter((a) => a.status === 'connected')
  const mine = connected.find((a) => a.platform_user_id === meId) ?? null
  const byUser = new Map(connected.map((a) => [a.platform_user_id, a]))

  async function handleDisconnect(account: WhatsAppAccountRow, whose: string) {
    const ok = await confirm({
      title: 'Disconnect WhatsApp?',
      description: `${whose} will stop sending and receiving WhatsApp messages in the CRM. Existing chats are kept.`,
      confirmLabel: 'Disconnect',
      destructive: true,
    })
    if (!ok) return
    setDisconnectingId(account.id)
    const result = await disconnectWhatsAppAccount(account.id)
    setDisconnectingId(null)
    if (result.ok) toast.success(result.message ?? 'Disconnected.')
    else toast.error(result.message)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <WhatsAppIcon className="size-4" />
            </span>
            My WhatsApp
          </CardTitle>
          <CardDescription>
            Connect your own WhatsApp number to chat with your leads and members from the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {mine ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{mine.display_phone_number ?? 'Connected'}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {[mine.verified_name, mine.is_coexistence ? 'WhatsApp Business app linked' : 'API number', `since ${formatDate(mine.connected_at)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mine.quality_rating && (
                  <Badge variant="outline" className="rounded-full border-0 bg-background text-[11px]">
                    Quality: {mine.quality_rating.toLowerCase()}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disconnectingId === mine.id}
                  onClick={() => handleDisconnect(mine, 'Your number')}
                >
                  {disconnectingId === mine.id ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Unplug data-icon="inline-start" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <>
              <label className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3">
                <span className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-[13px] font-medium text-foreground">
                      I already use WhatsApp Business app on this number
                    </span>
                    <span className="block text-[12px] text-muted-foreground">
                      You’ll scan a QR code from the app and keep using WhatsApp on your phone. Turn off to connect a
                      fresh number that isn’t on WhatsApp yet.
                    </span>
                  </span>
                </span>
                <Switch checked={useBusinessApp} onCheckedChange={setUseBusinessApp} />
              </label>
              <div>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                  disabled={busy}
                  onClick={() => start(useBusinessApp)}
                >
                  {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <WhatsAppIcon className="size-4" />}
                  {busy ? 'Connecting…' : 'Connect WhatsApp'}
                </Button>
              </div>
              <p className="text-[12px] text-muted-foreground">
                A Facebook window opens — log in, pick or create your business, and confirm your number. A personal
                (non-business) WhatsApp number must first be switched to the free WhatsApp Business app.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && team.length > 0 && (
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">Team numbers</CardTitle>
            <CardDescription>
              Each member connects their own number from their Settings → WhatsApp. You can disconnect any of them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Member</th>
                    <th className="py-2 pr-3 font-semibold">Role</th>
                    <th className="py-2 pr-3 font-semibold">WhatsApp</th>
                    <th className="py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => {
                    const account = byUser.get(member.id)
                    return (
                      <tr key={member.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-foreground">
                          {member.full_name}
                          {member.id === meId && <span className="text-muted-foreground"> (you)</span>}
                        </td>
                        <td className="py-2.5 pr-3 capitalize text-muted-foreground">{member.role.replace('_', ' ')}</td>
                        <td className="py-2.5 pr-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full border-0 text-[11px]',
                              account ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {account ? account.display_phone_number ?? 'Connected' : 'Not connected'}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          {account && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={disconnectingId === account.id}
                              onClick={() => handleDisconnect(account, `${member.full_name}’s number`)}
                            >
                              {disconnectingId === account.id && <Loader2 className="animate-spin" data-icon="inline-start" />}
                              Disconnect
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </div>
  )
}
