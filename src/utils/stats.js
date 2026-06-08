// Rolling N-round average for a given field
export function rollingAvg(rounds, field, n = 5) {
  return rounds.map((_, i) => {
    const window = rounds.slice(Math.max(0, i - n + 1), i + 1)
    const vals = window.map(r => r[field]).filter(v => v !== null && v !== undefined)
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  })
}

// Season detection: fall = Aug–Dec, spring = Jan–May
export function getSeason(dateStr) {
  if (!dateStr) return 'unknown'
  const parts = dateStr.split('/')
  const month = parseInt(parts[0])
  if (isNaN(month)) return 'unknown'
  return month >= 8 ? 'fall' : 'spring'
}

export function filterBySeason(rounds, season) {
  if (season === 'all') return rounds
  return rounds.filter(r => getSeason(r.date) === season)
}

export function avg(arr) {
  const vals = arr.filter(v => v !== null && v !== undefined)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function scoreToPar(score, par) {
  if (score === null || par === null) return null
  return score - par
}

// Color coding: green = good, red = bad
// For strokes gained: positive = green, negative = red
// For scoring avg: lower = green
export function sgColor(val) {
  if (val === null) return 'text-zinc-500'
  if (val > 0.3) return 'text-green-400'
  if (val > 0) return 'text-green-300'
  if (val > -0.3) return 'text-red-300'
  return 'text-red-400'
}

export function scoreColor(toPar) {
  if (toPar === null) return 'text-zinc-500'
  if (toPar < -2) return 'text-green-400'
  if (toPar < 0) return 'text-green-300'
  if (toPar === 0) return 'text-zinc-400'
  if (toPar <= 2) return 'text-red-300'
  return 'text-red-400'
}

export function pctColor(val, higherIsBetter = true) {
  if (val === null) return 'text-zinc-500'
  const good = higherIsBetter ? val > 60 : val < 5
  const ok = higherIsBetter ? val > 40 : val < 10
  if (good) return 'text-green-400'
  if (ok) return 'text-yellow-400'
  return 'text-red-400'
}

export function fmt(val, decimals = 2, prefix = '') {
  if (val === null || val === undefined) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  const s = n.toFixed(decimals)
  return prefix + (n > 0 && prefix === '+' ? '+' + n.toFixed(decimals) : s)
}

export function fmtSG(val) {
  if (val === null || val === undefined) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  return (n >= 0 ? '+' : '') + n.toFixed(2)
}

export function fmtPct(val) {
  if (val === null || val === undefined) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  return n.toFixed(0) + '%'
}

// Rank players on a stat (lower rank = better)
export function rankPlayers(players, field, lowerIsBetter = false) {
  const sorted = [...players]
    .filter(p => p[field] !== null && p[field] !== undefined)
    .sort((a, b) => lowerIsBetter ? a[field] - b[field] : b[field] - a[field])
  const ranks = {}
  sorted.forEach((p, i) => { ranks[p.name] = i + 1 })
  return ranks
}

export const STAT_META = [
  { key: 'avg',         label: 'Scoring Avg',     lowerBetter: true,  format: v => fmt(v, 1),   category: 'scoring' },
  { key: 'qAvg',        label: 'Q Avg',           lowerBetter: true,  format: v => fmt(v, 1),   category: 'scoring' },
  { key: 'tAvg',        label: 'T Avg',           lowerBetter: true,  format: v => fmt(v, 1),   category: 'scoring' },
  { key: 'sgDriving',   label: 'SG: Driving',     lowerBetter: false, format: fmtSG,            category: 'sg' },
  { key: 'sgApproach',  label: 'SG: Approach',    lowerBetter: false, format: fmtSG,            category: 'sg' },
  { key: 'sgShortGame', label: 'SG: Short Game',  lowerBetter: false, format: fmtSG,            category: 'sg' },
  { key: 'sgPutting',   label: 'SG: Putting',     lowerBetter: false, format: fmtSG,            category: 'sg' },
  { key: 'fwPct',       label: 'Fairways',        lowerBetter: false, format: fmtPct,           category: 'traditional' },
  { key: 'girPct',      label: 'GIR',             lowerBetter: false, format: fmtPct,           category: 'traditional' },
  { key: 'scrambling',  label: 'Scrambling',      lowerBetter: false, format: fmtPct,           category: 'traditional' },
  { key: 'sandSave',    label: 'Sand Save',       lowerBetter: false, format: fmtPct,           category: 'traditional' },
  { key: 'threePutt',   label: '3-Putt%',         lowerBetter: true,  format: fmtPct,           category: 'putting' },
  { key: 'puttUnder5',  label: 'Putt <5ft',       lowerBetter: false, format: fmtPct,           category: 'putting' },
  { key: 'putt5to10',   label: 'Putt 5-10ft',     lowerBetter: false, format: fmtPct,           category: 'putting' },
  { key: 'birdieAvg',   label: 'Birdie Avg',      lowerBetter: false, format: v => fmt(v, 2),   category: 'scoring' },
  { key: 'bogeyAvg',    label: 'Bogey Avg',       lowerBetter: true,  format: v => fmt(v, 2),   category: 'scoring' },
  { key: 'par3',        label: 'Par 3 Avg',       lowerBetter: true,  format: v => fmt(v, 2),   category: 'pars' },
  { key: 'par4',        label: 'Par 4 Avg',       lowerBetter: true,  format: v => fmt(v, 2),   category: 'pars' },
  { key: 'par5',        label: 'Par 5 Avg',       lowerBetter: true,  format: v => fmt(v, 2),   category: 'pars' },
]
