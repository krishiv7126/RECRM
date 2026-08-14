"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDeviceId } from "@/lib/device-id"
import { redirectPathForRole } from "@/lib/role-redirect"
import type { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Phase = "checking" | "form" | "waiting" | "rejected"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>("checking")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const approvalIdRef = useRef<string | null>(null)

  async function redirectForRole(role: UserRole) {
    router.push(redirectPathForRole(role))
    router.refresh()
  }

  // Requests (or resumes) the approval queue for whatever session is currently
  // active. Shared by the credential form and by the on-mount check below, so
  // that revisiting /login with an already-authenticated-but-unapproved session
  // (e.g. the proxy bounced them back here) resumes waiting instead of forcing
  // them to re-type credentials against an account that's already signed in.
  async function requestApproval() {
    const device_id = getDeviceId()
    const { data, error: fnError } = await supabase.functions.invoke("request-login-approval", {
      body: { device_id },
    })

    if (fnError || data?.error) {
      setError(data?.error ?? "Something went wrong. Please try again.")
      await supabase.auth.signOut()
      setPhase("form")
      return
    }

    if (data.auto_approved) {
      await redirectForRole(data.role as UserRole)
      return
    }

    approvalIdRef.current = data.approval_id
    setPhase("waiting")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const email = `${username.trim()}@login.internal`

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError("Invalid username or password.")
        return
      }

      await requestApproval()
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function checkExistingSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (user) {
        await requestApproval()
      } else {
        setPhase("form")
      }
    }

    checkExistingSession()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== "waiting" || !approvalIdRef.current) return

    const channel = supabase
      .channel(`login_approval_queue:${approvalIdRef.current}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "login_approval_queue",
          filter: `id=eq.${approvalIdRef.current}`,
        },
        async (payload) => {
          const status = (payload.new as { status: string }).status
          if (status === "approved") {
            const {
              data: { user },
            } = await supabase.auth.getUser()
            if (!user) return
            const { data: me } = await supabase
              .from("platform_users")
              .select("role")
              .eq("auth_user_id", user.id)
              .single()
            if (me) await redirectForRole(me.role as UserRole)
          } else if (status === "rejected") {
            setPhase("rejected")
            await supabase.auth.signOut()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function resetToForm() {
    approvalIdRef.current = null
    setPassword("")
    setError(null)
    setPhase("form")
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <CardTitle className="font-heading text-xl text-foreground">Estatly</CardTitle>
          <CardDescription>
            {phase === "waiting" ? "Waiting for approval" : phase === "checking" ? "One moment…" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phase === "checking" && (
            <div className="flex justify-center py-2">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}

          {phase === "form" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting} className="mt-1 w-full">
                {submitting && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
          )}

          {phase === "waiting" && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Your login needs approval from an administrator. This page will continue automatically once
                approved.
              </p>
            </div>
          )}

          {phase === "rejected" && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <p className="text-sm text-destructive">Your login request was rejected.</p>
              <Button variant="outline" onClick={resetToForm}>
                Try again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
