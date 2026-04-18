import { useState, Component } from 'react'
import FileUpload from './components/FileUpload'
import Navigation from './components/Navigation'
import TeamDashboard from './components/TeamDashboard'
import PlayerDashboard from './components/PlayerDashboard'
import ComparisonView from './components/ComparisonView'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-red-950/50 border border-red-800 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-white font-bold text-lg mb-2">Something went wrong rendering the dashboard</h2>
            <p className="text-red-300 text-sm mb-4 font-mono break-all">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); this.props.onReset() }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [players, setPlayers] = useState(null)
  const [view, setView] = useState('team')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  function handleData(parsedPlayers) {
    setPlayers(parsedPlayers)
    setSelectedPlayer(parsedPlayers[0]?.name ?? null)
    setView('team')
  }

  function handleReset() {
    setPlayers(null)
    setSelectedPlayer(null)
    setView('team')
  }

  function handleSelectPlayer(name) {
    setSelectedPlayer(name)
    setView('player')
  }

  if (!players) {
    return <FileUpload onData={handleData} />
  }

  const activePlayer = players.find(p => p.name === selectedPlayer) ?? players[0]

  return (
    <ErrorBoundary onReset={handleReset}>
      <div className="min-h-screen bg-gray-950">
        <Navigation
          view={view}
          setView={setView}
          players={players}
          selectedPlayer={selectedPlayer}
          setSelectedPlayer={setSelectedPlayer}
          onReset={handleReset}
        />
        <main>
          {view === 'team' && (
            <TeamDashboard players={players} onSelectPlayer={handleSelectPlayer} />
          )}
          {view === 'player' && activePlayer && (
            <PlayerDashboard player={activePlayer} />
          )}
          {view === 'compare' && (
            <ComparisonView players={players} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
