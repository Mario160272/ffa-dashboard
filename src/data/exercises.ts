export type ExerciseStat = {
  distMin: number
  hsrMin: number
  accMin: number
  decMin: number
  sprintMin: number
  mpAvg: number
  cat: 'PHYSIQUE' | 'TACTIQUE' | 'TECHNIQUE' | 'AUTRE'
  sub: string
}

export const EXERCISE_STATS: Record<string, ExerciseStat> = {
  'PE_ACFF_PHYSIQUE_AEROBIE_PLATEAU':                   { distMin: 89.71,  hsrMin:  0.70, accMin: 2.67, decMin: 2.13, sprintMin: 0.02, mpAvg:  7.72, cat: 'PHYSIQUE',  sub: 'AEROBIE' },
  'PE_ACFF_PHYSIQUE_AEROBIE_CONDUITE DE BALLE':         { distMin: 84.42,  hsrMin:  0.20, accMin: 2.29, decMin: 1.85, sprintMin: 0.01, mpAvg:  7.24, cat: 'PHYSIQUE',  sub: 'AEROBIE' },
  'PE_ACFF_TACTIQUE_MSG_K+7VS7+K':                      { distMin: 101.85, hsrMin:  2.21, accMin: 6.49, decMin: 5.89, sprintMin: 0.18, mpAvg:  9.58, cat: 'TACTIQUE',  sub: 'MSG' },
  'PE_ACFF_TECHNIQUE_PASSING_EN LIGNE':                 { distMin: 54.20,  hsrMin:  0.00, accMin: 3.59, decMin: 2.34, sprintMin: 0.00, mpAvg:  4.93, cat: 'TECHNIQUE', sub: 'PASSING' },
  'PE_ACFF_TACTIQUE_POSSESSION_5VS5+J4+N1':             { distMin: 66.05,  hsrMin:  0.01, accMin: 4.95, decMin: 3.90, sprintMin: 0.01, mpAvg:  6.23, cat: 'TACTIQUE',  sub: 'POSSESSION' },
  'PE_ACFF_TACTIQUE_POSSESSION_4VS4+J4+N1':             { distMin: 50.94,  hsrMin:  0.00, accMin: 4.32, decMin: 3.20, sprintMin: 0.00, mpAvg:  4.86, cat: 'TACTIQUE',  sub: 'POSSESSION' },
  'PE_ACFF_TACTIQUE_MSG_K+6VS6+K':                      { distMin: 106.02, hsrMin:  3.03, accMin: 7.03, decMin: 6.31, sprintMin: 0.25, mpAvg: 10.03, cat: 'TACTIQUE',  sub: 'MSG' },
  'PE_ACFF_TACTIQUE_POSSESSION_4VS4+J8':                { distMin: 54.00,  hsrMin:  0.09, accMin: 4.37, decMin: 3.41, sprintMin: 0.01, mpAvg:  5.15, cat: 'TACTIQUE',  sub: 'POSSESSION' },
  'PE_ACFF_TECHNIQUE_PASSING_LOSANGE':                  { distMin: 72.01,  hsrMin:  0.56, accMin: 4.73, decMin: 2.35, sprintMin: 0.05, mpAvg:  6.50, cat: 'TECHNIQUE', sub: 'PASSING' },
  'PE_ACFF_TECHNIQUE_PASSING_Y':                        { distMin: 62.31,  hsrMin:  0.09, accMin: 4.58, decMin: 2.43, sprintMin: 0.01, mpAvg:  5.70, cat: 'TECHNIQUE', sub: 'PASSING' },
  'PE_ACFF_TECHNIQUE_PASSING_CROIX':                    { distMin: 73.85,  hsrMin:  2.37, accMin: 5.14, decMin: 2.64, sprintMin: 0.20, mpAvg:  6.73, cat: 'TECHNIQUE', sub: 'PASSING' },
  'PE_ACFF_TECHNIQUE_PASSING_DOUBLE CARRE':             { distMin: 65.30,  hsrMin:  0.59, accMin: 4.43, decMin: 2.07, sprintMin: 0.05, mpAvg:  5.91, cat: 'TECHNIQUE', sub: 'PASSING' },
  'PE_ACFF_PHYSIQUE_AEROBIE_EDB':                       { distMin: 163.72, hsrMin:  0.06, accMin: 0.23, decMin: 0.19, sprintMin: 0.01, mpAvg: 13.07, cat: 'PHYSIQUE',  sub: 'AEROBIE' },
  'PE_ACFF_TACTIQUE_MSG_K+7VS7+K+N1':                   { distMin: 100.07, hsrMin:  3.41, accMin: 5.82, decMin: 5.03, sprintMin: 0.28, mpAvg:  9.26, cat: 'TACTIQUE',  sub: 'MSG' },
  'PE_ACFF_TECHNIQUE_PASSING_SABLIER':                  { distMin: 62.00,  hsrMin:  0.14, accMin: 4.61, decMin: 2.24, sprintMin: 0.01, mpAvg:  5.66, cat: 'TECHNIQUE', sub: 'PASSING' },
  'PE_ACFF_TACTIQUE_SSG_K+4VS4+K+J8':                   { distMin: 65.41,  hsrMin:  0.31, accMin: 5.20, decMin: 4.49, sprintMin: 0.03, mpAvg:  6.33, cat: 'TACTIQUE',  sub: 'SSG' },
  'PE_ACFF_TACTIQUE_LSG_K+8VS8+K':                      { distMin: 116.06, hsrMin:  3.91, accMin: 5.85, decMin: 5.45, sprintMin: 0.32, mpAvg: 10.62, cat: 'TACTIQUE',  sub: 'LSG' },
  'PE_ACFF_PHYSIQUE_AEROBIE_INT 15-15':                 { distMin: 141.57, hsrMin: 57.93, accMin: 8.38, decMin: 8.35, sprintMin: 4.83, mpAvg: 13.33, cat: 'PHYSIQUE',  sub: 'AEROBIE' },
  'PE_ACFF_PHYSIQUE_VITESSE_SPRINTS DEPART ECHELLE SAM': { distMin: 83.62, hsrMin: 26.62, accMin: 5.59, decMin: 5.30, sprintMin: 2.22, mpAvg:  7.84, cat: 'PHYSIQUE',  sub: 'VITESSE' },
  'PE_ACFF_TACTIQUE_POSSESSION5VS5+J4+N1':              { distMin: 79.03,  hsrMin:  0.39, accMin: 5.43, decMin: 4.46, sprintMin: 0.03, mpAvg:  7.41, cat: 'TACTIQUE',  sub: 'POSSESSION' },
}

export function ampType(mp: number): 'Neuromusculaire' | 'Mixte' | 'Endurance' {
  if (mp > 10) return 'Neuromusculaire'
  if (mp > 7)  return 'Mixte'
  return 'Endurance'
}

export function ampColor(mp: number): string {
  if (mp > 10) return '#C9002B'
  if (mp > 7)  return '#917845'
  return '#1D9E75'
}

export function rpeEstimate(mp: number): number {
  if (mp > 10) return 7.5
  if (mp > 7)  return 6.0
  return 5.0
}

export type PredictionLine = {
  dist: number
  hsr: number
  acc: number
  dec: number
  sprint: number
  mpAvg: number
  rpeEst: number
  tlEst: number
  ampType: ReturnType<typeof ampType>
  ampColor: string
}

export function predictExercise(subjectKey: string, durationMin: number): PredictionLine | null {
  const stats = EXERCISE_STATS[subjectKey]
  if (!stats) return null
  const rpeEst = rpeEstimate(stats.mpAvg)
  return {
    dist: Math.round(stats.distMin * durationMin),
    hsr: Math.round(stats.hsrMin * durationMin),
    acc: Math.round(stats.accMin * durationMin),
    dec: Math.round(stats.decMin * durationMin),
    sprint: Math.round(stats.sprintMin * durationMin),
    mpAvg: stats.mpAvg,
    rpeEst,
    tlEst: Math.round(rpeEst * durationMin),
    ampType: ampType(stats.mpAvg),
    ampColor: ampColor(stats.mpAvg),
  }
}

export function parseSubject(subject: string): { cat: ExerciseStat['cat']; sub: string; detail: string } {
  const clean = subject.replace('PE_ACFF_', '').replace('PE_ACF_', '')
  const parts = clean.split('_')
  let cat: ExerciseStat['cat'] = 'AUTRE'
  const first = (parts[0] ?? '').toUpperCase()
  if (first.includes('PHYSIQUE')) cat = 'PHYSIQUE'
  else if (first.includes('TECHNIQUE')) cat = 'TECHNIQUE'
  else if (first.includes('TACTIQUE')) cat = 'TACTIQUE'
  const sub = parts[1] || cat
  const detail = parts.slice(2).join('_') || ''
  return { cat, sub, detail }
}
