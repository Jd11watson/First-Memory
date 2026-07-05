import { useState, useEffect, useRef } from 'react'
import { searchAlbums } from '../lib/itunes'

export default function SearchOverlay({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const albums = await searchAlbums(q)
        setResults(albums)
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 280)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  return (
    <div className="search-overlay-backdrop">
      <div className="search-overlay-inner">
        <div className="search-overlay-header">
          <button className="icon-btn" onClick={onClose} aria-label="Close search">←</button>
          <div className="search-wrap" style={{ flex: 1, marginBottom: 0 }}>
            <div className="search-field">
              <span className="search-icon">
                {loading ? <span className="search-spin" /> : '♪'}
              </span>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="Search for an album or artist…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button className="search-clear" onClick={() => { setQuery(''); setResults([]) }}>
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {results.length === 0 && !loading && query.trim().length >= 2 && (
          <div className="search-hint">No albums found. Try a different search.</div>
        )}
        {query.trim().length < 2 && (
          <div className="search-hint">Type at least 2 characters to search.</div>
        )}

        <ul className="search-list">
          {results.map(album => (
            <li
              key={album.id}
              className="search-result"
              onClick={() => onSelect(album)}
            >
              <div className="result-art">
                {album.artworkUrl ? (
                  <img src={album.artworkUrl} alt="" onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <span className="result-art-placeholder">♪</span>
                )}
              </div>
              <div className="result-text">
                <div className="result-name">{album.title}</div>
                <div className="result-artist">{album.artist}{album.year ? ` · ${album.year}` : ''}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
