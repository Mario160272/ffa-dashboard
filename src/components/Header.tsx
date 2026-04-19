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
      className="px-8 py-5 flex items-center gap-5 border-b"
      style={{ background: '#1A0008', color: '#FFFFFF' }}
    >
      <img
        src="/assets/FFA_logo_baseline.png"
        alt="FFA"
        className="h-14 w-auto object-contain bg-white rounded p-1"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          {badge && (
            <span
              className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
              style={{ background: '#C9002B', color: '#FFF' }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <div className="text-[12px] text-white/70 mt-1">{subtitle}</div>
        )}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </header>
  )
}
