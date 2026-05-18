"use client";
import { useState } from "react";
import { DailyLog } from "@/lib/supabase";

interface Props {
  initial: Partial<DailyLog>;
  onSave: (updates: Partial<DailyLog>) => Promise<void>;
  onDismiss: () => void;
}

type Step = "mood" | "energy" | "stress" | "work" | "done";
const STEPS: Step[] = ["mood", "energy", "stress", "work", "done"];

const STEP_META: Record<Step, { title: string; subtitle: string; emoji: string; color: string }> = {
  mood:   { title: "Mood",          subtitle: "How did you feel today overall?", emoji: "😊", color: "#f97316" },
  energy: { title: "Energy",        subtitle: "How was your energy level?",       emoji: "⚡", color: "#eab308" },
  stress: { title: "Stress",        subtitle: "How stressed were you today?",     emoji: "🌊", color: "#6366f1" },
  work:   { title: "Hours Worked",  subtitle: "Tap + and − to adjust.",           emoji: "🕐", color: "#3b82f6" },
  done:   { title: "All logged!",   subtitle: "Trends appear after a few weeks.", emoji: "✅", color: "#22c55e" },
};

export function CheckInFlow({ initial, onSave, onDismiss }: Props) {
  const [step, setStep] = useState<Step>("mood");
  const [values, setValues] = useState({
    mood_score:   initial.mood_score   ?? 7,
    energy_score: initial.energy_score ?? 7,
    stress_score: initial.stress_score ?? 3,
    hours_worked: initial.hours_worked ?? 8,
  });
  const [saving, setSaving] = useState(false);

  const meta = STEP_META[step];
  const stepIndex = STEPS.indexOf(step);
  const progress = stepIndex / (STEPS.length - 2);

  function next() {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep);
  }
  function back() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }
  async function finish() {
    setSaving(true);
    await onSave({
      mood_score:   values.mood_score,
      energy_score: values.energy_score,
      stress_score: values.stress_score,
      hours_worked: values.hours_worked,
    });
    setSaving(false);
    setStep("done");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 flex flex-col gap-8">
        {/* Progress bar */}
        {step !== "done" && (
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%`, background: meta.color }}
            />
          </div>
        )}

        {/* Question */}
        <div className="text-center space-y-2">
          <div className="text-5xl">{meta.emoji}</div>
          <h2 className="text-2xl font-bold text-white">{meta.title}</h2>
          <p className="text-gray-400">{meta.subtitle}</p>
        </div>

        {/* Input */}
        <div className="flex flex-col items-center gap-6">
          {step === "mood" && (
            <SliderInput
              value={values.mood_score}
              min={1} max={10}
              color={meta.color}
              onChange={v => setValues(x => ({ ...x, mood_score: v }))}
              lowLabel="Low" highLabel="High"
            />
          )}
          {step === "energy" && (
            <SliderInput
              value={values.energy_score}
              min={1} max={10}
              color={meta.color}
              onChange={v => setValues(x => ({ ...x, energy_score: v }))}
              lowLabel="Drained" highLabel="Energized"
            />
          )}
          {step === "stress" && (
            <SliderInput
              value={values.stress_score}
              min={1} max={5}
              color={meta.color}
              onChange={v => setValues(x => ({ ...x, stress_score: v }))}
              lowLabel="Calm" highLabel="Overwhelmed"
            />
          )}
          {step === "work" && (
            <StepperInput
              value={values.hours_worked}
              step={0.5}
              min={0} max={16}
              color={meta.color}
              suffix="hrs"
              onChange={v => setValues(x => ({ ...x, hours_worked: v }))}
            />
          )}
          {step === "done" && (
            <p className="text-gray-400 text-center text-sm max-w-xs">
              Check back tomorrow — your trends will start taking shape.
            </p>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3">
          {step !== "mood" && step !== "done" && (
            <button
              onClick={back}
              className="flex-1 py-4 rounded-xl bg-gray-800 text-white font-semibold text-lg active:scale-95 transition-transform"
            >
              ← Back
            </button>
          )}
          {step === "done" ? (
            <button
              onClick={onDismiss}
              className="flex-1 py-4 rounded-xl font-semibold text-lg active:scale-95 transition-transform text-white"
              style={{ background: meta.color }}
            >
              Close
            </button>
          ) : step === "work" ? (
            <button
              onClick={finish}
              disabled={saving}
              className="flex-1 py-4 rounded-xl font-semibold text-lg active:scale-95 transition-transform text-white disabled:opacity-50"
              style={{ background: meta.color }}
            >
              {saving ? "Saving…" : "Save Day ✓"}
            </button>
          ) : (
            <button
              onClick={next}
              className="flex-1 py-4 rounded-xl font-semibold text-lg active:scale-95 transition-transform text-white"
              style={{ background: meta.color }}
            >
              Next →
            </button>
          )}
        </div>

        <button onClick={onDismiss} className="text-gray-600 text-sm text-center hover:text-gray-400">
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ── Slider (no keyboard) ──────────────────────────────────────────────────────
function SliderInput({
  value, min, max, color, onChange, lowLabel, highLabel,
}: {
  value: number; min: number; max: number; color: string;
  onChange: (v: number) => void;
  lowLabel: string; highLabel: string;
}) {
  return (
    <div className="w-full space-y-4">
      <div className="text-center text-7xl font-bold text-white tabular-nums" style={{ color }}>
        {value}
        <span className="text-3xl text-gray-500">/{max}</span>
      </div>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

// ── Stepper (tap +/−, no keyboard) ───────────────────────────────────────────
function StepperInput({
  value, min, max, step, color, suffix, onChange,
}: {
  value: number; min: number; max: number; step: number;
  color: string; suffix: string; onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  const inc = () => onChange(Math.min(max, Math.round((value + step) * 10) / 10));
  return (
    <div className="flex items-center gap-6">
      <button onClick={dec}
        className="w-16 h-16 rounded-full bg-gray-800 text-white text-3xl font-light active:scale-90 transition-transform flex items-center justify-center">
        −
      </button>
      <div className="text-center min-w-[120px]">
        <span className="text-6xl font-bold text-white tabular-nums" style={{ color }}>
          {value % 1 === 0 ? value : value.toFixed(1)}
        </span>
        <span className="text-xl text-gray-400 ml-1">{suffix}</span>
      </div>
      <button onClick={inc}
        className="w-16 h-16 rounded-full text-white text-3xl font-light active:scale-90 transition-transform flex items-center justify-center"
        style={{ background: color }}>
        +
      </button>
    </div>
  );
}
