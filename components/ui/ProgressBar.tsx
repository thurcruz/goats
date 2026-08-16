'use client'

import { useEffect, useState } from 'react'

interface ProgressBarProps {
  value: number
  color?: string
  animated?: boolean
  height?: number
}

export default function ProgressBar({ value, color = '#d0e027', animated = true, height = 6 }: ProgressBarProps) {
  const [width, setWidth] = useState(animated ? 0 : value)

  useEffect(() => {
    if (!animated) return
    const t = setTimeout(() => setWidth(value), 50)
    return () => clearTimeout(t)
  }, [value, animated])

  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,.07)', height }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, width))}%`,
          background: color,
          transition: animated ? 'width 0.8s ease' : 'none',
        }}
      />
    </div>
  )
}
