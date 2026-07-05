import { useState, useMemo } from 'react'
import AlbumListItem from './AlbumListItem'
import SortFilterBar from './SortFilterBar'

function sortAlbums(albums, ranks, mode) {
  const withScore = albums.map(a => ({ album: a, score: ranks[a.id]?.score, updatedAt: ranks[a.id]?.updatedAt }))
  const sorted = [...withScore]
  switch (mode) {
    case 'least':
      sorted.sort((a, b) => a.score - b.score)
      break
    case 'recent':
      sorted.sort((a, b) => b.updatedAt - a.updatedAt)
      break
    case 'alpha':
      sorted.sort((a, b) => a.album.title.localeCompare(b.album.title))
      break
    case 'artist':
      sorted.sort((a, b) => a.album.artist.localeCompare(b.album.artist))
      break
    case 'favorite':
    default:
      sorted.sort((a, b) => b.score - a.score)
  }
  return sorted
}

export default function LibraryScreen({ library, ranks, onOpenAlbum, onOpenSearch }) {
  const [sortMode, setSortMode] = useState('favorite')

  const toRank = library.filter(a => !ranks[a.id])
  const ranked = useMemo(
    () => sortAlbums(library.filter(a => ranks[a.id]), ranks, sortMode),
    [library, ranks, sortMode]
  )

  if (library.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">♪</div>
        <div className="empty-state-title">Your library is empty</div>
        <div className="empty-state-body">Search for an album to start rating it, note your thoughts, and rank its songs.</div>
        <button className="rate-btn" style={{ marginTop: 18 }} onClick={onOpenSearch}>
          Search for an album
        </button>
      </div>
    )
  }

  return (
    <div>
      {toRank.length > 0 && (
        <div className="queue-section">
          <div className="section-label">To Rank</div>
          <div className="queue-strip">
            {toRank.map(album => (
              <div key={album.id} className="queue-item" onClick={() => onOpenAlbum(album.id)}>
                <div className="queue-art">
                  {album.artworkUrl && <img src={album.artworkUrl} alt="" />}
                </div>
                <div className="queue-title">{album.title}</div>
                <div className="queue-artist">{album.artist}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ranked.length > 0 && (
        <>
          <SortFilterBar value={sortMode} onChange={setSortMode} />
          <div className="album-list">
            {ranked.map(({ album, score }) => (
              <AlbumListItem
                key={album.id}
                album={album}
                score={score}
                onClick={() => onOpenAlbum(album.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
