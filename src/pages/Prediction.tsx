import { useMemo, useState } from 'react'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import { EXERCISE_STATS, ampColor, ampType, predictExercise } from '../data/exercises'
import { fmt } from '../utils/format'

const MD_OPTIONS = ['MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1']

type Line = { subject: string; duration: number }

function defaultLine(): Line {
  return { subject: '', duration: 10 }
}

export default function Prediction() {
  const [md, setMd] = useState('MD-3')
  const [lines, setLines] = useState<Line[]>([
    defaultLine(), defaultLine(), defaultLine(), defaultLine(), defaultLine(),
  ])

  // Group exercises by cat for dropdown
  const grouped = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const key of Object.keys(EXERCISE_STATS)) {
      const cat = EXERCISE_STATS[key].cat
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(key)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [])

  const predictions = lines.map((l) => (l.subject ? predictExercise(l.subject, l.duration) : null))

  const tot = useMemo(() => {
    const t = { dist: 0, hsr: 0, acc: 0, dec: 0, sprint: 0, duration: 0, mpSum: 0, mpN: 0, tl: 0 }
    lines.forEach((l, i) => {
      const p = predictions[i]
      if (!p) return
      t.dist += p.dist
      t.hsr += p.hsr
      t.acc += p.acc
      t.dec += p.dec
      t.sprint += p.sprint
      t.duration += l.duration
      t.mpSum += p.mpAvg * l.duration
      t.mpN += l.duration
      t.tl += p.tlEst
    })
    const mpAvg = t.mpN ? t.mpSum / t.mpN : 0
    return { ...t, mpAvg, dominant: ampType(mpAvg) }
  }, [lines, predictions])

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  return (
    <>
      <Header
        title="Prediction Séance"
        subtitle="Composez une séance, prédiction GPS automatique"
        badge="04"
        right={
          <select
            value={md}
            onChange={(e) => setMd(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm"
          >
            {MD_OPTIONS.map((o) => (
              <option key={o} value={o} className="text-black">{o}</option>
            ))}
          </select>
        }
      />

      <div className="p-6 space-y-6">
        <Card title="Composer la séance" subtitle={`Cycle ${md} — 5 lignes maximum`}>
          <div className="space-y-2">
            {lines.map((l, i) => {
              const mp = l.subject ? EXERCISE_STATS[l.subject]?.mpAvg ?? 0 : 0
              return (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-6 text-[10px] text-black/40 font-bold">#{i + 1}</div>
                  <select
                    value={l.subject}
                    onChange={(e) => updateLine(i, { subject: e.target.value })}
                    className="flex-1 border border-black/10 rounded px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="">— choisir un exercice —</option>
                    {grouped.map(([cat, keys]) => (
                      <optgroup key={cat} label={cat}>
                        {keys.map((k) => (
                          <option key={k} value={k}>
                            {k.replace('PE_ACFF_', '').replace('PE_ACF_', '')}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={l.duration}
                    onChange={(e) => updateLine(i, { duration: Math.max(1, Number(e.target.value) || 0) })}
                    className="w-20 border border-black/10 rounded px-2 py-1.5 text-sm text-right"
                  />
                  <div className="w-10 text-[11px] text-black/60">min</div>
                  {l.subject && (
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ background: ampColor(mp) }}
                    >
                      {ampType(mp)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Prédiction par exercice">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-black/50 border-b border-black/10">
                  <th className="text-left py-2 px-2">Exercice</th>
                  <th className="text-right py-2 px-2">Durée</th>
                  <th className="text-right py-2 px-2">Dist</th>
                  <th className="text-right py-2 px-2">HSR</th>
                  <th className="text-right py-2 px-2">ACC</th>
                  <th className="text-right py-2 px-2">DEC</th>
                  <th className="text-right py-2 px-2">Sprint</th>
                  <th className="text-right py-2 px-2">AMP</th>
                  <th className="text-right py-2 px-2">RPE est.</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const p = predictions[i]
                  if (!l.subject || !p)
                    return (
                      <tr key={i} className="border-b border-black/5">
                        <td className="py-2 px-2 text-black/30 italic" colSpan={9}>Ligne #{i + 1} — vide</td>
                      </tr>
                    )
                  return (
                    <tr key={i} className="border-b border-black/5" style={{ borderLeft: `4px solid ${p.ampColor}` }}>
                      <td className="py-2 px-2 font-semibold truncate max-w-[260px]">
                        {l.subject.replace('PE_ACFF_', '')}
                      </td>
                      <td className="py-2 px-2 text-right">{l.duration}′</td>
                      <td className="py-2 px-2 text-right">{fmt(p.dist)}</td>
                      <td className="py-2 px-2 text-right">{fmt(p.hsr)}</td>
                      <td className="py-2 px-2 text-right">{fmt(p.acc)}</td>
                      <td className="py-2 px-2 text-right">{fmt(p.dec)}</td>
                      <td className="py-2 px-2 text-right">{fmt(p.sprint)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: p.ampColor }}>
                          {p.ampType}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">{p.rpeEst.toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Total séance">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi label="Distance" value={fmt(tot.dist)} unit="m" accent="red" />
            <Kpi label="HSR" value={fmt(tot.hsr)} unit="m" accent="red" />
            <Kpi label="ACC" value={fmt(tot.acc)} unit="m" accent="gold" />
            <Kpi label="DEC" value={fmt(tot.dec)} unit="m" accent="gold" />
            <Kpi label="Sprint" value={fmt(tot.sprint)} unit="m" accent="red" />
            <Kpi label="Durée" value={fmt(tot.duration)} unit="min" accent="neutral" />
            <Kpi label="Met Power moy." value={fmt(tot.mpAvg, 1)} unit="W/kg" accent={tot.mpAvg > 10 ? 'red' : tot.mpAvg > 7 ? 'gold' : 'green'} hint={tot.dominant} />
            <Kpi label="Training Load est." value={fmt(tot.tl)} unit="UA" accent="neutral" />
          </div>
        </Card>
      </div>
    </>
  )
}
