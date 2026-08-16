import { createClient } from '@/lib/supabase/server'

export async function getProjectsData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, owner:platform_users!projects_owner_id_fkey(full_name), properties(id, status, price)')
    .order('created_at', { ascending: false })

  return data ?? []
}

export type ProjectWithRelations = Awaited<ReturnType<typeof getProjectsData>>[number]
