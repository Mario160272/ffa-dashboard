import type { GpsRow } from './types'
import { isFullSession } from './excel'

export type ACWRZone = 'OPTIMAL' | 'SURVEILLER' | 'RISQUE' | 'UNKNOWN'

function daysDiff(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.abs(db - da) / (1000 * 60 * 60 * 24)
}

function mean(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

export function filterFullSessions(rows: GpsRow[]): GpsRow[] {
  return rows.filter((r) => isFullSession(r.subjects))
}

export function calcACWRExternal(sessions: GpsRow[], referenceDate: string): number | null {
  const acute = sessions.filter((s) => s.Date && daysDiff(s.Date, referenceDate) <= 7)
  const chronic = sessions.filter((s) => s.Date && daysDiff(s.Date, referenceDate) <= 28)
  if (!chronic.length) return null
  const acuteAvg = mean(acute.map((s) => s['Met Power']))
  const chronicAvg = mean(chronic.map((s) => s['Met Power']))
  return chronicAvg > 0 ? acuteAvg / chronicAvg : null
}

export function calcACWRInternal(sessions: GpsRow[], referenceDate: string): number | null {
  const withRpe = sessions.filter((s) => s.RPE != null && s.RPE > 0 && s['TOTAL TIME'] > 0)
  const acute = withRpe.filter((s) => daysDiff(s.Date, referenceDate) <= 7)
  const chronic = withRpe.filter((s) => daysDiff(s.Date, referenceDate) <= 28)
  if (!chronic.length) return null
  const acuteLoad = mean(acute.map((s) => (s.RPE ?? 0) * s['TOTAL TIME']))
  const chronicLoad = mean(chronic.map((s) => (s.RPE ?? 0) * s['TOTAL TIME']))
  return chronicLoad > 0 ? acuteLoad / chronicLoad : null
}

export function calcACWRCombined(ext: number | null, int: number | null): number | null {
  if (ext != null && int != null) return ext * 0.6 + int * 0.4
  if (ext != null) return ext
  if (int != null) return int
  return null
}

export function getZone(acwr: number | null): ACWRZone {
  if (acwr == null) return 'UNKNOWN'
  if (acwr > 1.5) return 'RISQUE'
  if (acwr > 1.3 || acwr < 0.8) return 'SURVEILLER'
  return 'OPTIMAL'
}

export function zoneColor(z: ACWRZone): string {
  switch (z) {
    case 'OPTIMAL':    return '#1D9E75'
    case 'SURVEILLER': return '#917845'
    case 'RISQUE':     return '#C9002B'
    default:           return '#BCC8D4'
  }
}

export type RpeTrend = 'hausse' | 'baisse' | 'stable'

export function rpeTrend(sessions: GpsRow[], referenceDate: string): RpeTrend {
  const withRpe = sessions
    .filter((s) => s.RPE != null && s.RPE > 0 && daysDiff(s.Date, referenceDate) <= 28)
    .sort((a, b) => a.Date.localeCompare(b.Date))
  if (withRpe.length < 4) return 'stable'
  const half = Math.floor(withRpe.length / 2)
  const firstHalf = mean(withRpe.slice(0, half).map((s) => s.RPE ?? 0))
  const secondHalf = mean(withRpe.slice(half).map((s) => s.RPE ?? 0))
  const diff = secondHalf - firstHalf
  if (diff > 0.5) return 'hausse'
  if (diff < -0.5) return 'baisse'
  return 'stable'
}

export type FormeLabel = 'Optimal' | 'Surveiller' | 'Récupération' | 'Inconnu'

export function getFormeLabel(acwr: number | null, trend: RpeTrend): FormeLabel {
  const z = getZone(acwr)
  if (z === 'OPTIMAL' && trend !== 'hausse') return 'Optimal'
  if (z === 'OPTIMAL' && trend === 'hausse') return 'Surveiller'
  if (z === 'SURVEILLER') return 'Surveiller'
  if (z === 'RISQUE') return 'Récupération'
  return 'Inconnu'
}

export function formeColor(label: FormeLabel): string {
  switch (label) {
    case 'Optimal':      return '#1D9E75'
    case 'Surveiller':   return '#917845'
    case 'Récupération': return '#C9002B'
    default:             return '#BCC8D4'
  }
}
