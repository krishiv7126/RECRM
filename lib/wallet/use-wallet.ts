'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Wallet {
  balance: number
  cost_per_message: number
  low_balance_threshold: number
}

export interface WalletTransaction {
  id: string
  amount: number
  kind: string
  balance_after: number
  note: string | null
  created_at: string
}

/** The caller's own org wallet (and optionally its recent ledger). */
export function useWallet({ withTransactions = false } = {}) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: orgId } = await supabase.rpc('fn_current_org_id')
    if (!orgId) {
      setLoading(false)
      return
    }
    const [{ data: w }, tx] = await Promise.all([
      supabase.from('org_wallets').select('balance, cost_per_message, low_balance_threshold').eq('org_id', orgId).maybeSingle(),
      withTransactions
        ? supabase
            .from('wallet_transactions')
            .select('id, amount, kind, balance_after, note, created_at')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: null }),
    ])
    setWallet(
      w ? { balance: Number(w.balance), cost_per_message: Number(w.cost_per_message), low_balance_threshold: Number(w.low_balance_threshold) } : null,
    )
    if (tx.data) setTransactions(tx.data.map((t) => ({ ...t, amount: Number(t.amount), balance_after: Number(t.balance_after) })))
    setLoading(false)
  }, [withTransactions])

  useEffect(() => {
    void load()
  }, [load])

  return { wallet, transactions, loading, reload: load }
}

export function formatCredits(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
