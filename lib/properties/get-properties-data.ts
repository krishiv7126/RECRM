import { createClient } from '@/lib/supabase/server'

export async function getPropertiesData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('properties')
    .select('*, project:projects(name), owner:platform_users!properties_owner_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getPropertyFormOptions() {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('projects').select('id, name').order('name')

  return { projects: projects ?? [] }
}

export type PropertyWithRelations = Awaited<ReturnType<typeof getPropertiesData>>[number]
