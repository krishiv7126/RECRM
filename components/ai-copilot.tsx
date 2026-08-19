"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUp, Loader2 } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Role = "user" | "assistant"

/** Personality states that drive the orb + ambient intensity. */
type Phase = "idle" | "listening" | "thinking" | "responding"

export interface CopilotMessage {
  id: string
  role: Role
  content: string
}

export interface AICopilotProps {
  /** Optional seed messages. */
  initialMessages?: CopilotMessage[]
  /**
   * Stub for the real backend call. Wire this to a Supabase edge function
   * later. Receives the user's prompt and the running transcript, returns the
   * assistant's reply text.
   */
  onSendMessage?: (prompt: string, history: CopilotMessage[]) => Promise<string>
  /**
   * Prompt to submit automatically once on mount — used when arriving from the
   * AI Workspace hub, which links here as /ai-workspace/copilot?q=<prompt>.
   */
  autoSendPrompt?: string
  className?: string
}

const SUGGESTIONS = [
  "Show me hot leads with budget above ₹2Cr",
  "Summarize today's sales performance",
  "Draft WhatsApp follow-up for Marina Bay visitors",
  "Which deals are at risk this month?",
]

/* Fallback stub so the component is fully self-contained until wired up. */
async function defaultSend(prompt: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 1600))
  return `Here's a draft based on "${prompt.trim()}". Connect me to your Supabase edge function to pull live CRM data — leads, pipeline value, and forecasts — and I'll return grounded, source-backed answers you can act on right away.`
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/* -------------------------------------------------------------------------- */
/*  AI Orb — stateful sphere with counter-rotating rings, halo, ripples       */
/* -------------------------------------------------------------------------- */

const ORB_CONFIG: Record<Phase, { spin: number; halo: number; core: number; glow: number }> = {
  idle: { spin: 9, halo: 3.6, core: 3.6, glow: 0.55 },
  listening: { spin: 4.5, halo: 2.4, core: 2.4, glow: 0.8 },
  thinking: { spin: 2, halo: 1.3, core: 1.3, glow: 1 },
  responding: { spin: 6, halo: 3, core: 3, glow: 0.9 },
}

function AIOrb({
  size = 40,
  phase = "idle",
  ripples = false,
  className = "",
}: {
  size?: number
  phase?: Phase
  ripples?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  const cfg = ORB_CONFIG[phase]
  const energetic = phase === "thinking"

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* radiating ripple rings when a response begins arriving */}
      {ripples && !reduce && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{ inset: 0, borderColor: "var(--chart-3)" }}
              initial={{ scale: 0.6, opacity: 0.6 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: i * 0.6 }}
            />
          ))}
        </>
      )}

      {/* soft outer halo */}
      <motion.div
        className="absolute rounded-full blur-md"
        style={{
          inset: -size * 0.3,
          background: "radial-gradient(circle at 50% 50%, var(--chart-3), transparent 70%)",
        }}
        animate={
          reduce
            ? { opacity: cfg.glow * 0.7 }
            : { scale: [1, energetic ? 1.32 : 1.18, 1], opacity: [cfg.glow * 0.6, cfg.glow, cfg.glow * 0.6] }
        }
        transition={{ duration: cfg.halo, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* base rotating conic gradient sphere */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, var(--chart-1), var(--chart-5), var(--chart-3), var(--chart-7), var(--chart-1))",
        }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: cfg.spin, repeat: Infinity, ease: "linear" }}
      />

      {/* counter-rotating energy rings (masked to thin rings) */}
      {!reduce && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: -size * 0.08,
              background:
                "conic-gradient(from 90deg, transparent 0deg, var(--chart-5) 70deg, transparent 150deg, transparent 360deg)",
              WebkitMaskImage: "radial-gradient(transparent 56%, #000 58%)",
              maskImage: "radial-gradient(transparent 56%, #000 58%)",
              opacity: energetic ? 0.95 : 0.4,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: cfg.spin * 0.7, repeat: Infinity, ease: "linear" }}
          />
          {energetic && (
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: -size * 0.2,
                background:
                  "conic-gradient(from 250deg, transparent 0deg, var(--chart-7) 60deg, transparent 130deg, transparent 360deg)",
                WebkitMaskImage: "radial-gradient(transparent 62%, #000 64%)",
                maskImage: "radial-gradient(transparent 62%, #000 64%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />
          )}
        </>
      )}

      {/* glossy sphere highlight */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), rgba(255,255,255,0) 45%)",
        }}
      />

      {/* inner core so it reads as a sphere, not a ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.22,
          background: "radial-gradient(circle at 40% 35%, var(--card), var(--accent))",
        }}
        animate={reduce ? undefined : { scale: [1, energetic ? 0.78 : 0.88, 1] }}
        transition={{ duration: cfg.core, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Aurora + particle field — strictly inside an inset, clipped layer         */
/* -------------------------------------------------------------------------- */

const BLOBS = [
  { color: "var(--chart-1)", top: "-10%", left: "-8%", w: "48%", h: "48%", dur: 15, x: [0, 34, -12, 0], y: [0, 22, 40, 0] },
  { color: "var(--chart-5)", bottom: "-12%", right: "-10%", w: "54%", h: "54%", dur: 18, x: [0, -30, 14, 0], y: [0, -24, -8, 0] },
  { color: "var(--chart-7)", top: "22%", left: "36%", w: "42%", h: "42%", dur: 21, x: [0, 22, -26, 0], y: [0, -18, 14, 0] },
  { color: "var(--chart-3)", top: "40%", left: "-6%", w: "36%", h: "36%", dur: 24, x: [0, 26, 8, 0], y: [0, -12, 18, 0] },
]

function AuroraField({ active }: { active: boolean }) {
  const reduce = useReducedMotion()

  // Particles use randomness, so only generate them after mount to avoid a
  // server/client hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        dur: 9 + Math.random() * 10,
        delay: Math.random() * 10,
        drift: (Math.random() - 0.5) * 40,
        opacity: 0.25 + Math.random() * 0.35,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Drifting aurora blobs with a slow, whole-field hue breathe */}
      <motion.div
        className="absolute inset-0"
        animate={reduce ? undefined : { filter: ["hue-rotate(-10deg)", "hue-rotate(12deg)", "hue-rotate(-10deg)"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      >
        {BLOBS.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: b.top,
              left: b.left,
              right: b.right,
              bottom: b.bottom,
              width: b.w,
              height: b.h,
              filter: "blur(64px)",
              background: `radial-gradient(circle, ${b.color}, transparent 68%)`,
            }}
            animate={
              reduce
                ? { opacity: active ? 0.4 : 0.24 }
                : {
                    x: b.x,
                    y: b.y,
                    opacity: active ? [0.34, 0.58, 0.34] : [0.18, 0.32, 0.18],
                  }
            }
            transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      {/* Floating dust motes rising through the surface */}
      {mounted &&
        !reduce &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-primary"
            style={{
              left: `${p.left}%`,
              bottom: -8,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
            }}
            animate={{ y: [0, -520], x: [0, p.drift, 0], opacity: [0, p.opacity, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Streaming assistant text — word-by-word blur reveal + finishing sheen     */
/* -------------------------------------------------------------------------- */

function StreamingText({
  text,
  animate,
  onDone,
}: {
  text: string
  animate: boolean
  onDone?: () => void
}) {
  const reduce = useReducedMotion()
  const words = useMemo(() => text.split(/(\s+)/), [text])
  const step = 0.045

  useEffect(() => {
    if (!animate || reduce) {
      onDone?.()
      return
    }
    const total = words.length * step * 1000 + 350
    const t = setTimeout(() => onDone?.(), total)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, reduce])

  if (reduce || !animate) {
    return <p className="whitespace-pre-wrap text-pretty">{text}</p>
  }

  return (
    <p className="whitespace-pre-wrap text-pretty">
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, delay: i * step, ease: "easeOut" }}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {w}
        </motion.span>
      ))}
    </p>
  )
}

/* -------------------------------------------------------------------------- */
/*  Thinking indicator                                                        */
/* -------------------------------------------------------------------------- */

function ThinkingBubble() {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <AIOrb size={32} phase="thinking" />
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-border bg-muted px-4 py-3">
        <motion.span
          className="bg-clip-text text-sm font-medium text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 35%, var(--primary) 50%, var(--muted-foreground) 65%, var(--muted-foreground) 100%)",
            backgroundSize: "220% 100%",
          }}
          animate={reduce ? undefined : { backgroundPositionX: ["180%", "-40%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        >
          Thinking
        </motion.span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-primary"
              animate={reduce ? undefined : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Message bubble                                                            */
/* -------------------------------------------------------------------------- */

function MessageRow({
  message,
  streaming,
  onStreamDone,
}: {
  message: CopilotMessage
  streaming: boolean
  onStreamDone: () => void
}) {
  const reduce = useReducedMotion()
  const isUser = message.role === "user"
  const [swept, setSwept] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.7 }}
      whileHover={reduce ? undefined : { y: -2 }}
      className={`group flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && <AIOrb size={32} phase={streaming ? "responding" : "idle"} ripples={streaming} className="mt-0.5" />}
      <div
        className={[
          "relative max-w-[82%] overflow-hidden rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow group-hover:shadow-md",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm border border-border bg-muted text-foreground",
        ].join(" ")}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-pretty">{message.content}</p>
        ) : (
          <StreamingText
            text={message.content}
            animate={streaming}
            onDone={() => {
              setSwept(true)
              onStreamDone()
            }}
          />
        )}

        {/* soft glow sweep once the assistant bubble finishes rendering */}
        {!isUser && swept && !reduce && (
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(100deg, transparent, color-mix(in oklch, var(--primary) 22%, transparent), transparent)",
            }}
            initial={{ x: "-140%" }}
            animate={{ x: "360%" }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            onAnimationComplete={() => setSwept(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

function EmptyState({ phase, onPick }: { phase: Phase; onPick: (s: string) => void }) {
  const reduce = useReducedMotion()
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <AIOrb size={88} phase={phase} />
      </motion.div>

      <motion.h2
        className="mt-8 max-w-sm text-balance text-lg font-semibold text-foreground"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5 }}
      >
        Ask about leads, deals, forecasts, or draft a message.
      </motion.h2>

      <motion.div
        className="mt-7 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.95 },
              show: { opacity: 1, y: 0, scale: 1 },
            }}
            whileHover={reduce ? undefined : { scale: 1.03, y: -3 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="group relative flex items-center gap-2 overflow-hidden rounded-2xl border border-border bg-card/70 px-4 py-3 text-left text-sm text-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-accent"
          >
            {/* gentle continuous idle float, each pill offset */}
            <motion.span
              className="pointer-events-none absolute inset-0"
              animate={reduce ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              aria-hidden="true"
            />
            {/* sheen sweep on hover */}
            <span
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-[linear-gradient(100deg,transparent,color-mix(in_oklch,var(--primary)_28%,transparent),transparent)] opacity-0 group-hover:opacity-100 group-hover:[animation:copilot-sheen_0.9s_ease-in-out]"
              aria-hidden="true"
            />
            <span
              className="relative size-2 shrink-0 rounded-full bg-primary transition-transform group-hover:scale-125"
              aria-hidden="true"
            />
            <span className="relative text-pretty">{s}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Send button — morphs arrow -> spinner, emits a burst on send              */
/* -------------------------------------------------------------------------- */

function SendButton({
  canSend,
  sending,
  burstKey,
  onClick,
}: {
  canSend: boolean
  sending: boolean
  burstKey: number
  onClick: () => void
}) {
  const reduce = useReducedMotion()
  return (
    <div className="relative mb-0.5">
      {/* radial burst on submit */}
      {!reduce && burstKey > 0 && (
        <div key={burstKey} className="pointer-events-none absolute inset-0" aria-hidden="true">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <motion.span
              className="absolute left-1/2 top-1/2 size-1 rounded-full bg-primary"
              key={deg}
              initial={{ x: "-50%", y: "-50%", opacity: 0.9, scale: 1 }}
              animate={{
                x: `calc(-50% + ${Math.cos((deg * Math.PI) / 180) * 22}px)`,
                y: `calc(-50% + ${Math.sin((deg * Math.PI) / 180) * 22}px)`,
                opacity: 0,
                scale: 0.4,
              }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      <motion.button
        type="button"
        onClick={onClick}
        disabled={!canSend}
        whileHover={canSend && !reduce ? { scale: 1.08 } : undefined}
        whileTap={canSend && !reduce ? { scale: 0.88 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 24 }}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Send message"
      >
        <AnimatePresence mode="wait" initial={false}>
          {sending ? (
            <motion.span
              key="spin"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
            >
              <Loader2 className="size-5 animate-spin" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="arrow"
              initial={{ opacity: 0, y: 6, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.6 }}
            >
              <ArrowUp className="size-5" strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function AICopilot({
  initialMessages = [],
  onSendMessage = defaultSend,
  autoSendPrompt,
  className = "",
}: AICopilotProps) {
  const reduce = useReducedMotion()
  const [messages, setMessages] = useState<CopilotMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [focused, setFocused] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [focusRipple, setFocusRipple] = useState(0)
  const [burstKey, setBurstKey] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const hasMessages = messages.length > 0
  const typing = focused || input.trim().length > 0

  const phase: Phase = sending
    ? "thinking"
    : streamingId
      ? "responding"
      : typing
        ? "listening"
        : "idle"

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, sending])

  // auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || sending) return

      setBurstKey((k) => k + 1)
      const userMsg: CopilotMessage = { id: uid(), role: "user", content: text }
      const history = [...messages, userMsg]
      setMessages(history)
      setInput("")
      setSending(true)

      try {
        const reply = await onSendMessage(text, history)
        const id = uid()
        setMessages((prev) => [...prev, { id, role: "assistant", content: reply }])
        setStreamingId(id)
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "Something went wrong reaching the assistant. Please try again.",
          },
        ])
      } finally {
        setSending(false)
      }
    },
    [messages, onSendMessage, sending],
  )

  // Fire `autoSendPrompt` exactly once on mount. Guarded by a ref rather than
  // an effect dependency because `submit` is recreated on every message change,
  // which would otherwise re-send the prompt on each reply.
  const autoSentRef = useRef(false)
  useEffect(() => {
    if (!autoSendPrompt || autoSentRef.current) return
    autoSentRef.current = true
    void submit(autoSendPrompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSendPrompt])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Respect IME composition (CJK) and Safari's unreliable final event.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void submit(input)
    }
  }

  const canSend = input.trim().length > 0 && !sending
  const ambientActive = focused || sending || streamingId !== null

  return (
    <div
      className={[
        // Designed to be the flex-1 child of a flex-column parent.
        // min-h-0 lets the inner message list scroll instead of blowing out height.
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card",
        className,
      ].join(" ")}
    >
      {/* Decorative aurora + particles — strictly contained in this inset layer */}
      <AuroraField active={ambientActive} />

      {/* Whole-surface gentle breathing at rest */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          boxShadow: "inset 0 0 120px 0 color-mix(in oklch, var(--primary) 8%, transparent)",
        }}
        animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      {/* Content sits above the glow */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Scroll area */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {hasMessages ? (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    streaming={m.id === streamingId}
                    onStreamDone={() => setStreamingId((cur) => (cur === m.id ? null : cur))}
                  />
                ))}
              </AnimatePresence>
              <AnimatePresence>{sending && <ThinkingBubble key="thinking" />}</AnimatePresence>
              <div ref={endRef} />
            </div>
          ) : (
            <EmptyState phase={phase} onPick={(s) => submit(s)} />
          )}
        </div>

        {/* Composer */}
        <div className="px-4 pb-4 pt-2 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <div className="relative">
              {/* soft focus glow behind the composer */}
              <motion.div
                className="pointer-events-none absolute -inset-2 rounded-[1.75rem] blur-lg"
                style={{
                  background: "linear-gradient(120deg, var(--chart-1), var(--chart-7), var(--chart-5))",
                }}
                animate={{ opacity: focused || sending ? 0.4 : 0 }}
                transition={{ duration: 0.4 }}
                aria-hidden="true"
              />

              {/* focus ripple — expands outward once on focus */}
              <AnimatePresence>
                {focusRipple > 0 && !reduce && (
                  <motion.span
                    key={focusRipple}
                    className="pointer-events-none absolute inset-0 rounded-3xl border border-primary/50"
                    initial={{ opacity: 0.6, scale: 0.98 }}
                    animate={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    aria-hidden="true"
                  />
                )}
              </AnimatePresence>

              {/* tracing gradient border that traces around the input on focus */}
              <div
                className="copilot-trace-border pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
                style={{ opacity: focused || sending ? 1 : 0 }}
                aria-hidden="true"
              />

              <div className="relative flex items-end gap-2 rounded-3xl border border-border bg-card/90 p-2 shadow-sm backdrop-blur-sm">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    setFocused(true)
                    setFocusRipple((k) => k + 1)
                  }}
                  onBlur={() => setFocused(false)}
                  placeholder="Ask anything…"
                  className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                  aria-label="Message the AI copilot"
                />
                <SendButton canSend={canSend} sending={sending} burstKey={burstKey} onClick={() => submit(input)} />
              </div>
            </div>
            <p className="mt-2 px-1 text-center text-xs text-muted-foreground">
              Estatly AI can make mistakes. Verify important CRM details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
