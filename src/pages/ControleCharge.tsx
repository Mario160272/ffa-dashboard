import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import PlayerAvatar from '../components/PlayerAvatar'
import { PLAYERS } from '../data/players'
import { useGpsData } from '../hooks/useGpsData'
import { fmt, fmtDate } from '../utils/format'
import {
  calcACWRCombined, calcACWRExternal, calcACWRInternal,
  calcACWR_ACC, calcACWR_HSR, calcMonotony, computeRiskScore,
  filterFullSessions, formeColor, getFormeLabel, getZone, riskColor, rpeTrend, zoneColor,
} from '../utils/acwr'
import type { GpsRow } from '../utils/types'

function meanNullable(arr: (number | null)[]): number | null {
  const filtered = arr.filter((v): v is number => v != null && Number.isFinite(v))
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

  const playerStats = useMemo(() => {
    return PLAYERS.map((p) => {
      const sessions = fullSessions.filter((r) => r.Name === p.name)
      const ext = calcACWRExternal(sessions, refDate)
      const int = calcACWRInternal(sessions, refDate)
      const comb = calcACWRCombined(ext, int)
      const hsr = calcACWR_HSR(sessions, refDate)
      const acc = calcACWR_ACC(sessions, refDate)
      const diff = ext != null && int != null ? Math.abs(ext - int) : null
      const monotony = calcMonotony(sessions, refDate)
      const trend = rpeTrend(sessions, refDate)
      const recentRpe = sessions
        .filter((s) => s.RPE != null && s.RPE > 0)
        .sort((a, b) => a.Date.localeCompare(b.Date))
        .slice(-10)
      const rpeAvg = meanNullable(recentRpe.map((s) => s.RPE ?? null))
      const risk = computeRiskScore({ comb, hsr, acc, diff, monotony })
      return { ...p, ext, int, comb, hsr, acc, diff, monotony, trend, recentRpe, rpeAvg, risk }
    })
  }, [fullSessions, refDate])

  const team = useMemo(() => {
    return {
      ext: meanNullable(playerStats.map((s) => s.ext)),
      int: meanNullable(playerStats.map((s) => s.int)),
      comb: meanNullable(playerStats.map((s) => s.comb)),
      hsr: meanNullable(playerStats.map((s) => s.hsr)),
      acc: meanNullable(playerStats.map((s) => s.acc)),
      monotony: meanNullable(playerStats.map((s) => s.monotony)),
      rpe: meanNullable(playerStats.map((s) => s.rpeAvg)),
      risk: meanNullable(playerStats.map((s) => s.risk)),
    }
  }, [playerStats])

  const player = selected ? playerStats.find((p) => p.name === selected) ?? null : null
  const sparkline = useMemo(() => {
    if (!player) return []
    return player.recentRpe.map((s) => ({
      date: s.Date.slice(5),
      rpe: s.RPE,
    }))
  }, [player])

  const playerBars = useMemo(() => {
    if (!player) return []
    const val = (v: number | null) => v ?? 0
    return [
      { name: 'ACWR Ext',   v: val(player.ext),  col: zoneColor(getZone(player.ext)) },
      { name: 'ACWR Int',   v: val(player.int),  col: zoneColor(getZone(player.int)) },
      { name: 'ACWR HSR',   v: val(player.hsr),  col: zoneColor(getZone(player.hsr)) },
      { name: 'ACWR ACC',   v: val(player.acc),  col: zoneColor(getZone(player.acc)) },
      { name: 'Monotonie',  v: val(player.monotony), col: player.monotony != null && player.monotony > 2 ? '#C9002B' : player.monotony != null && player.monotony > 1.5 ? '#917845' : '#1D9E75' },
      { name: 'Diff E/I',   v: val(player.diff) * 10,  col: player.diff != null && player.diff > 0.3 ? '#C9002B' : player.diff != null && player.diff > 0.15 ? '#917845' : '#1D9E75' },
    ]
  }, [player])

  const playerForme = player ? getFormeLabel(player.comb, player.trend) : null

  return (
    <>
      <Header
        title="Contrôle de la charge"
        subtitle={`ACWR live · réf. ${refDate ? fmtDate(refDate) : '—'} · 5 métriques avancées`}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Kpi label="ACWR Combiné" value={team.comb != null ? team.comb.toFixed(2) : '—'} accent="red" hint="60/40" />
              <Kpi label="ACWR HSR" value={team.hsr != null ? team.hsr.toFixed(2) : '—'} accent="blue" hint="7j/28j cumul" />
              <Kpi label="ACWR ACC" value={team.acc != null ? team.acc.toFixed(2) : '—'} accent="gold" hint="7j/28j cumul" />
              <Kpi label="Monotonie Foster" value={team.monotony != null ? team.monotony.toFixed(2) : '—'} accent="neutral" hint="mean/std load 7j" />
              <Kpi label="RPE moy." value={team.rpe != null ? team.rpe.toFixed(1) : '—'} unit="/10" accent="neutral" />
              <Kpi label="Risque /11" value={team.risk != null ? fmt(team.risk, 1) : '—'} accent="red" hint="score composite" />
            </div>

            <Card title="Grille joueurs" subtitle="3 métriques par carte + score risque · clique pour le détail">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {playerStats.map((p) => {
                  const zCombo = getZone(p.comb)
                  const colCombo = zoneColor(zCombo)
                  const riskCol = riskColor(p.risk)
                  return (
                    <button
                      key={p.name}
                      onClick={() => setSelected(p.name)}
                      className="text-left rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow bg-white"
                      style={{ borderLeft: `3px solid ${colCombo}` }}
                    >
                      <div className="flex items-center gap-3">
                        <PlayerAvatar name={p.name} prenom={p.prenom} photo={p.photo} size={42} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold truncate">{p.name}</div>
                          <div className="text-[10px] text-black/50 truncate">{p.prenom}</div>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                        <div>
                          <div className="text-[8px] tracking-widest uppercase text-black/40">Comb</div>
                          <div className="text-[14px] font-bold kpi-value" style={{ color: colCombo }}>
                            {p.comb != null ? p.comb.toFixed(2) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[8px] tracking-widest uppercase text-black/40">HSR</div>
                          <div className="text-[14px] font-bold kpi-value" style={{ color: zoneColor(getZone(p.hsr)) }}>
                            {p.hsr != null ? p.hsr.toFixed(2) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[8px] tracking-widest uppercase text-black/40">ACC</div>
                          <div className="text-[14px] font-bold kpi-value" style={{ color: zoneColor(getZone(p.acc)) }}>
                            {p.acc != null ? p.acc.toFixed(2) : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-black/60">
                        <span className="mono">Diff E/I : {p.diff != null ? p.diff.toFixed(2) : '—'}</span>
                        <span className="mono tracking-wider uppercase">{p.trend}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-[10px] font-semibold" style={{ color: riskCol }}>
                          Risque {p.risk}/11
                        </div>
                        <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                          <div
                            className="h-full"
                            style={{ width: `${Math.min(100, (p.risk / 11) * 100)}%`, background: riskCol }}
                          />
                        </div>
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
                  <div className="text-xs text-black/50">Pôle Elite — 25/26 · tendance RPE {player.trend}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-black/50">Forme</div>
                  <div
                    className="text-lg font-bold mt-0.5"
                    style={{ color: formeColor(playerForme ?? 'Inconnu') }}
                  >
                    {playerForme}
                  </div>
                  <div className="text-[10px] text-black/40 mt-0.5 mono">
                    Risque {player.risk}/11
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-0">
                {([
                  ['ACWR Ext',  player.ext],
                  ['ACWR Int',  player.int],
                  ['ACWR Comb', player.comb],
                  ['ACWR HSR',  player.hsr],
                  ['ACWR ACC',  player.acc],
                ] as const).map(([label, val]) => {
                  const z = getZone(val)
                  return (
                    <div key={label} className="p-4 border-b md:border-b-0 md:border-r border-black/5 last:border-r-0">
                      <div className="text-[10px] uppercase tracking-widest text-black/50">{label}</div>
                      <div className="mt-1 text-[22px] font-bold kpi-value" style={{ color: zoneColor(z) }}>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="6 barres ACWR + Mono + Diff" subtitle="Vue synthétique des 6 métriques avancées">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={playerBars} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                      <CartesianGrid stroke="#EEE" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'DM Mono' }} />
                      <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                      <Tooltip />
                      <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                        {playerBars.map((b, i) => (
                          <Cell key={i} fill={b.col} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-black/40 mt-2 mono">
                  Diff E/I × 10 pour visualisation — valeur réelle : {player.diff != null ? player.diff.toFixed(3) : '—'}
                </div>
              </Card>

              {sparkline.length > 0 && (
                <Card title="Sparkline RPE" subtitle={`${sparkline.length} dernières sessions FULL`}>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart data={sparkline} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid stroke="#EEE" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono' }} domain={[0, 10]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="rpe" stroke="#C9002B" strokeWidth={2} dot={{ r: 3, fill: '#C9002B' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>

            <Card title="Interprétation">
              <div className="text-sm text-black/70 leading-relaxed space-y-2">
                {playerForme === 'Optimal' && (
                  <p>Zone optimale. Charge bien proportionnée à la base chronique — maintenir la planification en cours.</p>
                )}
                {playerForme === 'Surveiller' && (
                  <p>Zone de surveillance. ACWR s'écarte de la fenêtre 0.8–1.3{player.trend === 'hausse' ? ' (RPE en hausse)' : ''}. Ajuster la charge aiguë de la prochaine semaine.</p>
                )}
                {playerForme === 'Récupération' && (
                  <p>Risque élevé. ACWR combiné &gt; 1.5 — réduire le volume / HSR sur 3-5 jours et privilégier la récupération.</p>
                )}
                {player.monotony != null && player.monotony > 2 && (
                  <p className="text-[#C9002B]">
                    ⚠️ Monotonie Foster {player.monotony.toFixed(2)} &gt; 2.0 — les charges quotidiennes manquent de variabilité, risque d'accumulation.
                  </p>
                )}
                {player.diff != null && player.diff > 0.3 && (
                  <p className="text-[#917845]">
                    ⚠️ Différentiel ACWR externe/interne {player.diff.toFixed(2)} — forte dissonance entre charge GPS et perception. Revoir le monitoring RPE.
                  </p>
                )}
                {player.hsr != null && player.hsr > 1.5 && (
                  <p className="text-[#C9002B]">
                    ⚠️ ACWR HSR {player.hsr.toFixed(2)} — sprint cumulé aigu &gt; chronique, attention aux ischio.
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
