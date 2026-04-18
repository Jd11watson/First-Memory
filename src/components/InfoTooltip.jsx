import { useState, useRef, useEffect } from 'react'

export default function InfoTooltip({ title, body }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-4 h-4 rounded-full border border-gray-700 text-gray-600 hover:border-emerald-700 hover:text-emerald-400 transition-colors flex items-center justify-center text-[10px] font-bold leading-none select-none"
        aria-label="More info"
      >
        i
      </button>

      {open && (
        <div className="absolute z-50 bottom-full mb-2 right-0 w-64 rounded-xl border border-emerald-900/60 bg-gray-950 shadow-2xl p-4 text-left">
          {/* Arrow */}
          <div className="absolute -bottom-1.5 right-3 w-3 h-3 bg-gray-950 border-r border-b border-emerald-900/60 rotate-45" />
          <p className="font-display font-semibold text-emerald-400 text-xs uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{body}</p>
        </div>
      )}
    </div>
  )
}
