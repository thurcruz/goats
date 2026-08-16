interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div
      className="flex items-start justify-between px-6 py-6 border-b"
      style={{ borderColor: '#E5E5E5' }}
    >
      <div>
        <h1
          className="text-2xl"
          style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: '#737373' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
