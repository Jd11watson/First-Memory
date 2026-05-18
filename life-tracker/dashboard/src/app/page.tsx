import { SleepChart } from "@/components/charts/SleepChart";
import { MoodChart } from "@/components/charts/MoodChart";
import { WorkoutCalendar } from "@/components/charts/WorkoutCalendar";
import { PhonePickupChart } from "@/components/charts/PhonePickupChart";
import { StatCard } from "@/components/ui/StatCard";
import { AlertsPanel } from "@/components/ui/AlertsPanel";

// In production: fetch from CloudKit Web Services using the user's iCloud credentials.
// For now: data is passed as props from a server component that reads the CloudKit API.
// CloudKit Web Services docs: https://developer.apple.com/documentation/cloudkitjs

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">Life Tracker</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="text-sm text-gray-500">Synced via iCloud</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Today at a glance */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Today at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard label="Sleep" value="7h 24m" icon="🌙" trend="+12m vs avg" trendUp />
            <StatCard label="Resting HR" value="58 bpm" icon="❤️" trend="-3 vs avg" trendUp />
            <StatCard label="HRV" value="42 ms" icon="📈" trend="+5 vs avg" trendUp />
            <StatCard label="Steps" value="8,241" icon="👟" trend="82% of goal" trendUp />
            <StatCard label="Pickups" value="47×" icon="📱" trend="-12 vs avg" trendUp />
            <StatCard label="First Touch" value="7:02 AM" icon="🌅" trend="On time" trendUp={false} />
          </div>
        </section>

        {/* Alerts */}
        <AlertsPanel />

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SleepChart />
          <MoodChart />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WorkoutCalendar />
          <PhonePickupChart />
        </div>
      </div>
    </main>
  );
}
