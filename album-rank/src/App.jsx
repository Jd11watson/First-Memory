import { useState } from 'react'
import LibraryScreen from './components/LibraryScreen'
import AlbumDetailScreen from './components/AlbumDetailScreen'
import SongRankingScreen from './components/SongRankingScreen'
import SearchOverlay from './components/SearchOverlay'
import RatingSheet from './components/RatingSheet'
import NoteComposer from './components/NoteComposer'
import TrackHistory from './components/TrackHistory'
import { getAlbumWithTracks } from './lib/itunes'
import {
  getLibrary, addAlbumToLibrary, updateAlbumTracks,
  getRanks, setAlbumRank,
  getAllNotes, addNote,
  getAllSongHistory, addSongRank,
  getOrCreateSocialStats,
} from './lib/storage'

export default function App() {
  const [library, setLibrary] = useState(() => getLibrary())
  const [ranks, setRanks] = useState(() => getRanks())
  const [notesMap, setNotesMap] = useState(() => getAllNotes())
  const [songHistory, setSongHistory] = useState(() => getAllSongHistory())
  const [socialMap, setSocialMap] = useState({})

  const [screen, setScreen] = useState('library')
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeSheet, setActiveSheet] = useState(null)

  const [songsLoading, setSongsLoading] = useState(false)
  const [songsError, setSongsError] = useState('')

  const selectedAlbum = library.find(a => a.id === selectedAlbumId) || null

  const ensureSocial = (albumId) => {
    if (socialMap[albumId]) return
    const stats = getOrCreateSocialStats(albumId)
    setSocialMap(prev => ({ ...prev, [albumId]: stats }))
  }

  const goToLibrary = () => {
    setScreen('library')
    setSelectedAlbumId(null)
  }

  const openAlbum = (albumId) => {
    ensureSocial(albumId)
    setSelectedAlbumId(albumId)
    setScreen('detail')
  }

  const handleSelectSearchResult = (album) => {
    const next = addAlbumToLibrary(album)
    setLibrary(next)
    setSearchOpen(false)
    openAlbum(album.id)
  }

  const openSongRanking = async () => {
    setScreen('songs')
    setSongsError('')
    if (selectedAlbum.tracks) return
    setSongsLoading(true)
    try {
      const full = await getAlbumWithTracks(selectedAlbum.id)
      const next = updateAlbumTracks(selectedAlbum.id, full.tracks)
      setLibrary(next)
    } catch {
      setSongsError('Could not load the tracklist. Check your connection and try again.')
    }
    setSongsLoading(false)
  }

  const saveAlbumRating = (score) => {
    const next = setAlbumRank(selectedAlbumId, score)
    setRanks(next)
    setActiveSheet(null)
  }

  const saveNote = (text) => {
    const next = addNote(selectedAlbumId, text)
    setNotesMap(next)
    setActiveSheet(null)
  }

  const saveTrackRating = (score) => {
    const track = activeSheet.track
    const next = addSongRank(track.id, score)
    setSongHistory(next)
    setActiveSheet(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="app-logo" onClick={goToLibrary}>✦ Ranked</button>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setSearchOpen(true)} title="Search for an album">
            ♪+
          </button>
        </div>
      </header>

      {screen === 'library' && (
        <LibraryScreen
          library={library}
          ranks={ranks}
          onOpenAlbum={openAlbum}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      {screen === 'detail' && selectedAlbum && (
        <AlbumDetailScreen
          album={selectedAlbum}
          rank={ranks[selectedAlbum.id]}
          notes={notesMap[selectedAlbum.id] || []}
          social={socialMap[selectedAlbum.id] || { friends: [], global: { avg: 0, count: 0 } }}
          onBack={goToLibrary}
          onRate={() => setActiveSheet({ type: 'albumRate' })}
          onAddNote={() => setActiveSheet({ type: 'note' })}
          onOpenSongRanking={openSongRanking}
        />
      )}

      {screen === 'songs' && selectedAlbum && (
        <SongRankingScreen
          albumTitle={selectedAlbum.title}
          tracks={selectedAlbum.tracks || []}
          loading={songsLoading}
          error={songsError}
          getHistory={(trackId) => songHistory[trackId] || []}
          onBack={() => setScreen('detail')}
          onRateTrack={(track) => setActiveSheet({ type: 'songRate', track })}
          onShowHistory={(track) => setActiveSheet({ type: 'history', track })}
        />
      )}

      {searchOpen && (
        <SearchOverlay onSelect={handleSelectSearchResult} onClose={() => setSearchOpen(false)} />
      )}

      {activeSheet?.type === 'albumRate' && (
        <RatingSheet
          title={selectedAlbum.title}
          subtitle="Rate this album"
          initialScore={ranks[selectedAlbum.id]?.score}
          onSave={saveAlbumRating}
          onClose={() => setActiveSheet(null)}
        />
      )}

      {activeSheet?.type === 'note' && (
        <NoteComposer onSave={saveNote} onClose={() => setActiveSheet(null)} />
      )}

      {activeSheet?.type === 'songRate' && (
        <RatingSheet
          title={activeSheet.track.title}
          subtitle="Rate this song"
          initialScore={(() => {
            const hist = songHistory[activeSheet.track.id] || []
            return hist.length ? hist[hist.length - 1].score : undefined
          })()}
          onSave={saveTrackRating}
          onClose={() => setActiveSheet(null)}
        />
      )}

      {activeSheet?.type === 'history' && (
        <TrackHistory
          trackTitle={activeSheet.track.title}
          history={songHistory[activeSheet.track.id] || []}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  )
}
