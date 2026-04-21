import type { GpsRow } from './types'
import { isFullSession } from './excel'
import { mondayOf } from './format'

export type TeamSessionAvg = {
  date: string
  subjects: string
  isMatch: boolean
  dist: number
  hsr: number
  sprint: number
  acc: number
  dec: number
  mp: number
  mpDist: number   // Met Power >20 dist
  distMin: number
  hsrMin: number
  duration: number
  nPlayers: number
  rpeMean: number | null
  tl: number       // mean RPE*duration across players (RPE>0 only)
}

/**
 * Compute Team Average per session (groupby Date + subjects) from raw GPS rows.
 * Only includes FULL sessions (FULLTRAINING/FULLMATCH).
 */
export function teamAveragePerSession(rows: GpsRow[]): TeamSessionAvg[] {
  const full = rows.filter((r) => isFullSession(r.subjects))
  const map = new Map<string, GpsRow[]>()
  for (const r of full) {
    const key = `${r.Date}__${r.subjects}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  const result: TeamSessionAvg[] = []
  for (const [key, arr] of map.entries()) {
    const [date, subjects] = key.split('__')
    const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)
    const rpeVals = arr.map((r) => r.RPE ?? 0).filter((v) => v > 0)
    const tlVals = arr
      .filter((r) => r.RPE != null && r.RPE > 0 && r['TOTAL TIME'] > 0)
      .map((r) => (r.RPE as number) * r['TOTAL TIME'])
    result.push({
      date,
      subjects,
      isMatch: arr[0]?.IS_MATCH === 'MATCH',
      dist: mean(arr.map((r) => r.Distanza)),
      hsr: mean(arr.map((r) => r['Vel > 16 (m)'])),
      sprint: mean(arr.map((r) => r['Dist > 25,2 km/h'])),
      acc: mean(arr.map((r) => r['Acc > 2 (m)'])),
      dec: mean(arr.map((r) => r['Dec <-2 (m)'])),
      mp: mean(arr.map((r) => r['Met Power'])),
      mpDist: mean(arr.map((r) => r['MP > 20 (m)'])),
      distMin: mean(arr.map((r) => r['Dist/min'])),
      hsrMin: mean(arr.map((r) => r['HS/MIN'])),
      duration: mean(arr.map((r) => r['TOTAL TIME'])),
      nPlayers: arr.length,
      rpeMean: rpeVals.length ? rpeVals.reduce((s, v) => s + v, 0) / rpeVals.length : null,
      tl: tlVals.length ? tlVals.reduce((s, v) => s + v, 0) / tlVals.length : 0,
    })
  }
  return result.sort((a, b) => a.date.localeCompare(b.date))
}

export type WeekAggregate = {
  week: string              // Monday ISO
  sessions: TeamSessionAvg[]
  dist: number              // sum over sessions
  hsr: number
  sprint: number
  acc: number
  dec: number
  tlMean: number | null     // mean TL (per-player avg)
  rpeMean: number | null
  hasMatch: boolean
  matchDate: string | null
  matchSession: TeamSessionAvg | null
}

export function aggregateByWeek(sessions: TeamSessionAvg[]): WeekAggregate[] {
  const map = new Map<string, TeamSessionAvg[]>()
  for (const s of sessions) {
    const w = mondayOf(s.date)
    if (!map.has(w)) map.set(w, [])
    map.get(w)!.push(s)
  }
  const result: WeekAggregate[] = []
  for (const [week, arr] of map.entries()) {
    const match = arr.find((s) => s.isMatch) ?? null
    const tlVals = arr.map((s) => s.tl).filter((v) => v > 0)
    const rpeVals = arr.map((s) => s.rpeMean).filter((v): v is number => v != null)
    result.push({
      week,
      sessions: arr,
      dist: arr.reduce((s, x) => s + x.dist, 0),
      hsr: arr.reduce((s, x) => s + x.hsr, 0),
      sprint: arr.reduce((s, x) => s + x.sprint, 0),
      acc: arr.reduce((s, x) => s + x.acc, 0),
      dec: arr.reduce((s, x) => s + x.dec, 0),
      tlMean: tlVals.length ? tlVals.reduce((a, b) => a + b, 0) / tlVals.length : null,
      rpeMean: rpeVals.length ? rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length : null,
      hasMatch: !!match,
      matchDate: match?.date ?? null,
      matchSession: match,
    })
  }
  return result.sort((a, b) => a.week.localeCompare(b.week))
}

/**
 * Given a reference match date, return MD-5...MD-1 + MATCH.
 */
export type MDSlot = {
  label: string      // "MD-5" ... "MATCH"
  dayOffset: number  // -5..0
  date: string       // ISO
  session: TeamSessionAvg | null
}

export function microCycle(
  sessions: TeamSessionAvg[],
  matchDate: string,
): MDSlot[] {
  const refDate = new Date(matchDate + 'T00:00:00')
  const slots: MDSlot[] = []
  for (let off = -5; off <= 0; off++) {
    const d = new Date(refDate)
    d.setDate(d.getDate() + off)
    const iso = d.toISOString().slice(0, 10)
    const session = sessions.find((s) => s.date === iso) ?? null
    slots.push({
      label: off === 0 ? 'MATCH' : `MD${off}`,
      dayOffset: off,
      date: iso,
      session,
    })
  }
  return slots
}

/**
 * Match Model reference (Team Average, normalized per 80min).
 * Computed from season matches: mean of (session_metric / session_duration * 80).
 */
export function computeMatchRef80(sessions: TeamSessionAvg[]) {
  const matches = sessions.filter((s) => s.isMatch && s.duration > 0)
  if (!matches.length) {
    return { dist: 9085, hsr: 1570, sprint: 280, acc: 427, dec: 390, duration80: 80 }
  }
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
  const normalize = (m: TeamSessionAvg, k: keyof TeamSessionAvg) =>
    ((m[k] as number) / m.duration) * 80
  return {
    dist: mean(matches.map((m) => normalize(m, 'dist'))),
    hsr: mean(matches.map((m) => normalize(m, 'hsr'))),
    sprint: mean(matches.map((m) => normalize(m, 'sprint'))),
    acc: mean(matches.map((m) => normalize(m, 'acc'))),
    dec: mean(matches.map((m) => normalize(m, 'dec'))),
    duration80: 80,
  }
}
