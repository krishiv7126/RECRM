import { ProjectsGrid } from '@/components/projects/projects-grid'
import { getProjectsData } from '@/lib/projects/get-projects-data'

export default async function ProjectsPage() {
  const projects = await getProjectsData()
  return <ProjectsGrid initialProjects={projects} />
}
