interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {trend && (
        <div className={`text-xs ${trendUp ? "text-green-400" : "text-gray-400"}`}>
          {trend}
        </div>
      )}
    </div>
  );
}
