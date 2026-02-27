import type { ProjectStatus } from '@repo/types'

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: 'Not Started', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  ACTIVE: { label: 'Active', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  DONE: { label: 'Done', className: 'bg-green-100 text-green-700 border-green-200' },
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  )
}
