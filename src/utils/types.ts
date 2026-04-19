export type GpsRow = {
  Date: string            // ISO yyyy-mm-dd
  Name: string            // player name UPPER
  subjects: string        // exercice/session id
  IS_MATCH: 'MATCH' | 'TRAINING'
  Distanza: number
  'Vel > 16 (m)': number
  'Dist > 25,2 km/h': number
  'Acc > 2 (m)': number
  'Dec <-2 (m)': number
  'MP > 20 (m)': number
  'V max': number
  'Met Power': number
  'Dist/min': number
  'HS/MIN': number
  'ACC/MIN': number
  'DEC/MIN': number
  '25/MIN': number
  'TRAINING LOAD': number
  RPE: number | null
  'TOTAL TIME': number
  SEASON: string
  AMPM: 'AM' | 'PM'
  Drill: string
}
