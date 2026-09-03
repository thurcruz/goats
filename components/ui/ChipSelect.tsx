'use client'

interface ChipOption<T extends string> { value: T; label: string }

interface ChipSelectProps<T extends string> {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  /** Wrapper layout classes. Defaults to a horizontally scrollable row. */
  className?: string
}

/**
 * Theme-aware pill selector shared across modules (tasks, goals, library filters).
 * Uses CSS variables so the active/inactive states adapt to light/dark themes.
 */
export default function ChipSelect<T extends string>({ options, value, onChange, size = 'md', className = 'flex gap-1 overflow-x-auto' }: ChipSelectProps<T>) {
  const pad = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
  return (
    <div className={className}>
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-full border transition ${pad}`}
            style={{
              borderColor: active ? 'var(--energy)' : 'var(--line)',
              background: active ? 'var(--energy)' : 'transparent',
              color: active ? '#11130f' : 'var(--muted)',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
