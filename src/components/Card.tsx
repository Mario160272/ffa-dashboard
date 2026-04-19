import { ReactNode } from 'react'

type Props = {
  title?: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}

export default function Card({ title, subtitle, right, children, className = '', padded = true }: Props) {
  return (
    <section className={`bg-white rounded-lg border border-black/5 shadow-sm ${className}`}>
      {(title || right) && (
        <header className="px-4 py-3 border-b border-black/5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {title && (
              <div className="text-[11px] font-bold tracking-widest uppercase text-black/70">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[10px] text-black/40 mt-0.5">{subtitle}</div>
            )}
          </div>
          {right}
        </header>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  )
}
