import { useMemo, useState } from 'react'
import Header from '../components/Header'
import Card from '../components/Card'
import Kpi from '../components/Kpi'
import PlayerAvatar from '../components/PlayerAvatar'
import { PLAYERS } from '../data/players'
import { fmt } from '../utils/format'
import { formeColor, getFormeLabel, getZone, zoneColor } from '../utils/acwr'

export default function ControleCharge() {
  const [selected, setSelected] = useState<string | null>(null)

  const team = useMemo(() => {
    const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)
    return {
      acwr: mean(PLAYERS.map((p) => p.acwr)),
      rpe: mean(PLAYERS.map((p) => p.rpe)),
    }
  }, [])

  const player = selected ? PLAYERS.find((p) => p.name === selected) ?? null : null
  const playerForme = player ? getFormeLabel(player.acwr, 'stable') : null

  return (
    <>
      <Header
        title="Contrôle de la charge"
        subtitle="ACWR équipe & joueurs — zones Gabbett"
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
        {!player && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi label="ACWR Combiné" value={team.acwr.toFixed(2)} accent="red" />
              <Kpi label="ACWR Externe (moy.)" value={team.acwr.toFixed(2)} accent="red" />
              <Kpi label="ACWR Interne (moy.)" value={team.acwr.toFixed(2)} accent="red" />
              <Kpi label="RPE moy." value={team.rpe.toFixed(1)} unit="/10" accent="neutral" />
              <Kpi label="TL moy." value="—" accent="neutral" />
            </div>

            <Card title="Grille joueurs" subtitle="Clique sur une carte pour voir le détail">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PLAYERS.map((p) => {
                  const z = getZone(p.acwr)
                  const col = zoneColor(z)
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
                        <div
                          className="text-lg font-bold"
                          style={{ color: col }}
                        >
                          {p.acwr.toFixed(2)}
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
                              width: `${Math.min(100, (p.acwr / 2) * 100)}%`,
                              background: col,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-black/50">RPE {p.rpe.toFixed(1)}</div>
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
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {(['ext', 'int', 'comb'] as const).map((k) => {
                  const val = player.acwr
                  const z = getZone(val)
                  return (
                    <div key={k} className="p-5 border-b md:border-b-0 md:border-r border-black/5 last:border-r-0">
                      <div className="text-[10px] uppercase tracking-widest text-black/50">
                        {k === 'ext' ? 'ACWR Externe' : k === 'int' ? 'ACWR Interne' : 'ACWR Combiné'}
                      </div>
                      <div className="mt-1 text-3xl font-bold" style={{ color: zoneColor(z) }}>
                        {val.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-semibold mt-0.5" style={{ color: zoneColor(z) }}>
                        {z}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card title="Contexte">
              <div className="text-sm text-black/70 leading-relaxed">
                {playerForme === 'Optimal' && (
                  <>Zone optimale. Charge bien proportionnée à la base chronique — maintenir la planification en cours.</>
                )}
                {playerForme === 'Surveiller' && (
                  <>Zone de surveillance. ACWR s'écarte de la fenêtre 0.8–1.3. Ajuster la charge aiguë de la prochaine semaine.</>
                )}
                {playerForme === 'Récupération' && (
                  <>Risque élevé. ACWR &gt; 1.5 — réduire le volume / HSR sur 3-5 jours et privilégier la récupération.</>
                )}
                {playerForme === 'Inconnu' && <>Pas assez de données récentes pour estimer la forme.</>}
              </div>
            </Card>
          </>
        )}

        <div className="text-[11px] text-black/40">
          Affichage basé sur les valeurs pré-calculées (snapshot saison). Le branchement live sur l'Excel GPS sera activé à l'étape suivante — les mêmes fonctions ACWR dans <code>src/utils/acwr.ts</code> seront alors utilisées. · {fmt(PLAYERS.length)} joueurs
        </div>
      </div>
    </>
  )
}
