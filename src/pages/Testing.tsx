import Header from '../components/Header'
import Card from '../components/Card'

export default function Testing() {
  return (
    <>
      <Header
        title="Testing & Profil physique"
        subtitle="Sprints · CMJ · T-Test · 30-15 Ift · FMS · Nordbord"
        badge="08"
      />
      <div className="p-6">
        <Card>
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: '#C9002B', color: '#FFF' }}
            >
              <span className="text-2xl font-bold">08</span>
            </div>
            <h2 className="text-xl font-bold text-ffa-text">En cours de développement</h2>
            <p className="text-sm text-black/50 mt-2 max-w-md">
              Cette page accueillera l'analyse des tests de terrain (sprints 5/10/20/30 m, CMJ/CMJB, T-Test,
              30-15 Ift, FMS total, Nordbord G/D) ainsi que le composite score.
            </p>
            <p className="text-xs text-black/40 mt-4">
              Source : <code>public/data/TESTINGS_PE.xlsx</code> — 3 sessions disponibles (20/07/2025, 01/01/2026, 09/02/2026)
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
