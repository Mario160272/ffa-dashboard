import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import { useGpsData } from '../hooks/useGpsData'
import { isFullSession } from '../utils/excel'
import { parseSubject, ampColor, ampType } from '../data/exercises'
import { fmt } from '../utils/format'

type Period = 'saison' | 'mois' | 'semaine'

const CAT_COLORS: Record<string, string> = {
  PHYSIQUE: '#C9002B',
  TACTIQUE: '#500515',
  TECHNIQUE: '#917845',
  AUTRE: '#BCC8D4',
}

// Exclusion filter : FULLMATCH/FULLTRAINING/1STTIME/2NDTIME
function isValidExercise(subject: string): boolean {
  if (!subject) return false
  if (isFullSession(subject)) return false
  if (/1STTIME|2NDTIME/i.test(subject)) return false
  return true
}

export default function Repartition() {
  const { data, loading, error } = useGpsData()
  const [period, setPeriod] = useState<Period>('saison')

  const exRows = useMemo(
    () => data.filter((r) => isValidExercise(r.subjects) && r.IS_MATCH === 'TRAINING' && r['TOTAL TIME'] > 0),
    [data],
  )

  // Full sessions for volume block
  const fullRows = useMemo(() => data.filter((r) => isFullSession(r.subjects)), [data])
  const trainDays = useMemo(() => {
    const s = new Set<string>()
    for (const r of fullRows) if (r.IS_MATCH === 'TRAINING' && r.Date) s.add(r.Date)
    return s
  }, [fullRows])
  const matchDays = useMemo(() => {
    const s = new Set<string>()
    for (const r of fullRows) if (r.IS_MATCH === 'MATCH' && r.Date) s.add(r.Date)
    return s
  }, [fullRows])

  // Count of unique exercises (subjects) used + count of distinct exercise-sessions
  const exerciseCount = useMemo(() => {
    const seenSessions = new Set<string>()
    for (const r of exRows) seenSessions.add(`${r.Date}__${r.subjects}`)
    return seenSessions.size
  }, [exRows])

  const catDonut = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of exRows) {
      const { cat } = parseSubject(r.subjects)
      map.set(cat, (map.get(cat) ?? 0) + r['TOTAL TIME'])
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1
    return {
      total: Math.round(total),
      data: Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
          name,
          value: Math.round(value),
          pct: Math.round((value / total) * 100),
        })),
    }
  }, [exRows])

  const subBars = useMemo(() => {
    const map = new Map<string, { sub: string; cat: string; minutes: number }>()
    for (const r of exRows) {
      const { cat, sub } = parseSubject(r.subjects)
      const key = `${cat}_${sub}`
      if (!map.has(key)) map.set(key, { sub, cat, minutes: 0 })
      map.get(key)!.minutes += r['TOTAL TIME']
    }
    return Array.from(map.values())
      .map((e) => ({ ...e, minutes: Math.round(e.minutes) }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [exRows])

  const stacked = useMemo(() => {
    const map = new Map<string, { month: string; PHYSIQUE: number; TACTIQUE: number; TECHNIQUE: number; AUTRE: number }>()
    for (const r of exRows) {
      if (!r.Date) continue
      const month = r.Date.slice(0, 7)
      if (!map.has(month)) {
        map.set(month, { month, PHYSIQUE: 0, TACTIQUE: 0, TECHNIQUE: 0, AUTRE: 0 })
      }
      const { cat } = parseSubject(r.subjects)
      const bucket = map.get(month)!
      ;(bucket as Record<string, number | string>)[cat] = (bucket[cat] as number) + r['TOTAL TIME']
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
  }, [exRows])

  const exerciseCards = useMemo(() => {
    const map = new Map<string, {
      subject: string; cat: string
      n: number
      dist: number; hsr: number; sprint: number; acc: number
      dec: number; distMin: number; vmax: number; durMean: number
      mp: number
    }>()
    for (const r of exRows) {
      if (!map.has(r.subjects)) {
        map.set(r.subjects, {
          subject: r.subjects, cat: parseSubject(r.subjects).cat, n: 0,
          dist: 0, hsr: 0, sprint: 0, acc: 0,
          dec: 0, distMin: 0, vmax: 0, durMean: 0, mp: 0,
        })
      }
      const e = map.get(r.subjects)!
      e.n += 1
      e.dist += r.Distanza
      e.hsr += r['Vel > 16 (m)']
      e.sprint += r['Dist > 25,2 km/h']
      e.acc += r['Acc > 2 (m)']
      e.dec += r['Dec <-2 (m)']
      e.distMin += r['Dist/min']
      e.vmax = Math.max(e.vmax, r['V max'])
      e.durMean += r['TOTAL TIME']
      e.mp += r['Met Power']
    }
    return Array.from(map.values())
      .filter((e) => e.n >= 3)
      .map((e) => ({
        ...e,
        dist: e.dist / e.n,
        hsr: e.hsr / e.n,
        sprint: e.sprint / e.n,
        acc: e.acc / e.n,
        dec: e.dec / e.n,
        distMin: e.distMin / e.n,
        durMean: e.durMean / e.n,
        mp: e.mp / e.n,
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 12)
  }, [exRows])

  // Volume full sessions block
  const volumeMonthly = useMemo(() => {
    const map = new Map<string, { month: string; Training: number; Match: number }>()
    const byDate = new Map<string, Set<'T' | 'M'>>()
    for (const r of fullRows) {
      if (!r.Date) continue
      const m = r.Date.slice(0, 7)
      if (!byDate.has(r.Date)) byDate.set(r.Date, new Set())
      byDate.get(r.Date)!.add(r.IS_MATCH === 'MATCH' ? 'M' : 'T')
      if (!map.has(m)) map.set(m, { month: m, Training: 0, Match: 0 })
    }
    for (const [date, kinds] of byDate.entries()) {
      const m = date.slice(0, 7)
      const bucket = map.get(m)!
      if (kinds.has('T')) bucket.Training += 1
      if (kinds.has('M')) bucket.Match += 1
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
  }, [fullRows])

  const ratio = matchDays.size > 0 ? trainDays.size / matchDays.size : 0

  return (
    <>
      <Header
        title="Répartition des séances"
        subtitle="Balance PHYSIQUE / TACTIQUE / TECHNIQUE · volume full sessions"
        badge="06"
        right={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm mono"
          >
            <option value="saison" className="text-black">Saison</option>
            <option value="mois" className="text-black">Mois</option>
            <option value="semaine" className="text-black">Semaine</option>
          </select>
        }
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}
        {error && <div className="text-sm text-ffa-red">Erreur : {error}</div>}

        {/* Section Volume Full Sessions */}
        <Card title="Volume Full Sessions" subtitle="Décompte officiel saison 25/26">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Kpi label="Entraînements" value={trainDays.size} accent="blue" hint="jours training" />
            <Kpi label="Matchs" value={matchDays.size} accent="red" hint="jours match" />
            <Kpi label="Ratio T:M" value={ratio.toFixed(1) + ':1'} accent="gold" />
            <Kpi label="Total jours" value={trainDays.size + matchDays.size} accent="neutral" />
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={volumeMonthly} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid stroke="#EEE" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Training" stackId="a" fill="#BCC8D4" />
                <Bar dataKey="Match" stackId="a" fill="#C9002B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut + Sub-categories */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card title="Répartition par catégorie" subtitle={`${fmt(catDonut.total)} min · filtrage FULL/1ST/2ND exclu`} className="md:col-span-2">
            <div className="relative" style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={catDonut.data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={75}
                    outerRadius={105}
                    label={(e) => `${e.name} ${e.pct}%`}
                    labelLine={false}
                  >
                    {catDonut.data.map((d) => (
                      <Cell key={d.name} fill={CAT_COLORS[d.name] ?? '#BCC8D4'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v, 0) + ' min'} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[22px] font-bold kpi-value text-ffa-red">{fmt(exerciseCount)}</div>
                <div className="text-[10px] text-black/50 mono uppercase tracking-widest">exercices</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-black/50 mono text-center">
              {fmt(exerciseCount)} exercices réalisés sur {trainDays.size} séances d'entraînement
            </div>
          </Card>

          <Card title="Sous-catégories" subtitle="Minutes cumulées — décroissant" className="md:col-span-3">
            <div className="space-y-1.5">
              {subBars.map((b, i) => {
                const max = subBars[0]?.minutes ?? 1
                const pct = (b.minutes / max) * 100
                const col = CAT_COLORS[b.cat] ?? '#BCC8D4'
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-40 flex items-center gap-2">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white uppercase"
                        style={{ background: col }}
                      >
                        {b.cat.slice(0, 4)}
                      </span>
                      <div className="text-[12px] font-semibold truncate">{b.sub}</div>
                    </div>
                    <div className="flex-1 h-6 rounded bg-black/5 relative overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${pct}%`, background: col }}
                      />
                    </div>
                    <div className="w-20 text-right mono text-[12px] font-bold">{fmt(b.minutes)}</div>
                    <div className="w-8 text-[10px] text-black/40 mono">min</div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Évolution mensuelle stacked */}
        <Card title="Évolution mensuelle" subtitle="Stacked bars par catégorie (minutes)">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={stacked} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid stroke="#EEE" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                <Tooltip formatter={(v: number) => fmt(v, 0) + ' min'} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="PHYSIQUE" stackId="a" fill={CAT_COLORS.PHYSIQUE} />
                <Bar dataKey="TACTIQUE" stackId="a" fill={CAT_COLORS.TACTIQUE} />
                <Bar dataKey="TECHNIQUE" stackId="a" fill={CAT_COLORS.TECHNIQUE} />
                <Bar dataKey="AUTRE" stackId="a" fill={CAT_COLORS.AUTRE} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cartes exercices 8 métriques */}
        <Card title="Exercices les plus utilisés" subtitle="Top 12 — 8 métriques par exercice">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exerciseCards.map((e) => (
              <div
                key={e.subject}
                className="rounded-lg border border-black/5 p-3 bg-white"
                style={{ borderLeft: `4px solid ${CAT_COLORS[e.cat] ?? '#BCC8D4'}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[9px] font-bold text-white mono uppercase"
                    style={{ background: CAT_COLORS[e.cat] ?? '#BCC8D4' }}
                  >
                    {e.cat}
                  </span>
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[9px] font-bold text-white mono"
                    style={{ background: ampColor(e.mp) }}
                  >
                    {ampType(e.mp)}
                  </span>
                  <span className="ml-auto text-[10px] text-black/40 mono">n={e.n}</span>
                </div>
                <div className="mt-2 text-[12px] font-semibold truncate" title={e.subject}>
                  {e.subject.replace('PE_ACFF_', '')}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 text-[10px]">
                  <Metric lab="Dist"    v={fmt(e.dist, 0)} />
                  <Metric lab="HSR"     v={fmt(e.hsr, 0)} />
                  <Metric lab="Sprint"  v={fmt(e.sprint, 0)} />
                  <Metric lab="ACC"     v={fmt(e.acc, 0)} />
                  <Metric lab="DEC"     v={fmt(e.dec, 0)} />
                  <Metric lab="Dist/min" v={fmt(e.distMin, 1)} />
                  <Metric lab="Vmax"    v={e.vmax.toFixed(1)} />
                  <Metric lab="Durée"   v={fmt(e.durMean, 0) + '′'} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function Metric({ lab, v }: { lab: string; v: string }) {
  return (
    <div>
      <div className="text-[8px] uppercase tracking-widest text-black/40 mono">{lab}</div>
      <div className="font-bold text-black/80 mono">{v}</div>
    </div>
  )
}
