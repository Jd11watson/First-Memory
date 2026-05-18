import SwiftUI
import SwiftData
import Charts

struct TrendsView: View {
    @Query(sort: \DailyLog.date) private var logs: [DailyLog]
    @State private var selectedPeriod: Period = .month

    enum Period: String, CaseIterable {
        case week = "7D", month = "30D", quarter = "90D"
        var days: Int {
            switch self { case .week: return 7; case .month: return 30; case .quarter: return 90 }
        }
    }

    private var filteredLogs: [DailyLog] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -selectedPeriod.days, to: .now)!
        return logs.filter { $0.date >= cutoff }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Period selector
                    Picker("Period", selection: $selectedPeriod) {
                        ForEach(Period.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)

                    // Sleep trend
                    ChartCard(title: "Sleep", icon: "moon.fill", color: .indigo) {
                        Chart(filteredLogs.filter { $0.sleepMinutes != nil }) { log in
                            LineMark(
                                x: .value("Date", log.date, unit: .day),
                                y: .value("Hours", Double(log.sleepMinutes ?? 0) / 60.0)
                            )
                            .foregroundStyle(.indigo)
                            AreaMark(
                                x: .value("Date", log.date, unit: .day),
                                y: .value("Hours", Double(log.sleepMinutes ?? 0) / 60.0)
                            )
                            .foregroundStyle(.indigo.opacity(0.15))
                        }
                        .chartYScale(domain: 4...10)
                        .chartYAxis {
                            AxisMarks(values: [4, 6, 7, 8, 9]) { v in
                                AxisValueLabel { Text("\(v.as(Double.self).map { "\(Int($0))h" } ?? "")") }
                                AxisGridLine()
                            }
                        }
                        .frame(height: 120)
                    }

                    // Mood trend
                    ChartCard(title: "Mood", icon: "face.smiling", color: .orange) {
                        Chart(filteredLogs.filter { $0.moodScore != nil }) { log in
                            BarMark(
                                x: .value("Date", log.date, unit: .day),
                                y: .value("Mood", log.moodScore ?? 0)
                            )
                            .foregroundStyle(moodColor(log.moodScore ?? 5))
                        }
                        .chartYScale(domain: 0...10)
                        .frame(height: 100)
                    }

                    // Heart rate + HRV
                    ChartCard(title: "Heart Rate & HRV", icon: "heart.fill", color: .red) {
                        Chart {
                            ForEach(filteredLogs.filter { $0.restingHR != nil }) { log in
                                LineMark(
                                    x: .value("Date", log.date, unit: .day),
                                    y: .value("Resting HR", log.restingHR ?? 0),
                                    series: .value("Metric", "Resting HR")
                                )
                                .foregroundStyle(.red)
                            }
                            ForEach(filteredLogs.filter { $0.hrv != nil }) { log in
                                LineMark(
                                    x: .value("Date", log.date, unit: .day),
                                    y: .value("HRV", log.hrv ?? 0),
                                    series: .value("Metric", "HRV")
                                )
                                .foregroundStyle(.green)
                            }
                        }
                        .chartForegroundStyleScale(["Resting HR": .red, "HRV": .green])
                        .frame(height: 120)
                    }

                    // Hours worked
                    ChartCard(title: "Hours Worked", icon: "clock.fill", color: .blue) {
                        Chart(filteredLogs.filter { $0.hoursWorked != nil }) { log in
                            BarMark(
                                x: .value("Date", log.date, unit: .day),
                                y: .value("Hours", log.hoursWorked ?? 0)
                            )
                            .foregroundStyle(.blue)
                        }
                        .chartYScale(domain: 0...12)
                        .frame(height: 100)
                    }

                    // Phone pickups
                    if filteredLogs.contains(where: { $0.phonePickups != nil }) {
                        ChartCard(title: "Phone Pickups", icon: "iphone", color: .purple) {
                            Chart(filteredLogs.filter { $0.phonePickups != nil }) { log in
                                LineMark(
                                    x: .value("Date", log.date, unit: .day),
                                    y: .value("Pickups", log.phonePickups ?? 0)
                                )
                                .foregroundStyle(.purple)
                            }
                            .frame(height: 100)
                        }
                    }

                    // Summary stats
                    SummaryStatsGrid(logs: filteredLogs)
                }
                .padding(.bottom)
            }
            .navigationTitle("Trends")
        }
    }

    private func moodColor(_ score: Int) -> Color {
        switch score {
        case 8...10: return .green
        case 5...7: return .orange
        default: return .red
        }
    }
}

struct ChartCard<Content: View>: View {
    let title: String, icon: String, color: Color
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: icon)
                .font(.subheadline.bold())
                .foregroundStyle(color)
            content()
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }
}

struct SummaryStatsGrid: View {
    let logs: [DailyLog]

    private var avgSleep: Double? {
        let v = logs.compactMap(\.sleepMinutes)
        return v.isEmpty ? nil : Double(v.reduce(0, +)) / Double(v.count) / 60.0
    }
    private var avgMood: Double? {
        let v = logs.compactMap(\.moodScore)
        return v.isEmpty ? nil : Double(v.reduce(0, +)) / Double(v.count)
    }
    private var avgHours: Double? {
        let v = logs.compactMap(\.hoursWorked)
        return v.isEmpty ? nil : v.reduce(0, +) / Double(v.count)
    }
    private var avgPickups: Double? {
        let v = logs.compactMap(\.phonePickups)
        return v.isEmpty ? nil : Double(v.reduce(0, +)) / Double(v.count)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Averages").font(.headline).padding(.horizontal)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                if let s = avgSleep { SummaryCard(label: "Sleep", value: String(format: "%.1fh", s), icon: "moon.fill", color: .indigo) }
                if let m = avgMood { SummaryCard(label: "Mood", value: String(format: "%.1f/10", m), icon: "face.smiling", color: .orange) }
                if let h = avgHours { SummaryCard(label: "Work", value: String(format: "%.1fh", h), icon: "clock.fill", color: .blue) }
                if let p = avgPickups { SummaryCard(label: "Pickups", value: String(format: "%.0f/day", p), icon: "iphone", color: .purple) }
            }
            .padding(.horizontal)
        }
    }
}

struct SummaryCard: View {
    let label: String, value: String, icon: String, color: Color
    var body: some View {
        HStack {
            Image(systemName: icon).foregroundStyle(color)
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Text(value).font(.headline)
            }
            Spacer()
        }
        .padding(12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}
