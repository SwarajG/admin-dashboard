import * as React from 'react'
import { cn } from './utils'

export interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn('relative inline-flex group', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 whitespace-nowrap"
      >
        {content}
        {/* Arrow */}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  )
}

export { Tooltip }
