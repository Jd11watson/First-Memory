"use client";
import { useEffect, useState } from "react";
import { supabase, Contact, isOverdue, daysSince } from "@/lib/supabase";

const MEDIUMS = ["call", "text", "in person", "video"];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logging, setLogging] = useState<Contact | null>(null);
  const [medium, setMedium] = useState("call");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newInterval, setNewInterval] = useState(14);

  async function load() {
    const { data } = await supabase.from("contacts").select("*").order("name");
    setContacts(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function logContact(id: string) {
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      supabase.from("contacts").update({ last_contacted_at: today }).eq("id", id),
      supabase.from("contact_logs").insert({ contact_id: id, medium }),
    ]);
    setLogging(null);
    load();
  }

  async function addContact() {
    if (!newName.trim()) return;
    await supabase.from("contacts").insert({
      name: newName.trim(),
      target_interval_days: newInterval,
    });
    setNewName(""); setShowAdd(false);
    load();
  }

  async function deleteContact(id: string) {
    if (!confirm("Remove this person?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    load();
  }

  const overdue = contacts.filter(isOverdue);
  const current = contacts.filter(c => !isOverdue(c));

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">People</h1>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-orange-500 rounded-xl text-white font-semibold text-sm active:scale-95 transition-transform">
          + Add
        </button>
      </div>

      {contacts.length === 0 && (
        <p className="text-gray-500 text-center py-8">Add people you want to stay in touch with.</p>
      )}

      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🔴 Reach Out</h2>
          <div className="space-y-2">
            {overdue.map(c => <ContactRow key={c.id} contact={c} onLog={() => setLogging(c)} onDelete={deleteContact} />)}
          </div>
        </div>
      )}

      {current.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🟢 All Good</h2>
          <div className="space-y-2">
            {current.map(c => <ContactRow key={c.id} contact={c} onLog={() => setLogging(c)} onDelete={deleteContact} />)}
          </div>
        </div>
      )}

      {/* Log contact sheet */}
      {logging && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 space-y-5">
            <h2 className="text-xl font-bold text-white">Log contact — {logging.name}</h2>
            <div>
              <p className="text-sm text-gray-400 mb-3">How did you connect?</p>
              <div className="grid grid-cols-2 gap-2">
                {MEDIUMS.map(m => (
                  <button key={m}
                    onClick={() => setMedium(m)}
                    className={`py-3 rounded-xl capitalize font-semibold text-sm active:scale-95 transition-transform
                      ${medium === m ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-300"}`}>
                    {m === "call" ? "📞" : m === "text" ? "💬" : m === "in person" ? "🤝" : "📹"} {m}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => logContact(logging.id)}
              className="w-full py-4 bg-orange-500 rounded-xl text-white font-bold text-lg active:scale-95 transition-transform">
              Save ✓
            </button>
            <button onClick={() => setLogging(null)} className="w-full text-gray-500 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Add contact sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Add Person</h2>
            <input
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500"
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm whitespace-nowrap">Check in every</span>
              <input
                type="number" min={1} max={90}
                className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white"
                value={newInterval}
                onChange={e => setNewInterval(Number(e.target.value))}
              />
              <span className="text-gray-400 text-sm">days</span>
            </div>
            <button onClick={addContact} disabled={!newName.trim()}
              className="w-full py-3 bg-orange-500 rounded-xl text-white font-semibold disabled:opacity-40">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="w-full text-gray-500 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}

function ContactRow({ contact, onLog, onDelete }: {
  contact: Contact;
  onLog: () => void;
  onDelete: (id: string) => void;
}) {
  const days = daysSince(contact.last_contacted_at);
  const overdue = isOverdue(contact);
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl bg-gray-900 border ${overdue ? "border-red-900/40" : "border-transparent"}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
        style={{ background: overdue ? "#450a0a" : "#14532d", color: overdue ? "#f87171" : "#4ade80" }}>
        {contact.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{contact.name}</div>
        <div className={`text-sm ${overdue ? "text-red-400" : "text-gray-500"}`}>
          {days === null ? "Never logged" : `${days}d ago · goal: ${contact.target_interval_days}d`}
        </div>
      </div>
      <button onClick={onLog}
        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 transition-transform">
        Log
      </button>
      <button onClick={() => onDelete(contact.id)}
        className="text-gray-700 hover:text-red-500 text-lg active:scale-90 transition-transform">
        ✕
      </button>
    </div>
  );
}
