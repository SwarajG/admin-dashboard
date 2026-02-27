interface DeadlineIndicatorProps {
  deadline: string | null
  daysUntilDeadline: number | null
  status: string
}

export function DeadlineIndicator({ deadline, daysUntilDeadline, status }: DeadlineIndicatorProps) {
  if (!deadline) return <span className="text-sm text-gray-400">No deadline</span>

  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0 && status !== 'DONE'
  const isUrgent =
    daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 7
  const isSafe = daysUntilDeadline !== null && daysUntilDeadline > 7

  const dateStr = new Date(deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col">
      <span
        className={`text-sm font-medium ${
          isOverdue
            ? 'text-red-600'
            : isUrgent
              ? 'text-orange-500'
              : isSafe
                ? 'text-green-600'
                : 'text-gray-600'
        }`}
      >
        {dateStr}
      </span>
      {daysUntilDeadline !== null && status !== 'DONE' && (
        <span
          className={`text-xs ${
            isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-400' : 'text-gray-400'
          }`}
        >
          {isOverdue
            ? `${Math.abs(daysUntilDeadline)} days overdue`
            : `${daysUntilDeadline} days left`}
        </span>
      )}
    </div>
  )
}
