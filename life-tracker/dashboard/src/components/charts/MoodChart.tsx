"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, subDays } from "date-fns";

const data = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), "MMM d"),
  mood: Math.floor(4 + Math.random() * 7),
}));

const moodColor = (score: number) => {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#f97316";
  return "#ef4444";
};

export function MoodChart() {
  const avg = data.reduce((s, d) => s + d.mood, 0) / data.length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-white">😊 Mood</h3>
          <p className="text-sm text-gray-400">Last 30 days</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-400">{avg.toFixed(1)}/10</div>
          <div className="text-xs text-gray-400">avg daily mood</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval={6} />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} domain={[0, 10]} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#d1d5db" }}
            formatter={(v: number) => [`${v}/10`, "Mood"]}
          />
          <Bar dataKey="mood" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={moodColor(entry.mood)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
