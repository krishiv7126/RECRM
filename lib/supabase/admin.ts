import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// The WhatsApp webhook has no end-user session (Meta calls it directly), so
// it can't use the RLS-scoped browser/server clients like the rest of RECRM
// — it needs the service role key to write inbound messages/conversations.
// Mirrors superCRM's lib/supabase/admin.ts. Never import into a "use client"
// component; the "server-only" import throws a build error if that happens.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Server is not configured (missing SUPABASE_SERVICE_ROLE_KEY).')
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
