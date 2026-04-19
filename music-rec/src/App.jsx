import { useState, useCallback } from 'react'
import StreamingPicker from './components/StreamingPicker'
import ApiKeyBanner from './components/ApiKeyBanner'
import SearchBar from './components/SearchBar'
import SeedSong from './components/SeedSong'
import RecommendationCard from './components/RecommendationCard'

const LASTFM = 'https://ws.audioscrobbler.com/2.0'

async function getItunesArtwork(track, artist) {
  try {
    const q = encodeURIComponent(`${artist} ${track}`)
    const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`)
    const data = await res.json()
    const result = data.results?.[0]
    if (!result) return null
    return result.artworkUrl100?.replace('100x100bb', '600x600bb')
  } catch {
    return null
  }
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('lastfm_key') || '')
  const [streaming, setStreaming] = useState(() => localStorage.getItem('streaming') || '')
  const [seedSong, setSeedSong] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [allSimilar, setAllSimilar] = useState([])
  // Cumulative set of all songs ever shown — persists across likes so recs never repeat
  const [excluded, setExcluded] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const saveApiKey = (key) => {
    localStorage.setItem('lastfm_key', key)
    setApiKey(key)
  }

  const saveStreaming = (service) => {
    localStorage.setItem('streaming', service)
    setStreaming(service)
  }

  const fetchSimilar = useCallback(async (track, artist, currentExcluded = new Set()) => {
    if (!apiKey) return
    setLoading(true)
    setError('')
    try {
      const url = `${LASTFM}/?method=track.getSimilar&track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}&limit=50&api_key=${apiKey}&format=json`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) {
        setError(data.message || 'Last.fm error — check your API key.')
        setLoading(false)
        return
      }
      const tracks = data.similartracks?.track || []
      if (tracks.length === 0) {
        setError('No similar tracks found. Try a more popular song.')
        setLoading(false)
        return
      }
      setAllSimilar(tracks)
      const filtered = tracks.filter(t => !currentExcluded.has(`${t.artist.name}::${t.name}`))
      setRecommendations(filtered.slice(0, 3))
    } catch {
      setError('Network error. Check your connection and API key.')
    }
    setLoading(false)
  }, [apiKey])

  const handleSongSelect = async (song) => {
    const artwork = await getItunesArtwork(song.name, song.artist)
    const seed = {
      name: song.name,
      artist: song.artist,
      image: artwork || song.image?.find(i => i.size === 'extralarge')?.['#text'] || song.image?.[3]?.['#text'],
    }
    setSeedSong(seed)
    setHistory([seed])
    const seedKey = `${song.artist}::${song.name}`
    const newExcluded = new Set([seedKey])
    setExcluded(newExcluded)
    setRecommendations([])
    fetchSimilar(song.name, song.artist, newExcluded)
  }

  const handleLike = async (song) => {
    const artwork = await getItunesArtwork(song.name, song.artist.name)
    const newSeed = {
      name: song.name,
      artist: song.artist.name,
      image: artwork || song.image?.find(i => i.size === 'extralarge')?.['#text'] || song.image?.[3]?.['#text'],
    }
    setSeedSong(newSeed)
    setHistory(prev => [...prev, newSeed])
    // Add the liked song + all currently shown recs to excluded so they never reappear
    const newExcluded = new Set(excluded)
    newExcluded.add(`${song.artist.name}::${song.name}`)
    if (seedSong) newExcluded.add(`${seedSong.artist}::${seedSong.name}`)
    recommendations.forEach(r => newExcluded.add(`${r.artist.name}::${r.name}`))
    setExcluded(newExcluded)
    setRecommendations([])
    fetchSimilar(song.name, song.artist.name, newExcluded)
  }

  const handleDislike = (song) => {
    const key = `${song.artist.name}::${song.name}`
    const newExcluded = new Set([...excluded, key])
    setExcluded(newExcluded)
    const filtered = allSimilar.filter(t => !newExcluded.has(`${t.artist.name}::${t.name}`))
    setRecommendations(filtered.slice(0, 3))
  }

  if (!streaming) {
    return <StreamingPicker onSelect={saveStreaming} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">◈ SoundAlike</span>
        <button className="settings-btn" onClick={() => saveStreaming('')} title="Change streaming service">
          ⚙
        </button>
      </header>

      {!apiKey && <ApiKeyBanner onSave={saveApiKey} />}

      {apiKey && (
        <>
          <SearchBar apiKey={apiKey} onSelect={handleSongSelect} />

          {history.length > 1 && (
            <div className="history-trail">
              {history.map((s, i) => (
                <span key={i} className="history-chip">
                  {i > 0 && <span className="history-arrow">→</span>}
                  <span className="history-name">{s.name}</span>
                </span>
              ))}
            </div>
          )}

          {seedSong && <SeedSong song={seedSong} />}

          {loading && (
            <div className="loading">
              <div className="spinner" />
              <span>Finding similar songs…</span>
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          {!loading && recommendations.length > 0 && (
            <div className="recommendations">
              <p className="rec-label">You might like</p>
              <div className="rec-list">
                {recommendations.map((song, i) => (
                  <RecommendationCard
                    key={`${song.artist.name}::${song.name}::${i}`}
                    song={song}
                    streaming={streaming}
                    onLike={() => handleLike(song)}
                    onDislike={() => handleDislike(song)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
