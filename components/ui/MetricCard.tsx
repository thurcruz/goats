'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  sublabel?: string
  color?: string
  icon?: ReactNode
  active?: boolean
}

export default function MetricCard({ label, value, sublabel, color, icon, active }: MetricCardProps) {
  const hasValue = value !== '0' && value !== 0 && value !== '0%'

  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-2"
      style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: (active || hasValue) && color ? color : '#737373', transition: 'color 0.4s ease' }}>
            {icon}
          </span>
        )}
      </div>
      <div
        className="text-3xl"
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontWeight: 400,
          color: (active || hasValue) && color ? color : '#000000',
          transition: 'color 0.4s ease',
        }}
      >
        {value}
      </div>
      {sublabel && (
        <span className="text-xs" style={{ color: '#737373' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
