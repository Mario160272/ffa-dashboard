import { NavLink } from 'react-router-dom'

const NAV = [
  { n: '00', label: 'Dashboard',         to: '/' },
  { n: '01', label: 'Session Match',     to: '/session-match' },
  { n: '02', label: 'Inside Training',   to: '/session-training' },
  { n: '03', label: 'Week Analysis',     to: '/week-analysis' },
  { n: '04', label: 'Prediction',        to: '/prediction' },
  { n: '05', label: 'Contrôle Charge',   to: '/controle-charge' },
  { n: '06', label: 'Répartition',       to: '/repartition' },
  { n: '07', label: 'Présences',         to: '/presences' },
  { n: '08', label: 'Testing',           to: '/testing' },
]

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[220px] flex flex-col text-white"
      style={{
        background: 'linear-gradient(180deg, #1A0008 0%, #2D0012 100%)',
        borderRight: '1px solid rgba(201, 0, 43, 0.25)',
      }}
    >
      {/* Team photo (COSA) as backdrop banner */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 150,
          background:
            'linear-gradient(180deg, rgba(26,0,8,0.55) 0%, rgba(26,0,8,0.95) 100%), url(/assets/EQUIPE_jaune.jpg) center 30% / cover no-repeat',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-4 pb-2">
          <img
            src="/assets/FFA_logo_baseline_blanc.png"
            alt="FFA"
            className="w-full h-auto object-contain"
            style={{ maxHeight: 70 }}
          />
          <div className="mt-1 text-[10px] tracking-[0.25em] uppercase text-white/80 text-center font-semibold">
            Pôle Elite · 25-26
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#C9002B]/12 text-white'
                  : 'text-white/65 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute right-0 top-0 bottom-0"
                    style={{
                      width: 3,
                      background: '#C9002B',
                    }}
                  />
                )}
                <span className="text-[10px] font-bold opacity-60 w-5 font-mono tracking-tight">
                  {item.n}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="nav-active-dot" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Signature */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <img
          src="/assets/MARIO.jpg"
          alt="Mario"
          className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="text-[13px] font-bold leading-tight truncate text-white">
            INNAURATO Mario
          </div>
          <div className="text-[11px] leading-tight" style={{ color: '#BCC8D4' }}>
            Responsable Unité Motrice
          </div>
          <div className="text-[10px] leading-tight font-semibold" style={{ color: '#C9002B' }}>
            FFA
          </div>
        </div>
      </div>
    </aside>
  )
}
