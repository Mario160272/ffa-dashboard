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

// --- ACWR spécifiques (HSR, ACC) sur la distance cumulée (somme) ---
function ratio7over28Sum(sessions: GpsRow[], referenceDate: string, key: keyof GpsRow): number | null {
  const a = sessions.filter((s) => s.Date && daysDiff(s.Date, referenceDate) <= 7)
  const c = sessions.filter((s) => s.Date && daysDiff(s.Date, referenceDate) <= 28)
  if (!c.length) return null
  const sum = (arr: GpsRow[]) => arr.reduce((s, r) => s + (Number(r[key]) || 0), 0)
  const acute = a.length > 0 ? sum(a) / a.length : 0
  const chronic = sum(c) / c.length
  return chronic > 0 ? acute / chronic : null
}

export function calcACWR_HSR(sessions: GpsRow[], referenceDate: string): number | null {
  return ratio7over28Sum(sessions, referenceDate, 'Vel > 16 (m)' as keyof GpsRow)
}

export function calcACWR_ACC(sessions: GpsRow[], referenceDate: string): number | null {
  return ratio7over28Sum(sessions, referenceDate, 'Acc > 2 (m)' as keyof GpsRow)
}

/**
 * Monotonie Foster : mean(daily loads) / std(daily loads)
 * sur les 7 jours précédant referenceDate (jours OFF = 0)
 * Daily load = somme RPE × TOTAL TIME des sessions de la journée
 */
export function calcMonotony(sessions: GpsRow[], referenceDate: string): number | null {
  const ref = new Date(referenceDate + 'T00:00:00')
  const daily: number[] = []
  const valid = sessions.filter((s) => s.RPE != null && s.RPE > 0 && s['TOTAL TIME'] > 0)
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(ref)
    d.setDate(d.getDate() - offset)
    const iso = d.toISOString().slice(0, 10)
    const dayLoad = valid
      .filter((s) => s.Date === iso)
      .reduce((sum, s) => sum + (s.RPE as number) * s['TOTAL TIME'], 0)
    daily.push(dayLoad)
  }
  const trained = daily.filter((v) => v > 0).length
  if (trained < 2) return null
  const mean = daily.reduce((a, b) => a + b, 0) / daily.length
  const variance = daily.reduce((a, b) => a + (b - mean) ** 2, 0) / daily.length
  const std = Math.sqrt(variance)
  return std > 0 ? mean / std : null
}

/**
 * Score de risque composite /11
 * - ACWR combiné : >1.5 (+3) / 1.3-1.5 ou <0.5 (+2) / 0.5-0.8 (+1) / 0.8-1.3 (+0)
 * - ACWR HSR    : >1.5 (+2) / 1.3-1.5 (+1)
 * - ACWR ACC    : >1.5 (+2) / 1.3-1.5 (+1)
 * - Diff GPS/RPE: >0.30 (+2) / 0.15-0.30 (+1)
 * - Monotonie   : >2.0 (+2) / 1.5-2.0 (+1)
 */
export function computeRiskScore(args: {
  comb: number | null
  hsr: number | null
  acc: number | null
  diff: number | null
  monotony: number | null
}): number {
  let score = 0
  if (args.comb != null) {
    if (args.comb > 1.5) score += 3
    else if (args.comb > 1.3 || args.comb < 0.5) score += 2
    else if (args.comb < 0.8) score += 1
  }
  if (args.hsr != null) {
    if (args.hsr > 1.5) score += 2
    else if (args.hsr > 1.3) score += 1
  }
  if (args.acc != null) {
    if (args.acc > 1.5) score += 2
    else if (args.acc > 1.3) score += 1
  }
  if (args.diff != null) {
    if (args.diff > 0.3) score += 2
    else if (args.diff > 0.15) score += 1
  }
  if (args.monotony != null) {
    if (args.monotony > 2) score += 2
    else if (args.monotony > 1.5) score += 1
  }
  return score
}

export function riskColor(score: number): string {
  if (score >= 7) return '#C9002B'
  if (score >= 4) return '#917845'
  return '#1D9E75'
}
