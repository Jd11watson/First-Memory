import AppleMusicIcon from './AppleMusicIcon'
import FriendsAndGlobalStats from './FriendsAndGlobalStats'
import NotesTimeline from './NotesTimeline'
import { appleSearchFallbackUrl } from '../lib/itunes'

function scoreBandClass(score) {
  if (score >= 7) return 'score-high'
  if (score >= 4) return 'score-mid'
  return 'score-low'
}

export default function AlbumDetailScreen({ album, rank, notes, social, onBack, onRate, onAddNote, onOpenSongRanking }) {
  const appleUrl = album.appleAlbumUrl || appleSearchFallbackUrl(`${album.artist} ${album.title}`)

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← Library</button>

      <div className="detail-header">
        <div className="detail-art">
          {album.artworkUrl && <img src={album.artworkUrl} alt="" />}
        </div>
        <div className="detail-title">{album.title}</div>
        <div className="detail-artist">{album.artist}</div>
        {album.year && <div className="detail-year">{album.year}</div>}
      </div>

      <div className="your-rank-card">
        <div>
          <div className="your-rank-label">Your Rank</div>
          {rank ? (
            <div className={`your-rank-value text-${scoreBandClass(rank.score)}`}>
              {rank.score.toFixed(1)}<span className="score-scale">/10</span>
            </div>
          ) : (
            <div className="your-rank-empty">Not yet rated</div>
          )}
        </div>
        <button className="rate-btn" onClick={onRate}>{rank ? 'Re-rate' : 'Rate'}</button>
      </div>

      <div className="action-row">
        <a className="action-link apple-link" href={appleUrl} target="_blank" rel="noreferrer">
          <AppleMusicIcon /> Open in Apple Music
        </a>
      </div>

      <div className="rank-songs-link" onClick={onOpenSongRanking}>
        <div>
          <div className="rank-songs-link-title">Rank Songs</div>
          <div className="rank-songs-link-sub">
            {album.trackCount ? `${album.trackCount} tracks` : 'Score each track individually'}
          </div>
        </div>
        <div className="rank-songs-arrow">→</div>
      </div>

      <FriendsAndGlobalStats social={social} />

      <NotesTimeline notes={notes} onAddNote={onAddNote} />
    </div>
  )
}
