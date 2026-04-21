type Props = {
  label: string
  value: string | number
  unit?: string
  hint?: string
  accent?: 'red' | 'gold' | 'green' | 'neutral' | 'blue'
}

const COLOR: Record<NonNullable<Props['accent']>, string> = {
  red: '#C9002B',
  gold: '#917845',
  green: '#1D9E75',
  blue: '#185FA5',
  neutral: '#1A0008',
}

export default function Kpi({ label, value, unit, hint, accent = 'red' }: Props) {
  const color = COLOR[accent]
  return (
    <div
      className="kpi-card bg-white rounded-lg border border-black/5 px-4 py-3 shadow-sm"
      style={{ ['--kpi-accent' as string]: color }}
    >
      <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-black/50">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-2xl font-bold kpi-value" style={{ color }}>
          {value}
        </div>
        {unit && <div className="text-xs font-semibold text-black/50 mono">{unit}</div>}
      </div>
      {hint && <div className="text-[10px] text-black/40 mt-0.5">{hint}</div>}
    </div>
  )
}
