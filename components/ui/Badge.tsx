interface BadgeProps {
  label: string
  color?: string
  active?: boolean
  size?: 'sm' | 'md'
}

export default function Badge({ label, color, active, size = 'sm' }: BadgeProps) {
  const padding = size === 'sm' ? '2px 8px' : '4px 12px'
  const fontSize = size === 'sm' ? '11px' : '12px'

  return (
    <span
      style={{
        display: 'inline-block',
        padding,
        borderRadius: '999px',
        fontSize,
        fontWeight: 500,
        border: active && color ? 'none' : '1px solid #000000',
        background: active && color ? color : 'transparent',
        color: active && color ? '#FFFFFF' : '#000000',
        transition: 'all 0.4s ease',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  )
}
