import { useEffect, useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import { useGpsData } from '../hooks/useGpsData'
import { buildExerciseCatalog, type ExerciseLiveStat } from '../utils/exerciseStats'
import { ampColor, ampType, rpeEstimate } from '../data/exercises'
import { fmt } from '../utils/format'

const MD_OPTIONS = ['MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1']

type Line = { subject: string; duration: number }

// 3 exercices pré-chargés : Aérobie Plateau 15′ · MSG K+7vs7+K 20′ · Passing En Ligne 15′
const PRESETS: Line[] = [
  { subject: 'PE_ACFF_PHYSIQUE_AEROBIE_PLATEAU', duration: 15 },
  { subject: 'PE_ACFF_TACTIQUE_MSG_K+7VS7+K', duration: 20 },
  { subject: 'PE_ACFF_TECHNIQUE_PASSING_EN LIGNE', duration: 15 },
  { subject: '', duration: 10 },
  { subject: '', duration: 10 },
]

type Prediction = {
  dist: number
  hsr: number
  acc: number
  dec: number
  sprint: number
  mpAvg: number
  rpeEst: number
  tlEst: number
  ampType: ReturnType<typeof ampType>
  ampColor: string
}

function predict(stat: ExerciseLiveStat, durationMin: number): Prediction {
  const rpeEst = rpeEstimate(stat.mpAvg)
  return {
    dist: Math.round(stat.distMin * durationMin),
    hsr: Math.round(stat.hsrMin * durationMin),
    acc: Math.round(stat.accMin * durationMin),
    dec: Math.round(stat.decMin * durationMin),
    sprint: Math.round(stat.sprintMin * durationMin),
    mpAvg: stat.mpAvg,
    rpeEst,
    tlEst: Math.round(rpeEst * durationMin),
    ampType: ampType(stat.mpAvg),
    ampColor: ampColor(stat.mpAvg),
  }
}

const CAT_COLORS: Record<string, string> = {
  PHYSIQUE: '#C9002B',
  TACTIQUE: '#500515',
  TECHNIQUE: '#917845',
  AUTRE: '#BCC8D4',
}
const AMP_COLORS: Record<string, string> = {
  Neuromusculaire: '#C9002B',
  Mixte: '#917845',
  Endurance: '#1D9E75',
}

function MiniDonut({ title, data, total }: {
  title: string
  data: { name: string; value: number; color: string }[]
  total: number
}) {
  return (
    <Card title={title} padded={false}>
      <div className="relative" style={{ width: '100%', height: 170 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number, _n, ent) => [`${fmt(v, 0)} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, ent?.payload?.name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[10px] mono text-black/50">{fmt(total, 0)}</div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="flex flex-wrap gap-1.5 text-[9px]">
          {data.filter((d) => d.value > 0).map((d, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="font-mono">{d.name} {total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default function Prediction() {
  const { data, loading } = useGpsData()
  const [md, setMd] = useState('MD-3')
  const [lines, setLines] = useState<Line[]>(PRESETS)
  const [catalogReady, setCatalogReady] = useState(false)

  const catalog = useMemo(() => buildExerciseCatalog(data), [data])

  useEffect(() => {
    if (catalog.length > 0 && !catalogReady) setCatalogReady(true)
  }, [catalog.length, catalogReady])

  const catalogMap = useMemo(() => {
    const m = new Map<string, ExerciseLiveStat>()
    for (const e of catalog) m.set(e.subject, e)
    return m
  }, [catalog])

  // Group for dropdown: CAT → SUB → [subjects]
  const grouped = useMemo(() => {
    const tree = new Map<string, Map<string, ExerciseLiveStat[]>>()
    for (const e of catalog) {
      if (!tree.has(e.cat)) tree.set(e.cat, new Map())
      const subMap = tree.get(e.cat)!
      if (!subMap.has(e.sub)) subMap.set(e.sub, [])
      subMap.get(e.sub)!.push(e)
    }
    return Array.from(tree.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [catalog])

  const predictions = lines.map((l) => {
    if (!l.subject) return null
    const stat = catalogMap.get(l.subject)
    return stat ? predict(stat, l.duration) : null
  })

  const active = lines
    .map((l, i) => ({ line: l, stat: l.subject ? catalogMap.get(l.subject) : undefined, p: predictions[i] }))
    .filter((x) => x.stat && x.p)

  const tot = useMemo(() => {
    let dist = 0, hsr = 0, acc = 0, dec = 0, sprint = 0
    let duration = 0, mpSum = 0, mpN = 0, tl = 0
    for (const { line, p } of active) {
      if (!p) continue
      dist += p.dist; hsr += p.hsr; acc += p.acc; dec += p.dec; sprint += p.sprint
      duration += line.duration
      mpSum += p.mpAvg * line.duration
      mpN += line.duration
      tl += p.tlEst
    }
    const mpAvg = mpN ? mpSum / mpN : 0
    return { dist, hsr, acc, dec, sprint, duration, mpAvg, tl, dominant: ampType(mpAvg) }
  }, [active])

  // Donuts 1 : minutes par catégorie
  const donutCat = useMemo(() => {
    const byCat: Record<string, number> = {}
    for (const { line, stat } of active) {
      if (!stat) continue
      byCat[stat.cat] = (byCat[stat.cat] ?? 0) + line.duration
    }
    const total = Object.values(byCat).reduce((s, v) => s + v, 0)
    return {
      total,
      data: Object.entries(byCat).map(([name, value]) => ({
        name, value, color: CAT_COLORS[name] ?? '#BCC8D4',
      })),
    }
  }, [active])

  // Donuts 2 : minutes par AMP intensity
  const donutAmp = useMemo(() => {
    const byAmp: Record<string, number> = {}
    for (const { line, stat } of active) {
      if (!stat) continue
      const label = ampType(stat.mpAvg)
      byAmp[label] = (byAmp[label] ?? 0) + line.duration
    }
    const total = Object.values(byAmp).reduce((s, v) => s + v, 0)
    return {
      total,
      data: Object.entries(byAmp).map(([name, value]) => ({
        name, value, color: AMP_COLORS[name] ?? '#BCC8D4',
      })),
    }
  }, [active])

  // Donuts 3 : distance par catégorie
  const donutDistCat = useMemo(() => {
    const byCat: Record<string, number> = {}
    for (const { stat, p } of active) {
      if (!stat || !p) continue
      byCat[stat.cat] = (byCat[stat.cat] ?? 0) + p.dist
    }
    const total = Object.values(byCat).reduce((s, v) => s + v, 0)
    return {
      total,
      data: Object.entries(byCat).map(([name, value]) => ({
        name, value, color: CAT_COLORS[name] ?? '#BCC8D4',
      })),
    }
  }, [active])

  // Donuts 4 : HSR par catégorie
  const donutHsrCat = useMemo(() => {
    const byCat: Record<string, number> = {}
    for (const { stat, p } of active) {
      if (!stat || !p) continue
      byCat[stat.cat] = (byCat[stat.cat] ?? 0) + p.hsr
    }
    const total = Object.values(byCat).reduce((s, v) => s + v, 0)
    return {
      total,
      data: Object.entries(byCat).map(([name, value]) => ({
        name, value, color: CAT_COLORS[name] ?? '#BCC8D4',
      })),
    }
  }, [active])

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  return (
    <>
      <Header
        title="Prediction Séance"
        subtitle={`Catalogue live — ${catalog.length} exercices (n≥3)`}
        badge="04"
        right={
          <select
            value={md}
            onChange={(e) => setMd(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm mono"
          >
            {MD_OPTIONS.map((o) => (
              <option key={o} value={o} className="text-black">{o}</option>
            ))}
          </select>
        }
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement catalogue GPS…</div>}

        <Card title="Composer la séance" subtitle={`Cycle ${md} — pré-chargé 3 exercices`}>
          <div className="space-y-2">
            {lines.map((l, i) => {
              const stat = l.subject ? catalogMap.get(l.subject) : null
              const mp = stat?.mpAvg ?? 0
              return (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-6 text-[10px] text-black/40 font-mono font-bold">#{i + 1}</div>
                  <select
                    value={l.subject}
                    onChange={(e) => updateLine(i, { subject: e.target.value })}
                    className="flex-1 border border-black/10 rounded px-2 py-1.5 text-sm bg-white"
                    disabled={!catalogReady}
                  >
                    <option value="">— choisir un exercice —</option>
                    {grouped.map(([cat, subMap]) => (
                      <optgroup key={cat} label={cat}>
                        {Array.from(subMap.entries()).flatMap(([, arr]) =>
                          arr.map((e) => (
                            <option key={e.subject} value={e.subject}>
                              [{e.sub}] {e.subject.replace('PE_ACFF_', '').replace('PE_ACF_', '')} (n={e.n})
                            </option>
                          )),
                        )}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={l.duration}
                    onChange={(e) => updateLine(i, { duration: Math.max(1, Number(e.target.value) || 0) })}
                    className="w-16 border border-black/10 rounded px-2 py-1.5 text-sm text-right mono"
                  />
                  <div className="w-8 text-[11px] text-black/60">min</div>
                  {l.subject && (
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
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
                      <td className="py-2 px-2 text-right mono">{l.duration}′</td>
                      <td className="py-2 px-2 text-right mono">{fmt(p.dist)}</td>
                      <td className="py-2 px-2 text-right mono">{fmt(p.hsr)}</td>
                      <td className="py-2 px-2 text-right mono">{fmt(p.acc)}</td>
                      <td className="py-2 px-2 text-right mono">{fmt(p.dec)}</td>
                      <td className="py-2 px-2 text-right mono">{fmt(p.sprint)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: p.ampColor }}>
                          {p.ampType}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right mono">{p.rpeEst.toFixed(1)}</td>
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
            <Kpi label="HSR" value={fmt(tot.hsr)} unit="m" accent="blue" />
            <Kpi label="ACC" value={fmt(tot.acc)} unit="m" accent="gold" />
            <Kpi label="DEC" value={fmt(tot.dec)} unit="m" accent="gold" />
            <Kpi label="Sprint" value={fmt(tot.sprint)} unit="m" accent="red" />
            <Kpi label="Durée" value={fmt(tot.duration)} unit="min" accent="neutral" />
            <Kpi
              label="Met Power moy."
              value={fmt(tot.mpAvg, 1)}
              unit="W/kg"
              accent={tot.mpAvg > 10 ? 'red' : tot.mpAvg > 7 ? 'gold' : 'green'}
              hint={tot.dominant}
            />
            <Kpi label="Training Load est." value={fmt(tot.tl)} unit="UA" accent="green" />
          </div>
        </Card>

        {/* 4 donuts live */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniDonut title="% minutes par catégorie" data={donutCat.data} total={donutCat.total} />
          <MiniDonut title="% minutes par intensité AMP" data={donutAmp.data} total={donutAmp.total} />
          <MiniDonut title="% distance par catégorie" data={donutDistCat.data} total={donutDistCat.total} />
          <MiniDonut title="% HSR par catégorie" data={donutHsrCat.data} total={donutHsrCat.total} />
        </div>
      </div>
    </>
  )
}
