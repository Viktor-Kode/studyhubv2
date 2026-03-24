import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'outline' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant === 'default' && 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
        variant === 'secondary' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        variant === 'outline' && 'border border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200',
        className,
      )}
      {...props}
    />
  )
}
