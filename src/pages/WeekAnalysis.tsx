import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell,
  PieChart, Pie,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import PlayerAvatar from '../components/PlayerAvatar'
import { useGpsData } from '../hooks/useGpsData'
import { useConvalida } from '../hooks/useConvalida'
import { fmt, fmtDate, mondayOf, shortDate } from '../utils/format'
import { isFullSession } from '../utils/excel'
import { PLAYER_BY_NAME, PLAYERS } from '../data/players'
import { opponentByDate } from '../data/convalida'
import {
  aggregateByWeek, computeMatchRef80, microCycle, teamAveragePerSession,
} from '../utils/weekAnalysis'

function sparklineData(weeks: ReturnType<typeof aggregateByWeek>, key: 'dist' | 'hsr' | 'acc' | 'tlMean' | 'rpeMean', n = 6) {
  const last = weeks.slice(-n)
  return last.map((w) => ({ week: w.week.slice(5), val: (w[key] as number) ?? 0 }))
}

function KpiCardRich({
  label, value, unit, color, series, refValue, hint,
}: {
  label: string
  value: string | number
  unit?: string
  color: string
  series: { week: string; val: number }[]
  refValue?: number
  hint?: string
}) {
  const cur = series.length ? series[series.length - 1].val : 0
  const pct = refValue && refValue > 0 ? Math.round((cur / refValue) * 100) : null
  return (
    <div
      className="kpi-card bg-white rounded-lg border border-black/5 p-4 shadow-sm"
      style={{ ['--kpi-accent' as string]: color, minHeight: 140 }}
    >
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-black/50">
          {label}
        </div>
        {pct != null && (
          <div
            className="text-[10px] font-mono font-bold tracking-tight"
            style={{ color: pct >= 90 ? color : pct >= 70 ? '#917845' : '#C9002B' }}
          >
            {pct}%
          </div>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-[26px] font-bold kpi-value leading-none" style={{ color }}>
          {value}
        </div>
        {unit && <div className="text-[11px] font-semibold text-black/50 mono">{unit}</div>}
      </div>
      {hint && <div className="text-[10px] text-black/40 mt-0.5 mono">{hint}</div>}
      <div style={{ width: '100%', height: 44, marginTop: 8 }}>
        <ResponsiveContainer>
          <LineChart data={series} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Donut({ label, ratio, color, note }: { label: string; ratio: number; color: string; note?: string }) {
  const pct = Math.round(ratio * 100)
  const col = ratio > 1.2 ? '#C9002B' : ratio < 0.7 ? '#917845' : color
  const pieData = [
    { name: 'At', value: Math.min(ratio, 1.3) },
    { name: 'Rest', value: Math.max(0, 1.3 - Math.min(ratio, 1.3)) },
  ]
  return (
    <div className="bg-white rounded-lg border border-black/5 p-3">
      <div className="text-[10px] font-bold tracking-widest uppercase text-black/50 text-center">
        {label}
      </div>
      <div className="relative" style={{ width: '100%', height: 150 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              innerRadius={48}
              outerRadius={64}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={col} />
              <Cell fill="#EEE" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-xl font-bold kpi-value" style={{ color: col }}>
            {pct}%
          </div>
          <div className="text-[9px] text-black/40 mono">vs match /80′</div>
        </div>
      </div>
      {note && <div className="text-[10px] text-black/50 text-center mono">{note}</div>}
    </div>
  )
}

export default function WeekAnalysis() {
  const { data, loading, error } = useGpsData()
  const fixtures = useConvalida()

  const sessionsTA = useMemo(() => teamAveragePerSession(data), [data])
  const weeks = useMemo(() => aggregateByWeek(sessionsTA), [sessionsTA])
  const matchRef = useMemo(() => computeMatchRef80(sessionsTA), [sessionsTA])

  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const chosen = selectedWeek || weeks[weeks.length - 1]?.week || ''
  const curWeek = weeks.find((w) => w.week === chosen)

  // Microcycle: use match in selected week, or most recent match
  const referenceMatch = useMemo(() => {
    if (curWeek?.matchDate) return curWeek.matchDate
    const allMatches = sessionsTA.filter((s) => s.isMatch)
    return allMatches[allMatches.length - 1]?.date ?? ''
  }, [curWeek, sessionsTA])

  const cycle = useMemo(
    () => (referenceMatch ? microCycle(sessionsTA, referenceMatch) : []),
    [sessionsTA, referenceMatch],
  )

  const opponent = opponentByDate(fixtures, referenceMatch)

  // Saison bar chart : distances par semaine, rouge = semaine avec match
  const seasonBars = useMemo(
    () =>
      weeks.map((w) => ({
        week: w.week.slice(5),
        weekFull: w.week,
        dist: Math.round(w.dist),
        hasMatch: w.hasMatch,
        selected: w.week === chosen,
      })),
    [weeks, chosen],
  )

  // Heatmap joueurs : 6 dernières semaines · distance moy/session par joueur
  const heatmap = useMemo(() => {
    const last6 = weeks.slice(-6)
    return PLAYERS.map((p) => {
      const cells = last6.map((w) => {
        const playerRows = data.filter(
          (r) => r.Name === p.name && isFullSession(r.subjects) && mondayOf(r.Date) === w.week,
        )
        const dist = playerRows.length
          ? playerRows.reduce((s, r) => s + r.Distanza, 0) / playerRows.length
          : 0
        return { week: w.week.slice(5), dist: Math.round(dist) }
      })
      return { player: p, cells }
    })
  }, [weeks, data])

  const heatMax = Math.max(1, ...heatmap.flatMap((h) => h.cells.map((c) => c.dist)))

  function heatColor(v: number): string {
    if (v <= 0) return '#F5F5F5'
    const ratio = Math.min(1, v / heatMax)
    // orange → red scale
    const r = 201
    const g = Math.round(201 * (1 - ratio) * 0.3 + 50 * (1 - ratio))
    const b = 43
    return `rgba(${r}, ${g}, ${b}, ${0.25 + ratio * 0.75})`
  }

  // Bar chart joueurs : distance moy/session vs match ref /80min
  const playerBars = useMemo(() => {
    return PLAYERS.map((p) => {
      const fullP = data.filter((r) => r.Name === p.name && isFullSession(r.subjects))
      const nonZero = fullP.filter((r) => r['TOTAL TIME'] > 0)
      if (!nonZero.length) return { name: p.name, dist: 0, pct: 0 }
      const avgDist = nonZero.reduce((s, r) => s + r.Distanza, 0) / nonZero.length
      return {
        name: p.name,
        dist: Math.round(avgDist),
        pct: matchRef.dist > 0 ? Math.round((avgDist / matchRef.dist) * 100) : 0,
      }
    }).sort((a, b) => b.dist - a.dist)
  }, [data, matchRef])

  function pctColor(pct: number): string {
    if (pct >= 70) return '#C9002B'
    if (pct >= 60) return '#185FA5'
    return '#917845'
  }

  const mdColor = (slot: typeof cycle[number]) => {
    if (slot.dayOffset === 0) return '#C9002B'
    if (!slot.session) return '#BCC8D4'
    return slot.session.mp > 10 ? '#C9002B' : slot.session.mp > 7 ? '#917845' : '#1D9E75'
  }

  return (
    <>
      <Header
        title="Week Analysis"
        subtitle="Microcycle · Match Model · Heatmap joueurs"
        badge="03"
        right={
          <select
            value={chosen}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm mono"
          >
            {weeks.length === 0 && <option>— aucune semaine —</option>}
            {weeks.map((w) => (
              <option key={w.week} value={w.week} className="text-black">
                Sem. {fmtDate(w.week)}{w.hasMatch ? ' · MATCH' : ''}
              </option>
            ))}
          </select>
        }
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}
        {error && <div className="text-sm text-ffa-red">Erreur : {error}</div>}

        {/* KPI enrichies */}
        {curWeek && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCardRich
              label="Distance"
              value={fmt(curWeek.dist, 0)}
              unit="m"
              color="#C9002B"
              series={sparklineData(weeks, 'dist')}
              refValue={matchRef.dist * 4}
              hint="somme semaine"
            />
            <KpiCardRich
              label="HSR"
              value={fmt(curWeek.hsr, 0)}
              unit="m"
              color="#185FA5"
              series={sparklineData(weeks, 'hsr')}
              refValue={matchRef.hsr * 4}
              hint="somme semaine"
            />
            <KpiCardRich
              label="ACC"
              value={fmt(curWeek.acc, 0)}
              unit="m"
              color="#917845"
              series={sparklineData(weeks, 'acc')}
              refValue={matchRef.acc * 4}
              hint="somme semaine"
            />
            <KpiCardRich
              label="TL"
              value={curWeek.tlMean != null ? fmt(curWeek.tlMean, 0) : '—'}
              unit="UA"
              color="#1D9E75"
              series={sparklineData(weeks, 'tlMean')}
              hint="moy joueurs"
            />
            <div
              className="kpi-card rounded-lg p-4 shadow-sm flex flex-col justify-between"
              style={{
                ['--kpi-accent' as string]: '#C9002B',
                background: '#1A0008',
                color: '#FFF',
                minHeight: 140,
              }}
            >
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/60">
                RPE
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <div className="text-[26px] font-bold kpi-value leading-none" style={{ color: '#C9002B' }}>
                    {curWeek.rpeMean != null ? curWeek.rpeMean.toFixed(1) : '—'}
                  </div>
                  <div className="text-[11px] font-semibold text-white/50 mono">/10</div>
                </div>
                <div className="text-[10px] text-white/40 mt-0.5 mono">moy joueurs</div>
                <div style={{ width: '100%', height: 34, marginTop: 6 }}>
                  <ResponsiveContainer>
                    <LineChart data={sparklineData(weeks, 'rpeMean')} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <Line type="monotone" dataKey="val" stroke="#C9002B" strokeWidth={1.8} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Microcycle MD- */}
        {cycle.length > 0 && (
          <Card
            title="Microcycle"
            subtitle={
              referenceMatch
                ? `MD-5 → MATCH${opponent ? ` vs ${opponent}` : ''} · ${fmtDate(referenceMatch)}`
                : 'Pas de match trouvé'
            }
          >
            <div className="grid grid-cols-6 gap-3">
              {cycle.map((slot, i) => {
                const col = mdColor(slot)
                const isMatch = slot.dayOffset === 0
                return (
                  <div
                    key={i}
                    className="rounded-lg p-3 text-center relative"
                    style={{
                      background: isMatch ? '#C9002B' : '#FFF',
                      color: isMatch ? '#FFF' : '#202020',
                      border: `1px solid ${isMatch ? '#C9002B' : 'rgba(0,0,0,0.08)'}`,
                      borderLeft: `3px solid ${col}`,
                    }}
                  >
                    <div className="text-[10px] font-mono font-bold tracking-widest opacity-80">
                      {slot.label}
                    </div>
                    <div className="text-[10px] font-mono mt-0.5 opacity-60">
                      {shortDate(slot.date)}
                    </div>
                    <div className="mt-2 text-[18px] font-bold kpi-value">
                      {slot.session ? fmt(slot.session.dist, 0) : '—'}
                    </div>
                    <div className="text-[9px] opacity-60 mono">m dist</div>
                    <div className="text-[10px] mt-1 mono opacity-80">
                      {slot.session?.rpeMean != null ? `RPE ${slot.session.rpeMean.toFixed(1)}` : 'RPE —'}
                    </div>
                    {isMatch && opponent && (
                      <div className="mt-1 text-[9px] font-bold tracking-wider uppercase opacity-90">
                        vs {opponent}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Donuts Match Model */}
        {curWeek && (
          <Card
            title="Match Model"
            subtitle={`Référence /80′ — ${fmt(matchRef.dist, 0)}m · ${fmt(matchRef.hsr, 0)}m HSR · ${fmt(matchRef.acc, 0)}m ACC`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Donut label="Distance" ratio={matchRef.dist > 0 ? curWeek.dist / (matchRef.dist * 4) : 0} color="#C9002B" note={`${fmt(curWeek.dist, 0)} m · ref ${fmt(matchRef.dist * 4, 0)}`} />
              <Donut label="HSR" ratio={matchRef.hsr > 0 ? curWeek.hsr / (matchRef.hsr * 4) : 0} color="#185FA5" note={`${fmt(curWeek.hsr, 0)} m · ref ${fmt(matchRef.hsr * 4, 0)}`} />
              <Donut label="ACC" ratio={matchRef.acc > 0 ? curWeek.acc / (matchRef.acc * 4) : 0} color="#917845" note={`${fmt(curWeek.acc, 0)} m · ref ${fmt(matchRef.acc * 4, 0)}`} />
              <Donut label="TL" ratio={curWeek.tlMean ? curWeek.tlMean / 400 : 0} color="#1D9E75" note={curWeek.tlMean != null ? `${fmt(curWeek.tlMean, 0)} UA` : '—'} />
            </div>
          </Card>
        )}

        {/* Saison bar chart */}
        {seasonBars.length > 0 && (
          <Card title="Distance moyenne Team Average / semaine" subtitle="Rouge = semaine avec match · Gris = training only · Rouge vif = sélection">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={seasonBars} margin={{ top: 10, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid stroke="#EEE" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fontFamily: 'DM Mono' }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                  <Tooltip />
                  <Bar dataKey="dist" radius={[3, 3, 0, 0]}>
                    {seasonBars.map((b, i) => {
                      let c = '#BCC8D4'
                      if (b.selected) c = '#C9002B'
                      else if (b.hasMatch) c = '#500515'
                      return <Cell key={i} fill={c} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Heatmap joueurs */}
        {heatmap.length > 0 && (
          <Card title="Heatmap joueurs" subtitle="Distance moy/session · 6 dernières semaines">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-black/50 border-b border-black/10">
                    <th className="text-left py-2 px-2">Joueur</th>
                    {heatmap[0]?.cells.map((c) => (
                      <th key={c.week} className="text-center py-2 px-2 font-mono">{c.week}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((h) => (
                    <tr key={h.player.name} className="border-b border-black/5">
                      <td className="py-1.5 px-2 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <PlayerAvatar name={h.player.name} prenom={h.player.prenom} photo={h.player.photo} size={22} />
                          {h.player.name}
                        </span>
                      </td>
                      {h.cells.map((c, i) => (
                        <td key={i} className="py-1.5 px-1 text-center">
                          <div
                            className="rounded mono text-[10px] font-bold py-1.5"
                            style={{
                              background: heatColor(c.dist),
                              color: c.dist > heatMax * 0.5 ? '#FFF' : '#202020',
                            }}
                          >
                            {c.dist > 0 ? fmt(c.dist, 0) : '·'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Bar chart joueurs vs match /80 */}
        {playerBars.length > 0 && (
          <Card title="Distance moy par session vs match /80′" subtitle={`Référence /80min : ${fmt(matchRef.dist, 0)} m`}>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <BarChart data={playerBars} margin={{ top: 10, right: 10, bottom: 50, left: 0 }}>
                  <CartesianGrid stroke="#EEE" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'DM Mono' }} angle={-45} textAnchor="end" height={60} interval={0} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                  <Tooltip />
                  <Bar dataKey="dist" radius={[3, 3, 0, 0]}>
                    {playerBars.map((b, i) => (
                      <Cell key={i} fill={pctColor(b.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px] text-black/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#C9002B' }} /> ≥70% match /80
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#185FA5' }} /> 60-70%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#917845' }} /> &lt;60%
              </span>
            </div>
          </Card>
        )}

        <div className="hidden">{PLAYER_BY_NAME['BORSU']?.name}</div>
      </div>
    </>
  )
}
