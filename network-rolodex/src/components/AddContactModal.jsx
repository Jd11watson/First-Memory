import { useState } from 'react'

// Manual add. Industry/region are left to inference on save (the user can correct
// them afterward in the detail panel), keeping this form short.
export default function AddContactModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: '', company: '', title: '', city: '', country: '', strength: 3, tags: '',
  })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = () => {
    if (!form.name.trim()) return
    onAdd({
      ...form,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      source: 'manual',
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add contact</h2>
        <div className="m-sub">Industry and region are auto-classified — adjust them after saving if needed.</div>
        <div className="field">
          <label>Name *</label>
          <input autoFocus value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="row2">
          <div className="field">
            <label>Company</label>
            <input value={form.company} onChange={(e) => set({ company: e.target.value })} />
          </div>
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label>City</label>
            <input value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </div>
          <div className="field">
            <label>Country</label>
            <input value={form.country} onChange={(e) => set({ country: e.target.value })} />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label>Strength</label>
            <select value={form.strength} onChange={(e) => set({ strength: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => set({ tags: e.target.value })} />
          </div>
        </div>
        <div className="m-actions">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={submit} disabled={!form.name.trim()}>Add</button>
        </div>
      </div>
    </div>
  )
}
