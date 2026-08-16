import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 text-[#d0e027]" style={{ fontSize: 40 }}>
          {icon}
        </div>
      )}
      <p className="text-base font-medium mb-1">{title}</p>
      {description && (
        <p className="muted text-sm" style={{ maxWidth: 280 }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
