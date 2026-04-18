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
      if (!players.length) throw new Error('No player data found. Check your sheet names match player names.')
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
    const file = e.dataTransfer.files[0]
    handle(file)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-2xl">⛳</div>
            <div className="text-left">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Golf Analytics</h1>
              <p className="text-xs text-emerald-400 uppercase tracking-widest font-medium">Team Dashboard</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Upload your team Excel file to unlock strokes gained trends, head-to-head comparisons, and drill-down stats for every player.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all select-none
            ${dragging
              ? 'border-emerald-400 bg-emerald-950/40'
              : 'border-gray-700 hover:border-emerald-600 hover:bg-gray-900'
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
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Parsing workbook…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl">📊</div>
              <p className="text-white font-semibold">Drop your Excel file here</p>
              <p className="text-gray-500 text-sm">or tap to browse — .xlsx / .xls</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-300 text-sm text-left">
            <strong>Parse error:</strong> {error}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-600">
          Data never leaves your device — all processing happens in your browser.
        </p>
      </div>
    </div>
  )
}
