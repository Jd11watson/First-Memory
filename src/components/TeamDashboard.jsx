import { useState } from 'react'
import { STAT_META, fmtSG, fmtPct, fmt, sgColor } from '../utils/stats'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const CATEGORIES = [
  { id: 'sg',          label: 'Strokes Gained' },
  { id: 'traditional', label: 'Ball Striking' },
  { id: 'putting',     label: 'Putting' },
  { id: 'scoring',     label: 'Scoring' },
  { id: 'pars',        label: 'By Par' },
]

// Distinct, vibrant palette that reads well on zinc-900
const PLAYER_COLORS = [
  '#4ade80', '#60a5fa', '#fbbf24', '#f87171',
  '#a78bfa', '#34d399', '#fb923c', '#38bdf8', '#e879f9',
]

function SGBarChart({ players }) {
  const keys = ['sgDriving', 'sgApproach', 'sgShortGame', 'sgPutting']
  const labels = ['Driving', 'Approach', 'Short Game', 'Putting']
  const data = keys.map((key, i) => {
    const entry = { stat: labels[i] }
    players.forEach(p => { entry[p.name] = p[key] ?? null })
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="stat" tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'Space Grotesk' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false} />
        <ReferenceLine y={0} stroke="#3f3f46" />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10, fontSize: 12, fontFamily: 'Space Grotesk' }}
          formatter={(v, name) => [v !== null ? Number(v).toFixed(2) : '—', name]}
          cursor={{ fill: '#ffffff08' }}
        />
        {players.map((p, i) => (
          <Bar key={p.name} dataKey={p.name} fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            radius={[3, 3, 0, 0]} maxBarSize={16} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function RankBar({ value, min, max, lowerBetter, color }) {
  const range = max - min || 1
  const pct = lowerBetter ? ((max - value) / range) * 100 : ((value - min) / range) * 100
  return (
    <div className="w-full bg-zinc-800 rounded-full h-1 mt-1.5">
      <div className="h-1 rounded-full" style={{ width: `${Math.max(4, Math.min(100, pct))}%`, backgroundColor: color }} />
    </div>
  )
}

export default function TeamDashboard({ players, onSelectPlayer }) {
  const [sortKey, setSortKey] = useState('avg')
  const [category, setCategory] = useState('sg')

  const meta = STAT_META.find(s => s.key === sortKey)
  const catStats = STAT_META.filter(s => s.category === category)

  const sorted = [...players].sort((a, b) => {
    const av = a[sortKey] ?? (meta?.lowerBetter ? Infinity : -Infinity)
    const bv = b[sortKey] ?? (meta?.lowerBetter ? Infinity : -Infinity)
    return meta?.lowerBetter ? av - bv : bv - av
  })

  function sgTotal(p) {
    const vals = [p.sgDriving, p.sgApproach, p.sgShortGame, p.sgPutting].filter(v => v !== null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null
  }

  const avgLeader = [...players].filter(p => p.avg).sort((a, b) => a.avg - b.avg)[0]
  const sgLeader  = [...players].sort((a, b) => (sgTotal(b) ?? -99) - (sgTotal(a) ?? -99))[0]
  const girLeader = [...players].filter(p => p.girPct).sort((a, b) => b.girPct - a.girPct)[0]
  const scrLeader = [...players].filter(p => p.scrambling).sort((a, b) => b.scrambling - a.scrambling)[0]

  const leaderCards = [
    { label: 'Low Score Avg', player: avgLeader, value: avgLeader ? fmt(avgLeader.avg, 1) : '—' },
    { label: 'SG Leader',     player: sgLeader,  value: sgLeader  ? fmtSG(sgTotal(sgLeader)) : '—' },
    { label: 'Best GIR',      player: girLeader, value: girLeader ? fmtPct(girLeader.girPct) : '—' },
    { label: 'Best Scrambling', player: scrLeader, value: scrLeader ? fmtPct(scrLeader.scrambling) : '—' },
  ]

  const statMins = {}, statMaxs = {}
  catStats.forEach(s => {
    const vals = players.map(p => p[s.key]).filter(v => v !== null && v !== undefined)
    statMins[s.key] = vals.length ? Math.min(...vals) : 0
    statMaxs[s.key] = vals.length ? Math.max(...vals) : 1
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Leader cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {leaderCards.map(card => (
          <button
            key={card.label}
            onClick={() => card.player && onSelectPlayer(card.player.name)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-zinc-600 hover:bg-zinc-800/50 transition-all group"
          >
            <p className="label-xs mb-3">{card.label}</p>
            <p className="font-display text-3xl font-bold text-white leading-none mb-2">{card.value}</p>
            <p className="text-sm text-green-400 font-display font-medium group-hover:text-green-300 transition-colors">
              {card.player?.name ?? '—'}
            </p>
          </button>
        ))}
      </div>

      {/* SG chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="section-title">Strokes Gained — All Players</p>
        <SGBarChart players={players} />
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-zinc-800">
          {players.map((p, i) => (
            <button key={p.name} onClick={() => onSelectPlayer(p.name)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors font-display">
              <span className="w-2 h-2 rounded-full" style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Category tabs */}
        <div className="flex border-b border-zinc-800 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-5 py-3.5 text-xs font-display font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                category === cat.id
                  ? 'text-white border-green-500 bg-zinc-800/40'
                  : 'text-zinc-600 border-transparent hover:text-zinc-300'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 label-xs w-36">Player</th>
                <th className="text-center px-3 py-3 label-xs">Rnds</th>
                {catStats.map(s => (
                  <th key={s.key} onClick={() => setSortKey(s.key)}
                    className={`text-center px-4 py-3 label-xs cursor-pointer whitespace-nowrap transition-colors hover:text-zinc-300 ${
                      sortKey === s.key ? 'text-green-400' : ''
                    }`}>
                    {s.label}{sortKey === s.key ? (meta?.lowerBetter ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, rowIdx) => (
                <tr key={p.name} onClick={() => onSelectPlayer(p.name)}
                  className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-zinc-700 text-xs font-display w-4 text-right">{rowIdx + 1}</span>
                      <span className="font-display font-semibold text-zinc-100 text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-zinc-500 text-sm">{p.rounds ?? '—'}</td>
                  {catStats.map(s => {
                    const v = p[s.key]
                    const colorCls = s.category === 'sg' ? sgColor(v) : 'text-zinc-200'
                    return (
                      <td key={s.key} className="px-4 py-2.5 text-center">
                        <div className={`font-mono font-semibold text-sm ${colorCls}`}>
                          {v !== null && v !== undefined ? s.format(v) : <span className="text-zinc-700">—</span>}
                        </div>
                        {v !== null && v !== undefined && (
                          <RankBar value={v} min={statMins[s.key]} max={statMaxs[s.key]}
                            lowerBetter={s.lowerBetter}
                            color={s.category === 'sg' ? (v >= 0 ? '#4ade80' : '#f87171') : '#60a5fa'} />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
