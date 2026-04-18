import { useState, useMemo } from 'react'
import StatCard from './StatCard'
import TrendChart from './TrendChart'
import { filterBySeason, rollingAvg, fmt, fmtSG, fmtPct, sgColor, scoreColor, scoreToPar } from '../utils/stats'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine
} from 'recharts'

const SEASONS = [
  { id: 'all', label: 'All' },
  { id: 'fall', label: 'Fall' },
  { id: 'spring', label: 'Spring' },
]

const TREND_GROUPS = [
  {
    label: 'Score vs Par',
    lines: [{ key: 'toPar', label: 'Score to Par', color: '#10b981' }],
    referenceY: 0,
    invertY: false,
  },
  {
    label: 'Strokes Gained',
    lines: [
      { key: 'sgDriving',   label: 'Driving',    color: '#3b82f6' },
      { key: 'sgApproach',  label: 'Approach',   color: '#f59e0b' },
      { key: 'sgShortGame', label: 'Short Game', color: '#8b5cf6' },
      { key: 'sgPutting',   label: 'Putting',    color: '#ec4899' },
    ],
    referenceY: 0,
    showLegend: true,
  },
  {
    label: 'Ball Striking',
    lines: [
      { key: 'girPct',     label: 'GIR %',      color: '#10b981' },
      { key: 'fwPct',      label: 'Fairways %', color: '#3b82f6' },
      { key: 'scrambling', label: 'Scrambling', color: '#f59e0b' },
    ],
    showLegend: true,
  },
  {
    label: 'Putting',
    lines: [
      { key: 'puttUnder5', label: '<5ft %',   color: '#10b981' },
      { key: 'putt5to10',  label: '5-10ft %', color: '#3b82f6' },
      { key: 'threePutt',  label: '3-Putt %', color: '#ef4444' },
    ],
    showLegend: true,
  },
]

function ScoreRow({ round }) {
  const toPar = scoreToPar(round.score, round.par)
  return (
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors text-xs">
      <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{round.date}</td>
      <td className="px-3 py-2 text-gray-300 whitespace-nowrap max-w-[140px] truncate">{round.course}</td>
      <td className="px-3 py-2 text-center">
        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
          round.type === 'T' ? 'bg-amber-900/60 text-amber-300' : 'bg-blue-900/60 text-blue-300'
        }`}>
          {round.type}
        </span>
      </td>
      <td className="px-3 py-2 text-center text-gray-400">{round.par}</td>
      <td className={`px-3 py-2 text-center font-bold ${scoreColor(toPar)}`}>
        {round.score} {toPar !== null ? `(${toPar >= 0 ? '+' : ''}${toPar})` : ''}
      </td>
      <td className={`px-3 py-2 text-center font-mono ${sgColor(round.sgDriving)}`}>{fmtSG(round.sgDriving)}</td>
      <td className={`px-3 py-2 text-center font-mono ${sgColor(round.sgApproach)}`}>{fmtSG(round.sgApproach)}</td>
      <td className={`px-3 py-2 text-center font-mono ${sgColor(round.sgShortGame)}`}>{fmtSG(round.sgShortGame)}</td>
      <td className={`px-3 py-2 text-center font-mono ${sgColor(round.sgPutting)}`}>{fmtSG(round.sgPutting)}</td>
      <td className="px-3 py-2 text-center text-gray-300">{fmtPct(round.girPct)}</td>
      <td className="px-3 py-2 text-center text-gray-300">{fmtPct(round.fwPct)}</td>
      <td className="px-3 py-2 text-center text-gray-300">{fmtPct(round.scrambling)}</td>
    </tr>
  )
}

export default function PlayerDashboard({ player }) {
  const [season, setSeason] = useState('all')
  const [showAllRounds, setShowAllRounds] = useState(false)

  const rounds = useMemo(() => {
    const filtered = filterBySeason(player.roundLog ?? [], season)
    return filtered.map(r => ({
      ...r,
      toPar: scoreToPar(r.score, r.par),
    }))
  }, [player, season])

  const trendData = useMemo(() => {
    return rounds.map((r, i) => ({ ...r, index: i + 1 }))
  }, [rounds])

  // Season summary stats derived from rounds
  const seasonStats = useMemo(() => {
    if (!rounds.length) return {}
    const avg = field => {
      const vals = rounds.map(r => r[field]).filter(v => v !== null && v !== undefined)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }
    return {
      avg: avg('score'),
      sgDriving: avg('sgDriving'),
      sgApproach: avg('sgApproach'),
      sgShortGame: avg('sgShortGame'),
      sgPutting: avg('sgPutting'),
      girPct: avg('girPct'),
      fwPct: avg('fwPct'),
      scrambling: avg('scrambling'),
      sandSave: avg('sandSave'),
      threePutt: avg('threePutt'),
      puttUnder5: avg('puttUnder5'),
      putt5to10: avg('putt5to10'),
      birdieAvg: avg('birdieAvg'),
      bogeyAvg: avg('bogeyAvg'),
      par3: avg('par3'),
      par4: avg('par4'),
      par5: avg('par5'),
    }
  }, [rounds])

  // Use season-derived stats, fall back to summary sheet stats
  const s = (key) => seasonStats[key] ?? player[key]

  // SG total
  const sgTotal = [s('sgDriving'), s('sgApproach'), s('sgShortGame'), s('sgPutting')]
    .filter(v => v !== null).reduce((a, b) => a + b, 0)

  const displayedRounds = showAllRounds ? rounds : rounds.slice(-10)

  // Radar data (normalize 0-100)
  const radarData = [
    { stat: 'Driving',    value: Math.max(0, 50 + (s('sgDriving') ?? 0) * 25) },
    { stat: 'Approach',   value: Math.max(0, 50 + (s('sgApproach') ?? 0) * 25) },
    { stat: 'Short Game', value: Math.max(0, 50 + (s('sgShortGame') ?? 0) * 25) },
    { stat: 'Putting',    value: Math.max(0, 50 + (s('sgPutting') ?? 0) * 25) },
    { stat: 'GIR',        value: s('girPct') ?? 50 },
    { stat: 'Scrambling', value: s('scrambling') ?? 50 },
  ]

  // Par scoring bar
  const parData = [
    { par: 'Par 3', avg: s('par3'), ref: 3 },
    { par: 'Par 4', avg: s('par4'), ref: 4 },
    { par: 'Par 5', avg: s('par5'), ref: 5 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{player.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {player.rounds ?? player.roundLog?.length ?? 0} rounds · Season avg {fmt(player.avg ?? s('avg'), 1)}
          </p>
        </div>
        {/* Season filter */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          {SEASONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSeason(s.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                season === s.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Scoring Avg" value={fmt(s('avg'), 1)} size="md" colorClass="text-white" />
        <StatCard label="Q Avg" value={fmt(player.qAvg, 1)} size="md" colorClass="text-blue-300" />
        <StatCard label="T Avg" value={fmt(player.tAvg, 1)} size="md" colorClass="text-amber-300" />
        <StatCard label="SG Total" value={fmtSG(sgTotal)} colorClass={sgColor(sgTotal)} />
        <StatCard label="GIR %" value={fmtPct(s('girPct'))} colorClass="text-white" />
        <StatCard label="Scrambling" value={fmtPct(s('scrambling'))} colorClass="text-white" />
      </div>

      {/* SG Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="SG: Driving" value={fmtSG(s('sgDriving'))} colorClass={sgColor(s('sgDriving'))} sub="vs field avg" />
        <StatCard label="SG: Approach" value={fmtSG(s('sgApproach'))} colorClass={sgColor(s('sgApproach'))} sub="vs field avg" />
        <StatCard label="SG: Short Game" value={fmtSG(s('sgShortGame'))} colorClass={sgColor(s('sgShortGame'))} sub="vs field avg" />
        <StatCard label="SG: Putting" value={fmtSG(s('sgPutting'))} colorClass={sgColor(s('sgPutting'))} sub="vs field avg" />
      </div>

      {/* Radar + Par avg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Player Profile</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Par avg */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Scoring by Par</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {parData.map(d => {
              const diff = d.avg !== null ? d.avg - d.ref : null
              return (
                <div key={d.par} className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{d.par}</p>
                  <p className="text-2xl font-extrabold text-white">{fmt(d.avg, 2)}</p>
                  {diff !== null && (
                    <p className={`text-xs font-semibold mt-1 ${diff < 0 ? 'text-emerald-400' : diff === 0 ? 'text-gray-400' : 'text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)} vs par
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Additional putting stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-800/60 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">3-Putt %</p>
              <p className="text-sm font-bold text-red-400">{fmtPct(s('threePutt'))}</p>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Made &lt;5ft</p>
              <p className="text-sm font-bold text-emerald-400">{fmtPct(s('puttUnder5'))}</p>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Made 5-10ft</p>
              <p className="text-sm font-bold text-emerald-400">{fmtPct(s('putt5to10'))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TREND_GROUPS.map(group => (
          <div key={group.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">{group.label} — Trend</h3>
            <TrendChart
              data={trendData}
              lines={group.lines}
              xKey="date"
              referenceY={group.referenceY ?? null}
              invertY={group.invertY ?? false}
              showLegend={group.showLegend ?? false}
              height={180}
            />
          </div>
        ))}
      </div>

      {/* Round log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            Round Log {season !== 'all' ? `· ${season.charAt(0).toUpperCase() + season.slice(1)}` : ''} ({rounds.length} rounds)
          </h3>
          {rounds.length > 10 && (
            <button
              onClick={() => setShowAllRounds(!showAllRounds)}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {showAllRounds ? 'Show recent' : `Show all ${rounds.length}`}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Date','Course','Type','Par','Score','SG: Drv','SG: App','SG: SG','SG: Putt','GIR','FW','Scr'].map(h => (
                  <th key={h} className="px-3 py-2 text-gray-600 font-medium text-center first:text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...displayedRounds].reverse().map((r, i) => (
                <ScoreRow key={i} round={r} />
              ))}
              {!rounds.length && (
                <tr><td colSpan={12} className="text-center text-gray-600 py-8">No round data for this season</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
