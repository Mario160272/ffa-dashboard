import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import PlayerAvatar from '../components/PlayerAvatar'
import { PLAYERS, PLAYER_BY_NAME } from '../data/players'
import { useGpsData } from '../hooks/useGpsData'
import { fmt, fmtDate } from '../utils/format'
import {
  calcACWRCombined, calcACWRExternal, calcACWRInternal,
  filterFullSessions, formeColor, getFormeLabel, getZone, rpeTrend, zoneColor,
} from '../utils/acwr'
import type { GpsRow } from '../utils/types'

function mean(arr: number[]): number | null {
  const filtered = arr.filter((v) => v != null && Number.isFinite(v))
  return filtered.length ? filtered.reduce((s, v) => s + v, 0) / filtered.length : null
}

function latestDateOf(rows: GpsRow[]): string {
  let max = ''
  for (const r of rows) if (r.Date && r.Date > max) max = r.Date
  return max
}

export default function ControleCharge() {
  const { data, loading, error } = useGpsData()
  const [selected, setSelected] = useState<string | null>(null)

  const fullSessions = useMemo(() => filterFullSessions(data), [data])
  const refDate = useMemo(() => latestDateOf(fullSessions) || new Date().toISOString().slice(0, 10), [fullSessions])

  // Per-player ACWR
  const playerStats = useMemo(() => {
    return PLAYERS.map((p) => {
      const sessions = fullSessions.filter((r) => r.Name === p.name)
      const ext = calcACWRExternal(sessions, refDate)
      const int = calcACWRInternal(sessions, refDate)
      const comb = calcACWRCombined(ext, int)
      const trend = rpeTrend(sessions, refDate)
      const recentRpe = sessions
        .filter((s) => s.RPE != null && s.RPE > 0)
        .sort((a, b) => a.Date.localeCompare(b.Date))
        .slice(-10)
      const rpeAvg = mean(recentRpe.map((s) => s.RPE as number))
      return { ...p, ext, int, comb, trend, recentRpe, rpeAvg }
    })
  }, [fullSessions, refDate])

  // Team averages
  const team = useMemo(() => {
    const ext = mean(playerStats.map((s) => s.ext).filter((v): v is number => v != null))
    const int = mean(playerStats.map((s) => s.int).filter((v): v is number => v != null))
    const comb = mean(playerStats.map((s) => s.comb).filter((v): v is number => v != null))
    const rpe = mean(playerStats.map((s) => s.rpeAvg).filter((v): v is number => v != null))
    const tl = mean(
      fullSessions
        .filter((s) => s.RPE != null && s.RPE > 0 && s['TOTAL TIME'] > 0)
        .map((s) => (s.RPE as number) * s['TOTAL TIME']),
    )
    return { ext, int, comb, rpe, tl }
  }, [playerStats, fullSessions])

  const player = selected ? playerStats.find((p) => p.name === selected) ?? null : null

  const sparkline = useMemo(() => {
    if (!player) return []
    return player.recentRpe.map((s) => ({
      date: s.Date.slice(5),
      rpe: s.RPE,
      tl: (s.RPE ?? 0) * s['TOTAL TIME'],
    }))
  }, [player])

  const playerForme = player ? getFormeLabel(player.comb, player.trend) : null

  return (
    <>
      <Header
        title="Contrôle de la charge"
        subtitle={`ACWR live · réf. ${refDate ? fmtDate(refDate) : '—'} · zones Gabbett`}
        badge="05"
        right={
          selected ? (
            <button
              onClick={() => setSelected(null)}
              className="bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 text-sm"
            >
              ← Retour équipe
            </button>
          ) : null
        }
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}
        {error && <div className="text-sm text-ffa-red">Erreur : {error}</div>}

        {!player && !loading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi label="ACWR Externe"
                value={team.ext != null ? team.ext.toFixed(2) : '—'}
                accent="red" hint="Met Power" />
              <Kpi label="ACWR Interne"
                value={team.int != null ? team.int.toFixed(2) : '—'}
                accent="red" hint="RPE × durée" />
              <Kpi label="ACWR Combiné"
                value={team.comb != null ? team.comb.toFixed(2) : '—'}
                accent="red" hint="60/40" />
              <Kpi label="RPE moy." value={team.rpe != null ? team.rpe.toFixed(1) : '—'} unit="/10" accent="neutral" />
              <Kpi label="TL moy." value={team.tl != null ? fmt(team.tl, 0) : '—'} unit="UA" accent="neutral" />
            </div>

            <Card title="Grille joueurs" subtitle="ACWR combiné live · clique sur une carte pour voir le détail">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {playerStats.map((p) => {
                  const z = getZone(p.comb)
                  const col = zoneColor(z)
                  const displayVal = p.comb ?? p.ext ?? p.int
                  return (
                    <button
                      key={p.name}
                      onClick={() => setSelected(p.name)}
                      className="text-left rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <PlayerAvatar name={p.name} prenom={p.prenom} photo={p.photo} size={42} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold truncate">{p.name}</div>
                          <div className="text-[10px] text-black/50 truncate">{p.prenom}</div>
                        </div>
                        <div className="text-lg font-bold" style={{ color: col }}>
                          {displayVal != null ? displayVal.toFixed(2) : '—'}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: col }}>
                          {z}
                        </div>
                        <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(100, ((displayVal ?? 0) / 2) * 100)}%`,
                              background: col,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-black/50">
                          RPE {p.rpeAvg != null ? p.rpeAvg.toFixed(1) : '—'}
                        </div>
                      </div>
                      <div className="mt-1.5 text-[9px] text-black/40 tracking-wider">
                        Tendance : {p.trend.toUpperCase()}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </>
        )}

        {player && (
          <>
            <Card padded={false}>
              <div className="p-5 flex items-center gap-5 border-b border-black/5">
                <PlayerAvatar name={player.name} prenom={player.prenom} photo={player.photo} size={72} />
                <div className="flex-1">
                  <div className="text-2xl font-bold">{player.prenom} {player.name}</div>
                  <div className="text-xs text-black/50">Pôle Excellence — 25/26</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-black/50">Forme</div>
                  <div
                    className="text-lg font-bold mt-0.5"
                    style={{ color: formeColor(playerForme ?? 'Inconnu') }}
                  >
                    {playerForme}
                  </div>
                  <div className="text-[10px] text-black/40 mt-0.5">
                    tendance RPE : {player.trend}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {([
                  ['ext', 'ACWR Externe', player.ext],
                  ['int', 'ACWR Interne', player.int],
                  ['comb', 'ACWR Combiné', player.comb],
                ] as const).map(([k, label, val]) => {
                  const z = getZone(val)
                  return (
                    <div key={k} className="p-5 border-b md:border-b-0 md:border-r border-black/5 last:border-r-0">
                      <div className="text-[10px] uppercase tracking-widest text-black/50">{label}</div>
                      <div className="mt-1 text-3xl font-bold" style={{ color: zoneColor(z) }}>
                        {val != null ? val.toFixed(2) : '—'}
                      </div>
                      <div className="text-[11px] font-semibold mt-0.5" style={{ color: zoneColor(z) }}>
                        {z}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {sparkline.length > 0 && (
              <Card title="Sparkline RPE" subtitle={`${sparkline.length} dernières sessions FULL`}>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={sparkline} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <CartesianGrid stroke="#EEE" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="rpe"
                        stroke="#C9002B"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#C9002B' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            <Card title="Contexte">
              <div className="text-sm text-black/70 leading-relaxed">
                {playerForme === 'Optimal' && (
                  <>Zone optimale. Charge bien proportionnée à la base chronique — maintenir la planification en cours.</>
                )}
                {playerForme === 'Surveiller' && (
                  <>Zone de surveillance. ACWR s'écarte de la fenêtre 0.8–1.3{player.trend === 'hausse' ? ' (RPE en hausse)' : ''}. Ajuster la charge aiguë de la prochaine semaine.</>
                )}
                {playerForme === 'Récupération' && (
                  <>Risque élevé. ACWR &gt; 1.5 — réduire le volume / HSR sur 3-5 jours et privilégier la récupération.</>
                )}
                {playerForme === 'Inconnu' && <>Pas assez de données récentes pour estimer la forme.</>}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Silence unused-hint for PLAYER_BY_NAME (kept for future use) */}
      <div className="hidden">{Object.keys(PLAYER_BY_NAME).length}</div>
    </>
  )
}
