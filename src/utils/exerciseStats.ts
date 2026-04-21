import type { GpsRow } from './types'
import { isFullSession } from './excel'
import { parseSubject } from '../data/exercises'

export type ExerciseLiveStat = {
  subject: string
  cat: 'PHYSIQUE' | 'TACTIQUE' | 'TECHNIQUE' | 'AUTRE'
  sub: string
  n: number            // sample size
  distMin: number
  hsrMin: number
  accMin: number
  decMin: number
  sprintMin: number
  mpAvg: number        // Met Power mean (W/kg)
  durationMean: number // avg session duration
}

/**
 * Build a dynamic catalog of all exercises (subjects) from GPS rows,
 * with per-minute averages computed on the fly.
 * Filters: exclude FULLTRAINING/FULLMATCH/1STTIME/2NDTIME markers, keep n >= 3.
 */
export function buildExerciseCatalog(rows: GpsRow[]): ExerciseLiveStat[] {
  const groups = new Map<string, GpsRow[]>()
  for (const r of rows) {
    if (!r.subjects) continue
    if (isFullSession(r.subjects)) continue
    if (/1STTIME|2NDTIME/i.test(r.subjects)) continue
    if (!(r['TOTAL TIME'] > 0)) continue
    if (!groups.has(r.subjects)) groups.set(r.subjects, [])
    groups.get(r.subjects)!.push(r)
  }

  const result: ExerciseLiveStat[] = []
  for (const [subject, arr] of groups.entries()) {
    if (arr.length < 3) continue
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
    // per-minute = metric / duration, then mean across sessions
    const distMin = mean(arr.map((r) => r.Distanza / r['TOTAL TIME']))
    const hsrMin = mean(arr.map((r) => r['Vel > 16 (m)'] / r['TOTAL TIME']))
    const accMin = mean(arr.map((r) => r['Acc > 2 (m)'] / r['TOTAL TIME']))
    const decMin = mean(arr.map((r) => r['Dec <-2 (m)'] / r['TOTAL TIME']))
    const sprintMin = mean(arr.map((r) => r['Dist > 25,2 km/h'] / r['TOTAL TIME']))
    const mpAvg = mean(arr.map((r) => r['Met Power']))
    const durationMean = mean(arr.map((r) => r['TOTAL TIME']))
    const { cat, sub } = parseSubject(subject)
    result.push({
      subject, cat, sub, n: arr.length,
      distMin, hsrMin, accMin, decMin, sprintMin, mpAvg, durationMean,
    })
  }
  // sort by n desc
  return result.sort((a, b) => b.n - a.n)
}
