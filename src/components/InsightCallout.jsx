import { useState, useMemo } from 'react'
import { fmtSG, fmtPct, fmt, sgColor } from '../utils/stats'

// Each insight: { id, label, compute(player, rounds) → { headline, detail, value, valueColor, direction } }
const INSIGHTS = [
  {
    id: 'strength',
    label: 'Top Strength',
    compute(player, rounds, allPlayers) {
      const cats = [
        { key: 'sgDriving',   name: 'Driving' },
        { key: 'sgApproach',  name: 'Approach' },
        { key: 'sgShortGame', name: 'Short Game' },
        { key: 'sgPutting',   name: 'Putting' },
      ]
      const best = cats
        .map(c => ({ ...c, val: avg(rounds, c.key) ?? player[c.key] }))
        .filter(c => c.val !== null)
        .sort((a, b) => b.val - a.val)[0]
      if (!best) return null
      return {
        headline: `Strongest category: SG ${best.name}`,
        detail: `${fmtSG(best.val)} strokes gained per round — your biggest edge`,
        value: fmtSG(best.val),
        valueColor: best.val >= 0 ? '#4ade80' : '#f87171',
      }
    },
  },
  {
    id: 'weakness',
    label: 'Top Weakness',
    compute(player, rounds) {
      const cats = [
        { key: 'sgDriving',   name: 'Driving' },
        { key: 'sgApproach',  name: 'Approach' },
        { key: 'sgShortGame', name: 'Short Game' },
        { key: 'sgPutting',   name: 'Putting' },
      ]
      const worst = cats
        .map(c => ({ ...c, val: avg(rounds, c.key) ?? player[c.key] }))
        .filter(c => c.val !== null)
        .sort((a, b) => a.val - b.val)[0]
      if (!worst) return null
      return {
        headline: `Biggest gap: SG ${worst.name}`,
        detail: `${fmtSG(worst.val)} per round — highest-priority area for improvement`,
        value: fmtSG(worst.val),
        valueColor: '#f87171',
      }
    },
  },
  {
    id: 'form',
    label: 'Recent Form',
    compute(player, rounds) {
      if (rounds.length < 3) return null
      const recent5 = rounds.slice(-5)
      const prior   = rounds.slice(0, -5)
      const recentAvg = avg(recent5, 'score')
      const priorAvg  = prior.length ? avg(prior, 'score') : null
      const diff = priorAvg !== null ? recentAvg - priorAvg : null
      const arrow = diff === null ? '' : diff < -0.5 ? '↓ Trending lower' : diff > 0.5 ? '↑ Trending higher' : '→ Holding steady'
      return {
        headline: `Last ${recent5.length} rounds: ${fmt(recentAvg, 1)} avg`,
        detail: diff !== null
          ? `${Math.abs(diff).toFixed(1)} strokes ${diff < 0 ? 'better' : 'worse'} than prior form. ${arrow}.`
          : 'Not enough prior rounds to compare.',
        value: fmt(recentAvg, 1),
        valueColor: diff !== null && diff < -0.3 ? '#4ade80' : diff !== null && diff > 0.3 ? '#f87171' : '#a1a1aa',
      }
    },
  },
  {
    id: 'gir',
    label: 'GIR Impact',
    compute(player, rounds) {
      const girVal = avg(rounds, 'girPct') ?? player.girPct
      if (girVal === null) return null
      const benchmark = 65
      const diff = girVal - benchmark
      return {
        headline: `GIR: ${fmtPct(girVal)}`,
        detail: diff >= 0
          ? `${Math.abs(diff).toFixed(0)}pp above the 65% benchmark — generating consistent birdie chances.`
          : `${Math.abs(diff).toFixed(0)}pp below the 65% benchmark — improving GIR directly lowers scoring.`,
        value: fmtPct(girVal),
        valueColor: diff >= 0 ? '#4ade80' : '#f87171',
      }
    },
  },
  {
    id: 'scrambling',
    label: 'Scrambling',
    compute(player, rounds) {
      const scrVal = avg(rounds, 'scrambling') ?? player.scrambling
      const girVal = avg(rounds, 'girPct') ?? player.girPct
      if (scrVal === null) return null
      const misses = girVal !== null ? 100 - girVal : null
      return {
        headline: `Scrambling: ${fmtPct(scrVal)}`,
        detail: scrVal >= 60
          ? `Elite short game — saving par on ${fmtPct(scrVal)} of missed greens limits damage when approach play breaks down.`
          : `${fmtPct(scrVal)} scrambling means bogeys are leaking in. Aim for 60%+ to hold scores together.`,
        value: fmtPct(scrVal),
        valueColor: scrVal >= 60 ? '#4ade80' : scrVal >= 50 ? '#fbbf24' : '#f87171',
      }
    },
  },
  {
    id: 'putting',
    label: 'Putting Leaks',
    compute(player, rounds) {
      const threePutt = avg(rounds, 'threePutt') ?? player.threePutt
      const under5    = avg(rounds, 'puttUnder5') ?? player.puttUnder5
      if (threePutt === null && under5 === null) return null
      const issues = []
      if (threePutt !== null && threePutt > 8)  issues.push(`${fmtPct(threePutt)} 3-putt rate is a scoring leak`)
      if (under5 !== null && under5 < 88)        issues.push(`${fmtPct(under5)} make rate inside 5ft needs work`)
      return {
        headline: issues.length ? 'Putting weakness flagged' : 'Putting: no major leaks',
        detail: issues.length ? issues.join(' · ') + '.' : `3-Putt ${fmtPct(threePutt)} and <5ft ${fmtPct(under5)} — both in solid range.`,
        value: threePutt !== null ? fmtPct(threePutt) : '—',
        valueColor: threePutt !== null && threePutt > 8 ? '#f87171' : '#4ade80',
      }
    },
  },
]

function avg(rounds, key) {
  const vals = rounds.map(r => r[key]).filter(v => v !== null && v !== undefined)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

export default function InsightCallout({ player, rounds }) {
  const [activeId, setActiveId] = useState('strength')

  const insight = useMemo(() => {
    const def = INSIGHTS.find(i => i.id === activeId)
    return def ? def.compute(player, rounds) : null
  }, [activeId, player, rounds])

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      {/* Toggle tabs */}
      <div className="flex overflow-x-auto border-b border-zinc-800" style={{ scrollbarWidth: 'none' }}>
        {INSIGHTS.map(ins => (
          <button
            key={ins.id}
            onClick={() => setActiveId(ins.id)}
            className={`px-4 py-2.5 text-[11px] font-display font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
              activeId === ins.id
                ? 'text-white border-green-500 bg-zinc-800/60'
                : 'text-zinc-600 border-transparent hover:text-zinc-300'
            }`}
          >
            {ins.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {insight ? (
        <div className="px-5 py-4 flex items-center gap-5">
          <div
            className="text-3xl font-display font-black leading-none shrink-0 tabular-nums"
            style={{ color: insight.valueColor }}
          >
            {insight.value}
          </div>
          <div className="border-l border-zinc-800 pl-5">
            <p className="font-display font-semibold text-white text-sm">{insight.headline}</p>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{insight.detail}</p>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 text-zinc-600 text-sm">Not enough data yet — add more rounds.</div>
      )}
    </div>
  )
}
