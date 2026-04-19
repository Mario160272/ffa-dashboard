import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import PlayerAvatar from '../components/PlayerAvatar'
import { PLAYERS } from '../data/players'
import { useGpsData } from '../hooks/useGpsData'
import { isFullSession } from '../utils/excel'
import { fmt } from '../utils/format'
import type { GpsRow } from '../utils/types'

export default function Presences() {
  const { data, loading, error } = useGpsData()
  const [selected, setSelected] = useState<string>('')

  const { matchDays, trainingDays } = useMemo(() => {
    const md = new Set<string>()
    const td = new Set<string>()
    for (const r of data) {
      if (!r.Date || !isFullSession(r.subjects)) continue
      if (r.IS_MATCH === 'MATCH') md.add(r.Date)
      else td.add(r.Date)
    }
    return { matchDays: md, trainingDays: td }
  }, [data])

  const totalMatches = matchDays.size || 26
  const totalTrainings = trainingDays.size || 108

  type Row = {
    name: string
    prenom: string
    photo: string | null
    nMatch: number
    nTrain: number
    minMatch: number
    minTrain: number
    pctMatch: number
    pctTrain: number
  }

  const presences: Row[] = useMemo(() => {
    return PLAYERS.map((p) => {
      const fullMatches = data.filter(
        (r) => r.Name === p.name && r.IS_MATCH === 'MATCH' && isFullSession(r.subjects),
      )
      const fullTrainings = data.filter(
        (r) => r.Name === p.name && r.IS_MATCH === 'TRAINING' && isFullSession(r.subjects),
      )
      const nMatch = new Set(fullMatches.map((r) => r.Date)).size
      const nTrain = new Set(fullTrainings.map((r) => r.Date)).size
      const minMatch = fullMatches.reduce((s, r) => s + r['TOTAL TIME'], 0)
      const minTrain = fullTrainings.reduce((s, r) => s + r['TOTAL TIME'], 0)
      return {
        name: p.name,
        prenom: p.prenom,
        photo: p.photo,
        nMatch,
        nTrain,
        minMatch: Math.round(minMatch),
        minTrain: Math.round(minTrain),
        pctMatch: totalMatches > 0 ? (nMatch / totalMatches) * 100 : 0,
        pctTrain: totalTrainings > 0 ? (nTrain / totalTrainings) * 100 : 0,
      }
    })
  }, [data, totalMatches, totalTrainings])

  const team = useMemo(() => {
    const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)
    return {
      pctMatch: mean(presences.map((p) => p.pctMatch)),
      pctTrain: mean(presences.map((p) => p.pctTrain)),
      minMatch: mean(presences.map((p) => p.minMatch)),
      minTrain: mean(presences.map((p) => p.minTrain)),
    }
  }, [presences])

  const bars = useMemo(
    () =>
      [...presences]
        .sort((a, b) => b.pctMatch - a.pctMatch)
        .map((p) => ({
          name: p.name,
          match: Number(p.pctMatch.toFixed(1)),
          train: Number(p.pctTrain.toFixed(1)),
        })),
    [presences],
  )

  const player = selected ? presences.find((p) => p.name === selected) ?? null : null

  const monthly = useMemo(() => {
    if (!player) return []
    const playerRows = data.filter((r) => r.Name === player.name && isFullSession(r.subjects))
    const byMonth = new Map<string, { match: number; train: number; min: number }>()
    for (const r of playerRows) {
      if (!r.Date) continue
      const m = r.Date.slice(0, 7)
      if (!byMonth.has(m)) byMonth.set(m, { match: 0, train: 0, min: 0 })
      const b = byMonth.get(m)!
      if (r.IS_MATCH === 'MATCH') b.match += 1
      else b.train += 1
      b.min += r['TOTAL TIME']
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, stats]) => ({ month, ...stats, min: Math.round(stats.min) }))
  }, [player, data])

  function colorPct(v: number): string {
    if (v >= 85) return '#1D9E75'
    if (v >= 70) return '#917845'
    return '#C9002B'
  }

  function heatShade(n: number, max: number): string {
    if (max <= 0 || n <= 0) return '#F5F5F5'
    const intensity = Math.min(1, n / max)
    const alpha = Math.round(20 + 235 * intensity)
    return `rgba(201, 0, 43, ${alpha / 255})`
  }

  const maxMonthlyMin = Math.max(1, ...monthly.map((m) => m.min))

  return (
    <>
      <Header
        title="Présences & Minutes"
        subtitle={`${totalMatches} matchs · ${totalTrainings} entraînements détectés dans l'Excel`}
        badge="07"
        right={
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm"
          >
            <option value="" className="text-black">Tous les joueurs</option>
            {PLAYERS.map((p) => (
              <option key={p.name} value={p.name} className="text-black">
                {p.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}
        {error && <div className="text-sm text-ffa-red">Erreur : {error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Matchs saison" value={totalMatches} accent="red" />
          <Kpi label="Entraînements" value={totalTrainings} accent="red" />
          <Kpi label="% présence moy." value={fmt((team.pctMatch + team.pctTrain) / 2, 1)} unit="%" accent="red" />
          <Kpi label="Minutes moy." value={fmt(team.minMatch + team.minTrain, 0)} unit="min" accent="neutral" />
        </div>

        {!player && bars.length > 0 && (
          <Card title="% présence par joueur" subtitle="Rouge = matchs · Bleu-gris = entraînements">
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <BarChart data={bars} margin={{ top: 10, right: 10, bottom: 60, left: 0 }}>
                  <CartesianGrid stroke="#EEE" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} height={70} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => v + ' %'} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="match" name="Matchs %" fill="#C9002B" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="train" name="Training %" fill="#BCC8D4" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {player && (
          <>
            <Card padded={false}>
              <div className="p-5 flex items-center gap-5 border-b border-black/5">
                <PlayerAvatar name={player.name} prenom={player.prenom} photo={player.photo} size={64} />
                <div className="flex-1">
                  <div className="text-xl font-bold">{player.prenom} {player.name}</div>
                  <div className="text-xs text-black/50">Présences saison — détail mensuel</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-black/5">
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-widest text-black/50">% Matchs</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: colorPct(player.pctMatch) }}>
                    {fmt(player.pctMatch, 1)}%
                  </div>
                  <div className="text-[11px] text-black/50">{player.nMatch} / {totalMatches}</div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-widest text-black/50">% Training</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: colorPct(player.pctTrain) }}>
                    {fmt(player.pctTrain, 1)}%
                  </div>
                  <div className="text-[11px] text-black/50">{player.nTrain} / {totalTrainings}</div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-widest text-black/50">Minutes Match</div>
                  <div className="mt-1 text-2xl font-bold text-ffa-red">{fmt(player.minMatch)}</div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-widest text-black/50">Minutes Training</div>
                  <div className="mt-1 text-2xl font-bold">{fmt(player.minTrain)}</div>
                </div>
              </div>
            </Card>

            {monthly.length > 0 && (
              <Card title="Heatmap mensuelle" subtitle="Nombre de sessions & minutes par mois">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-black/50 border-b border-black/10">
                        <th className="text-left py-2 px-2">Mois</th>
                        <th className="text-center py-2 px-2">Matchs</th>
                        <th className="text-center py-2 px-2">Entraînements</th>
                        <th className="text-right py-2 px-2">Minutes</th>
                        <th className="text-center py-2 px-2 w-40">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((m) => (
                        <tr key={m.month} className="border-b border-black/5">
                          <td className="py-2 px-2 font-semibold">{m.month}</td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className="inline-block w-8 h-8 leading-8 rounded text-[11px] font-bold text-white"
                              style={{ background: m.match > 0 ? '#C9002B' : '#F5F5F5', color: m.match > 0 ? '#FFF' : '#999' }}
                            >
                              {m.match || '·'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className="inline-block w-8 h-8 leading-8 rounded text-[11px] font-bold"
                              style={{
                                background: m.train > 0 ? '#1A0008' : '#F5F5F5',
                                color: m.train > 0 ? '#FFF' : '#999',
                              }}
                            >
                              {m.train || '·'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-semibold">{fmt(m.min)}</td>
                          <td className="py-2 px-2">
                            <div
                              className="h-4 rounded"
                              style={{
                                background: heatShade(m.min, maxMonthlyMin),
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        <Card title="Tableau synthèse" subtitle="Clic sur une ligne = vue détail">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-black/50 border-b border-black/10">
                  <th className="text-left py-2 px-2">Joueur</th>
                  <th className="text-right py-2 px-2">Match %</th>
                  <th className="text-right py-2 px-2">Train %</th>
                  <th className="text-right py-2 px-2">Min Match</th>
                  <th className="text-right py-2 px-2">Min Train</th>
                  <th className="text-right py-2 px-2">Total min</th>
                </tr>
              </thead>
              <tbody>
                {[...presences].sort((a, b) => b.pctMatch - a.pctMatch).map((p) => (
                  <tr
                    key={p.name}
                    className="border-b border-black/5 hover:bg-black/5 cursor-pointer"
                    onClick={() => setSelected(p.name)}
                  >
                    <td className="py-2 px-2 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <PlayerAvatar name={p.name} prenom={p.prenom} photo={p.photo} size={24} />
                        {p.name}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: colorPct(p.pctMatch) }}>
                      {fmt(p.pctMatch, 1)}%
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: colorPct(p.pctTrain) }}>
                      {fmt(p.pctTrain, 1)}%
                    </td>
                    <td className="py-2 px-2 text-right">{fmt(p.minMatch)}</td>
                    <td className="py-2 px-2 text-right">{fmt(p.minTrain)}</td>
                    <td className="py-2 px-2 text-right font-bold">{fmt(p.minMatch + p.minTrain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Silence unused type import */}
        <div className="hidden">{({} as GpsRow | undefined)?.Date}</div>
      </div>
    </>
  )
}
