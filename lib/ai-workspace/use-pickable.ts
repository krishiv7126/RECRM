"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface PickableCustomer {
  id: string
  full_name: string
  phone: string | null
}

export interface PickableDeal {
  id: string
  code: string
  title: string
}

export function useCustomers() {
  const [customers, setCustomers] = useState<PickableCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .order("full_name")
      .then(({ data }) => {
        setCustomers(data ?? [])
        setLoading(false)
      })
  }, [])

  return { customers, loading }
}

export function useDealsForCustomer(customerId: string) {
  const [deals, setDeals] = useState<PickableDeal[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) {
      setDeals([])
      return
    }
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("deals")
      .select("id, code, title")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDeals(data ?? [])
        setLoading(false)
      })
  }, [customerId])

  return { deals, loading }
}
