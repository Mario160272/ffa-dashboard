import { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  badge?: string
  right?: ReactNode
}

export default function Header({ title, subtitle, badge, right }: Props) {
  return (
    <header
      className="relative px-8 py-5 flex items-center gap-4 text-white"
      style={{
        background: 'linear-gradient(90deg, #1A0008 0%, #2D0012 100%)',
      }}
    >
      {/* Ligne rouge gauche 3px */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: 3, background: '#C9002B' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {badge && (
            <span
              className="inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-[0.15em] uppercase"
              style={{ background: 'rgba(201,0,43,0.9)', color: '#FFF' }}
            >
              {badge}
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
        </div>
        {subtitle && (
          <div className="text-[12px] text-white/70 mt-1 font-mono">{subtitle}</div>
        )}
      </div>
      {right && <div className="flex items-center gap-3 flex-shrink-0">{right}</div>}
    </header>
  )
}
