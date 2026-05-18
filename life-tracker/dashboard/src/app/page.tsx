"use client";
import { useEffect, useState } from "react";
import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { supabase, DailyLog, Contact, Chore, isOverdue, choreDaysOverdue, daysSince } from "@/lib/supabase";
import Link from "next/link";

export default function TodayPage() {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function load() {
      const [{ data: logData }, { data: contactData }, { data: choreData }] = await Promise.all([
        supabase.from("daily_logs").select("*").eq("date", today).maybeSingle(),
        supabase.from("contacts").select("*").order("name"),
        supabase.from("chores").select("*").order("name"),
      ]);
      setLog(logData);
      setContacts(contactData ?? []);
      setChores(choreData ?? []);
      setLoading(false);
    }
    load();
  }, [today]);

  async function handleSave(updates: Partial<DailyLog>) {
    const { data } = await supabase
      .from("daily_logs")
      .upsert({ ...updates, date: today }, { onConflict: "date" })
      .select()
      .single();
    if (data) setLog(data);
  }

  const overdueContacts = contacts.filter(isOverdue);
  const overdueChores = chores.filter(c => (choreDaysOverdue(c) ?? 0) > 0);
  const isCheckedIn = log?.mood_score != null;

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Today</h1>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setShowCheckIn(true)}
          className="px-4 py-2 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          style={{ background: isCheckedIn ? "#1f2937" : "#f97316", color: isCheckedIn ? "#9ca3af" : "white" }}
        >
          {isCheckedIn ? "Update Log" : "📝 Log Day"}
        </button>
      </div>

      {/* Today's check-in summary */}
      {isCheckedIn ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard emoji="😊" label="Mood"   value={`${log!.mood_score}/10`}   color="#f97316" />
          <StatCard emoji="⚡" label="Energy" value={`${log!.energy_score}/10`} color="#eab308" />
          <StatCard emoji="🌊" label="Stress" value={`${log!.stress_score}/5`}  color="#6366f1" />
          <StatCard emoji="🕐" label="Work"   value={`${log!.hours_worked}h`}   color="#3b82f6" />
        </div>
      ) : (
        <button
          onClick={() => setShowCheckIn(true)}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-gray-700 text-gray-400 text-center hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          <div className="text-4xl mb-2">📝</div>
          <div className="font-semibold">Log your day</div>
          <div className="text-sm mt-1">Mood · Energy · Stress · Hours — takes 30 seconds</div>
        </button>
      )}

      {/* Passive health data (populated by Shortcuts) */}
      {(log?.sleep_minutes || log?.resting_hr || log?.steps) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">From Apple Health</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {log.sleep_minutes && (
              <PassivePill emoji="🌙" label="Sleep"
                value={`${Math.floor(log.sleep_minutes / 60)}h ${log.sleep_minutes % 60}m`} />
            )}
            {log.resting_hr && (
              <PassivePill emoji="❤️" label="Resting HR" value={`${Math.round(log.resting_hr)} bpm`} />
            )}
            {log.hrv && (
              <PassivePill emoji="📊" label="HRV" value={`${Math.round(log.hrv)} ms`} />
            )}
            {log.steps && (
              <PassivePill emoji="👟" label="Steps" value={log.steps.toLocaleString()} />
            )}
            {log.phone_pickups && (
              <PassivePill emoji="📱" label="Pickups" value={`${log.phone_pickups}×`} />
            )}
          </div>
        </div>
      )}

      {/* Needs attention */}
      {(overdueContacts.length > 0 || overdueChores.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Needs Attention</h2>
          <div className="space-y-2">
            {overdueContacts.slice(0, 3).map(c => (
              <Link key={c.id} href="/contacts"
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-red-900/40 active:scale-[0.98] transition-transform">
                <span className="text-2xl">👤</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{c.name}</div>
                  <div className="text-sm text-red-400">
                    {daysSince(c.last_contacted_at) ?? "Never"} days since last contact
                  </div>
                </div>
                <span className="text-gray-600 text-sm">→</span>
              </Link>
            ))}
            {overdueChores.slice(0, 3).map(c => (
              <Link key={c.id} href="/chores"
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-orange-900/40 active:scale-[0.98] transition-transform">
                <span className="text-2xl">✅</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{c.name}</div>
                  <div className="text-sm text-orange-400">
                    {choreDaysOverdue(c)} days overdue
                  </div>
                </div>
                <span className="text-gray-600 text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shortcut setup prompt (shown until first health data arrives) */}
      {!log?.sleep_minutes && (
        <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-800/40">
          <div className="font-semibold text-indigo-300 mb-1">🔗 Connect Apple Health</div>
          <p className="text-sm text-gray-400">
            Set up the Shortcuts automation on your iPhone to pull sleep, heart rate, and steps
            automatically each morning. See Settings → Health Sync for the setup guide.
          </p>
        </div>
      )}

      {showCheckIn && (
        <CheckInFlow
          initial={log ?? {}}
          onSave={handleSave}
          onDismiss={() => setShowCheckIn(false)}
        />
      )}
    </main>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-900">
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
        <div className="text-xl font-bold" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

function PassivePill({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-gray-900 min-w-[80px]">
      <span className="text-xl">{emoji}</span>
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
