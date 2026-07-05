import { useState } from 'react'
import BottomSheet from './BottomSheet'

export default function NoteComposer({ onSave, onClose }) {
  const [text, setText] = useState('')

  const handleSave = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <BottomSheet onClose={onClose}>
      <div className="sheet-title">Add a note</div>
      <div className="sheet-subtitle">Thoughts get timestamped and never overwritten</div>

      <textarea
        className="note-textarea"
        placeholder="What do you think of this album right now?"
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
      />

      <button className="sheet-save-btn" onClick={handleSave} disabled={!text.trim()}>
        Save Note
      </button>
    </BottomSheet>
  )
}
