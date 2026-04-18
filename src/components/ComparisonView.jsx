import { useState } from 'react'
import { STAT_META, fmtSG, fmtPct, fmt, sgColor } from '../utils/stats'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell
} from 'recharts'

const PLAYER_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

const COMPARE_STATS = [
  { key: 'avg',         label: 'Scoring Avg',    lowerBetter: true },
  { key: 'sgDriving',   label: 'SG: Driving',    lowerBetter: false },
  { key: 'sgApproach',  label: 'SG: Approach',   lowerBetter: false },
  { key: 'sgShortGame', label: 'SG: Short Game', lowerBetter: false },
  { key: 'sgPutting',   label: 'SG: Putting',    lowerBetter: false },
  { key: 'girPct',      label: 'GIR %',          lowerBetter: false },
  { key: 'fwPct',       label: 'Fairways %',     lowerBetter: false },
  { key: 'scrambling',  label: 'Scrambling %',   lowerBetter: false },
  { key: 'threePutt',   label: '3-Putt %',       lowerBetter: true },
  { key: 'birdieAvg',   label: 'Birdie Avg',     lowerBetter: false },
  { key: 'bogeyAvg',    label: 'Bogey Avg',      lowerBetter: true },
  { key: 'par3',        label: 'Par 3 Avg',      lowerBetter: true },
  { key: 'par4',        label: 'Par 4 Avg',      lowerBetter: true },
  { key: 'par5',        label: 'Par 5 Avg',      lowerBetter: true },
]

const RADAR_STATS = [
  { key: 'sgDriving',   label: 'Driving',    center: 0,  scale: 25 },
  { key: 'sgApproach',  label: 'Approach',   center: 0,  scale: 25 },
  { key: 'sgShortGame', label: 'Short Game', center: 0,  scale: 25 },
  { key: 'sgPutting',   label: 'Putting',    center: 0,  scale: 25 },
  { key: 'girPct',      label: 'GIR',        center: 50, scale: 1 },
  { key: 'scrambling',  label: 'Scrambling', center: 50, scale: 1 },
]

function fmtVal(key, val) {
  if (val === null || val === undefined) return '—'
  const meta = STAT_META.find(s => s.key === key)
  return meta ? meta.format(val) : String(val)
}

export default function ComparisonView({ players }) {
  const [selected, setSelected] = useState(players.slice(0, 3).map(p => p.name))

  const active = players.filter(p => selected.includes(p.name))

  function togglePlayer(name) {
    setSelected(prev =>
      prev.includes(name)
        ? prev.length > 1 ? prev.filter(n => n !== name) : prev
        : [...prev, name]
    )
  }

  // Radar data
  const radarData = RADAR_STATS.map(({ key, label, center, scale }) => {
    const entry = { stat: label }
    active.forEach(p => {
      const v = p[key]
      entry[p.name] = v !== null && v !== undefined ? Math.max(0, Math.min(100, center + (v * scale))) : 50
    })
    return entry
  })

  // Bar chart: SG breakdown
  const sgData = ['sgDriving', 'sgApproach', 'sgShortGame', 'sgPutting'].map(key => {
    const entry = { stat: STAT_META.find(s => s.key === key)?.label?.replace('SG: ', '') ?? key }
    active.forEach(p => { entry[p.name] = p[key] ?? null })
    return entry
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Player selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Select Players to Compare</p>
        <div className="flex flex-wrap gap-2">
          {players.map((p, i) => {
            const isSelected = selected.includes(p.name)
            return (
              <button
                key={p.name}
                onClick={() => togglePlayer(p.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  isSelected
                    ? 'border-transparent text-white'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
                style={isSelected ? { background: PLAYER_COLORS[i % PLAYER_COLORS.length] + '33', borderColor: PLAYER_COLORS[i % PLAYER_COLORS.length] } : {}}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: isSelected ? PLAYER_COLORS[i % PLAYER_COLORS.length] : '#374151' }}
                />
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Radar + SG bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Player Profiles</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              {active.map((p, i) => (
                <Radar
                  key={p.name}
                  dataKey={p.name}
                  stroke={PLAYER_COLORS[players.findIndex(pl => pl.name === p.name) % PLAYER_COLORS.length]}
                  fill={PLAYER_COLORS[players.findIndex(pl => pl.name === p.name) % PLAYER_COLORS.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* SG bars */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Strokes Gained Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sgData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="stat" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <ReferenceLine y={0} stroke="#374151" />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => [v !== null ? Number(v).toFixed(2) : '—', name]}
              />
              {active.map((p) => (
                <Bar
                  key={p.name}
                  dataKey={p.name}
                  fill={PLAYER_COLORS[players.findIndex(pl => pl.name === p.name) % PLAYER_COLORS.length]}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={20}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full stat comparison table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium">Full Stat Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Stat</th>
                {active.map((p, i) => (
                  <th key={p.name} className="text-center px-4 py-3 text-xs font-semibold"
                    style={{ color: PLAYER_COLORS[players.findIndex(pl => pl.name === p.name) % PLAYER_COLORS.length] }}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_STATS.map(stat => {
                const vals = active.map(p => p[stat.key])
                const validVals = vals.filter(v => v !== null && v !== undefined)
                const bestVal = validVals.length
                  ? stat.lowerBetter ? Math.min(...validVals) : Math.max(...validVals)
                  : null

                return (
                  <tr key={stat.key} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs font-medium">{stat.label}</td>
                    {active.map((p) => {
                      const v = p[stat.key]
                      const isBest = v !== null && v !== undefined && v === bestVal && validVals.length > 1
                      return (
                        <td key={p.name} className="px-4 py-3 text-center">
                          <span className={`font-mono font-semibold text-sm ${
                            isBest ? 'text-emerald-400' : 'text-gray-300'
                          }`}>
                            {fmtVal(stat.key, v)}
                          </span>
                          {isBest && <span className="ml-1 text-emerald-500 text-xs">★</span>}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
