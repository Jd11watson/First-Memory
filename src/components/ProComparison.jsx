import { useState } from 'react'
import { PROS, COMPARE_STATS } from '../data/proStats'

function gap(amateurVal, proVal, lowerBetter) {
  if (amateurVal === null || amateurVal === undefined || proVal === null) return null
  const diff = amateurVal - proVal
  return lowerBetter ? diff : -diff // negative = amateur is worse
}

function GapBar({ gapVal }) {
  if (gapVal === null) return <div className="w-full h-1 bg-zinc-800 rounded-full" />
  // clamp gap to ±3 strokes (or ±30pp for pct) — just visual scaling
  const pct = Math.max(0, Math.min(100, 50 - (gapVal / 3) * 50))
  const isGood = gapVal <= 0
  return (
    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-1 rounded-full transition-all"
        style={{
          width: `${Math.abs(50 - pct) * 2}%`,
          marginLeft: isGood ? '50%' : `${pct}%`,
          background: isGood ? '#4ade80' : '#f87171',
        }}
      />
    </div>
  )
}

export default function ProComparison({ player, avgStats }) {
  const [proName, setProName] = useState(PROS[PROS.length - 1].name) // default: Tour Average
  const [open, setOpen] = useState(false)

  const pro = PROS.find(p => p.name === proName) ?? PROS[PROS.length - 1]

  // Get the stat value for the amateur (from season averages or summary sheet)
  function amateurVal(key) {
    return avgStats[key] ?? player[key]
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <p className="label-xs mb-0.5">Compare to the Pros</p>
          <p className="text-zinc-600 text-[11px]">
            PGA Tour 2024 season · SG values vs. tour average
          </p>
        </div>
        {/* Pro selector */}
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 text-sm font-display font-semibold text-zinc-200 transition-colors"
          >
            {pro.name}
            <span className="text-zinc-500 text-xs">▾</span>
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-30 max-h-72 overflow-y-auto">
              {PROS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setProName(p.name); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-display transition-colors ${
                    p.name === proName
                      ? 'bg-green-600/20 text-green-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {p.name}
                  {p.name === 'PGA Tour Average' && (
                    <span className="ml-2 text-[10px] text-zinc-600">baseline</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_90px_90px_90px] px-5 py-2.5 border-b border-zinc-800">
        <span className="label-xs">Stat</span>
        <span className="label-xs text-right">{player.name}</span>
        <span className="label-xs text-right" style={{ color: '#fbbf24' }}>{pro.name.split(' ').slice(-1)[0]}</span>
        <span className="label-xs text-right">Gap</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-800/60">
        {COMPARE_STATS.map(stat => {
          const aVal = amateurVal(stat.key)
          const pVal = pro[stat.key]
          const gapVal = gap(aVal, pVal, stat.lowerBetter)

          const gapStr = gapVal === null ? '—'
            : (gapVal <= 0 ? '' : '+') + Number(gapVal).toFixed(gapVal % 1 === 0 ? 0 : 2)

          const gapColor = gapVal === null ? 'text-zinc-700'
            : gapVal <= -0.5 ? 'text-red-400'
            : gapVal <= 0 ? 'text-green-400'
            : 'text-red-400'

          return (
            <div key={stat.key} className="grid grid-cols-[1fr_90px_90px_90px] px-5 py-2.5 hover:bg-zinc-800/30 transition-colors">
              <span className="text-zinc-500 text-xs font-display">{stat.label}</span>
              <span className="text-right font-mono text-sm text-zinc-200">
                {aVal !== null && aVal !== undefined ? stat.fmt(aVal) : <span className="text-zinc-700">—</span>}
              </span>
              <span className="text-right font-mono text-sm" style={{ color: '#fbbf24' }}>
                {pVal !== null ? stat.fmt(pVal) : '—'}
              </span>
              <div className="flex flex-col items-end gap-1">
                <span className={`font-mono text-xs font-semibold ${gapColor}`}>{gapStr}</span>
                <GapBar gapVal={gapVal} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3 border-t border-zinc-800">
        <p className="text-[11px] text-zinc-700 leading-relaxed">
          Gap = amateur minus pro. Green = within range or better. Red bars show the distance to close.
          SG values use the same zero-baseline; gap reflects raw difference in strokes gained per round.
        </p>
      </div>
    </div>
  )
}
