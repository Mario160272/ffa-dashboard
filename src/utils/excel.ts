import * as XLSX from 'xlsx'
import type { GpsRow } from './types'

function excelDateToISO(val: unknown): string {
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val)
    if (!d) return ''
    const mm = String(d.m).padStart(2, '0')
    const dd = String(d.d).padStart(2, '0')
    return `${d.y}-${mm}-${dd}`
  }
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10)
  }
  if (typeof val === 'string') {
    // "2025-08-13" or "13/08/2025"
    const s = val.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (m) {
      const dd = m[1].padStart(2, '0')
      const mm = m[2].padStart(2, '0')
      let yyyy = m[3]
      if (yyyy.length === 2) yyyy = '20' + yyyy
      return `${yyyy}-${mm}-${dd}`
    }
  }
  return ''
}

function toNum(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function toNumOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n)) return null
  if (n === 0) return null
  return n
}

export async function loadGpsData(url = '/data/FFA_GPS_DATA_CLEAN.xlsx'): Promise<GpsRow[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GPS file not found: ${res.status}`)
  const buf = await res.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: false })
  const sheetName = wb.SheetNames.find((n) => n.toUpperCase().includes('GPS')) || wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  // Detect header row: look for a row containing both "Date" and "Name"
  const grid = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' }) as (string | number)[][]
  let headerRowIdx = 0
  for (let i = 0; i < Math.min(grid.length, 5); i++) {
    const cells = (grid[i] || []).map((v) => String(v || '').trim())
    if (cells.includes('Date') && cells.includes('Name')) {
      headerRowIdx = i
      break
    }
  }
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: '',
    range: headerRowIdx,
  })
  return raw.map((r) => ({
    Date: excelDateToISO(r['Date']),
    Name: String(r['Name'] ?? '').trim().toUpperCase(),
    subjects: String(r['subjects'] ?? '').trim(),
    IS_MATCH: (String(r['IS_MATCH'] ?? '').trim().toUpperCase() as 'MATCH' | 'TRAINING') || 'TRAINING',
    Distanza: toNum(r['Distanza']),
    'Vel > 16 (m)': toNum(r['Vel > 16 (m)']),
    'Dist > 25,2 km/h': toNum(r['Dist > 25,2 km/h']),
    'Acc > 2 (m)': toNum(r['Acc > 2 (m)']),
    'Dec <-2 (m)': toNum(r['Dec <-2 (m)']),
    'MP > 20 (m)': toNum(r['MP > 20 (m)']),
    'V max': toNum(r['V max']),
    'Met Power': toNum(r['Met Power']),
    'Dist/min': toNum(r['Dist/min']),
    'HS/MIN': toNum(r['HS/MIN']),
    'ACC/MIN': toNum(r['ACC/MIN']),
    'DEC/MIN': toNum(r['DEC/MIN']),
    '25/MIN': toNum(r['25/MIN']),
    'TRAINING LOAD': toNum(r['TRAINING LOAD']),
    RPE: toNumOrNull(r['RPE']),
    'TOTAL TIME': toNum(r['TOTAL TIME']),
    SEASON: String(r['SEASON'] ?? '').trim(),
    AMPM: (String(r['AMPM'] ?? 'AM').trim().toUpperCase() as 'AM' | 'PM') || 'AM',
    Drill: String(r['Drill'] ?? '').trim(),
  }))
}

export function isFullSession(subject: string): boolean {
  const s = (subject || '').toUpperCase()
  return s.includes('FULLTRAINING') || s.includes('FULLMATCH') || s.includes('FULL TRAINING') || s.includes('FULL MATCH')
}

export function isExercise(subject: string): boolean {
  return !isFullSession(subject)
}
