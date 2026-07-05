function formatTimestamp(ts) {
  const d = new Date(ts)
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

export default function NotesTimeline({ notes, onAddNote }) {
  const sorted = [...notes].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="notes-section">
      <div className="section-header">
        <div className="section-label" style={{ marginBottom: 0 }}>Notes</div>
        <button className="add-note-btn" onClick={onAddNote}>+ Add note</button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 10px' }}>
          <div className="empty-state-body">No notes yet. Jot down what you think, whenever you think it.</div>
        </div>
      ) : (
        <div className="notes-list">
          {sorted.map(note => (
            <div key={note.id} className="note-card">
              <div className="note-timestamp">{formatTimestamp(note.timestamp)}</div>
              <div className="note-text">{note.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
