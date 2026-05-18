import { createClient } from "@supabase/supabase-js";

// Fallback placeholders prevent build-time errors when env vars aren't set.
// At runtime on Vercel, the real values are always present.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(url, key);

// ── Types mirroring the schema ───────────────────────────────────────────────

export interface DailyLog {
  id: string;
  date: string;
  mood_score: number | null;
  energy_score: number | null;
  stress_score: number | null;
  hours_worked: number | null;
  notes: string | null;
  sleep_minutes: number | null;
  sleep_start: string | null;
  sleep_end: string | null;
  resting_hr: number | null;
  hrv: number | null;
  steps: number | null;
  active_calories: number | null;
  phone_pickups: number | null;
  first_pickup_time: string | null;
  screen_time_minutes: number | null;
  weather_condition: string | null;
  temp_high_f: number | null;
  temp_low_f: number | null;
}

export interface Workout {
  id: string;
  started_at: string;
  workout_type: string;
  duration_minutes: number;
  source: string;
  notes: string | null;
  intensity: number | null;
  calories_burned: number | null;
}

export interface Contact {
  id: string;
  name: string;
  relationship_type: string;
  target_interval_days: number;
  last_contacted_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Chore {
  id: string;
  name: string;
  area: string;
  interval_days: number;
  last_completed_at: string | null;
  notes: string | null;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getTodayLog(): Promise<DailyLog | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", today)
    .maybeSingle();
  return data;
}

export async function upsertDailyLog(
  updates: Partial<DailyLog> & { date: string }
): Promise<DailyLog | null> {
  const { data } = await supabase
    .from("daily_logs")
    .upsert(updates, { onConflict: "date" })
    .select()
    .single();
  return data;
}

export async function getRecentLogs(days = 30): Promise<DailyLog[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .gte("date", cutoff.toISOString().split("T")[0])
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getChores(): Promise<Chore[]> {
  const { data } = await supabase
    .from("chores")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function completeChore(choreId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  await Promise.all([
    supabase.from("chores").update({ last_completed_at: today }).eq("id", choreId),
    supabase.from("chore_completions").insert({ chore_id: choreId }),
  ]);
}

export async function getContacts(): Promise<Contact[]> {
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function logContact(
  contactId: string,
  medium: string,
  notes?: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  await Promise.all([
    supabase.from("contacts").update({ last_contacted_at: today }).eq("id", contactId),
    supabase.from("contact_logs").insert({ contact_id: contactId, medium, notes }),
  ]);
}

export async function getRecentWorkouts(days = 30): Promise<Workout[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data } = await supabase
    .from("workouts")
    .select("*")
    .gte("started_at", cutoff.toISOString())
    .order("started_at", { ascending: false });
  return data ?? [];
}

// ── Helper: days since a date string ────────────────────────────────────────
export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

export function isOverdue(contact: Contact): boolean {
  const days = daysSince(contact.last_contacted_at);
  if (days === null) return true;
  return days >= contact.target_interval_days;
}

export function choreNextDue(chore: Chore): Date | null {
  if (!chore.last_completed_at) return null;
  const last = new Date(chore.last_completed_at);
  last.setDate(last.getDate() + chore.interval_days);
  return last;
}

export function choreDaysOverdue(chore: Chore): number | null {
  const due = choreNextDue(chore);
  if (!due) return null;
  const days = Math.floor((Date.now() - due.getTime()) / 86400000);
  return days > 0 ? days : null;
}
