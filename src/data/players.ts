export type Player = {
  name: string       // Nom GPS (MAJUSCULES)
  prenom: string
  photo: string | null
  acwr: number
  rpe: number
  nMatch: number
  pctMatch: number
  minMatch: number
  nTrain: number
  pctTrain: number
  minTrain: number
}

// Photos sont nommées <NOM>.jpeg dans public/players/
export const PLAYERS: Player[] = [
  { name: 'AMEWOUNOU', prenom: 'Lilian',        photo: 'AMEWOUNOU.jpeg', acwr: 1.04, rpe: 6.3, nMatch: 21, pctMatch: 80.8,  minMatch: 1334, nTrain: 80,  pctTrain: 74.1, minTrain: 5763 },
  { name: 'BOEHMER',   prenom: 'Julian',        photo: 'BOEHMER.jpeg',   acwr: 0.86, rpe: 5.6, nMatch: 16, pctMatch: 61.5,  minMatch: 849,  nTrain: 74,  pctTrain: 68.5, minTrain: 5196 },
  { name: 'BORSU',     prenom: 'Renan',         photo: 'BORSU.jpeg',     acwr: 0.85, rpe: 5.6, nMatch: 22, pctMatch: 84.6,  minMatch: 984,  nTrain: 85,  pctTrain: 78.7, minTrain: 5976 },
  { name: 'BWALANGWA', prenom: 'Josué',         photo: 'BWALANGWA.jpeg', acwr: 0.80, rpe: 5.3, nMatch: 26, pctMatch: 100.0, minMatch: 1477, nTrain: 96,  pctTrain: 88.9, minTrain: 6931 },
  { name: 'COLLETTE',  prenom: 'Raphaël',       photo: 'COLLETTE.jpeg',  acwr: 1.00, rpe: 5.0, nMatch: 17, pctMatch: 65.4,  minMatch: 874,  nTrain: 67,  pctTrain: 62.0, minTrain: 4887 },
  { name: 'DETRO',     prenom: 'Alexandre',     photo: 'DETRO.jpeg',     acwr: 0.92, rpe: 5.9, nMatch: 21, pctMatch: 80.8,  minMatch: 1229, nTrain: 89,  pctTrain: 82.4, minTrain: 6318 },
  { name: 'DUEZ',      prenom: 'Théo',          photo: null,             acwr: 1.04, rpe: 7.0, nMatch: 22, pctMatch: 84.6,  minMatch: 1455, nTrain: 79,  pctTrain: 73.1, minTrain: 5883 },
  { name: 'GODFROID',  prenom: 'Harry',         photo: 'GODFROID.jpeg',  acwr: 1.03, rpe: 6.3, nMatch: 19, pctMatch: 73.1,  minMatch: 1024, nTrain: 68,  pctTrain: 63.0, minTrain: 5058 },
  { name: 'GOFFIN',    prenom: 'Victor',        photo: 'GOFFIN.jpeg',    acwr: 0.91, rpe: 6.4, nMatch: 26, pctMatch: 100.0, minMatch: 1650, nTrain: 98,  pctTrain: 90.7, minTrain: 7102 },
  { name: 'HENIN',     prenom: 'Clarence',      photo: 'HENIN.jpeg',     acwr: 0.99, rpe: 6.4, nMatch: 24, pctMatch: 92.3,  minMatch: 1361, nTrain: 101, pctTrain: 93.5, minTrain: 7289 },
  { name: 'IKENA',     prenom: 'Okpan',         photo: 'IKENA.jpeg',     acwr: 1.00, rpe: 6.2, nMatch: 24, pctMatch: 92.3,  minMatch: 1302, nTrain: 100, pctTrain: 92.6, minTrain: 7067 },
  { name: 'MBAYA',     prenom: 'Kelvyn',        photo: 'MBAYA.jpeg',     acwr: 0.89, rpe: 5.6, nMatch: 24, pctMatch: 92.3,  minMatch: 1452, nTrain: 88,  pctTrain: 81.5, minTrain: 6294 },
  { name: 'MUNZADI',   prenom: 'Mputu',         photo: 'MUNZADI.jpeg',   acwr: 1.07, rpe: 5.9, nMatch: 25, pctMatch: 96.2,  minMatch: 1494, nTrain: 97,  pctTrain: 89.8, minTrain: 6923 },
  { name: 'NSIBU',     prenom: 'Emmanuel',      photo: 'NSIBU.jpeg',     acwr: 0.88, rpe: 6.6, nMatch: 21, pctMatch: 80.8,  minMatch: 1326, nTrain: 88,  pctTrain: 81.5, minTrain: 6267 },
  { name: 'NYOUNG',    prenom: 'Franck Arthur', photo: 'NYOUNG.jpeg',    acwr: 1.03, rpe: 5.9, nMatch: 23, pctMatch: 88.5,  minMatch: 1284, nTrain: 99,  pctTrain: 91.7, minTrain: 7165 },
  { name: 'OZIAZAR',   prenom: 'Ilyas',         photo: 'OZIAZAR.jpeg',   acwr: 0.96, rpe: 6.5, nMatch: 25, pctMatch: 96.2,  minMatch: 1445, nTrain: 96,  pctTrain: 88.9, minTrain: 6987 },
]

export const PLAYER_BY_NAME: Record<string, Player> = Object.fromEntries(
  PLAYERS.map((p) => [p.name, p]),
)
