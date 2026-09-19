import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // api/ is excluded: those routes handle their own auth (webhook signature
  // verification, service-role checks, etc.) rather than the cookie-session
  // redirect below, which would otherwise send Meta's webhook calls to /login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
