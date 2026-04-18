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
        className="w-4 h-4 rounded-full border border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 transition-colors flex items-center justify-center text-[10px] font-bold select-none"
      >
        i
      </button>
      {open && (
        <div className="absolute z-50 bottom-full mb-2 right-0 w-64 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50 p-4 text-left">
          <div className="absolute -bottom-1.5 right-3 w-3 h-3 bg-zinc-900 border-r border-b border-zinc-700 rotate-45" />
          <p className="font-display font-semibold text-green-400 text-xs uppercase tracking-wider mb-2">{title}</p>
          <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">{body}</p>
        </div>
      )}
    </div>
  )
}
