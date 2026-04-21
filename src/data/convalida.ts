// Loaded from /data/CONVALIDA.json (extracted from ACFF 25-26 joint.xlsx feuille Convalida)
export type MatchFixture = {
  date: string  // ISO yyyy-mm-dd
  opponent: string
}

let cache: MatchFixture[] | null = null
let loadingPromise: Promise<MatchFixture[]> | null = null

export async function loadConvalida(): Promise<MatchFixture[]> {
  if (cache) return cache
  if (!loadingPromise) {
    loadingPromise = fetch('/data/CONVALIDA.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: MatchFixture[]) => {
        // Filter out "PRESEASON" markers without real opponent
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
