'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FloatingInquiryButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    function onScroll() {
      const y = window.scrollY
      // Small threshold so hover-jitter near the top doesn't flicker it.
      if (Math.abs(y - lastY.current) > 6) {
        setVisible(y < lastY.current || y < 80)
        lastY.current = y
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Already on the form it opens — no point floating over its own page.
  if (pathname === '/inquiries/new') return null

  return (
    <Link
      href="/inquiries/new"
      aria-label="New Inquiry"
      className={cn(
        'fixed right-5 bottom-5 z-20 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-[13px] font-semibold text-primary-foreground shadow-lg transition-all duration-300 ease-out hover:bg-primary/90 sm:right-8 sm:bottom-8',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-24 opacity-0',
      )}
    >
      <ClipboardPlus className="size-4 shrink-0" />
      New Inquiry
    </Link>
  )
}
