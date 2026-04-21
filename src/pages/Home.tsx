import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import PlayerAvatar from '../components/PlayerAvatar'
import { PLAYERS } from '../data/players'
import { useGpsData } from '../hooks/useGpsData'
import { isFullSession } from '../utils/excel'
import { fmt, fmtDate } from '../utils/format'
import {
  calcACWRCombined, calcACWRExternal, calcACWRInternal,
  filterFullSessions, getZone, zoneColor,
} from '../utils/acwr'

const QUICK_LINKS = [
  { n: '01', to: '/session-match',    title: 'Session Match',   desc: 'Analyse par match, scatter HSR/min' },
  { n: '02', to: '/session-training', title: 'Inside Training', desc: 'Team average + détail exercices' },
  { n: '03', to: '/week-analysis',    title: 'Week Analysis',   desc: 'Cumul hebdo + match model /80 min' },
  { n: '04', to: '/prediction',       title: 'Prediction',      desc: 'Composer une séance, prédiction GPS' },
  { n: '05', to: '/controle-charge',  title: 'Contrôle Charge', desc: 'ACWR ext / int / combiné · zones' },
  { n: '06', to: '/repartition',      title: 'Répartition',     desc: 'Balance Physique / Tactique / Technique' },
  { n: '07', to: '/presences',        title: 'Présences',       desc: 'Matchs · minutes · heatmap mensuel' },
  { n: '08', to: '/testing',          title: 'Testing',         desc: 'Profil physique — à venir' },
]

function mean(arr: number[]): number | null {
  const f = arr.filter((v) => v != null && Number.isFinite(v))
  return f.length ? f.reduce((s, v) => s + v, 0) / f.length : null
}

export default function Home() {
  const { data, loading } = useGpsData()

  const summary = useMemo(() => {
    const full = filterFullSessions(data)
    const matches = new Set<string>()
    const trainings = new Set<string>()
    const dates: string[] = []
    for (const r of full) {
      if (!r.Date) continue
      if (r.IS_MATCH === 'MATCH') matches.add(r.Date)
      else trainings.add(r.Date)
      dates.push(r.Date)
    }
    const refDate = dates.sort().slice(-1)[0] || ''
    const exts: number[] = []
    const ints: number[] = []
    for (const p of PLAYERS) {
      const s = full.filter((r) => r.Name === p.name)
      const e = calcACWRExternal(s, refDate)
      const i = calcACWRInternal(s, refDate)
      if (e != null) exts.push(e)
      if (i != null) ints.push(i)
    }
    const extMean = mean(exts)
    const intMean = mean(ints)
    return {
      nMatch: matches.size,
      nTrain: trainings.size,
      nPlayers: PLAYERS.length,
      refDate,
      acwrExt: extMean,
      acwrInt: intMean,
      acwrComb: calcACWRCombined(extMean, intMean),
    }
  }, [data])

  const playerZones = useMemo(() => {
    const full = filterFullSessions(data)
    return PLAYERS.map((p) => {
      const s = full.filter((r) => r.Name === p.name)
      const ext = calcACWRExternal(s, summary.refDate)
      const int = calcACWRInternal(s, summary.refDate)
      const comb = calcACWRCombined(ext, int) ?? ext ?? int
      return { ...p, comb, zone: getZone(comb) }
    })
  }, [data, summary.refDate])

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: 320,
          background:
            'linear-gradient(120deg, rgba(26,0,8,0.92) 0%, rgba(80,5,21,0.80) 55%, rgba(201,0,43,0.65) 100%), url(/assets/EQUIPE_jaune.jpg) center 30% / cover no-repeat',
        }}
      >
        <div className="px-8 py-10 text-white flex items-start gap-6">
          <img
            src="/assets/FFA_logo_baseline.png"
            alt="FFA"
            className="h-20 w-auto object-contain bg-white rounded-lg p-2 shadow-lg"
          />
          <div className="flex-1">
            <div className="text-[11px] tracking-[0.35em] font-bold uppercase text-white/70">
              Football Francophone Amateur · Pôle Elite
            </div>
            <h1 className="mt-1 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Dashboard 2025 — 2026
            </h1>
            <p className="mt-3 text-white/80 max-w-2xl text-[13px] leading-relaxed">
              Monitoring des charges d'entraînement et performance matchs —
              GPS K-Sport · ACWR Gabbett · Match Model /80 min ·
              {summary.refDate ? ` dernière session ${fmtDate(summary.refDate)}` : ' chargement…'}
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-black/50">Chargement GPS…</div>}

        {/* KPI summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Kpi label="Joueurs" value={summary.nPlayers} accent="red" />
          <Kpi label="Matchs" value={summary.nMatch} accent="red" />
          <Kpi label="Entraînements" value={summary.nTrain} accent="red" />
          <Kpi
            label="ACWR Externe"
            value={summary.acwrExt != null ? summary.acwrExt.toFixed(2) : '—'}
            accent="red"
            hint="Met Power"
          />
          <Kpi
            label="ACWR Interne"
            value={summary.acwrInt != null ? summary.acwrInt.toFixed(2) : '—'}
            accent="red"
            hint="RPE × durée"
          />
          <Kpi
            label="ACWR Combiné"
            value={summary.acwrComb != null ? summary.acwrComb.toFixed(2) : '—'}
            accent="red"
            hint="60/40"
          />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group bg-white rounded-lg border border-black/5 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[10px] font-bold tracking-[0.2em]"
                  style={{ color: '#C9002B' }}
                >
                  {l.n}
                </span>
                <div className="text-sm font-bold text-ffa-text group-hover:text-ffa-red transition-colors">
                  {l.title}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-black/50 leading-snug">{l.desc}</div>
              <div className="mt-auto pt-3 text-[10px] font-semibold tracking-widest uppercase text-ffa-red opacity-0 group-hover:opacity-100 transition-opacity">
                Ouvrir →
              </div>
            </Link>
          ))}
        </div>

        {/* Roster */}
        <Card title="Effectif Pôle Elite" subtitle={`${PLAYERS.length} joueurs · statut ACWR live`}>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
            {playerZones.map((p) => {
              const col = zoneColor(p.zone)
              return (
                <Link
                  key={p.name}
                  to="/controle-charge"
                  className="flex flex-col items-center gap-1.5 text-center group"
                  title={`${p.prenom} ${p.name} — ${p.zone}`}
                >
                  <div className="relative">
                    <PlayerAvatar name={p.name} prenom={p.prenom} photo={p.photo} size={56} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ background: col }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-ffa-text truncate max-w-[72px]">
                    {p.name}
                  </div>
                  <div className="text-[9px] text-black/50 truncate max-w-[72px]">
                    {p.prenom}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[10px] text-black/60 border-t border-black/5 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1D9E75' }} />
              Optimal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#917845' }} />
              Surveiller
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#C9002B' }} />
              Risque
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#BCC8D4' }} />
              Inconnu
            </span>
          </div>
        </Card>

        {/* Team photo + staff signature */}
        <Card padded={false}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            <div className="md:col-span-3 h-[320px]">
              <img
                src="/assets/EQUIPE_jaune.jpg"
                alt="Pôle Elite FFA"
                className="w-full h-full object-cover rounded-l-lg"
              />
            </div>
            <div className="md:col-span-2 p-6 flex flex-col">
              <div className="text-[10px] tracking-widest uppercase text-black/50 font-bold">
                Staff — Unité Motrice
              </div>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src="/assets/MARIO.jpg"
                  alt="Mario Innaurato"
                  className="w-16 h-16 rounded-full object-cover border-2"
                  style={{ borderColor: '#C9002B' }}
                />
                <div>
                  <div className="text-lg font-bold">INNAURATO Mario</div>
                  <div className="text-xs text-black/60">Responsable Unité Motrice</div>
                  <div className="text-xs text-black/40">FFA — Football Francophone Amateur</div>
                </div>
              </div>
              <div className="mt-6 text-[11px] text-black/60 leading-relaxed">
                Suivi quotidien des charges d'entraînement, prévention des blessures et
                optimisation de la performance physique des joueurs du Pôle Elite.
                Méthodologie : GPS K-Sport, ACWR Gabbett 60/40, Match Model normalisé /80 min.
              </div>
              <div className="mt-auto pt-4 text-[10px] text-black/40">
                Saison 25-26 · {fmt(summary.nMatch)} matchs · {fmt(summary.nTrain)} entraînements
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
