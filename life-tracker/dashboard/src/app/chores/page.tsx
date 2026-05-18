"use client";
import { useEffect, useState } from "react";
import { supabase, Chore, choreNextDue, choreDaysOverdue } from "@/lib/supabase";

const PRESETS = [
  { name: "Change AC Filter",  area: "general",     interval_days: 90 },
  { name: "Clean Fridge",      area: "kitchen",     interval_days: 30 },
  { name: "Clean Bathrooms",   area: "bathroom",    interval_days: 14 },
  { name: "Vacuum",            area: "living_room", interval_days: 7  },
  { name: "Oil Change",        area: "car",         interval_days: 90 },
  { name: "Mow Lawn",          area: "yard",        interval_days: 7  },
  { name: "Replace Dishwasher Filter", area: "kitchen", interval_days: 90 },
  { name: "Clean Garage",      area: "garage",      interval_days: 90 },
];

export default function ChoresPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("general");
  const [newInterval, setNewInterval] = useState(30);

  async function load() {
    const { data } = await supabase.from("chores").select("*").order("name");
    setChores(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function complete(id: string) {
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      supabase.from("chores").update({ last_completed_at: today }).eq("id", id),
      supabase.from("chore_completions").insert({ chore_id: id }),
    ]);
    load();
  }

  async function addChore(name: string, area: string, interval_days: number) {
    await supabase.from("chores").insert({ name, area, interval_days });
    setNewName(""); setShowAdd(false);
    load();
  }

  async function deleteChore(id: string) {
    if (!confirm("Remove this chore?")) return;
    await supabase.from("chores").delete().eq("id", id);
    load();
  }

  const overdue  = chores.filter(c => (choreDaysOverdue(c) ?? -1) >= 0);
  const upcoming = chores.filter(c => {
    const due = choreNextDue(c);
    if (!due) return false;
    const days = (due.getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 14 && !overdue.includes(c);
  });
  const fine = chores.filter(c => !overdue.includes(c) && !upcoming.includes(c));

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Chores & Maintenance</h1>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-orange-500 rounded-xl text-white font-semibold text-sm active:scale-95 transition-transform">
          + Add
        </button>
      </div>

      {chores.length === 0 && (
        <p className="text-gray-500 text-center py-8">No chores tracked yet. Add one above.</p>
      )}

      <ChoreSection title="🔴 Overdue"   chores={overdue}   onComplete={complete} onDelete={deleteChore} />
      <ChoreSection title="🟡 Due Soon"  chores={upcoming}  onComplete={complete} onDelete={deleteChore} />
      <ChoreSection title="🟢 All Clear" chores={fine}      onComplete={complete} onDelete={deleteChore} />

      {/* Add chore sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 space-y-5">
            <h2 className="text-xl font-bold text-white">Add Chore</h2>

            {/* Presets */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.name}
                    onClick={() => addChore(p.name, p.area, p.interval_days)}
                    className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 active:scale-95 transition-transform">
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Or create custom</p>
              <input
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                placeholder="Chore name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <select
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white"
                value={newArea}
                onChange={e => setNewArea(e.target.value)}
              >
                {["general","kitchen","bathroom","bedroom","living_room","garage","yard","car","appliance"].map(a => (
                  <option key={a} value={a}>{a.replace("_", " ")}</option>
                ))}
              </select>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Every</span>
                <input
                  type="number" min={1} max={365}
                  className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white"
                  value={newInterval}
                  onChange={e => setNewInterval(Number(e.target.value))}
                />
                <span className="text-gray-400 text-sm">days</span>
              </div>
              <button
                onClick={() => newName.trim() && addChore(newName.trim(), newArea, newInterval)}
                disabled={!newName.trim()}
                className="w-full py-3 bg-orange-500 rounded-xl text-white font-semibold disabled:opacity-40">
                Add Chore
              </button>
            </div>

            <button onClick={() => setShowAdd(false)} className="w-full text-gray-500 text-sm py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ChoreSection({ title, chores, onComplete, onDelete }: {
  title: string; chores: Chore[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!chores.length) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-2">
        {chores.map(chore => {
          const overdueDays = choreDaysOverdue(chore);
          const nextDue = choreNextDue(chore);
          const daysUntil = nextDue ? Math.ceil((nextDue.getTime() - Date.now()) / 86400000) : null;
          return (
            <div key={chore.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-900">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{chore.name}</div>
                <div className="text-xs text-gray-500 capitalize mt-0.5">
                  {chore.area.replace("_"," ")} · every {chore.interval_days}d
                  {overdueDays != null && overdueDays >= 0
                    ? <span className="text-red-400 ml-1">· {overdueDays}d overdue</span>
                    : daysUntil != null && daysUntil >= 0
                    ? <span className="text-yellow-400 ml-1">· due in {daysUntil}d</span>
                    : null}
                </div>
              </div>
              <button onClick={() => onComplete(chore.id)}
                className="text-2xl active:scale-90 transition-transform" title="Mark done">
                ☑️
              </button>
              <button onClick={() => onDelete(chore.id)}
                className="text-gray-700 hover:text-red-500 active:scale-90 transition-transform text-lg">
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
