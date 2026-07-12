import { useState } from 'react'
import { parseLinkedInCsv } from '../lib/csvImport.js'

// Import a LinkedIn Connections.csv export. Parsing is delegated to csvImport.js;
// this component only handles the file read and result feedback.
export default function ImportModal({ onImport, onClose }) {
  const [status, setStatus] = useState(null) // { ok, msg }

  const handleFile = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const rows = parseLinkedInCsv(text)
      if (rows.length === 0) {
        setStatus({ ok: false, msg: 'No contacts found in that file.' })
        return
      }
      const n = onImport(rows)
      setStatus({ ok: true, msg: `Imported ${n} contact${n === 1 ? '' : 's'}.` })
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Could not parse that file.' })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Import from LinkedIn</h2>
        <div className="m-sub">
          Export your connections from LinkedIn (Settings → Data privacy → Get a copy of your data →
          Connections), then drop the <code>Connections.csv</code> here.
        </div>
        <label className="dropzone" htmlFor="csv-file">
          <div><strong>Choose Connections.csv</strong></div>
          <div style={{ fontSize: 12, marginTop: 6 }}>City &amp; region aren’t in the export — add them later per contact.</div>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {status && <div className={`import-status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</div>}
        <div className="m-actions">
          <button className="primary-btn" onClick={onClose}>{status?.ok ? 'Done' : 'Close'}</button>
        </div>
      </div>
    </div>
  )
}
