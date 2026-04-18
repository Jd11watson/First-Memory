import { useState, useMemo } from 'react'
import SparklineCard from './SparklineCard'
import TrendChart from './TrendChart'
import InfoTooltip from './InfoTooltip'
import InsightCallout from './InsightCallout'
import AddRoundModal from './AddRoundModal'
import ProComparison from './ProComparison'
import { filterBySeason, fmt, fmtSG, fmtPct, sgColor, scoreColor, scoreToPar } from '../utils/stats'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const SEASONS = [
  { id: 'all', label: 'All' },
  { id: 'fall', label: 'Fall' },
  { id: 'spring', label: 'Spring' },
]

// Stat info copy ─────────────────────────────────────────────────────────────
const INFO = {
  sgDriving: {
    title: 'SG: Driving',
    body: 'Strokes gained or lost off the tee vs. a scratch baseline.\n\n+1.0 means you\'re gaining a full stroke per round on tee shots alone. Negative values indicate distance or accuracy losses driving.\n\nLook for: upward trend. Even small gains here compound quickly.',
  },
  sgApproach: {
    title: 'SG: Approach',
    body: 'Strokes gained on approach shots to the green.\n\nThe highest-leverage stat in golf — it separates scoring levels more than any other category. A +0.5 approach game is elite at the amateur level.\n\nLook for: consistency. Eliminating big negative rounds (loose irons) matters more than peak rounds.',
  },
  sgShortGame: {
    title: 'SG: Short Game',
    body: 'Strokes gained around the green: chips, pitches, and bunker shots inside ~50 yards.\n\nMeasures your ability to convert scrambling opportunities into pars and save bogeys from trouble.\n\nLook for: negative spikes that blow up rounds. Short game volatility is the #1 cause of high-score outliers.',
  },
  sgPutting: {
    title: 'SG: Putting',
    body: 'Strokes gained on the putting surface.\n\nBased on proximity — longer putts are expected to take 2 strokes, short ones 1. Beating those expectations gains strokes.\n\nNote: the most round-to-round variable stat. Focus on the 5-round rolling trend, not individual rounds.',
  },
  girPct: {
    title: 'Greens in Regulation (GIR)',
    body: 'Hitting the green in par minus 2 strokes (1 shot on par 3s, 2 on par 4s, 3 on par 5s).\n\nHigher GIR = more birdie chances, fewer scramble situations.\n\nBenchmarks: 60%+ strong, 50-60% average, below 50% means short game is doing heavy lifting.',
  },
  fwPct: {
    title: 'Fairways Hit',
    body: 'Percentage of par-4 and par-5 tee shots landing in the fairway.\n\nHitting fairways shortens approach distances and improves angles, which typically flows through to SG: Approach.\n\nLook for: if fairway % drops and approach SG drops in the same rounds — that\'s a driving accuracy problem.',
  },
  scrambling: {
    title: 'Scrambling %',
    body: 'When you miss a green in regulation, how often do you still make par or better?\n\nMeasures short game effectiveness when approach play breaks down.\n\nBenchmarks: 65%+ is strong. A high scrambling % can compensate for below-average GIR.',
  },
  threePutt: {
    title: '3-Putt %',
    body: 'Percentage of holes where you take 3 or more putts. Lower is always better.\n\nEach 3-putt costs at least one stroke above expectation and kills momentum.\n\nBenchmarks: below 5% is excellent, 5-10% is average, above 10% is a measurable scoring leak.',
  },
  puttUnder5: {
    title: 'Make % Inside 5ft',
    body: 'Percentage of putts made from inside 5 feet.\n\nThese should be near-automatic. Misses from this range are high-cost momentum killers and often show up as SG: Putting negatives.\n\nBenchmark: 90%+ is the goal. Below 85% is a significant weakness worth dedicated practice.',
  },
  putt5to10: {
    title: 'Make % from 5–10ft',
    body: 'Percentage of putts made from 5 to 10 feet.\n\nThese are the birdie putts that most directly separate scoring levels. Converting even 5% more of these can drop a scoring average by 0.3–0.5 strokes.\n\nBenchmark: 40–55% is typical at scratch. Above 55% is a genuine strength.',
  },
}

// Score row ───────────────────────────────────────────────────────────────────
function ScoreRow({ round }) {
  const toPar = scoreToPar(round.score, round.par)
  return (
    <tr className="border-b border-zinc-800/80 hover:bg-green-950/10 transition-colors text-xs">
      <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{round.date}</td>
      <td className="px-3 py-2 text-zinc-400 whitespace-nowrap max-w-[140px] truncate">{round.course}</td>
      <td className="px-3 py-2 text-center">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${
          round.type === 'T' ? 'bg-amber-950/60 text-amber-400' : 'bg-blue-950/60 text-blue-400'
        }`}>
          {round.type === 'T' ? 'TOURN' : 'QUAL'}
        </span>
      </td>
      <td className="px-3 py-2 text-center text-zinc-600">{round.par}</td>
      <td className={`px-3 py-2 text-center font-display font-bold ${scoreColor(toPar)}`}>
        {round.score}{toPar !== null ? ` (${toPar >= 0 ? '+' : ''}${toPar})` : ''}
      </td>
      <td className={`px-3 py-2 text-center font-mono text-xs ${sgColor(round.sgDriving)}`}>{fmtSG(round.sgDriving)}</td>
      <td className={`px-3 py-2 text-center font-mono text-xs ${sgColor(round.sgApproach)}`}>{fmtSG(round.sgApproach)}</td>
      <td className={`px-3 py-2 text-center font-mono text-xs ${sgColor(round.sgShortGame)}`}>{fmtSG(round.sgShortGame)}</td>
      <td className={`px-3 py-2 text-center font-mono text-xs ${sgColor(round.sgPutting)}`}>{fmtSG(round.sgPutting)}</td>
      <td className="px-3 py-2 text-center text-zinc-400">{fmtPct(round.girPct)}</td>
      <td className="px-3 py-2 text-center text-zinc-400">{fmtPct(round.fwPct)}</td>
      <td className="px-3 py-2 text-center text-zinc-400">{fmtPct(round.scrambling)}</td>
    </tr>
  )
}

// Section header ──────────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 pt-2">
      {children}
    </h2>
  )
}

export default function PlayerDashboard({ player, onRoundAdded }) {
  const [season, setSeason] = useState('all')
  const [showAllRounds, setShowAllRounds] = useState(false)
  const [showAddRound, setShowAddRound] = useState(false)
  const [showProComp, setShowProComp] = useState(false)

  function handleSaveRound(round) {
    onRoundAdded(round)
    setShowAddRound(false)
  }

  const rounds = useMemo(() => {
    const filtered = filterBySeason(player.roundLog ?? [], season)
    return filtered.map(r => ({ ...r, toPar: scoreToPar(r.score, r.par) }))
  }, [player, season])

  const trendData = useMemo(() => rounds.map((r, i) => ({ ...r, index: i + 1 })), [rounds])

  const avg = useMemo(() => {
    if (!rounds.length) return {}
    const calc = field => {
      const vals = rounds.map(r => r[field]).filter(v => v !== null && v !== undefined)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }
    return {
      score: calc('score'), sgDriving: calc('sgDriving'), sgApproach: calc('sgApproach'),
      sgShortGame: calc('sgShortGame'), sgPutting: calc('sgPutting'),
      girPct: calc('girPct'), fwPct: calc('fwPct'), scrambling: calc('scrambling'),
      sandSave: calc('sandSave'), threePutt: calc('threePutt'),
      puttUnder5: calc('puttUnder5'), putt5to10: calc('putt5to10'),
      birdieAvg: calc('birdieAvg'), bogeyAvg: calc('bogeyAvg'),
      par3: calc('par3'), par4: calc('par4'), par5: calc('par5'),
    }
  }, [rounds])

  const s = key => avg[key] ?? player[key]

  const sgTotal = [s('sgDriving'), s('sgApproach'), s('sgShortGame'), s('sgPutting')]
    .filter(v => v !== null).reduce((a, b) => a + b, 0)

  const displayedRounds = showAllRounds ? rounds : rounds.slice(-10)

  const radarData = [
    { stat: 'Driving',    value: Math.max(0, Math.min(100, 50 + (s('sgDriving') ?? 0) * 25)) },
    { stat: 'Approach',   value: Math.max(0, Math.min(100, 50 + (s('sgApproach') ?? 0) * 25)) },
    { stat: 'Short Game', value: Math.max(0, Math.min(100, 50 + (s('sgShortGame') ?? 0) * 25)) },
    { stat: 'Putting',    value: Math.max(0, Math.min(100, 50 + (s('sgPutting') ?? 0) * 25)) },
    { stat: 'GIR',        value: s('girPct') ?? 50 },
    { stat: 'Scrambling', value: s('scrambling') ?? 50 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-zinc-800 pb-6">
        <div>
          <p className="label-xs mb-1">Player</p>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">{player.name}</h1>
          <p className="text-zinc-600 text-sm mt-1">
            {player.rounds ?? rounds.length} rounds recorded
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Season filter */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {SEASONS.map(opt => (
              <button key={opt.id} onClick={() => setSeason(opt.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-semibold transition-all ${
                  season === opt.id ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          {/* Add round */}
          <button onClick={() => setShowAddRound(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-display font-semibold transition-colors">
            + Add Round
          </button>
        </div>
      </div>

      {/* ── Insight callout ── */}
      <InsightCallout player={player} rounds={rounds} />

      {/* ── Hero numbers ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Scoring Avg', val: fmt(s('score') ?? player.avg, 1), color: 'text-white' },
          { label: 'Q Avg',        val: fmt(player.qAvg, 1),              color: 'text-blue-400' },
          { label: 'T Avg',        val: fmt(player.tAvg, 1),              color: 'text-amber-400' },
          { label: 'SG Total',     val: fmtSG(sgTotal),                   color: sgColor(sgTotal) },
          { label: 'GIR %',        val: fmtPct(s('girPct')),              color: 'text-white' },
          { label: 'Scrambling',   val: fmtPct(s('scrambling')),          color: 'text-white' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="label-xs mb-2">{c.label}</p>
            <p className={`font-display text-2xl font-bold ${c.color}`}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* ── Score trend ── */}
      <div>
        <SectionHeading>Score Trend</SectionHeading>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label-xs">Score vs Par — per round</span>
            <InfoTooltip
              title="Score vs Par"
              body="Each bar shows your score relative to the course par for that round. Below zero means under par.\n\nUse this to spot scoring streaks, outlier rounds, and whether your game is trending lower over time."
            />
          </div>
          <TrendChart
            data={trendData}
            lines={[{ key: 'toPar', label: 'Score to Par', color: '#22c55e' }]}
            xKey="date"
            referenceY={0}
            height={160}
          />
        </div>
      </div>

      {/* ── Strokes Gained sparklines ── */}
      <div>
        <SectionHeading>Strokes Gained</SectionHeading>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'sgDriving',   label: 'SG: Driving',    color: '#3b82f6' },
            { key: 'sgApproach',  label: 'SG: Approach',   color: '#f59e0b' },
            { key: 'sgShortGame', label: 'SG: Short Game', color: '#a78bfa' },
            { key: 'sgPutting',   label: 'SG: Putting',    color: '#ec4899' },
          ].map(m => (
            <SparklineCard
              key={m.key}
              label={m.label}
              value={fmtSG(s(m.key))}
              rawValue={s(m.key)}
              data={trendData}
              dataKey={m.key}
              color={m.color}
              referenceY={0}
              higherBetter
              info={INFO[m.key]}
            />
          ))}
        </div>
      </div>

      {/* ── Ball Striking sparklines ── */}
      <div>
        <SectionHeading>Ball Striking</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'girPct',    label: 'GIR %',        color: '#22c55e', higherBetter: true  },
            { key: 'fwPct',     label: 'Fairways %',   color: '#60a5fa', higherBetter: true  },
            { key: 'scrambling',label: 'Scrambling %', color: '#fbbf24', higherBetter: true  },
          ].map(m => (
            <SparklineCard
              key={m.key}
              label={m.label}
              value={fmtPct(s(m.key))}
              rawValue={s(m.key)}
              data={trendData}
              dataKey={m.key}
              color={m.color}
              higherBetter={m.higherBetter}
              info={INFO[m.key]}
            />
          ))}
        </div>
      </div>

      {/* ── Putting sparklines ── */}
      <div>
        <SectionHeading>Putting</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'puttUnder5', label: 'Make % <5ft',    color: '#22c55e', higherBetter: true  },
            { key: 'putt5to10',  label: 'Make % 5–10ft',  color: '#60a5fa', higherBetter: true  },
            { key: 'threePutt',  label: '3-Putt %',       color: '#f87171', higherBetter: false },
          ].map(m => (
            <SparklineCard
              key={m.key}
              label={m.label}
              value={fmtPct(s(m.key))}
              rawValue={s(m.key)}
              data={trendData}
              dataKey={m.key}
              color={m.color}
              higherBetter={m.higherBetter}
              info={INFO[m.key]}
            />
          ))}
        </div>
      </div>

      {/* ── Profile + Par scoring ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="label-xs mb-3">Player Profile</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'Space Grotesk' }} />
              <Radar dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="label-xs mb-4">Scoring by Par</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[{ label: 'Par 3', key: 'par3', ref: 3 }, { label: 'Par 4', key: 'par4', ref: 4 }, { label: 'Par 5', key: 'par5', ref: 5 }].map(d => {
              const v = s(d.key)
              const diff = v !== null ? v - d.ref : null
              return (
                <div key={d.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className="label-xs mb-1">{d.label}</p>
                  <p className="font-display text-2xl font-bold text-white">{fmt(v, 2)}</p>
                  {diff !== null && (
                    <p className={`text-xs font-semibold mt-1 ${diff < 0 ? 'text-green-400' : diff === 0 ? 'text-zinc-600' : 'text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <p className="label-xs">Birdie Avg</p>
              <p className="font-display text-xl font-bold text-green-400 mt-1">{fmt(s('birdieAvg'), 2)}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <p className="label-xs">Bogey Avg</p>
              <p className="font-display text-xl font-bold text-red-400 mt-1">{fmt(s('bogeyAvg'), 2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pro comparison ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading>Compare to the Pros</SectionHeading>
          <button
            onClick={() => setShowProComp(v => !v)}
            className={`text-xs font-display font-semibold px-3 py-1 rounded-lg border transition-all ${
              showProComp
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
            }`}
          >
            {showProComp ? 'Hide' : 'Show'}
          </button>
        </div>
        {showProComp && <ProComparison player={player} avgStats={avg} />}
      </div>

      {/* ── Round log ── */}
      <div>
        <SectionHeading>Round Log</SectionHeading>
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="label-xs">
              {season !== 'all' ? season.charAt(0).toUpperCase() + season.slice(1) + ' · ' : ''}
              {rounds.length} rounds
            </span>
            {rounds.length > 10 && (
              <button
                onClick={() => setShowAllRounds(!showAllRounds)}
                className="text-xs text-green-500 hover:text-green-400 transition-colors"
              >
                {showAllRounds ? 'Show recent' : `Show all ${rounds.length}`}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Date', 'Course', 'Type', 'Par', 'Score', 'SG Drv', 'SG App', 'SG SG', 'SG Putt', 'GIR', 'FW', 'Scr'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-gray-700 font-medium text-center first:text-left whitespace-nowrap label-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...displayedRounds].reverse().map((r, i) => <ScoreRow key={i} round={r} />)}
                {!rounds.length && (
                  <tr>
                    <td colSpan={12} className="text-center text-gray-700 py-10">
                      No round data for this filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddRound && (
        <AddRoundModal
          playerName={player.name}
          onSave={handleSaveRound}
          onClose={() => setShowAddRound(false)}
        />
      )}
    </div>
  )
}
