export default function Navigation({ view, setView, players, selectedPlayer, setSelectedPlayer, onReset }) {
  const views = [
    { id: 'team',    label: 'Team' },
    { id: 'player',  label: 'Player' },
    { id: 'compare', label: 'Compare' },
  ]

  return (
    <nav className="border-b border-[#162318] sticky top-0 z-50" style={{ background: '#050a07' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-5">

        {/* Logo */}
        <button onClick={onReset} className="flex items-center gap-2.5 shrink-0 hover:opacity-75 transition-opacity">
          <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center text-sm">⛳</div>
          <span className="font-display font-semibold text-white text-sm tracking-tight hidden sm:block">
            Golf Analytics
          </span>
        </button>

        <div className="w-px h-5 bg-[#162318]" />

        {/* View tabs */}
        <div className="flex gap-0.5">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all ${
                view === v.id
                  ? 'bg-emerald-800/70 text-emerald-300 ring-1 ring-emerald-700/50'
                  : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Player pills — visible in player view */}
        {view === 'player' && (
          <div className="flex gap-1 overflow-x-auto ml-2" style={{ scrollbarWidth: 'none' }}>
            {players.map(p => (
              <button
                key={p.name}
                onClick={() => setSelectedPlayer(p.name)}
                className={`px-3 py-1 rounded-lg text-xs font-display font-semibold whitespace-nowrap transition-all ${
                  selectedPlayer === p.name
                    ? 'bg-emerald-800 text-emerald-200'
                    : 'text-gray-600 hover:text-gray-300'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto">
          <button
            onClick={onReset}
            className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors font-display"
          >
            ↑ New file
          </button>
        </div>
      </div>
    </nav>
  )
}
