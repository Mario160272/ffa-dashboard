import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import { useGpsData } from '../hooks/useGpsData'
import { fmt, fmtDate } from '../utils/format'
import { isFullSession } from '../utils/excel'
import { ampColor, ampType, parseSubject } from '../data/exercises'

export default function SessionTraining() {
  const { data, loading, error } = useGpsData()

  const trainingDates = useMemo(() => {
    const s = new Set<string>()
    for (const r of data) {
      if (r.IS_MATCH === 'TRAINING' && isFullSession(r.subjects) && r.Date) s.add(r.Date)
    }
    return Array.from(s).sort()
  }, [data])

  const [selected, setSelected] = useState<string>('')
  const chosen = selected || trainingDates[trainingDates.length - 1] || ''

  const fullRows = useMemo(
    () => data.filter((r) => r.Date === chosen && r.IS_MATCH === 'TRAINING' && isFullSession(r.subjects)),
    [data, chosen],
  )

  const exRows = useMemo(
    () => data.filter((r) => r.Date === chosen && r.IS_MATCH === 'TRAINING' && !isFullSession(r.subjects)),
    [data, chosen],
  )

  const kpi = useMemo(() => {
    if (!fullRows.length) return null
    const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)
    const rpeVals = fullRows.map((r) => r.RPE ?? 0).filter((v) => v > 0)
    return {
      dur: mean(fullRows.map((r) => r['TOTAL TIME'])),
      dist: mean(fullRows.map((r) => r.Distanza)),
      distMin: mean(fullRows.map((r) => r['Dist/min'])),
      hsr: mean(fullRows.map((r) => r['Vel > 16 (m)'])),
      sprint: mean(fullRows.map((r) => r['Dist > 25,2 km/h'])),
      acc: mean(fullRows.map((r) => r['Acc > 2 (m)'])),
      dec: mean(fullRows.map((r) => r['Dec <-2 (m)'])),
      mp20: mean(fullRows.map((r) => r['MP > 20 (m)'])),
      mpAvg: mean(fullRows.map((r) => r['Met Power'])),
      rpe: mean(rpeVals),
    }
  }, [fullRows])

  const barData = useMemo(
    () =>
      fullRows.map((r) => ({
        name: r.Name,
        dist: Math.round(r.Distanza),
        hsr: Math.round(r['Vel > 16 (m)']),
        acc: Math.round(r['Acc > 2 (m)']),
        mp: Number(r['Met Power']?.toFixed?.(1) ?? r['Met Power']),
      })),
    [fullRows],
  )

  const exerciseGroups = useMemo(() => {
    const map = new Map<string, typeof exRows>()
    for (const r of exRows) {
      if (!map.has(r.subjects)) map.set(r.subjects, [])
      map.get(r.subjects)!.push(r)
    }
    return Array.from(map.entries()).map(([subject, arr]) => {
      const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)
      const mp = mean(arr.map((r) => r['Met Power']))
      return {
        subject,
        ...parseSubject(subject),
        dur: mean(arr.map((r) => r['TOTAL TIME'])),
        dist: mean(arr.map((r) => r.Distanza)),
        distMin: mean(arr.map((r) => r['Dist/min'])),
        hsr: mean(arr.map((r) => r['Vel > 16 (m)'])),
        acc: mean(arr.map((r) => r['Acc > 2 (m)'])),
        dec: mean(arr.map((r) => r['Dec <-2 (m)'])),
        mp,
      }
    })
  }, [exRows])

  const totExercises = useMemo(() => {
    return exerciseGroups.reduce(
      (acc, e) => ({
        dur: acc.dur + e.dur,
        dist: acc.dist + e.dist,
        hsr: acc.hsr + e.hsr,
        acc: acc.acc + e.acc,
        dec: acc.dec + e.dec,
      }),
      { dur: 0, dist: 0, hsr: 0, acc: 0, dec: 0 },
    )
  }, [exerciseGroups])

  return (
    <>
      <Header
        title="Inside Training"
        subtitle="Team average + bar charts joueurs + détail exercices"
        badge="02"
        right={
          <select
            value={chosen}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm"
          >
            {trainingDates.length === 0 && <option>— aucun entraînement —</option>}
            {trainingDates.map((d) => (
              <option key={d} value={d} className="text-black">
                {fmtDate(d)}
              </option>
            ))}
          </select>
        }
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}
        {error && <div className="text-sm text-ffa-red">Erreur : {error}</div>}

        {kpi && (
          <Card title="Team Average">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi label="Durée" value={fmt(kpi.dur, 0)} unit="min" accent="neutral" />
              <Kpi label="Distance" value={fmt(kpi.dist, 0)} unit="m" accent="red" />
              <Kpi label="Dist / min" value={fmt(kpi.distMin, 1)} unit="m/min" accent="red" />
              <Kpi label="HSR" value={fmt(kpi.hsr, 0)} unit="m" accent="red" />
              <Kpi label="Sprint" value={fmt(kpi.sprint, 0)} unit="m" accent="gold" />
              <Kpi label="ACC" value={fmt(kpi.acc, 0)} unit="m" accent="gold" />
              <Kpi label="DEC" value={fmt(kpi.dec, 0)} unit="m" accent="gold" />
              <Kpi label="MP > 20" value={fmt(kpi.mp20, 0)} unit="m" accent="red" />
              <Kpi
                label="Met Power moy."
                value={fmt(kpi.mpAvg, 1)}
                unit="W/kg"
                accent={kpi.mpAvg > 10 ? 'red' : kpi.mpAvg > 7 ? 'gold' : 'green'}
                hint={ampType(kpi.mpAvg)}
              />
              <Kpi label="RPE moy." value={fmt(kpi.rpe, 1)} unit="/10" accent="neutral" />
            </div>
          </Card>
        )}

        {barData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              ['Distance', 'dist', '#C9002B'],
              ['HSR', 'hsr', '#500515'],
              ['ACC', 'acc', '#917845'],
              ['Met Power', 'mp', '#1A0008'],
            ] as const).map(([label, key, color]) => (
              <Card key={key} title={label}>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 40, left: 0 }}>
                      <CartesianGrid stroke="#EEE" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} height={60} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Bar dataKey={key} fill={color} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ))}
          </div>
        )}

        {exerciseGroups.length > 0 && (
          <Card title="Inside Training — Exercices du jour" subtitle="Couleur = type AMP">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-black/50 border-b border-black/10">
                    <th className="text-left py-2 px-2">Exercice</th>
                    <th className="text-left py-2 px-2">Cat.</th>
                    <th className="text-right py-2 px-2">Durée</th>
                    <th className="text-right py-2 px-2">Dist</th>
                    <th className="text-right py-2 px-2">/min</th>
                    <th className="text-right py-2 px-2">HSR</th>
                    <th className="text-right py-2 px-2">ACC</th>
                    <th className="text-right py-2 px-2">DEC</th>
                    <th className="text-right py-2 px-2">MP</th>
                    <th className="text-right py-2 px-2">AMP</th>
                  </tr>
                </thead>
                <tbody>
                  {exerciseGroups.map((e, i) => {
                    const col = ampColor(e.mp)
                    return (
                      <tr key={i} style={{ borderLeft: `4px solid ${col}` }} className="border-b border-black/5">
                        <td className="py-2 px-2 font-semibold truncate max-w-[260px]">{e.subject.replace('PE_ACFF_', '')}</td>
                        <td className="py-2 px-2 text-[11px] text-black/60">{e.cat}</td>
                        <td className="py-2 px-2 text-right">{fmt(e.dur, 0)}′</td>
                        <td className="py-2 px-2 text-right">{fmt(e.dist, 0)}</td>
                        <td className="py-2 px-2 text-right">{fmt(e.distMin, 1)}</td>
                        <td className="py-2 px-2 text-right">{fmt(e.hsr, 0)}</td>
                        <td className="py-2 px-2 text-right">{fmt(e.acc, 0)}</td>
                        <td className="py-2 px-2 text-right">{fmt(e.dec, 0)}</td>
                        <td className="py-2 px-2 text-right">{fmt(e.mp, 1)}</td>
                        <td className="py-2 px-2 text-right">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ background: col }}
                          >
                            {ampType(e.mp)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-black/5 font-bold">
                    <td className="py-2 px-2" colSpan={2}>TOTAL</td>
                    <td className="py-2 px-2 text-right">{fmt(totExercises.dur, 0)}′</td>
                    <td className="py-2 px-2 text-right">{fmt(totExercises.dist, 0)}</td>
                    <td className="py-2 px-2 text-right">—</td>
                    <td className="py-2 px-2 text-right">{fmt(totExercises.hsr, 0)}</td>
                    <td className="py-2 px-2 text-right">{fmt(totExercises.acc, 0)}</td>
                    <td className="py-2 px-2 text-right">{fmt(totExercises.dec, 0)}</td>
                    <td className="py-2 px-2 text-right">—</td>
                    <td className="py-2 px-2 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </>
  )
}
