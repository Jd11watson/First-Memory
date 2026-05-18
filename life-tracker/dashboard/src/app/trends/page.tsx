"use client";
import { useEffect, useState } from "react";
import { supabase, DailyLog } from "@/lib/supabase";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import { format, parseISO } from "date-fns";

type Period = "7" | "30" | "90";

export default function TrendsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [period, setPeriod] = useState<Period>("30");

  useEffect(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    supabase.from("daily_logs").select("*")
      .gte("date", cutoff.toISOString().split("T")[0])
      .order("date", { ascending: true })
      .then(({ data }) => setLogs(data ?? []));
  }, [period]);

  const fmt = (d: string) => format(parseISO(d), period === "7" ? "EEE" : "MMM d");

  const sleepData  = logs.filter(l => l.sleep_minutes).map(l => ({ date: fmt(l.date), value: +(l.sleep_minutes! / 60).toFixed(1) }));
  const moodData   = logs.filter(l => l.mood_score).map(l => ({ date: fmt(l.date), value: l.mood_score! }));
  const workData   = logs.filter(l => l.hours_worked).map(l => ({ date: fmt(l.date), value: l.hours_worked! }));
  const hrData     = logs.filter(l => l.resting_hr).map(l => ({ date: fmt(l.date), value: Math.round(l.resting_hr!) }));
  const pickupData = logs.filter(l => l.phone_pickups).map(l => ({ date: fmt(l.date), value: l.phone_pickups! }));

  const avg = (arr: { value: number }[]) =>
    arr.length ? (arr.reduce((s, d) => s + d.value, 0) / arr.length).toFixed(1) : "—";

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Trends</h1>
        <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
          {(["7","30","90"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                ${period === p ? "bg-orange-500 text-white" : "text-gray-400"}`}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          <div className="text-4xl mb-3">📊</div>
          <div>No data yet for this period.</div>
          <div className="text-sm mt-1">Log a few days using the check-in to see trends appear.</div>
        </div>
      )}

      {sleepData.length > 0 && (
        <ChartCard title="Sleep" emoji="🌙" avg={`${avg(sleepData)}h / night`} color="#6366f1">
          <LineChart data={sleepData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} domain={[4, 10]} />
            <Tooltip contentStyle={tipStyle} formatter={(v: number) => [`${v}h`, "Sleep"]} />
            <ReferenceLine y={8} stroke="#4b5563" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ChartCard>
      )}

      {moodData.length > 0 && (
        <ChartCard title="Mood" emoji="😊" avg={`${avg(moodData)} / 10`} color="#f97316">
          <BarChart data={moodData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} domain={[0, 10]} />
            <Tooltip contentStyle={tipStyle} formatter={(v: number) => [`${v}/10`, "Mood"]} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {moodData.map((d, i) => (
                <Cell key={i} fill={d.value >= 8 ? "#22c55e" : d.value >= 5 ? "#f97316" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      )}

      {workData.length > 0 && (
        <ChartCard title="Hours Worked" emoji="🕐" avg={`${avg(workData)}h / day`} color="#3b82f6">
          <BarChart data={workData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} domain={[0, 12]} />
            <Tooltip contentStyle={tipStyle} formatter={(v: number) => [`${v}h`, "Worked"]} />
            <ReferenceLine y={8} stroke="#4b5563" strokeDasharray="4 4" />
            <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {hrData.length > 0 && (
        <ChartCard title="Resting Heart Rate" emoji="❤️" avg={`${avg(hrData)} bpm`} color="#ef4444">
          <LineChart data={hrData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} />
            <Tooltip contentStyle={tipStyle} formatter={(v: number) => [`${v} bpm`, "Resting HR"]} />
            <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ChartCard>
      )}

      {pickupData.length > 0 && (
        <ChartCard title="Phone Pickups" emoji="📱" avg={`${avg(pickupData)}× / day`} color="#a855f7">
          <LineChart data={pickupData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} />
            <Tooltip contentStyle={tipStyle} formatter={(v: number) => [`${v}×`, "Pickups"]} />
            <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ChartCard>
      )}
    </main>
  );
}

const tipStyle = {
  background: "#111827", border: "1px solid #374151",
  borderRadius: 8, fontSize: 12,
};

function ChartCard({ title, emoji, avg, color, children }: {
  title: string; emoji: string; avg: string; color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-semibold text-white">{title}</span>
        </div>
        <span className="text-sm font-semibold" style={{ color }}>{avg}</span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
