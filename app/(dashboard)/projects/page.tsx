import type { Metadata } from 'next'
import { ProjectsGrid } from '@/components/projects/projects-grid'
import { getProjectsData } from '@/lib/projects/get-projects-data'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage() {
  const projects = await getProjectsData()
  return <ProjectsGrid initialProjects={projects} />
}
