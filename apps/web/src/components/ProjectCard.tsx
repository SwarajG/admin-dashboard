import { Link } from 'react-router-dom'
import type { ProjectSummary } from '@repo/types'
import { StatusBadge } from './StatusBadge'
import { DeadlineIndicator } from './DeadlineIndicator'
import { AlertTriangle, Users } from 'lucide-react'

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1 mr-2">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        {project.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
        )}
        <div className="flex items-center justify-between mt-4">
          <DeadlineIndicator
            deadline={project.deadline}
            daysUntilDeadline={project.daysUntilDeadline}
            status={project.status}
          />
          <div className="flex items-center gap-3">
            {project.openBlockerCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                {project.openBlockerCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {project.memberCount} member
            {project.memberCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-400">by {project.owner.name}</span>
        </div>
      </div>
    </Link>
  )
}
