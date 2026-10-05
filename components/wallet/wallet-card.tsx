'use client'

import { AlertTriangle, Wallet as WalletIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCredits, type Wallet, type WalletTransaction } from '@/lib/wallet/use-wallet'

const KIND_LABELS: Record<string, string> = {
  topup: 'Top-up',
  whatsapp_send: 'WhatsApp send',
  refund: 'Refund',
  adjustment: 'Adjustment',
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

/** WhatsApp credit wallet: balance, what the current audience would cost, recent ledger. */
export function WalletCard({
  wallet,
  transactions,
  recipientCount,
}: {
  wallet: Wallet | null
  transactions: WalletTransaction[]
  recipientCount: number
}) {
  if (!wallet) return null
  const cost = recipientCount * wallet.cost_per_message
  const short = cost > wallet.balance
  const low = wallet.balance <= wallet.low_balance_threshold

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <WalletIcon className="size-5" />
            </span>
            <div>
              <p className="text-[12px] text-muted-foreground">WhatsApp credit wallet</p>
              <p className={cn('font-heading text-2xl font-bold', low ? 'text-red-600' : 'text-foreground')}>
                {formatCredits(wallet.balance)} credits
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
            <span className="text-muted-foreground">Cost per message</span>
            <span className="font-medium text-foreground">{formatCredits(wallet.cost_per_message)} credit</span>
            <span className="text-muted-foreground">This audience</span>
            <span className={cn('font-medium', short ? 'text-red-600' : 'text-foreground')}>
              {formatCredits(cost)} credits ({recipientCount})
            </span>
          </div>
        </div>

        {(low || short) && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {short
              ? 'Not enough credits to message this whole audience. Ask your platform admin to top up the wallet.'
              : 'Credits are running low. Ask your platform admin to top up the wallet.'}
          </div>
        )}

        {transactions.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Recent activity</p>
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-[13px] last:border-0">
                <span className="text-foreground/80">
                  {KIND_LABELS[t.kind] ?? t.kind}
                  {t.note ? <span className="text-muted-foreground"> · {t.note}</span> : null}
                </span>
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span className={cn('font-medium', t.amount < 0 ? 'text-foreground' : 'text-emerald-600')}>
                    {t.amount > 0 ? '+' : ''}
                    {formatCredits(t.amount)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{formatWhen(t.created_at)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
