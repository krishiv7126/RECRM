'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, Filter, MapPin, MoreHorizontal, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { ProjectWithRelations } from '@/lib/projects/get-projects-data'

function formatPrice(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function projectStats(project: ProjectWithRelations) {
  const props = project.properties ?? []
  const totalUnits = props.length
  const availableUnits = props.filter((p) => p.status === 'available').length
  const prices = props.map((p) => p.price).filter((p): p is number => p !== null)
  const priceMin = prices.length ? Math.min(...prices) : null
  const priceMax = prices.length ? Math.max(...prices) : null
  return { totalUnits, availableUnits, priceMin, priceMax }
}

export function ProjectsGrid({ initialProjects }: { initialProjects: ProjectWithRelations[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('All Cities')
  const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null)

  const cities = useMemo(
    () => ['All Cities', ...Array.from(new Set(projects.map((p) => p.city).filter(Boolean) as string[]))],
    [projects],
  )

  const totalUnits = useMemo(() => projects.reduce((sum, p) => sum + projectStats(p).totalUnits, 0), [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCity = cityFilter === 'All Cities' || project.city === cityFilter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        project.name.toLowerCase().includes(q) ||
        (project.developer_name ?? '').toLowerCase().includes(q) ||
        (project.city ?? '').toLowerCase().includes(q) ||
        (project.location ?? '').toLowerCase().includes(q)
      return matchesCity && matchesQuery
    })
  }, [projects, cityFilter, query])

  async function handleDelete(project: ProjectWithRelations) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setProjects((prev) => prev.filter((p) => p.id !== project.id))
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Inventory' }, { label: 'Projects' }]}
          title="Projects"
          description={`${projects.length} active projects · ${totalUnits.toLocaleString('en-IN')} total units`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <ProjectDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Plus data-icon="inline-start" />
                New Project
              </Button>
            }
          />
        </div>
      </div>

      <ProjectDialog
        open={!!editingProject}
        onOpenChange={(next) => {
          if (!next) setEditingProject(null)
        }}
        project={editingProject ?? undefined}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </InputGroup>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <MapPin data-icon="inline-start" />
                  {cityFilter}
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {cities.map((city) => (
                <DropdownMenuItem key={city} onClick={() => setCityFilter(city)}>
                  {city}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredProjects.map((project) => {
          const stats = projectStats(project)
          return (
            <div
              key={project.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-40 w-full bg-gradient-to-br from-primary/25 via-accent to-secondary/60">
                <Badge
                  variant="outline"
                  className="absolute left-3 top-3 gap-1.5 rounded-full border-0 bg-card/90 text-foreground/80"
                >
                  <Building2 className="size-3.5" />
                  {stats.availableUnits} units available
                </Badge>
                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          aria-label={`More actions for ${project.name}`}
                          className="flex size-7 items-center justify-center rounded-full bg-card/90 text-foreground/80 backdrop-blur transition-colors hover:bg-card"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProject(project)}>Edit project</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(project)}>
                        Delete project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-lg font-bold leading-snug text-foreground text-pretty">
                    {project.name}
                  </h3>
                  <p className="text-[13px] text-muted-foreground">{project.developer_name ?? '—'}</p>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {project.location ?? '—'}
                      {project.city ? `, ${project.city}` : ''}
                    </span>
                  </div>
                </div>

                {project.description && (
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-foreground/80">{project.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-[12px]">
                  <div className="flex flex-col">
                    <span className="font-heading font-bold text-foreground">{stats.totalUnits}</span>
                    <span className="text-muted-foreground">Total units</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-bold text-foreground">{stats.availableUnits}</span>
                    <span className="text-muted-foreground">Available</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-bold text-foreground">
                      {stats.priceMin !== null && stats.priceMax !== null
                        ? `${formatPrice(stats.priceMin)} - ${formatPrice(stats.priceMax)}`
                        : '—'}
                    </span>
                    <span className="text-muted-foreground">Price range</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(project.owner?.full_name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[12px] text-foreground/80">{project.owner?.full_name ?? '—'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/properties')}>
                    View Units
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredProjects.length === 0 && (
          <div
            className={cn(
              'col-span-full flex items-center justify-center rounded-2xl bg-card py-12 text-muted-foreground ring-1 ring-border',
            )}
          >
            No projects match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
