import BottomSheet from './BottomSheet'

function formatTimestamp(ts) {
  const d = new Date(ts)
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

export default function TrackHistory({ trackTitle, history, onClose }) {
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)

  return (
    <BottomSheet onClose={onClose}>
      <div className="sheet-title">{trackTitle}</div>
      <div className="sheet-subtitle">How your rating has changed over time</div>

      <div className="history-timeline">
        {sorted.map((entry, i) => {
          const isFirst = i === 0
          const isLast = i === sorted.length - 1
          const tag = isFirst ? 'First listen' : isLast ? 'Current' : null
          return (
            <div key={entry.id} className="history-entry">
              <div className="history-dot-col">
                <div className="history-dot" />
                {!isLast && <div className="history-line" />}
              </div>
              <div className="history-content">
                {tag && <div className="history-tag">{tag}</div>}
                <div className="history-score">
                  {entry.score.toFixed(1)}<span className="score-scale">/10</span>
                </div>
                <div className="history-date">{formatTimestamp(entry.timestamp)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </BottomSheet>
  )
}
