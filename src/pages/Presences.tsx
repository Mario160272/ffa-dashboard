import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import PlayerAvatar from '../components/PlayerAvatar'
import { PLAYERS } from '../data/players'
import { fmt } from '../utils/format'

const MATCHES_TOTAL = 26
const TRAININGS_TOTAL = 108

export default function Presences() {
  const [period, setPeriod] = useState<'saison' | 'mois'>('saison')
  const [selected, setSelected] = useState<string>('')

  const team = useMemo(() => {
    const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)
    return {
      pctMatch: mean(PLAYERS.map((p) => p.pctMatch)),
      pctTrain: mean(PLAYERS.map((p) => p.pctTrain)),
      minMatch: mean(PLAYERS.map((p) => p.minMatch)),
      minTrain: mean(PLAYERS.map((p) => p.minTrain)),
    }
  }, [])

  const bars = useMemo(
    () =>
      [...PLAYERS]
        .sort((a, b) => b.pctMatch - a.pctMatch)
        .map((p) => ({
          name: p.name,
          match: Number(p.pctMatch.toFixed(1)),
          train: Number(p.pctTrain.toFixed(1)),
        })),
    [],
  )

  const player = selected ? PLAYERS.find((p) => p.name === selected) ?? null : null

  return (
    <>
      <Header
        title="Présences & Minutes"
        subtitle={`${MATCHES_TOTAL} matchs · ${TRAININGS_TOTAL} entraînements — saison 25/26`}
        badge="07"
        right={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'saison' | 'mois')}
              className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm"
            >
              <option value="saison" className="text-black">Saison</option>
              <option value="mois" className="text-black">Par mois</option>
            </select>
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
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Matchs saison" value={MATCHES_TOTAL} accent="red" />
          <Kpi label="Entraînements" value={TRAININGS_TOTAL} accent="red" />
          <Kpi label="% présence moy." value={fmt((team.pctMatch + team.pctTrain) / 2, 1)} unit="%" accent="red" />
          <Kpi label="Minutes moy." value={fmt(team.minMatch + team.minTrain, 0)} unit="min" accent="neutral" />
        </div>

        {!player && (
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
          <Card padded={false}>
            <div className="p-5 flex items-center gap-5 border-b border-black/5">
              <PlayerAvatar name={player.name} prenom={player.prenom} photo={player.photo} size={64} />
              <div className="flex-1">
                <div className="text-xl font-bold">{player.prenom} {player.name}</div>
                <div className="text-xs text-black/50">Présences {period === 'saison' ? 'saison' : 'mensuelles'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-black/5">
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-black/50">% Matchs</div>
                <div className="mt-1 text-2xl font-bold" style={{ color: player.pctMatch >= 85 ? '#1D9E75' : player.pctMatch >= 70 ? '#917845' : '#C9002B' }}>
                  {fmt(player.pctMatch, 1)}%
                </div>
                <div className="text-[11px] text-black/50">{player.nMatch} / {MATCHES_TOTAL}</div>
              </div>
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-black/50">% Training</div>
                <div className="mt-1 text-2xl font-bold" style={{ color: player.pctTrain >= 85 ? '#1D9E75' : player.pctTrain >= 70 ? '#917845' : '#C9002B' }}>
                  {fmt(player.pctTrain, 1)}%
                </div>
                <div className="text-[11px] text-black/50">{player.nTrain} / {TRAININGS_TOTAL}</div>
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
        )}

        <Card title="Tableau synthèse">
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
                {[...PLAYERS].sort((a, b) => b.pctMatch - a.pctMatch).map((p) => (
                  <tr key={p.name} className="border-b border-black/5 hover:bg-black/5 cursor-pointer" onClick={() => setSelected(p.name)}>
                    <td className="py-2 px-2 font-semibold">{p.name}</td>
                    <td className="py-2 px-2 text-right">{fmt(p.pctMatch, 1)}%</td>
                    <td className="py-2 px-2 text-right">{fmt(p.pctTrain, 1)}%</td>
                    <td className="py-2 px-2 text-right">{fmt(p.minMatch)}</td>
                    <td className="py-2 px-2 text-right">{fmt(p.minTrain)}</td>
                    <td className="py-2 px-2 text-right font-bold">{fmt(p.minMatch + p.minTrain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
}
