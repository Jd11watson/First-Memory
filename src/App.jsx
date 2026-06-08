import { useState, Component } from 'react'
import FileUpload from './components/FileUpload'
import Navigation from './components/Navigation'
import TeamDashboard from './components/TeamDashboard'
import PlayerDashboard from './components/PlayerDashboard'
import ComparisonView from './components/ComparisonView'
import { saveData, loadData, clearData } from './utils/storage'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
        <div className="max-w-lg w-full bg-red-950/40 border border-red-800 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-4">⚠️</p>
          <h2 className="font-display font-bold text-white text-lg mb-2">Render error</h2>
          <p className="text-red-300 text-xs font-mono mb-6">{this.state.error?.message}</p>
          <button onClick={() => { this.setState({ error: null }); this.props.onReset() }}
            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-display font-semibold transition-colors">
            Start over
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  const [players, setPlayers]               = useState(() => loadData())
  const [view, setView]                     = useState('team')
  const [selectedPlayer, setSelectedPlayer] = useState(() => loadData()?.[0]?.name ?? null)

  function handleData(parsedPlayers) {
    saveData(parsedPlayers)
    setPlayers(parsedPlayers)
    setSelectedPlayer(parsedPlayers[0]?.name ?? null)
    setView('team')
  }

  function handleReset() {
    clearData()
    setPlayers(null)
    setSelectedPlayer(null)
    setView('team')
  }

  function handleSelectPlayer(name) {
    setSelectedPlayer(name)
    setView('player')
  }

  // Called when a round is added manually — update state + persist
  function handleRoundAdded(playerName, round) {
    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.name !== playerName) return p
        const roundLog = [...(p.roundLog ?? []), round]
        return { ...p, roundLog, rounds: roundLog.length }
      })
      saveData(next)
      return next
    })
  }

  if (!players) return <FileUpload onData={handleData} />

  const activePlayer = players.find(p => p.name === selectedPlayer) ?? players[0]

  return (
    <ErrorBoundary onReset={handleReset}>
      <div className="min-h-screen bg-zinc-950">
        <Navigation
          view={view} setView={setView}
          players={players}
          selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer}
          onReset={handleReset}
          hasSavedData
        />
        <main>
          {view === 'team'    && <TeamDashboard players={players} onSelectPlayer={handleSelectPlayer} />}
          {view === 'player'  && activePlayer && (
            <PlayerDashboard
              player={activePlayer}
              onRoundAdded={round => handleRoundAdded(activePlayer.name, round)}
            />
          )}
          {view === 'compare' && <ComparisonView players={players} />}
        </main>
      </div>
    </ErrorBoundary>
  )
}
