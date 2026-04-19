import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import { useGpsData } from '../hooks/useGpsData'
import { fmt, fmtDate, mondayOf } from '../utils/format'
import { isFullSession } from '../utils/excel'
import { MATCH_MODEL } from '../data/matches'
import { calcACWRCombined, calcACWRExternal, calcACWRInternal, filterFullSessions, getZone, zoneColor } from '../utils/acwr'

type Tab = 'charge' | 'model'

function sumBy<T>(arr: T[], k: (r: T) => number): number {
  return arr.reduce((s, r) => s + k(r), 0)
}

export default function WeekAnalysis() {
  const { data, loading, error } = useGpsData()
  const [tab, setTab] = useState<Tab>('charge')

  const weeks = useMemo(() => {
    const s = new Set<string>()
    for (const r of data) {
      if (!r.Date) continue
      if (!isFullSession(r.subjects)) continue
      s.add(mondayOf(r.Date))
    }
    return Array.from(s).sort()
  }, [data])

  const [selected, setSelected] = useState<string>('')
  const chosen = selected || weeks[weeks.length - 1] || ''

  const weekRows = useMemo(() => {
    if (!chosen) return []
    const start = new Date(chosen)
    const end = new Date(chosen)
    end.setDate(end.getDate() + 7)
    return data.filter(
      (r) =>
        isFullSession(r.subjects) &&
        r.Date &&
        new Date(r.Date) >= start &&
        new Date(r.Date) < end,
    )
  }, [data, chosen])

  const weekTot = useMemo(() => {
    if (!weekRows.length) return null
    const trainings = weekRows.filter((r) => r.IS_MATCH === 'TRAINING')
    const matches = weekRows.filter((r) => r.IS_MATCH === 'MATCH')
    return {
      dist: sumBy(weekRows, (r) => r.Distanza) / Math.max(1, new Set(weekRows.map((r) => r.Name)).size),
      hsr: sumBy(weekRows, (r) => r['Vel > 16 (m)']) / Math.max(1, new Set(weekRows.map((r) => r.Name)).size),
      acc: sumBy(weekRows, (r) => r['Acc > 2 (m)']) / Math.max(1, new Set(weekRows.map((r) => r.Name)).size),
      dec: sumBy(weekRows, (r) => r['Dec <-2 (m)']) / Math.max(1, new Set(weekRows.map((r) => r.Name)).size),
      trainingDays: new Set(trainings.map((r) => r.Date)).size,
      matchDays: new Set(matches.map((r) => r.Date)).size,
    }
  }, [weekRows])

  const weeklySeries = useMemo(() => {
    const map = new Map<string, { week: string; dist: number; n: number }>()
    for (const r of data) {
      if (!isFullSession(r.subjects) || !r.Date) continue
      const w = mondayOf(r.Date)
      if (!map.has(w)) map.set(w, { week: w, dist: 0, n: 0 })
      const agg = map.get(w)!
      agg.dist += r.Distanza
      agg.n += 1
    }
    return Array.from(map.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((e) => ({ week: e.week.slice(5), dist: Math.round(e.dist / Math.max(1, e.n)) }))
  }, [data])

  // Match model donuts
  const donuts = useMemo(() => {
    if (!weekTot) return []
    const per = MATCH_MODEL.per80min
    const items = [
      { label: 'Distance', week: weekTot.dist, ref: per.dist, unit: 'm' },
      { label: 'HSR',      week: weekTot.hsr,  ref: per.hsr,  unit: 'm' },
      { label: 'ACC',      week: weekTot.acc,  ref: per.acc,  unit: 'm' },
      { label: 'DEC',      week: weekTot.dec,  ref: per.dec,  unit: 'm' },
    ]
    return items.map((i) => {
      const ratio = i.ref > 0 ? Math.min(i.week / i.ref, 2) : 0
      return { ...i, ratio }
    })
  }, [weekTot])

  // ACWR équipe (simple mean over players)
  const acwrTeam = useMemo(() => {
    if (!chosen || !data.length) return null
    const end = new Date(chosen)
    end.setDate(end.getDate() + 6)
    const ref = end.toISOString().slice(0, 10)
    const full = filterFullSessions(data)
    const players = Array.from(new Set(full.map((r) => r.Name)))
    const exts: number[] = []
    const ints: number[] = []
    for (const p of players) {
      const ps = full.filter((r) => r.Name === p)
      const ext = calcACWRExternal(ps, ref)
      const int = calcACWRInternal(ps, ref)
      if (ext != null) exts.push(ext)
      if (int != null) ints.push(int)
    }
    const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null)
    const ext = mean(exts)
    const int = mean(ints)
    const comb = calcACWRCombined(ext, int)
    return { ext, int, comb }
  }, [data, chosen])

  return (
    <>
      <Header
        title="Week Analysis"
        subtitle="Cumul hebdo + Match Model /80 min"
        badge="03"
        right={
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded overflow-hidden">
              <button
                onClick={() => setTab('charge')}
                className={`px-3 py-1.5 text-xs font-semibold ${tab === 'charge' ? 'bg-[#C9002B] text-white' : 'text-white/70'}`}
              >
                Charge
              </button>
              <button
                onClick={() => setTab('model')}
                className={`px-3 py-1.5 text-xs font-semibold ${tab === 'model' ? 'bg-[#C9002B] text-white' : 'text-white/70'}`}
              >
                Match Model
              </button>
            </div>
            <select
              value={chosen}
              onChange={(e) => setSelected(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm"
            >
              {weeks.length === 0 && <option>— aucune semaine —</option>}
              {weeks.map((w) => (
                <option key={w} value={w} className="text-black">
                  Semaine du {fmtDate(w)}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}
        {error && <div className="text-sm text-ffa-red">Erreur : {error}</div>}

        {tab === 'charge' && weekTot && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Distance totale" value={fmt(weekTot.dist, 0)} unit="m / joueur" accent="red" />
              <Kpi label="HSR semaine" value={fmt(weekTot.hsr, 0)} unit="m" accent="red" />
              <Kpi label="ACC semaine" value={fmt(weekTot.acc, 0)} unit="m" accent="gold" />
              <Kpi label="DEC semaine" value={fmt(weekTot.dec, 0)} unit="m" accent="gold" />
            </div>

            <Card title="Distance moyenne par joueur — saison complète">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={weeklySeries} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                    <CartesianGrid stroke="#EEE" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="dist" fill="#C9002B" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        {tab === 'model' && donuts.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {donuts.map((d) => {
                const pct = Math.round(d.ratio * 100)
                const color = d.ratio > 1.5 ? '#C9002B' : d.ratio < 0.8 ? '#917845' : '#1D9E75'
                const pieData = [
                  { name: 'Atteint', value: Math.min(d.ratio, 1) },
                  { name: 'Reste', value: Math.max(0, 1 - Math.min(d.ratio, 1)) },
                ]
                return (
                  <Card key={d.label} title={d.label} padded={false}>
                    <div className="relative" style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                          >
                            <Cell fill={color} />
                            <Cell fill="#EEE" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-2xl font-bold" style={{ color }}>{pct}%</div>
                        <div className="text-[10px] text-black/50">/ match 80′</div>
                      </div>
                    </div>
                    <div className="p-3 text-[11px] text-black/60 border-t border-black/5">
                      {fmt(d.week, 0)} {d.unit} · réf. {fmt(d.ref, 0)} {d.unit}
                    </div>
                  </Card>
                )
              })}
            </div>

            {acwrTeam && (
              <Card title="ACWR Équipe" subtitle="Moyenne sur tous les joueurs (full sessions)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['ext', 'int', 'comb'] as const).map((k) => {
                    const val = acwrTeam[k]
                    const z = getZone(val)
                    return (
                      <div key={k} className="rounded-lg border border-black/5 p-4">
                        <div className="text-[10px] tracking-widest uppercase text-black/50">
                          {k === 'ext' ? 'ACWR Externe' : k === 'int' ? 'ACWR Interne' : 'ACWR Combiné 60/40'}
                        </div>
                        <div className="mt-1 text-3xl font-bold" style={{ color: zoneColor(z) }}>
                          {val != null ? val.toFixed(2) : '—'}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold" style={{ color: zoneColor(z) }}>
                          {z}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  )
}
