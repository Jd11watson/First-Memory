import TrackRow from './TrackRow'

export default function SongRankingScreen({ albumTitle, tracks, loading, error, getHistory, onBack, onRateTrack, onShowHistory }) {
  return (
    <div>
      <button className="back-btn" onClick={onBack}>← {albumTitle}</button>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <span>Loading tracklist…</span>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && tracks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">♪</div>
          <div className="empty-state-title">No tracks found</div>
          <div className="empty-state-body">This release doesn't have tracklist data available.</div>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="track-list">
          {tracks.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              history={getHistory(track.id)}
              onRate={() => onRateTrack(track)}
              onShowHistory={() => onShowHistory(track)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
