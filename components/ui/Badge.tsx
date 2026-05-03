import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'teal' | 'gray' | 'green' | 'amber' | 'red' | 'blue'
  className?: string
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        {
          'bg-teal-50 text-teal-700 ring-1 ring-teal-200': variant === 'teal',
          'bg-gray-100 text-gray-600': variant === 'gray',
          'bg-green-50 text-green-700 ring-1 ring-green-200': variant === 'green',
          'bg-amber-50 text-amber-700 ring-1 ring-amber-200': variant === 'amber',
          'bg-red-50 text-red-700 ring-1 ring-red-200': variant === 'red',
          'bg-blue-50 text-blue-700 ring-1 ring-blue-200': variant === 'blue',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
