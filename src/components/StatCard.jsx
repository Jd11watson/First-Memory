export default function StatCard({ label, value, sub, trend, colorClass = 'text-white', size = 'md' }) {
  const valueSize = size === 'lg' ? 'text-4xl font-extrabold' : size === 'sm' ? 'text-xl font-bold' : 'text-2xl font-bold'
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1 hover:border-gray-700 transition-colors">
      <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">{label}</span>
      <span className={`${valueSize} ${colorClass} leading-tight`}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
      {trend !== undefined && trend !== null && (
        <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-gray-500'}`}>
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend).toFixed(2)} vs prev 5
        </span>
      )}
    </div>
  )
}
