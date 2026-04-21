import { useMemo, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import PlayerAvatar from '../components/PlayerAvatar'
import CalendarSelector, { type DayEntry } from '../components/CalendarSelector'
import { useGpsData } from '../hooks/useGpsData'
import { useConvalida } from '../hooks/useConvalida'
import { fmt, fmtDate } from '../utils/format'
import { isFullSession } from '../utils/excel'
import { PLAYER_BY_NAME } from '../data/players'
import { opponentByDate } from '../data/convalida'

export default function SessionMatch() {
  const { data, loading, error } = useGpsData()
  const fixtures = useConvalida()

  const entries: DayEntry[] = useMemo(() => {
    const seen = new Map<string, DayEntry>()
    for (const r of data) {
      if (!r.Date || !isFullSession(r.subjects)) continue
      const kind = r.IS_MATCH === 'MATCH' ? 'MATCH' : 'TRAINING'
      if (!seen.has(r.Date)) {
        seen.set(r.Date, {
          date: r.Date,
          kind,
          opponent: kind === 'MATCH' ? opponentByDate(fixtures, r.Date) : null,
          duration: r['TOTAL TIME'],
        })
      }
    }
    return Array.from(seen.values())
  }, [data, fixtures])

  const matchDates = useMemo(
    () => entries.filter((e) => e.kind === 'MATCH').map((e) => e.date).sort(),
    [entries],
  )

  const [selected, setSelected] = useState<string>('')
  const chosen = selected || matchDates[matchDates.length - 1] || ''
  const opponent = opponentByDate(fixtures, chosen)

  const rows = useMemo(
    () => data.filter((r) => r.Date === chosen && r.IS_MATCH === 'MATCH' && isFullSession(r.subjects)),
    [data, chosen],
  )

  const kpi = useMemo(() => {
    if (!rows.length) return null
    const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)
    const rpeVals = rows.map((r) => r.RPE ?? 0).filter((v) => v > 0)
    return {
      dist: mean(rows.map((r) => r.Distanza)),
      hsr: mean(rows.map((r) => r['Vel > 16 (m)'])),
      acc: mean(rows.map((r) => r['Acc > 2 (m)'])),
      rpe: mean(rpeVals),
    }
  }, [rows])

  const scatter = useMemo(
    () =>
      rows.map((r) => ({
        x: Math.round(r.Distanza),
        y: Number(r['HS/MIN']?.toFixed?.(2) ?? r['HS/MIN']),
        name: r.Name,
      })),
    [rows],
  )

  const sorted = [...rows].sort((a, b) => b.Distanza - a.Distanza)
  const distTop25 = useMemo(() => {
    const arr = rows.map((r) => r.Distanza).sort((a, b) => b - a)
    return arr[Math.floor(arr.length * 0.25)] ?? 0
  }, [rows])

  return (
    <>
      <Header
        title={`Session Match${opponent ? ` · vs ${opponent}` : ''}`}
        subtitle={chosen ? fmtDate(chosen) : 'Performance équipe — analyse par match'}
        badge="01"
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}
        {error && <div className="text-sm text-ffa-red">Erreur : {error}</div>}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Calendar selector */}
          <CalendarSelector
            entries={entries}
            value={chosen}
            onChange={setSelected}
            kindFilter="MATCH"
          />

          {/* KPIs */}
          {kpi && (
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              <Kpi label="Distance moy." value={fmt(kpi.dist, 0)} unit="m" accent="red" />
              <Kpi label="HSR moy." value={fmt(kpi.hsr, 0)} unit="m" accent="red" />
              <Kpi label="ACC moy." value={fmt(kpi.acc, 0)} unit="m" accent="gold" />
              <Kpi label="RPE moy." value={fmt(kpi.rpe, 1)} unit="/10" accent="neutral" />
            </div>
          )}
        </div>

        {!loading && !rows.length && !error && (
          <Card padded><div className="text-sm text-black/50">Aucune donnée pour ce match.</div></Card>
        )}

        {scatter.length > 0 && (
          <Card title="Scatter — Distance totale vs HSR / min" subtitle="Un point par joueur">
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="#EEE" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Distance"
                    unit=" m"
                    tick={{ fontSize: 10, fontFamily: 'DM Mono' }}
                    domain={['dataMin - 500', 'dataMax + 500']}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="HSR/min"
                    tick={{ fontSize: 10, fontFamily: 'DM Mono' }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatter} fill="#C9002B">
                    <LabelList dataKey="name" position="top" style={{ fontSize: 10, fill: '#202020' }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {sorted.length > 0 && (
          <Card title="Tableau joueurs" subtitle={opponent ? `vs ${opponent}` : undefined}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-black/50 border-b border-black/10">
                    <th className="text-left py-2 px-2">Joueur</th>
                    <th className="text-right py-2 px-2">Dist</th>
                    <th className="text-right py-2 px-2">HSR</th>
                    <th className="text-right py-2 px-2">Sprint</th>
                    <th className="text-right py-2 px-2">ACC</th>
                    <th className="text-right py-2 px-2">DEC</th>
                    <th className="text-right py-2 px-2">Vmax</th>
                    <th className="text-right py-2 px-2">RPE</th>
                    <th className="text-right py-2 px-2">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, idx) => {
                    const p = PLAYER_BY_NAME[r.Name]
                    return (
                      <tr key={`${r.Name}-${idx}`} className="border-b border-black/5">
                        <td className="py-2 px-2 font-semibold">
                          <span className="inline-flex items-center gap-2">
                            <PlayerAvatar name={r.Name} prenom={p?.prenom} photo={p?.photo ?? null} size={26} />
                            {r.Name}
                          </span>
                        </td>
                        <td
                          className="py-2 px-2 text-right mono"
                          style={{ color: r.Distanza >= distTop25 ? '#C9002B' : undefined, fontWeight: r.Distanza >= distTop25 ? 700 : 400 }}
                        >
                          {fmt(r.Distanza)}
                        </td>
                        <td className="py-2 px-2 text-right mono">{fmt(r['Vel > 16 (m)'])}</td>
                        <td className="py-2 px-2 text-right mono">{fmt(r['Dist > 25,2 km/h'])}</td>
                        <td className="py-2 px-2 text-right mono">{fmt(r['Acc > 2 (m)'])}</td>
                        <td className="py-2 px-2 text-right mono">{fmt(r['Dec <-2 (m)'])}</td>
                        <td className="py-2 px-2 text-right mono">{fmt(r['V max'], 1)}</td>
                        <td className="py-2 px-2 text-right mono">{r.RPE ? fmt(r.RPE, 1) : '—'}</td>
                        <td className="py-2 px-2 text-right mono">{fmt(r['TOTAL TIME'], 0)}′</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
