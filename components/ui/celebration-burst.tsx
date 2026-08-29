'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'

/**
 * Tiny celebratory pop for a task/deal completing — a round checkmark
 * badge with a few dots bursting outward. Deliberately not confetti: this
 * sits inline in a table row, so it needs to read as a quick acknowledgment
 * rather than a full-screen effect.
 */
export function CelebrationBurst({ show }: { show: boolean }) {
  const reduce = useReducedMotion()
  const particles = Array.from({ length: 6 })

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" aria-hidden="true">
          <motion.div
            className="relative flex size-8 items-center justify-center rounded-full bg-success text-white shadow-md"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Check className="size-4" strokeWidth={3} />
          </motion.div>
          {!reduce &&
            particles.map((_, i) => {
              const angle = (i / particles.length) * Math.PI * 2
              const distance = 26
              return (
                <motion.span
                  key={i}
                  className="absolute size-1.5 rounded-full bg-primary"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 0.4,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              )
            })}
        </div>
      )}
    </AnimatePresence>
  )
}
