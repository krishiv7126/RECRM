import type { UserRole } from "@/lib/types"

// The Super Admin portal is a separate app (superCRM), not part of RECRM.
// A super_admin signing into RECRM directly lands on the normal CRM dashboard —
// RLS grants them cross-org visibility there, so no separate route is needed.
export function redirectPathForRole(_role: UserRole) {
  return "/dashboard"
}
