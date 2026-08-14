import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { redirectPathForRole } from "@/lib/role-redirect"
import type { UserRole } from "@/lib/types"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refreshes the session cookie; do not add logic between client creation and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPage = pathname === "/login"

  if (!user) {
    if (!isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    return response
  }

  const { data: me } = await supabase.from("platform_users").select("id, role").eq("auth_user_id", user.id).single()

  // A valid Supabase session only proves the password was correct — it does NOT
  // mean the login was approved. Approval is what creates the login_sessions row
  // (see request-login-approval / decide-login-approval). Without an active row
  // here, this session must not reach protected routes, no matter how it got a
  // cookie — otherwise the approval queue is pure UI theater with no enforcement.
  const { count: activeSessionCount } = me
    ? await supabase
        .from("login_sessions")
        .select("id", { count: "exact", head: true })
        .eq("platform_user_id", me.id)
        .eq("is_active", true)
    : { count: 0 }

  const isApproved = (activeSessionCount ?? 0) > 0

  if (!isApproved) {
    // Keep the Supabase session (the /login page's own client logic re-checks
    // approval status and resumes the waiting screen) but never let it reach
    // anything past /login until login_sessions confirms approval.
    if (!isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    return response
  }

  if (isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = me ? redirectPathForRole(me.role as UserRole) : "/dashboard"
    return NextResponse.redirect(url)
  }

  return response
}
