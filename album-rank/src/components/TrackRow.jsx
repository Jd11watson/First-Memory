import { formatDuration } from '../lib/itunes'

function scoreBandClass(score) {
  if (score >= 7) return 'score-high'
  if (score >= 4) return 'score-mid'
  return 'score-low'
}

export default function TrackRow({ track, history, onRate, onShowHistory }) {
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  const current = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]

  let trend = null
  if (current && previous) {
    if (current.score > previous.score) trend = 'up'
    else if (current.score < previous.score) trend = 'down'
    else trend = 'flat'
  }

  return (
    <div className="track-row">
      <div className="track-number">{track.trackNumber}</div>
      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-duration">{formatDuration(track.durationMs)}</div>
      </div>

      <button className="track-score-btn" onClick={onRate}>
        {trend && <span className={`trend-icon trend-${trend}`}>{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'}</span>}
        {current ? (
          <span className={`score-badge ${scoreBandClass(current.score)}`}>
            {current.score.toFixed(1)}<span className="score-scale">/10</span>
          </span>
        ) : (
          <span className="score-badge score-none">Rate</span>
        )}
      </button>

      {sorted.length > 0 && (
        <button className="history-btn" onClick={onShowHistory} aria-label="View rating history" title="View rating history">
          ⏱
        </button>
      )}
    </div>
  )
}
