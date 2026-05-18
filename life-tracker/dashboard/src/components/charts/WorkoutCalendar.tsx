"use client";
import { format, subDays, isSameDay, startOfWeek, addDays } from "date-fns";

// Mock workout dates — replace with CloudKit data
const workoutDays = Array.from({ length: 90 }, (_, i) => subDays(new Date(), i))
  .filter(() => Math.random() > 0.55);

const WEEKS = 13; // ~3 months

export function WorkoutCalendar() {
  const today = new Date();
  const startDate = subDays(startOfWeek(today), (WEEKS - 1) * 7);

  const weeks = Array.from({ length: WEEKS }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => addDays(startDate, wi * 7 + di))
  );

  const workoutsThisMonth = workoutDays.filter(d => {
    const cutoff = subDays(today, 30);
    return d >= cutoff && d <= today;
  }).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-white">🏋️ Workouts</h3>
          <p className="text-sm text-gray-400">Last 13 weeks</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{workoutsThisMonth}</div>
          <div className="text-xs text-gray-400">this month</div>
        </div>
      </div>

      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 flex-1">
            {week.map((day, di) => {
              const hasWorkout = workoutDays.some(d => isSameDay(d, day));
              const isToday = isSameDay(day, today);
              const isFuture = day > today;

              return (
                <div
                  key={di}
                  title={`${format(day, "MMM d")}${hasWorkout ? " — Workout" : ""}`}
                  className={`aspect-square rounded-sm ${
                    isFuture
                      ? "bg-gray-800/30"
                      : hasWorkout
                      ? "bg-green-500"
                      : isToday
                      ? "bg-orange-800/50 ring-1 ring-orange-500"
                      : "bg-gray-800"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <div className="w-3 h-3 rounded-sm bg-gray-800" /> No workout
        <div className="w-3 h-3 rounded-sm bg-green-500 ml-2" /> Workout
      </div>
    </div>
  );
}
