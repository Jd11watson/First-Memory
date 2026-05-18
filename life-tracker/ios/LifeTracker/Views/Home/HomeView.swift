import SwiftUI
import SwiftData

struct HomeView: View {
    @Query(sort: \DailyLog.date, order: .reverse) private var logs: [DailyLog]
    @Query(sort: \Workout.startedAt, order: .reverse) private var workouts: [Workout]
    @Query private var contacts: [Contact]
    @Query private var chores: [Chore]
    @Query private var insights: [Insight]
    @Environment(\.modelContext) private var context

    @State private var showEveningCheckIn = false
    @State private var selectedTab: HomeTab = .today

    private var todayLog: DailyLog? { logs.first(where: { Calendar.current.isDateInToday($0.date) }) }
    private var overdueContacts: [Contact] { contacts.filter(\.isOverdue).sorted { ($0.daysSinceContact ?? 0) > ($1.daysSinceContact ?? 0) } }
    private var overdueChores: [Chore] { chores.filter(\.isOverdue).sorted { ($0.daysOverdue ?? 0) > ($1.daysOverdue ?? 0) } }
    private var unreadInsights: [Insight] { insights.filter { !$0.isRead } }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Today at a glance
                    TodaySummaryCard(log: todayLog)

                    // Passive stats from HealthKit
                    if let log = todayLog {
                        PassiveStatsRow(log: log)
                    }

                    // Alerts (overdue contacts, chores, unread insights)
                    if !overdueContacts.isEmpty || !overdueChores.isEmpty || !unreadInsights.isEmpty {
                        AlertsSection(
                            contacts: overdueContacts,
                            chores: overdueChores,
                            insights: unreadInsights
                        )
                    }

                    // Recent workouts (last 7 days)
                    WorkoutWeekView(workouts: workouts.filter { Calendar.current.isDate($0.startedAt, equalTo: .now, toGranularity: .weekOfYear) })
                }
                .padding()
            }
            .navigationTitle("Life Tracker")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Check In") {
                        showEveningCheckIn = true
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                }
            }
            .sheet(isPresented: $showEveningCheckIn) {
                EveningCheckInSheet(log: todayLog ?? createTodayLog())
            }
            .task {
                await syncPassiveData()
            }
        }
    }

    @discardableResult
    private func createTodayLog() -> DailyLog {
        let log = DailyLog(date: .now)
        context.insert(log)
        return log
    }

    private func syncPassiveData() async {
        do {
            try await HealthKitService.shared.requestPermissions()
            await HealthKitService.shared.syncDay(.now)
        } catch {
            print("HealthKit sync failed: \(error)")
        }
    }
}

enum HomeTab { case today, week, insights }

// MARK: - Today Summary Card

struct TodaySummaryCard: View {
    let log: DailyLog?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(Date.now.formatted(date: .complete, time: .omitted), systemImage: "calendar")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 16) {
                StatPill(icon: "face.smiling", value: log?.moodScore.map { "\($0)/10" } ?? "–", label: "Mood", color: .orange)
                StatPill(icon: "bolt.fill", value: log?.energyScore.map { "\($0)/10" } ?? "–", label: "Energy", color: .yellow)
                StatPill(icon: "clock.fill", value: log?.hoursWorked.map { String(format: "%.1fh", $0) } ?? "–", label: "Work", color: .blue)
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct StatPill: View {
    let icon: String, value: String, label: String, color: Color
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon).foregroundStyle(color)
            Text(value).font(.headline)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Passive Stats Row

struct PassiveStatsRow: View {
    let log: DailyLog

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                if let sleep = log.sleepMinutes {
                    PassiveStat(icon: "moon.fill", value: formatMinutes(sleep), label: "Sleep", color: .indigo)
                }
                if let hr = log.restingHR {
                    PassiveStat(icon: "heart.fill", value: "\(Int(hr)) bpm", label: "Resting HR", color: .red)
                }
                if let hrv = log.hrv {
                    PassiveStat(icon: "waveform.path.ecg", value: "\(Int(hrv)) ms", label: "HRV", color: .green)
                }
                if let steps = log.steps {
                    PassiveStat(icon: "figure.walk", value: steps.formatted(), label: "Steps", color: .teal)
                }
                if let pickups = log.phonePickups {
                    PassiveStat(icon: "iphone", value: "\(pickups)×", label: "Pickups", color: .purple)
                }
                if let firstPickup = log.firstPickupTime {
                    PassiveStat(icon: "sunrise.fill", value: firstPickup.formatted(date: .omitted, time: .shortened), label: "First Touch", color: .orange)
                }
                if let weather = log.weatherCondition, let high = log.tempHighF {
                    PassiveStat(icon: "thermometer.sun", value: "\(Int(high))°F", label: weather, color: .cyan)
                }
            }
            .padding(.horizontal)
        }
    }

    private func formatMinutes(_ mins: Int) -> String {
        "\(mins / 60)h \(mins % 60)m"
    }
}

struct PassiveStat: View {
    let icon: String, value: String, label: String, color: Color
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon).foregroundStyle(color).font(.title3)
            Text(value).font(.subheadline.bold())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Alerts Section

struct AlertsSection: View {
    let contacts: [Contact]
    let chores: [Chore]
    let insights: [Insight]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Needs Attention")
                .font(.headline)

            ForEach(contacts.prefix(3)) { contact in
                AlertRow(
                    icon: "person.fill",
                    color: .blue,
                    title: contact.name,
                    subtitle: "\(contact.daysSinceContact ?? 0) days since last contact"
                )
            }
            ForEach(chores.prefix(3)) { chore in
                AlertRow(
                    icon: "checkmark.circle",
                    color: .orange,
                    title: chore.name,
                    subtitle: "\(chore.daysOverdue ?? 0) days overdue"
                )
            }
            ForEach(insights.prefix(2)) { insight in
                AlertRow(
                    icon: "lightbulb.fill",
                    color: .yellow,
                    title: insight.title,
                    subtitle: insight.body
                )
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct AlertRow: View {
    let icon: String, color: Color, title: String, subtitle: String
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold())
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.tertiary).font(.caption)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Workout Week View

struct WorkoutWeekView: View {
    let workouts: [Workout]

    private var weekDays: [Date] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: .now)
        let weekday = cal.component(.weekday, from: today)
        let startOfWeek = cal.date(byAdding: .day, value: -(weekday - 1), to: today)!
        return (0..<7).compactMap { cal.date(byAdding: .day, value: $0, to: startOfWeek) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("This Week")
                .font(.headline)

            HStack(spacing: 8) {
                ForEach(weekDays, id: \.self) { day in
                    let hasWorkout = workouts.contains { Calendar.current.isDate($0.startedAt, inSameDayAs: day) }
                    let isToday = Calendar.current.isDateInToday(day)
                    VStack(spacing: 4) {
                        Text(day.formatted(.dateTime.weekday(.narrow)))
                            .font(.caption2)
                            .foregroundStyle(isToday ? .primary : .secondary)
                        Circle()
                            .fill(hasWorkout ? .green : (isToday ? .orange.opacity(0.3) : .secondary.opacity(0.2)))
                            .frame(width: 32, height: 32)
                            .overlay {
                                if hasWorkout {
                                    Image(systemName: "checkmark")
                                        .font(.caption.bold())
                                        .foregroundStyle(.white)
                                }
                            }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}
