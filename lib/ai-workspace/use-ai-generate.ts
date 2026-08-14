"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

export type AiContentType = Database["public"]["Enums"]["ai_content_type"]

interface GenerateParams {
  type: AiContentType
  lead_id?: string
  customer_id?: string
  deal_id?: string
  extra_instructions?: string
}

export function useAiGenerate() {
  const [output, setOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate(params: GenerateParams) {
    setLoading(true)
    setError(null)
    setOutput(null)

    const supabase = createClient()
    const { data, error: fnError } = await supabase.functions.invoke("ai-workspace", { body: params })

    setLoading(false)

    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? "Something went wrong. Please try again.")
      return null
    }

    setOutput(data.output as string)
    return data.output as string
  }

  return { output, loading, error, generate }
}
