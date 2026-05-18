"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays } from "date-fns";

const data = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), "MMM d"),
  pickups: Math.floor(30 + Math.random() * 80),
}));

const avg = Math.round(data.reduce((s, d) => s + d.pickups, 0) / data.length);

export function PhonePickupChart() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-white">📱 Phone Pickups</h3>
          <p className="text-sm text-gray-400">Last 30 days (from Screen Time)</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{avg}×</div>
          <div className="text-xs text-gray-400">avg per day</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="pickupGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval={6} />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#d1d5db" }}
            formatter={(v: number) => [`${v}×`, "Pickups"]}
          />
          <ReferenceLine y={avg} stroke="#6b7280" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="pickups" stroke="#a855f7" strokeWidth={2} fill="url(#pickupGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
