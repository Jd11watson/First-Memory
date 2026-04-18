export default function Navigation({ view, setView, players, selectedPlayer, setSelectedPlayer, onReset }) {
  const views = [
    { id: 'team', label: 'Team' },
    { id: 'player', label: 'Player' },
    { id: 'compare', label: 'Compare' },
  ]

  return (
    <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <button onClick={onReset} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <span className="text-xl">⛳</span>
          <span className="font-extrabold text-white text-sm tracking-tight hidden sm:block">Golf Analytics</span>
        </button>

        {/* View tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === v.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Player selector (shown when view === 'player') */}
        {view === 'player' && (
          <div className="flex gap-1 overflow-x-auto hide-scrollbar ml-2">
            {players.map(p => (
              <button
                key={p.name}
                onClick={() => setSelectedPlayer(p.name)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedPlayer === p.name
                    ? 'bg-emerald-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto shrink-0">
          <button
            onClick={onReset}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            ↑ New file
          </button>
        </div>
      </div>
    </nav>
  )
}
