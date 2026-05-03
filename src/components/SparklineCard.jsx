import { useMemo } from 'react'
import { LineChart, Line, ReferenceLine, ResponsiveContainer, YAxis } from 'recharts'
import InfoTooltip from './InfoTooltip'

function calcTrend(data, key) {
  const vals = data.map(d => d[key]).filter(v => v !== null && v !== undefined)
  if (vals.length < 6) return null
  const recent = vals.slice(-5)
  const prior  = vals.slice(-10, -5)
  if (!prior.length) return null
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
  return avg(recent) - avg(prior)
}

export default function SparklineCard({ label, value, rawValue, data, dataKey, color, referenceY = null, higherBetter = true, info }) {
  const delta = useMemo(() => calcTrend(data, dataKey), [data, dataKey])

  const isUp   = delta !== null && (higherBetter ? delta > 0.01 : delta < -0.01)
  const isDown = delta !== null && (higherBetter ? delta < -0.01 : delta > 0.01)

  const sparkData = data.map(d => ({ v: d[dataKey] ?? null }))
  const vals = sparkData.map(d => d.v).filter(v => v !== null)
  const min = vals.length ? Math.min(...vals) : 0
  const max = vals.length ? Math.max(...vals) : 1
  const pad = (max - min) * 0.3 || 0.5

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="label-xs">{label}</span>
        <div className="flex items-center gap-2">
          {delta !== null && (
            <span className={`text-[10px] font-semibold ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-zinc-600'}`}>
              {isUp ? '▲' : isDown ? '▼' : '─'}
            </span>
          )}
          {info && <InfoTooltip title={info.title} body={info.body} />}
        </div>
      </div>

      <p className="font-display text-2xl font-bold leading-none mb-1" style={{ color: rawValue === null ? '#52525b' : color }}>
        {value}
      </p>

      {delta !== null && (
        <p className={`text-[10px] mb-3 ${isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-zinc-600'}`}>
          {(delta >= 0 ? '+' : '')}{delta.toFixed(2)} vs prior 5
        </p>
      )}

      {sparkData.length > 2 ? (
        <ResponsiveContainer width="100%" height={48}>
          <LineChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <YAxis domain={[min - pad, max + pad]} hide />
            {referenceY !== null && <ReferenceLine y={referenceY} stroke="#3f3f46" strokeDasharray="3 2" />}
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-12 flex items-center">
          <span className="text-[10px] text-zinc-700">Not enough rounds</span>
        </div>
      )}
    </div>
  )
}
