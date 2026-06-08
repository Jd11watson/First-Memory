import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-500 mb-1.5 font-display">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-semibold font-display" style={{ color: p.color }}>
          {p.name}: {p.value !== null ? Number(p.value).toFixed(2) : '—'}
        </p>
      ))}
    </div>
  )
}

export default function TrendChart({ data, lines, xKey = 'date', referenceY = null, height = 220, showLegend = false }) {
  if (!data?.length) return (
    <div className="flex items-center justify-center text-zinc-700 text-sm" style={{ height }}>
      No data available
    </div>
  )

  const allVals = data.flatMap(d => lines.map(l => d[l.key])).filter(v => v !== null && v !== undefined)
  if (!allVals.length) return null
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const pad = (max - min) * 0.25 || 0.5

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[min - pad, max + pad]} tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: '#71717a', fontFamily: 'Space Grotesk' }} />}
        {referenceY !== null && <ReferenceLine y={referenceY} stroke="#3f3f46" strokeDasharray="4 2" />}
        {lines.map(l => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color}
            strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
