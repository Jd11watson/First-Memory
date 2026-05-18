// In production: fetch overdue contacts and chores from CloudKit

const mockAlerts = [
  { type: "contact", message: "You haven't called Jake in 18 days", icon: "👤", urgency: "high" },
  { type: "chore", message: "AC filter is 12 days overdue", icon: "✅", urgency: "high" },
  { type: "chore", message: "Clean fridge due in 3 days", icon: "✅", urgency: "medium" },
  { type: "insight", message: "Your sleep dropped 45min this week — shortest in 3 months", icon: "💡", urgency: "medium" },
];

export function AlertsPanel() {
  if (mockAlerts.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-300 mb-4">Needs Attention</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mockAlerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-4 rounded-xl border ${
              alert.urgency === "high"
                ? "bg-red-950/40 border-red-800/50"
                : "bg-gray-900 border-gray-800"
            }`}
          >
            <span className="text-xl">{alert.icon}</span>
            <p className="text-sm text-gray-200">{alert.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
