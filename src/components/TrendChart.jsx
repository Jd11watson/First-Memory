import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label, invertColors }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value !== null ? Number(p.value).toFixed(2) : '—'}
        </p>
      ))}
    </div>
  )
}

export default function TrendChart({
  data,
  lines,        // [{ key, label, color }]
  xKey = 'date',
  referenceY = null,
  height = 220,
  invertY = false,
  showLegend = false,
}) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
        No data available
      </div>
    )
  }

  // Determine Y domain with some padding
  const allVals = data.flatMap(d => lines.map(l => d[l.key])).filter(v => v !== null && v !== undefined)
  if (!allVals.length) return null
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const pad = (max - min) * 0.2 || 0.5
  const domain = invertY
    ? [Math.floor(min - pad), Math.ceil(max + pad)]
    : [Math.floor(min - pad), Math.ceil(max + pad)]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={domain}
          reversed={invertY}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
        {referenceY !== null && (
          <ReferenceLine y={referenceY} stroke="#374151" strokeDasharray="4 2" />
        )}
        {lines.map(l => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.label}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
