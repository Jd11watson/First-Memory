import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Called daily by an Apple Shortcut on the user's iPhone/iPad.
// The Shortcut reads HealthKit data and POSTs it here.
//
// Headers: Authorization: Bearer <HEALTH_SYNC_SECRET>
//
// Body (all fields optional):
// {
//   date: "2025-05-18",
//   sleep_minutes: 452,
//   sleep_start: "2025-05-17T23:08:00",
//   sleep_end: "2025-05-18T06:40:00",
//   resting_hr: 58.4,
//   hrv: 41.2,
//   steps: 8241,
//   active_calories: 480,
//   phone_pickups: 47,
//   first_pickup_time: "07:02:00",
//   screen_time_minutes: 210,
//   workout_type: "run",
//   workout_duration: 35,
//   workout_calories: 320
// }

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? "";
  const secret = process.env.HEALTH_SYNC_SECRET ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const date: string = body.date ?? new Date().toISOString().split("T")[0];
  const supabase = db();

  const logUpdate: Record<string, unknown> = { date };
  const fields = [
    "sleep_minutes","sleep_start","sleep_end","resting_hr","hrv",
    "steps","active_calories","phone_pickups","first_pickup_time","screen_time_minutes",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) logUpdate[f] = body[f];
  }

  const { error } = await supabase
    .from("daily_logs")
    .upsert(logUpdate, { onConflict: "date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.workout_type && body.workout_duration) {
    await supabase.from("workouts").insert({
      started_at: body.sleep_end ?? `${date}T08:00:00`,
      workout_type: body.workout_type,
      duration_minutes: body.workout_duration,
      calories_burned: body.workout_calories ?? null,
      source: "shortcuts",
    });
  }

  return NextResponse.json({ ok: true, date });
}
