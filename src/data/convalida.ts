// Loaded from /data/CONVALIDA.json (extracted from ACFF 25-26 joint.xlsx feuille Convalida)
// Champ enrichi : score (gf/ga) + résultat V/D/N + catégorie d'entraînement préparatoire
export type MatchResult = 'V' | 'D' | 'N'

export type MatchFixture = {
  date: string                  // ISO yyyy-mm-dd
  opponent: string
  category?: string             // FRIENDLY / OFFICIAL / etc.
  gf?: number | null            // goals for (équipe)
  ga?: number | null            // goals against
  result?: MatchResult | null   // V/D/N (null si pas joué)
  prepCat?: string | null       // PHYSICAL / TACTICAL / TECHNICAL
  prepSub?: string | null       // AEROBIC / PASSING / etc.
}

let cache: MatchFixture[] | null = null
let loadingPromise: Promise<MatchFixture[]> | null = null

export async function loadConvalida(): Promise<MatchFixture[]> {
  if (cache) return cache
  if (!loadingPromise) {
    loadingPromise = fetch('/data/CONVALIDA.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: MatchFixture[]) => {
        cache = d.filter((e) => e.opponent && e.opponent !== 'PRESEASON')
        return cache
      })
      .catch(() => {
        cache = []
        return cache
      })
  }
  return loadingPromise
}

export function opponentByDate(fixtures: MatchFixture[], iso: string): string | null {
  if (!iso) return null
  const hit = fixtures.find((f) => f.date === iso)
  return hit ? hit.opponent : null
}

export function fixtureByDate(fixtures: MatchFixture[], iso: string): MatchFixture | null {
  if (!iso) return null
  return fixtures.find((f) => f.date === iso) ?? null
}

export function resultColor(r: MatchResult | null | undefined): string {
  switch (r) {
    case 'V': return '#1D9E75'  // green
    case 'D': return '#C9002B'  // red
    case 'N': return '#917845'  // gold
    default:  return '#BCC8D4'  // gray (not played)
  }
}

export function resultLabel(r: MatchResult | null | undefined): string {
  switch (r) {
    case 'V': return 'Victoire'
    case 'D': return 'Défaite'
    case 'N': return 'Nul'
    default:  return 'À jouer'
  }
}

export function summarizeSeason(fixtures: MatchFixture[]) {
  const played = fixtures.filter((f) => f.result)
  const v = played.filter((f) => f.result === 'V').length
  const d = played.filter((f) => f.result === 'D').length
  const n = played.filter((f) => f.result === 'N').length
  const gf = played.reduce((s, f) => s + (f.gf ?? 0), 0)
  const ga = played.reduce((s, f) => s + (f.ga ?? 0), 0)
  return {
    total: fixtures.length,
    played: played.length,
    upcoming: fixtures.length - played.length,
    v, d, n,
    gf, ga,
    diff: gf - ga,
    points: v * 3 + n,  // 3 pts win, 1 pt draw
  }
}
