import { useState } from 'react'
import FileUpload from './components/FileUpload'
import Navigation from './components/Navigation'
import TeamDashboard from './components/TeamDashboard'
import PlayerDashboard from './components/PlayerDashboard'
import ComparisonView from './components/ComparisonView'

export default function App() {
  const [players, setPlayers] = useState(null)
  const [fileName, setFileName] = useState('')
  const [view, setView] = useState('team')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  function handleData(parsedPlayers, name) {
    setPlayers(parsedPlayers)
    setFileName(name)
    setSelectedPlayer(parsedPlayers[0]?.name ?? null)
    setView('team')
  }

  function handleReset() {
    setPlayers(null)
    setFileName('')
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
  )
}
