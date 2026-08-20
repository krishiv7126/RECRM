'use client'

/**
 * Shared AI motion primitives.
 *
 * Extracted verbatim from the v0-designed AI Copilot component so every
 * AI Workspace page animates identically from one source of truth —
 * ai-copilot.tsx imports these rather than keeping its own copies.
 *
 * Requires the `.copilot-*` keyframes in app/globals.css.
 */

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

/** Personality states that drive the orb + ambient intensity. */
export type Phase = "idle" | "listening" | "thinking" | "responding"

/* -------------------------------------------------------------------------- */
/*  AI Orb — stateful sphere with counter-rotating rings, halo, ripples       */
/* -------------------------------------------------------------------------- */

const ORB_CONFIG: Record<Phase, { spin: number; halo: number; core: number; glow: number }> = {
  idle: { spin: 9, halo: 3.6, core: 3.6, glow: 0.55 },
  listening: { spin: 4.5, halo: 2.4, core: 2.4, glow: 0.8 },
  thinking: { spin: 2, halo: 1.3, core: 1.3, glow: 1 },
  responding: { spin: 6, halo: 3, core: 3, glow: 0.9 },
}

export function AIOrb({
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

export function AuroraField({ active }: { active: boolean }) {
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

export function StreamingText({
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
