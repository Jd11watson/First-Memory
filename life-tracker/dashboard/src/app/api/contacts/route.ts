import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET() {
  const { data, error } = await db().from("contacts").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = db();

  if (body.action === "log") {
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      supabase.from("contacts").update({ last_contacted_at: today }).eq("id", body.id),
      supabase.from("contact_logs").insert({
        contact_id: body.id,
        medium: body.medium ?? "call",
        notes: body.notes ?? null,
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "create") {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        name: body.name,
        relationship_type: body.relationship_type ?? "friend",
        target_interval_days: body.target_interval_days ?? 14,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (body.action === "delete") {
    await supabase.from("contacts").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
