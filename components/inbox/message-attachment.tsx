'use client'

import { useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export const ATTACHMENT_BUCKET = 'documents'
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic)$/i

/** Original file name from a stored path like `{org}/inbox/{conv}/{uuid}-{name}`. */
export function attachmentName(path: string) {
  const last = path.split('/').pop() ?? path
  return last.replace(/^[0-9a-f-]{36}-/, '')
}

// Signed URLs are short-lived; cache them per path for this page session.
const signedCache = new Map<string, Promise<string | null>>()

function signedUrl(path: string) {
  let p = signedCache.get(path)
  if (!p) {
    p = createClient()
      .storage.from(ATTACHMENT_BUCKET)
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => data?.signedUrl ?? null)
    signedCache.set(path, p)
  }
  return p
}

export function MessageAttachment({ path, isOwn }: { path: string; isOwn: boolean }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const name = attachmentName(path)
  const isImage = IMAGE_EXT.test(name)

  useEffect(() => {
    let cancelled = false
    signedUrl(path).then((u) => {
      if (cancelled) return
      if (u) setUrl(u)
      else setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (failed) return <span className="text-[12px] opacity-80">Attachment unavailable</span>

  if (isImage) {
    return url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="max-h-60 max-w-full object-cover" />
      </a>
    ) : (
      <div className="flex h-32 w-48 items-center justify-center rounded-xl bg-black/5">
        <Loader2 className="size-4 animate-spin" />
      </div>
    )
  }

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium underline-offset-2 hover:underline',
        isOwn ? 'bg-white/15' : 'bg-black/5',
      )}
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate">{name}</span>
    </a>
  )
}
