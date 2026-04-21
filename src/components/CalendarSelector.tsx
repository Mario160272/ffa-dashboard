import { useMemo, useState } from 'react'

export type DayEntry = {
  date: string            // ISO yyyy-mm-dd
  kind: 'MATCH' | 'TRAINING'
  opponent?: string | null
  duration?: number
}

type Props = {
  entries: DayEntry[]
  value: string
  onChange: (iso: string) => void
  kindFilter?: 'MATCH' | 'TRAINING' | 'ALL'
  compact?: boolean
}

function ymDate(iso: string): { y: number; m: number; d: number } {
  const d = new Date(iso + 'T00:00:00')
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() }
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate()
}

function firstWeekday(y: number, m: number) {
  // 0=Monday
  const jd = new Date(y, m, 1).getDay()
  return jd === 0 ? 6 : jd - 1
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function CalendarSelector({ entries, value, onChange, kindFilter = 'ALL', compact }: Props) {
  const filtered = useMemo(
    () => (kindFilter === 'ALL' ? entries : entries.filter((e) => e.kind === kindFilter)),
    [entries, kindFilter],
  )

  const map = useMemo(() => {
    const m = new Map<string, DayEntry>()
    for (const e of filtered) m.set(e.date, e)
    return m
  }, [filtered])

  // Initial month from value or latest entry
  const initial = useMemo(() => {
    const iso = value || filtered[filtered.length - 1]?.date || new Date().toISOString().slice(0, 10)
    return ymDate(iso)
  }, [value, filtered])

  const [year, setYear] = useState(initial.y)
  const [month, setMonth] = useState(initial.m)

  function shiftMonth(delta: number) {
    let m = month + delta
    let y = year
    while (m < 0) { m += 12; y -= 1 }
    while (m > 11) { m -= 12; y += 1 }
    setMonth(m)
    setYear(y)
  }

  const grid: (string | null)[] = []
  const off = firstWeekday(year, month)
  const total = daysInMonth(year, month)
  for (let i = 0; i < off; i++) grid.push(null)
  for (let d = 1; d <= total; d++) {
    grid.push(`${year}-${pad(month + 1)}-${pad(d)}`)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })

  function formatOpt(e: DayEntry) {
    const d = e.date.slice(8, 10) + '/' + e.date.slice(5, 7)
    const letter = e.kind === 'MATCH' ? 'M' : 'T'
    const opp = e.opponent ? ` · vs ${e.opponent}` : ''
    return `${d} · ${letter}${opp}`
  }

  const sortedEntries = useMemo(() => [...filtered].sort((a, b) => a.date.localeCompare(b.date)), [filtered])

  const selectedEntry = map.get(value)

  return (
    <div className={`bg-white rounded-lg border border-black/5 ${compact ? 'p-2' : 'p-3'} shadow-sm`} style={{ minWidth: 280 }}>
      <div className="flex items-center gap-2 mb-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-black/10 rounded px-2 py-1.5 text-[11px] font-mono"
        >
          {sortedEntries.length === 0 && <option>— aucune session —</option>}
          {sortedEntries.map((e) => (
            <option key={e.date} value={e.date}>
              {formatOpt(e)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mb-1.5 text-[11px]">
        <button
          onClick={() => shiftMonth(-1)}
          className="w-6 h-6 rounded hover:bg-black/5 text-black/70"
          aria-label="Mois précédent"
        >‹</button>
        <div className="font-mono uppercase text-[11px] font-bold tracking-wider text-black/80">
          {monthLabel}
        </div>
        <button
          onClick={() => shiftMonth(1)}
          className="w-6 h-6 rounded hover:bg-black/5 text-black/70"
          aria-label="Mois suivant"
        >›</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] text-black/40 mb-1 font-mono tracking-wider">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((iso, i) => {
          if (!iso) return <div key={i} className="h-7" />
          const e = map.get(iso)
          const isSelected = iso === value
          const dayNum = Number(iso.slice(8, 10))
          let bg = 'transparent'
          let color = '#BCC8D4'
          let letter = ''
          if (e?.kind === 'MATCH') {
            bg = '#C9002B'
            color = '#FFF'
            letter = 'M'
          } else if (e?.kind === 'TRAINING') {
            bg = '#185FA5'
            color = '#FFF'
            letter = 'T'
          }
          return (
            <button
              key={i}
              onClick={() => e && onChange(iso)}
              disabled={!e}
              className={`h-7 rounded text-[9px] font-mono font-bold transition-all relative ${
                isSelected ? 'ring-2 ring-offset-0' : ''
              } ${!e ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'}`}
              style={{
                background: bg,
                color,
                ['--tw-ring-color' as string]: '#C9002B',
              }}
              title={e ? `${iso} · ${e.kind}${e.opponent ? ' vs ' + e.opponent : ''}` : iso}
            >
              {letter || dayNum}
            </button>
          )
        })}
      </div>

      {selectedEntry && (
        <div
          className="mt-2 p-2 rounded text-[11px]"
          style={{
            background: selectedEntry.kind === 'MATCH' ? 'rgba(201,0,43,0.06)' : 'rgba(24,95,165,0.05)',
            borderLeft: `3px solid ${selectedEntry.kind === 'MATCH' ? '#C9002B' : '#185FA5'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider text-white"
              style={{ background: selectedEntry.kind === 'MATCH' ? '#C9002B' : '#185FA5' }}
            >
              {selectedEntry.kind}
            </span>
            <span className="font-mono text-black/70">
              {selectedEntry.date.slice(8, 10)}/{selectedEntry.date.slice(5, 7)}/{selectedEntry.date.slice(0, 4)}
            </span>
          </div>
          {selectedEntry.opponent && (
            <div className="mt-1 font-semibold">vs {selectedEntry.opponent}</div>
          )}
          {selectedEntry.duration != null && selectedEntry.duration > 0 && (
            <div className="text-[10px] text-black/50 mono">durée {Math.round(selectedEntry.duration)}′</div>
          )}
        </div>
      )}
    </div>
  )
}
