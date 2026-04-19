import { useState, useEffect } from 'react'

function AppleMusicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 6.5l-5 2.5V16a2 2 0 11-1-1.732V9.382l7-3.5v3.618l-5 2.5v-1.618l4-2V8.5z"/>
    </svg>
  )
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

async function fetchAppleUrl(track, artist) {
  try {
    const q = encodeURIComponent(`${artist} ${track}`)
    const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`)
    const data = await res.json()
    const r = data.results?.[0]
    if (!r) return {}
    return {
      url: r.trackViewUrl,
      artwork: r.artworkUrl100?.replace('100x100bb', '600x600bb'),
    }
  } catch {
    return {}
  }
}

export default function RecommendationCard({ song, streaming, onLike, onDislike }) {
  const [appleData, setAppleData] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'like' | 'dislike' | null

  const needsApple = streaming === 'apple' || streaming === 'both'

  useEffect(() => {
    setAppleData(null)
    setFeedback(null)
    if (needsApple) {
      fetchAppleUrl(song.name, song.artist.name).then(setAppleData)
    }
  }, [song, needsApple])

  const lastfmImage = song.image?.find(i => i.size === 'extralarge')?.['#text'] || song.image?.[3]?.['#text']
  const artwork = appleData?.artwork || lastfmImage
  const matchPct = song.match ? Math.round(song.match * 100) : null

  const appleUrl = appleData?.url || `https://music.apple.com/search?term=${encodeURIComponent(`${song.artist.name} ${song.name}`)}`
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${song.artist.name} ${song.name}`)}`

  const handleLike = () => {
    if (feedback === 'like') return
    setFeedback('like')
    setTimeout(onLike, 300)
  }

  const handleDislike = () => {
    if (feedback === 'dislike') return
    setFeedback('dislike')
    setTimeout(onDislike, 300)
  }

  return (
    <div className={`rec-card ${feedback ? `rec-${feedback}` : ''}`}>
      <div className="rec-art">
        {artwork ? (
          <img src={artwork} alt={song.name} onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <span className="rec-art-placeholder">♪</span>
        )}
      </div>

      <div className="rec-info">
        <div className="rec-name">{song.name}</div>
        <div className="rec-artist">{song.artist.name}</div>
        {matchPct !== null && (
          <div className="rec-match">
            <div className="match-bar">
              <div className="match-fill" style={{ width: `${matchPct}%` }} />
            </div>
            <span className="match-pct">{matchPct}% match</span>
          </div>
        )}
      </div>

      <div className="rec-actions">
        {(streaming === 'apple' || streaming === 'both') && (
          <a href={appleUrl} className="stream-btn apple-stream" target="_blank" rel="noopener noreferrer">
            <AppleMusicIcon />
            <span>Apple Music</span>
          </a>
        )}
        {(streaming === 'spotify' || streaming === 'both') && (
          <a href={spotifyUrl} className="stream-btn spotify-stream" target="_blank" rel="noopener noreferrer">
            <SpotifyIcon />
            <span>Spotify</span>
          </a>
        )}
        <div className="feedback-row">
          <button
            className={`feedback-btn ${feedback === 'like' ? 'fb-active-like' : ''}`}
            onClick={handleLike}
            title="More like this"
          >
            👍
          </button>
          <button
            className={`feedback-btn ${feedback === 'dislike' ? 'fb-active-dislike' : ''}`}
            onClick={handleDislike}
            title="Not for me"
          >
            👎
          </button>
        </div>
      </div>
    </div>
  )
}
