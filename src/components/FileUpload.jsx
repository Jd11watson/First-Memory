import { useRef, useState } from 'react'
import { parseWorkbook } from '../utils/parseExcel'

export default function FileUpload({ onData }) {
  const inputRef = useRef()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  async function handle(file) {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const players = await parseWorkbook(file)
      onData(players, file.name)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handle(e.dataTransfer.files[0])
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#050a07' }}>
      <div className="max-w-md w-full">

        {/* Wordmark */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-emerald-900 ring-1 ring-emerald-700/50 flex items-center justify-center text-xl">⛳</div>
          <div>
            <h1 className="font-display text-xl font-bold text-white tracking-tight leading-none">Golf Analytics</h1>
            <p className="text-[11px] text-emerald-700 uppercase tracking-widest font-display mt-0.5">Team Dashboard</p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all select-none ${
            dragging
              ? 'border-emerald-600 bg-emerald-950/30'
              : 'border-[#1f3326] hover:border-emerald-800 hover:bg-emerald-950/10'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => handle(e.target.files[0])}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm font-display">Parsing workbook…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl opacity-60">📊</div>
              <p className="font-display font-semibold text-gray-300 text-base">Drop your Excel file here</p>
              <p className="text-gray-600 text-xs">or tap to browse · .xlsx / .xls</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 border border-red-900/60 rounded-xl p-4 text-red-400 text-xs bg-red-950/20">
            <strong className="font-display">Parse error:</strong> {error}
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-gray-800">
          Data is processed entirely in your browser — never uploaded anywhere.
        </p>
      </div>
    </div>
  )
}
