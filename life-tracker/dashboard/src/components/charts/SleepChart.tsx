"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays } from "date-fns";

// Mock data — replace with CloudKit fetch in production
const generateSleepData = () =>
  Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), "MMM d"),
    hours: 5.5 + Math.random() * 3,
  }));

const data = generateSleepData();
const avg = data.reduce((sum, d) => sum + d.hours, 0) / data.length;

export function SleepChart() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            🌙 Sleep
          </h3>
          <p className="text-sm text-gray-400">Last 30 days</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-400">{avg.toFixed(1)}h</div>
          <div className="text-xs text-gray-400">avg / night</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval={6} />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} domain={[4, 10]} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#d1d5db" }}
            formatter={(v: number) => [`${v.toFixed(1)}h`, "Sleep"]}
          />
          <ReferenceLine y={8} stroke="#4b5563" strokeDasharray="4 4" label={{ value: "8h goal", fill: "#6b7280", fontSize: 10 }} />
          <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
