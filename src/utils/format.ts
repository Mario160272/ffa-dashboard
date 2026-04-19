export function fmt(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-BE', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function shortDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit' })
}

export function isoWeek(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function mondayOf(iso: string): string {
  const d = new Date(iso)
  const day = d.getDay() || 7
  if (day !== 1) d.setDate(d.getDate() - (day - 1))
  return d.toISOString().slice(0, 10)
}
