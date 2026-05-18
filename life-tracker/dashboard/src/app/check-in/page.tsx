"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { supabase, DailyLog } from "@/lib/supabase";

export default function CheckInPage() {
  const router = useRouter();
  const [log, setLog] = useState<DailyLog | null>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    supabase.from("daily_logs").select("*").eq("date", today).maybeSingle()
      .then(({ data }) => setLog(data));
  }, [today]);

  async function handleSave(updates: Partial<DailyLog>) {
    const { data } = await supabase
      .from("daily_logs")
      .upsert({ ...updates, date: today }, { onConflict: "date" })
      .select().single();
    if (data) setLog(data);
  }

  return (
    <CheckInFlow
      initial={log ?? {}}
      onSave={handleSave}
      onDismiss={() => router.push("/")}
    />
  );
}
