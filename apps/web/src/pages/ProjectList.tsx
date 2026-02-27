import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, FolderKanban } from 'lucide-react'
import type { ProjectStatus } from '@repo/types'
import { useProjects } from '../hooks/useProjects'
import { ProjectCard } from '../components/ProjectCard'
import { RoleGuard } from '../components/RoleGuard'

type FilterStatus = 'ALL' | ProjectStatus

const filterOptions: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Not Started', value: 'NOT_STARTED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Done', value: 'DONE' },
]

export function ProjectList() {
  const { projects, isLoading } = useProjects()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
      const matchesSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      return matchesStatus && matchesSearch
    })
  }, [projects, search, statusFilter])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'Loading...' : `${projects.length} total project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
          <Link
            to="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Project
          </Link>
        </RoleGuard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse h-44"
            >
              <div className="h-4 w-2/3 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-full bg-gray-200 rounded mb-2" />
              <div className="h-3 w-4/5 bg-gray-200 rounded mb-4" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FolderKanban className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No projects found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your filters or search query'
              : 'Create your first project to get started'}
          </p>
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            {!search && statusFilter === 'ALL' && (
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                New Project
              </Link>
            )}
          </RoleGuard>
        </div>
      )}
    </div>
  )
}
