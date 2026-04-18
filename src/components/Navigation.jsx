export default function Navigation({ view, setView, players, selectedPlayer, setSelectedPlayer, onReset }) {
  const views = [
    { id: 'team',    label: 'Team' },
    { id: 'player',  label: 'Player' },
    { id: 'compare', label: 'Compare' },
  ]

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-5">

        <button onClick={onReset} className="flex items-center gap-2.5 shrink-0 hover:opacity-70 transition-opacity">
          <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center text-sm leading-none">⛳</div>
          <span className="font-display font-semibold text-white text-sm hidden sm:block">Golf Analytics</span>
        </button>

        <div className="w-px h-5 bg-zinc-800 shrink-0" />

        <div className="flex gap-0.5">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all ${
                view === v.id
                  ? 'bg-zinc-800 text-white ring-1 ring-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'player' && (
          <div className="flex gap-1 overflow-x-auto ml-1" style={{ scrollbarWidth: 'none' }}>
            {players.map(p => (
              <button
                key={p.name}
                onClick={() => setSelectedPlayer(p.name)}
                className={`px-3 py-1 rounded-md text-xs font-display font-medium whitespace-nowrap transition-all ${
                  selectedPlayer === p.name
                    ? 'bg-green-500 text-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto">
          <button onClick={onReset} className="text-[11px] text-zinc-700 hover:text-zinc-500 transition-colors font-display">
            ↑ New file
          </button>
        </div>
      </div>
    </nav>
  )
}
