type Props = {
  label: string
  value: string | number
  unit?: string
  hint?: string
  accent?: 'red' | 'gold' | 'green' | 'neutral'
}

const COLOR: Record<NonNullable<Props['accent']>, string> = {
  red: '#C9002B',
  gold: '#917845',
  green: '#1D9E75',
  neutral: '#1A0008',
}

export default function Kpi({ label, value, unit, hint, accent = 'red' }: Props) {
  const color = COLOR[accent]
  return (
    <div className="bg-white rounded-lg border border-black/5 px-4 py-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-widest uppercase text-black/50">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-2xl font-bold" style={{ color }}>
          {value}
        </div>
        {unit && <div className="text-xs font-semibold text-black/50">{unit}</div>}
      </div>
      {hint && <div className="text-[10px] text-black/40 mt-0.5">{hint}</div>}
    </div>
  )
}
