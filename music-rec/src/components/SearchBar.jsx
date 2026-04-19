import { useState, useEffect, useRef } from 'react'

export default function SearchBar({ apiKey, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(q)}&limit=7&api_key=${apiKey}&format=json`
        const res = await fetch(url)
        const data = await res.json()
        const tracks = data.results?.trackmatches?.track || []
        setResults(tracks)
        setOpen(tracks.length > 0)
        setActiveIdx(-1)
      } catch {
        // silently ignore search errors
      }
      setLoading(false)
    }, 280)
    return () => clearTimeout(debounceRef.current)
  }, [query, apiKey])

  const handleSelect = (track) => {
    onSelect(track)
    setQuery(`${track.artist} — ${track.name}`)
    setOpen(false)
    setResults([])
    setActiveIdx(-1)
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      handleSelect(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const getLargeImage = (images) => {
    if (!images) return ''
    const large = images.find(i => i.size === 'large') || images[2]
    return large?.['#text'] || ''
  }

  return (
    <div className="search-wrap" ref={containerRef}>
      <div className="search-field">
        <span className="search-icon">
          {loading ? <span className="search-spin" /> : '♪'}
        </span>
        <input
          className="search-input"
          type="text"
          placeholder="Search for a song or artist…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setResults([]); setOpen(false) }}>
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          {results.map((track, i) => {
            const img = getLargeImage(track.image)
            return (
              <li
                key={i}
                className={`search-result ${i === activeIdx ? 'active' : ''}`}
                onClick={() => handleSelect(track)}
                role="option"
              >
                <div className="result-art">
                  {img ? (
                    <img src={img} alt="" onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <span className="result-art-placeholder">♪</span>
                  )}
                </div>
                <div className="result-text">
                  <div className="result-name">{track.name}</div>
                  <div className="result-artist">{track.artist}</div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
