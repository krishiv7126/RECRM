'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
}

/**
 * In-app replacement for window.confirm(). Renders as part of the ERP's own
 * UI instead of a browser-chrome popup — call `confirm(options)` (awaits a
 * boolean) and mount the returned `<ConfirmDialog />` once in the component.
 */
export function useConfirm() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [pending, setPending] = useState(false)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setOpen(true)
    setPending(false)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function settle(result: boolean) {
    setOpen(false)
    resolver.current?.(result)
    resolver.current = null
  }

  function ConfirmDialog() {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && settle(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {options?.destructive && <AlertTriangle className="size-4 text-destructive" />}
              {options?.title}
            </DialogTitle>
            <DialogDescription>{options?.description}</DialogDescription>
          </DialogHeader>
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => settle(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={options?.destructive ? 'destructive' : 'default'}
              disabled={pending}
              onClick={() => {
                setPending(true)
                settle(true)
              }}
            >
              {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return { confirm, ConfirmDialog }
}
