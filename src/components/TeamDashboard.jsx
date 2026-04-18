import { useState } from 'react'
import { STAT_META, fmtSG, fmtPct, fmt, sgColor, rankPlayers } from '../utils/stats'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

const CATEGORIES = [
  { id: 'sg',          label: 'Strokes Gained' },
  { id: 'traditional', label: 'Ball Striking' },
  { id: 'putting',     label: 'Putting' },
  { id: 'scoring',     label: 'Scoring' },
  { id: 'pars',        label: 'By Par' },
]

const SG_KEYS = ['sgDriving', 'sgApproach', 'sgShortGame', 'sgPutting']

const PLAYER_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

function SGBarChart({ players }) {
  const data = SG_KEYS.map(key => {
    const entry = { stat: STAT_META.find(s => s.key === key)?.label ?? key }
    players.forEach(p => { entry[p.name] = p[key] ?? null })
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis dataKey="stat" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <ReferenceLine y={0} stroke="#374151" />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
          formatter={(v, name) => [v !== null ? Number(v).toFixed(2) : '—', name]}
        />
        {players.map((p, i) => (
          <Bar key={p.name} dataKey={p.name} fill={PLAYER_COLORS[i % PLAYER_COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={18} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function LeaderboardBar({ value, max, min, color, lowerBetter }) {
  const range = max - min || 1
  const pct = lowerBetter
    ? ((max - value) / range) * 100
    : ((value - min) / range) * 100
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default function TeamDashboard({ players, onSelectPlayer }) {
  const [sortKey, setSortKey] = useState('avg')
  const [category, setCategory] = useState('sg')
  const [season, setSeason] = useState('all')

  const meta = STAT_META.find(s => s.key === sortKey)
  const catStats = STAT_META.filter(s => s.category === category)

  // Season-filtered averages (use summary data directly, season toggle is informational for now)
  const sorted = [...players].sort((a, b) => {
    const av = a[sortKey] ?? (meta?.lowerBetter ? Infinity : -Infinity)
    const bv = b[sortKey] ?? (meta?.lowerBetter ? Infinity : -Infinity)
    return meta?.lowerBetter ? av - bv : bv - av
  })

  // Team leader cards
  const leaders = [
    { label: 'Lowest Avg', stat: 'avg', lowerBetter: true },
    { label: 'Best SG Total', stat: null, lowerBetter: false },
    { label: 'Best GIR', stat: 'girPct', lowerBetter: false },
    { label: 'Best Scrambling', stat: 'scrambling', lowerBetter: false },
  ]

  function sgTotal(p) {
    const vals = [p.sgDriving, p.sgApproach, p.sgShortGame, p.sgPutting].filter(v => v !== null)
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0)
  }

  const sgLeader = [...players].sort((a, b) => (sgTotal(b) ?? -99) - (sgTotal(a) ?? -99))[0]
  const avgLeader = [...players].filter(p => p.avg).sort((a, b) => a.avg - b.avg)[0]
  const girLeader = [...players].filter(p => p.girPct).sort((a, b) => b.girPct - a.girPct)[0]
  const scrLeader = [...players].filter(p => p.scrambling).sort((a, b) => b.scrambling - a.scrambling)[0]

  const leaderCards = [
    { label: 'Low Score Avg', player: avgLeader, value: avgLeader ? fmt(avgLeader.avg, 1) : '—', icon: '🏆' },
    { label: 'SG Leader', player: sgLeader, value: sgLeader ? fmtSG(sgTotal(sgLeader)) : '—', icon: '📈' },
    { label: 'Best GIR', player: girLeader, value: girLeader ? fmtPct(girLeader.girPct) : '—', icon: '🎯' },
    { label: 'Best Scrambling', player: scrLeader, value: scrLeader ? fmtPct(scrLeader.scrambling) : '—', icon: '🔄' },
  ]

  // Min/max for bar scaling
  const statMins = {}
  const statMaxs = {}
  catStats.forEach(s => {
    const vals = players.map(p => p[s.key]).filter(v => v !== null && v !== undefined)
    statMins[s.key] = vals.length ? Math.min(...vals) : 0
    statMaxs[s.key] = vals.length ? Math.max(...vals) : 1
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Leader cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {leaderCards.map(card => (
          <button
            key={card.label}
            onClick={() => card.player && onSelectPlayer(card.player.name)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-emerald-700 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{card.label}</span>
            </div>
            <div className="text-2xl font-extrabold text-white">{card.value}</div>
            <div className="text-sm text-emerald-400 font-semibold mt-0.5 group-hover:underline">
              {card.player?.name ?? '—'}
            </div>
          </button>
        ))}
      </div>

      {/* SG Team Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Strokes Gained — All Players
        </h2>
        <SGBarChart players={players} />
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {players.map((p, i) => (
            <button
              key={p.name}
              onClick={() => onSelectPlayer(p.name)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stat leaderboard */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Category tabs */}
        <div className="flex border-b border-gray-800 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                category === cat.id
                  ? 'text-emerald-400 border-b-2 border-emerald-500 bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium w-32">Player</th>
                <th className="text-center px-2 py-3 text-xs text-gray-500 font-medium">Rnds</th>
                {catStats.map(s => (
                  <th
                    key={s.key}
                    className={`text-center px-3 py-3 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                      sortKey === s.key ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                    onClick={() => setSortKey(s.key)}
                  >
                    {s.label} {sortKey === s.key ? (meta?.lowerBetter ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, rowIdx) => (
                <tr
                  key={p.name}
                  className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors"
                  onClick={() => onSelectPlayer(p.name)}
                >
                  <td className="px-4 py-3 font-semibold text-white">
                    <span className="text-gray-600 text-xs mr-2">{rowIdx + 1}</span>
                    {p.name}
                  </td>
                  <td className="px-2 py-3 text-center text-gray-400">{p.rounds ?? '—'}</td>
                  {catStats.map(s => {
                    const v = p[s.key]
                    const colorCls = s.category === 'sg'
                      ? sgColor(v)
                      : 'text-gray-200'
                    return (
                      <td key={s.key} className="px-3 py-2 text-center">
                        <div className={`font-mono font-semibold text-sm ${colorCls}`}>
                          {v !== null && v !== undefined ? s.format(v) : '—'}
                        </div>
                        {v !== null && v !== undefined && (
                          <LeaderboardBar
                            value={v}
                            min={statMins[s.key]}
                            max={statMaxs[s.key]}
                            lowerBetter={s.lowerBetter}
                            color={s.category === 'sg' ? (v >= 0 ? '#10b981' : '#ef4444') : '#3b82f6'}
                          />
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
