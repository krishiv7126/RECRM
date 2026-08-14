'use client'

import { useMemo, useState } from 'react'
import { Building2, ChevronDown, Filter, MapPin, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ProjectCard {
  id: string
  name: string
  developer_name: string
  city: string
  location: string
  description: string
  total_units: number
  available_units: number
  price_min: number
  price_max: number
  owner_full_name: string
}

const projects: ProjectCard[] = [
  {
    id: 'proj_1',
    name: 'Skyline Residency',
    developer_name: 'Lodha Group',
    city: 'Mumbai',
    location: 'Powai',
    description:
      'A premium high-rise development offering 2, 3 and 4 BHK residences with panoramic lake views, resort-style amenities, and dedicated concierge services.',
    total_units: 240,
    available_units: 38,
    price_min: 9500000,
    price_max: 18000000,
    owner_full_name: 'Meera Iyer',
  },
  {
    id: 'proj_2',
    name: 'Devanahalli Greens',
    developer_name: 'Prestige Group',
    city: 'Bengaluru',
    location: 'Devanahalli',
    description:
      'Gated villa community spread across 12 acres with private gardens, a clubhouse, and proximity to the international airport and tech corridor.',
    total_units: 96,
    available_units: 21,
    price_min: 14500000,
    price_max: 21000000,
    owner_full_name: 'Priya Nair',
  },
  {
    id: 'proj_3',
    name: 'Baner Riverside',
    developer_name: 'Kolte-Patil Developers',
    city: 'Pune',
    location: 'Baner',
    description:
      'Riverfront apartments designed around open courtyards and green terraces, with 1, 2 and 3 BHK options close to IT parks and arterial roads.',
    total_units: 180,
    available_units: 54,
    price_min: 5800000,
    price_max: 9200000,
    owner_full_name: 'Karan Shetty',
  },
  {
    id: 'proj_4',
    name: 'DLF Crest',
    developer_name: 'DLF Limited',
    city: 'Gurgaon',
    location: 'DLF Phase 3',
    description:
      'Ultra-luxury towers featuring double-height lobbies, sky lounges, and curated concierge living in the heart of Gurgaon golf course extension road.',
    total_units: 320,
    available_units: 12,
    price_min: 21000000,
    price_max: 45000000,
    owner_full_name: 'Aditya Rao',
  },
  {
    id: 'proj_5',
    name: 'Cyber Towers',
    developer_name: 'My Home Group',
    city: 'Hyderabad',
    location: 'HITEC City',
    description:
      'Grade-A commercial and office suites with column-free floor plates, smart building automation, and direct access to the HITEC City metro station.',
    total_units: 64,
    available_units: 9,
    price_min: 9800000,
    price_max: 19500000,
    owner_full_name: 'Divya Prakash',
  },
  {
    id: 'proj_6',
    name: 'Whitefield Grand',
    developer_name: 'Sobha Limited',
    city: 'Bengaluru',
    location: 'Whitefield',
    description:
      'Family-first township with landscaped courtyards, a full-size clubhouse, and easy access to Whitefield IT corridor and international schools.',
    total_units: 410,
    available_units: 76,
    price_min: 8600000,
    price_max: 17800000,
    owner_full_name: 'Priya Nair',
  },
]

function formatPrice(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function formatPriceRange(min: number, max: number) {
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProjectsPage() {
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('All Cities')

  const cities = useMemo(() => ['All Cities', ...Array.from(new Set(projects.map((p) => p.city)))], [])

  const totalUnits = useMemo(() => projects.reduce((sum, p) => sum + p.total_units, 0), [])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCity = cityFilter === 'All Cities' || project.city === cityFilter
      const matchesQuery =
        query.trim().length === 0 ||
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.developer_name.toLowerCase().includes(query.toLowerCase()) ||
        project.city.toLowerCase().includes(query.toLowerCase()) ||
        project.location.toLowerCase().includes(query.toLowerCase())
      return matchesCity && matchesQuery
    })
  }, [cityFilter, query])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Inventory' }, { label: 'Projects' }]}
          title="Projects"
          description={`${projects.length} active projects · ${totalUnits.toLocaleString('en-IN')} total units`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            <Plus data-icon="inline-start" />
            New Project
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search projects…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
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
          <Button variant="outline" size="sm">
            <Filter data-icon="inline-start" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredProjects.map((project) => (
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
                {project.available_units} units available
              </Badge>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-lg font-bold leading-snug text-foreground text-pretty">
                  {project.name}
                </h3>
                <p className="text-[13px] text-muted-foreground">{project.developer_name}</p>
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {project.location}, {project.city}
                  </span>
                </div>
              </div>

              <p className="line-clamp-2 text-[13px] leading-relaxed text-foreground/80">{project.description}</p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-[12px]">
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-foreground">{project.total_units}</span>
                  <span className="text-muted-foreground">Total units</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-foreground">{project.available_units}</span>
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-foreground">
                    {formatPriceRange(project.price_min, project.price_max)}
                  </span>
                  <span className="text-muted-foreground">Price range</span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(project.owner_full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[12px] text-foreground/80">{project.owner_full_name}</span>
                </div>
                <Button variant="outline" size="sm">
                  View Units
                </Button>
              </div>
            </div>
          </div>
        ))}

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
