import { useState } from 'react'

export default function ApiKeyBanner({ onSave }) {
  const [value, setValue] = useState('')

  const handleSave = () => {
    const trimmed = value.trim()
    if (trimmed) onSave(trimmed)
  }

  return (
    <div className="api-banner">
      <h3>Set up your Last.fm API key</h3>
      <p>
        SoundAlike uses Last.fm to find similar tracks. A free API key takes about 30 seconds to get.{' '}
        <a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener noreferrer">
          Get one here →
        </a>
      </p>
      <div className="api-input-row">
        <input
          className="api-input"
          type="text"
          placeholder="Paste your API key…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button className="api-save-btn" onClick={handleSave} disabled={!value.trim()}>
          Save
        </button>
      </div>
    </div>
  )
}
