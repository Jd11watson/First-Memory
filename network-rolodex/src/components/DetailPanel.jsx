import { INDUSTRIES, REGIONS } from '../lib/inference.js'

// Contact detail + inline editor. Editing industry/region here flips the
// override flag in the store, so the correction sticks through re-inference.
export default function DetailPanel({ contact, onUpdate, onDelete, onClose }) {
  if (!contact) return null
  const c = contact
  const set = (patch) => onUpdate(c.id, patch)

  return (
    <div className="detail">
      <div className="dt-head">
        <h2>{c.name || 'Unnamed'}</h2>
        <button className="close-x" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="dt-role">{c.title || '—'}{c.company ? ` · ${c.company}` : ''}</div>

      <div className="field">
        <label>Name</label>
        <input value={c.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="row2">
        <div className="field">
          <label>Company</label>
          <input value={c.company} onChange={(e) => set({ company: e.target.value })} />
        </div>
        <div className="field">
          <label>Title</label>
          <input value={c.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
      </div>

      <div className="field">
        <label>Industry</label>
        <select value={c.industry} onChange={(e) => set({ industry: e.target.value })}>
          {INDUSTRIES.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
        </select>
        <div className={`override-hint ${c.industryOverride ? 'on' : ''}`}>
          {c.industryOverride ? '✎ Manually set — kept through re-inference' : 'Auto-inferred from title & company'}
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>City</label>
          <input value={c.city} onChange={(e) => set({ city: e.target.value })} />
        </div>
        <div className="field">
          <label>Country</label>
          <input value={c.country} onChange={(e) => set({ country: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>Region</label>
        <select value={c.region} onChange={(e) => set({ region: e.target.value })}>
          {REGIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <div className={`override-hint ${c.regionOverride ? 'on' : ''}`}>
          {c.regionOverride ? '✎ Manually set' : 'Auto-inferred from city & country'}
        </div>
      </div>

      <div className="field">
        <label>Relationship strength</label>
        <div className="strength-picker">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={n <= c.strength ? 'on' : ''} onClick={() => set({ strength: n })}>{n}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Tags (comma-separated)</label>
        <input
          value={c.tags.join(', ')}
          onChange={(e) => set({ tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea value={c.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>

      <div className="field">
        <label>Source</label>
        <div className="source-tag">{c.source === 'linkedin-csv' ? 'LinkedIn import' : 'Manual'}{c.connectedOn ? ` · connected ${c.connectedOn}` : ''}</div>
      </div>

      <div className="dt-actions">
        <button className="ghost-btn danger" onClick={() => { onDelete(c.id); onClose() }}>Delete contact</button>
      </div>
    </div>
  )
}
