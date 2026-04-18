import { useMemo } from 'react'
import { LineChart, Line, ReferenceLine, ResponsiveContainer, YAxis } from 'recharts'
import InfoTooltip from './InfoTooltip'

function trend(data, key) {
  const vals = data.map(d => d[key]).filter(v => v !== null && v !== undefined)
  if (vals.length < 4) return null
  const recent = vals.slice(-5)
  const prior  = vals.slice(-10, -5)
  if (!prior.length) return null
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length
  const avgPrior  = prior.reduce((a, b) => a + b, 0) / prior.length
  return avgRecent - avgPrior
}

export default function SparklineCard({
  label,
  value,          // formatted string to display
  rawValue,       // numeric, for trend direction
  data,           // array of round objects
  dataKey,        // field name in data
  color,
  referenceY = null,
  higherBetter = true,
  info,           // { title, body }
}) {
  const delta = useMemo(() => trend(data, dataKey), [data, dataKey])

  // Trend arrow: green if improving, red if declining
  const improving = delta === null ? null : (higherBetter ? delta > 0.01 : delta < -0.01)
  const declining  = delta === null ? null : (higherBetter ? delta < -0.01 : delta > 0.01)

  const sparkData = data.map(d => ({ v: d[dataKey] ?? null }))

  // Y domain with padding
  const vals = sparkData.map(d => d.v).filter(v => v !== null)
  const min = vals.length ? Math.min(...vals) : 0
  const max = vals.length ? Math.max(...vals) : 1
  const pad = (max - min) * 0.3 || 0.5
  const domain = [min - pad, max + pad]

  return (
    <div className="card p-4 flex flex-col gap-2 hover:border-emerald-900/60 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="label-xs">{label}</span>
        <div className="flex items-center gap-2">
          {delta !== null && (
            <span className={`text-[10px] font-semibold ${improving ? 'text-emerald-400' : declining ? 'text-red-400' : 'text-gray-600'}`}>
              {improving ? '▲' : declining ? '▼' : '—'}
            </span>
          )}
          {info && <InfoTooltip title={info.title} body={info.body} />}
        </div>
      </div>

      {/* Value */}
      <span
        className="text-2xl font-display font-bold leading-none"
        style={{ color: rawValue === null ? '#4b5563' : color }}
      >
        {value}
      </span>

      {/* Trend label */}
      {delta !== null && (
        <span className={`text-[10px] ${improving ? 'text-emerald-500' : declining ? 'text-red-500' : 'text-gray-600'}`}>
          {(delta >= 0 ? '+' : '')}{delta.toFixed(2)} vs prev 5
        </span>
      )}

      {/* Sparkline */}
      {sparkData.length > 1 ? (
        <div className="mt-1">
          <ResponsiveContainer width="100%" height={52}>
            <LineChart data={sparkData} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
              <YAxis domain={domain} hide />
              {referenceY !== null && (
                <ReferenceLine y={referenceY} stroke="#1f3326" strokeDasharray="3 2" />
              )}
              <Line
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-8 flex items-center">
          <span className="text-[10px] text-gray-700">Not enough rounds</span>
        </div>
      )}
    </div>
  )
}
