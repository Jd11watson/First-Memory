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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full">

        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center text-lg">⛳</div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-tight">Golf Analytics</h1>
            <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-display">Team Dashboard</p>
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all select-none ${
            dragging
              ? 'border-green-500 bg-green-500/5'
              : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50'
          }`}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => handle(e.target.files[0])} />
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm font-display">Reading workbook…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">📊</div>
              <div>
                <p className="font-display font-semibold text-zinc-300">Drop your Excel file</p>
                <p className="text-zinc-600 text-xs mt-1">or click to browse · .xlsx / .xls</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 border border-red-800/50 rounded-xl p-4 text-red-400 text-xs bg-red-950/20">
            <strong className="font-display">Error:</strong> {error}
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-zinc-700">
          Processed entirely in your browser — data never uploaded.
        </p>
      </div>
    </div>
  )
}
