import { useState } from 'react'
import { STAT_META, fmtSG, fmtPct, fmt } from '../utils/stats'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

const PLAYER_COLORS = [
  '#4ade80', '#60a5fa', '#fbbf24', '#f87171',
  '#a78bfa', '#34d399', '#fb923c', '#38bdf8', '#e879f9',
]

const COMPARE_STATS = [
  { key: 'avg',         label: 'Scoring Avg',    lowerBetter: true  },
  { key: 'sgDriving',   label: 'SG: Driving',    lowerBetter: false },
  { key: 'sgApproach',  label: 'SG: Approach',   lowerBetter: false },
  { key: 'sgShortGame', label: 'SG: Short Game', lowerBetter: false },
  { key: 'sgPutting',   label: 'SG: Putting',    lowerBetter: false },
  { key: 'girPct',      label: 'GIR %',          lowerBetter: false },
  { key: 'fwPct',       label: 'Fairways %',     lowerBetter: false },
  { key: 'scrambling',  label: 'Scrambling %',   lowerBetter: false },
  { key: 'threePutt',   label: '3-Putt %',       lowerBetter: true  },
  { key: 'birdieAvg',   label: 'Birdie Avg',     lowerBetter: false },
  { key: 'bogeyAvg',    label: 'Bogey Avg',      lowerBetter: true  },
  { key: 'par3',        label: 'Par 3 Avg',      lowerBetter: true  },
  { key: 'par4',        label: 'Par 4 Avg',      lowerBetter: true  },
  { key: 'par5',        label: 'Par 5 Avg',      lowerBetter: true  },
]

const RADAR_STATS = [
  { key: 'sgDriving',   label: 'Driving',    center: 0,  scale: 25 },
  { key: 'sgApproach',  label: 'Approach',   center: 0,  scale: 25 },
  { key: 'sgShortGame', label: 'Short Gm',   center: 0,  scale: 25 },
  { key: 'sgPutting',   label: 'Putting',    center: 0,  scale: 25 },
  { key: 'girPct',      label: 'GIR',        center: 50, scale: 1  },
  { key: 'scrambling',  label: 'Scrambling', center: 50, scale: 1  },
]

function fmtVal(key, val) {
  if (val === null || val === undefined) return '—'
  return STAT_META.find(s => s.key === key)?.format(val) ?? String(val)
}

const TOOLTIP_STYLE = {
  background: '#18181b', border: '1px solid #3f3f46',
  borderRadius: 10, fontSize: 12, fontFamily: 'Space Grotesk',
}

export default function ComparisonView({ players }) {
  const [selected, setSelected] = useState(players.slice(0, 3).map(p => p.name))
  const active = players.filter(p => selected.includes(p.name))

  function toggle(name) {
    setSelected(prev =>
      prev.includes(name)
        ? prev.length > 1 ? prev.filter(n => n !== name) : prev
        : [...prev, name]
    )
  }

  const colorOf = name => PLAYER_COLORS[players.findIndex(p => p.name === name) % PLAYER_COLORS.length]

  const radarData = RADAR_STATS.map(({ key, label, center, scale }) => {
    const entry = { stat: label }
    active.forEach(p => {
      const v = p[key]
      entry[p.name] = v !== null && v !== undefined ? Math.max(0, Math.min(100, center + v * scale)) : 50
    })
    return entry
  })

  const sgData = ['sgDriving', 'sgApproach', 'sgShortGame', 'sgPutting'].map((key, i) => {
    const entry = { stat: ['Driving', 'Approach', 'Short Gm', 'Putting'][i] }
    active.forEach(p => { entry[p.name] = p[key] ?? null })
    return entry
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Player selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="section-title mb-4">Select Players</p>
        <div className="flex flex-wrap gap-2">
          {players.map(p => {
            const isOn = selected.includes(p.name)
            const color = colorOf(p.name)
            return (
              <button key={p.name} onClick={() => toggle(p.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold border transition-all ${
                  isOn ? 'text-zinc-950' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }`}
                style={isOn ? { background: color, borderColor: color } : {}}>
                <span className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: isOn ? 'rgba(0,0,0,0.3)' : '#3f3f46' }} />
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Radar + SG bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="section-title">Player Profiles</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'Space Grotesk' }} />
              {active.map(p => (
                <Radar key={p.name} dataKey={p.name}
                  stroke={colorOf(p.name)} fill={colorOf(p.name)} fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: '#71717a', fontFamily: 'Space Grotesk' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="section-title">Strokes Gained Breakdown</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sgData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="stat" tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'Space Grotesk' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <ReferenceLine y={0} stroke="#3f3f46" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [v !== null ? Number(v).toFixed(2) : '—', name]} cursor={{ fill: '#ffffff06' }} />
              {active.map(p => (
                <Bar key={p.name} dataKey={p.name} fill={colorOf(p.name)} radius={[3, 3, 0, 0]} maxBarSize={20} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stat table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <p className="section-title mb-0">Full Stat Comparison</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 label-xs">Stat</th>
                {active.map(p => (
                  <th key={p.name} className="text-center px-5 py-3 font-display font-bold text-sm"
                    style={{ color: colorOf(p.name) }}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_STATS.map(stat => {
                const vals = active.map(p => p[stat.key]).filter(v => v !== null && v !== undefined)
                const best = vals.length ? (stat.lowerBetter ? Math.min(...vals) : Math.max(...vals)) : null
                return (
                  <tr key={stat.key} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 text-zinc-500 text-xs font-display font-medium">{stat.label}</td>
                    {active.map(p => {
                      const v = p[stat.key]
                      const isBest = v !== null && v !== undefined && v === best && vals.length > 1
                      return (
                        <td key={p.name} className="px-5 py-3 text-center">
                          <span className={`font-mono font-semibold text-sm ${isBest ? 'text-green-400' : 'text-zinc-300'}`}>
                            {fmtVal(stat.key, v)}
                          </span>
                          {isBest && <span className="ml-1 text-green-500 text-xs">★</span>}
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
