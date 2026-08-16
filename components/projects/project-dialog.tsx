'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface EditableProject {
  id: string
  name: string
  developer_name: string | null
  location: string | null
  city: string | null
  description: string | null
}

export function ProjectDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  project,
}: {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  project?: EditableProject
}) {
  const router = useRouter()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [developerName, setDeveloperName] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!open) return
    setName(project?.name ?? '')
    setDeveloperName(project?.developer_name ?? '')
    setLocation(project?.location ?? '')
    setCity(project?.city ?? '')
    setDescription(project?.description ?? '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const fields = {
      name: name.trim(),
      developer_name: developerName.trim() || null,
      location: location.trim() || null,
      city: city.trim() || null,
      description: description.trim() || null,
    }

    if (project) {
      const { error: updateErr } = await supabase.from('projects').update(fields).eq('id', project.id)
      setSubmitting(false)
      if (updateErr) {
        setError(updateErr.message)
        return
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Not signed in.')
        setSubmitting(false)
        return
      }
      const { data: me } = await supabase
        .from('platform_users')
        .select('id, org_id')
        .eq('auth_user_id', user.id)
        .single()
      if (!me?.org_id) {
        setError('Could not resolve your organization.')
        setSubmitting(false)
        return
      }

      const { error: insertErr } = await supabase.from('projects').insert({
        org_id: me.org_id,
        owner_id: me.id,
        ...fields,
      })

      setSubmitting(false)
      if (insertErr) {
        setError(insertErr.message)
        return
      }
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>{project ? 'Update this project.' : 'Add a new project.'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="proj_name" className="text-sm font-medium text-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <Input id="proj_name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Skyline Residency" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="proj_developer" className="text-sm font-medium text-foreground">
              Developer
            </label>
            <Input id="proj_developer" value={developerName} onChange={(e) => setDeveloperName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj_location" className="text-sm font-medium text-foreground">
                Location
              </label>
              <Input id="proj_location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="proj_city" className="text-sm font-medium text-foreground">
                City
              </label>
              <Input id="proj_city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="proj_description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea id="proj_description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              {project ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
