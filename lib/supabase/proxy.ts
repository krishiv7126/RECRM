import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { redirectPathForRole } from "@/lib/role-redirect"
import { applyNavOverrides, groupLabelForPath, navByRole, type Role } from "@/lib/nav-config"
import type { UserRole } from "@/lib/types"

// Always reachable regardless of nav_overrides -- otherwise revoking the
// wrong group could redirect-loop a user (the redirect target itself must
// never be blockable), or lock them out of fixing their own access.
const ALWAYS_ALLOWED_PATHS = ["/dashboard", "/settings"]

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

  // A valid Supabase session only proves the password was correct — it does NOT
  // mean the login was approved. Approval is what creates the login_sessions row
  // (see request-login-approval / decide-login-approval). Without an active row
  // here, this session must not reach protected routes, no matter how it got a
  // cookie — otherwise the approval queue is pure UI theater with no enforcement.
  //
  // The active-session check is embedded rather than run as a second query: this
  // runs on every single request, so each extra round-trip to Supabase is paid
  // on every navigation in the app.
  const { data: me } = await supabase
    .from("platform_users")
    .select("id, role, nav_overrides, login_sessions(id)")
    .eq("auth_user_id", user.id)
    .eq("login_sessions.is_active", true)
    .single()

  const isApproved = (me?.login_sessions?.length ?? 0) > 0

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

  // Admin-configured per-user page access (Settings → Team Management →
  // Manage Access), enforced here rather than only via hidden sidebar links
  // so a revoked page isn't reachable by typing the URL directly.
  if (me && !ALWAYS_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const role = me.role as Role
    const overrides = me.nav_overrides as Record<string, boolean> | null
    if (overrides && Object.keys(overrides).length > 0) {
      const groupLabel = groupLabelForPath(pathname)
      if (groupLabel) {
        const effectiveSections = applyNavOverrides(navByRole[role] ?? navByRole.user, overrides)
        const hasAccess = effectiveSections.some((s) => s.groups.some((g) => g.label === groupLabel))
        if (!hasAccess) {
          const url = request.nextUrl.clone()
          url.pathname = "/dashboard"
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return response
}
