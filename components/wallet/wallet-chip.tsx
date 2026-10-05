'use client'

import Link from 'next/link'
import { Wallet as WalletIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCredits, useWallet } from '@/lib/wallet/use-wallet'

/** Top-bar WhatsApp credit balance; turns red when it runs low. */
export function WalletChip() {
  const { wallet } = useWallet()
  if (!wallet) return null
  const low = wallet.balance <= wallet.low_balance_threshold

  return (
    <Link
      href="/whatsapp-broadcast"
      title="WhatsApp credits"
      className={cn(
        'hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors sm:inline-flex',
        low
          ? 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30'
          : 'bg-card text-foreground ring-border hover:bg-muted',
      )}
    >
      <WalletIcon className="size-3.5" />
      {formatCredits(wallet.balance)} credits
    </Link>
  )
}
