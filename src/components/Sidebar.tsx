import { NavLink } from 'react-router-dom'

const NAV = [
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
      className="fixed left-0 top-0 bottom-0 w-[220px] flex flex-col"
      style={{ background: '#1A0008', color: '#FFFFFF' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-white/10">
        <img
          src="/assets/FFA_logo_baseline_blanc.png"
          alt="FFA"
          className="w-full h-auto object-contain"
          style={{ maxHeight: 90 }}
        />
        <div className="mt-3 text-[10px] tracking-widest uppercase text-white/60 text-center">
          Pôle Excellence · 25-26
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-colors border-l-[3px] ${
                isActive
                  ? 'bg-[#C9002B]/15 text-white border-[#C9002B]'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'
              }`
            }
          >
            <span className="text-[10px] font-bold opacity-60 w-5">{item.n}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Signature */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <img
          src="/assets/MARIO.jpg"
          alt="Mario"
          className="w-10 h-10 rounded-full object-cover border border-white/20"
        />
        <div className="min-w-0">
          <div className="text-[12px] font-semibold leading-tight truncate">
            INNAURATO Mario
          </div>
          <div className="text-[10px] text-white/60 leading-tight">
            Responsable Unité Motrice
          </div>
          <div className="text-[10px] text-white/40 leading-tight">FFA</div>
        </div>
      </div>
    </aside>
  )
}
