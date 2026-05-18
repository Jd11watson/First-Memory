import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Mood Widget (Lock Screen accessory)
// accessoryRectangular: a rectangular slot below the clock on the Lock Screen.

struct MoodEntry: TimelineEntry {
    let date: Date
    let moodScore: Int?   // nil if not yet logged today
}

struct MoodWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> MoodEntry {
        MoodEntry(date: .now, moodScore: 7)
    }
    func getSnapshot(in context: Context, completion: @escaping (MoodEntry) -> Void) {
        completion(MoodEntry(date: .now, moodScore: nil))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<MoodEntry>) -> Void) {
        // In production: read today's DailyLog from SwiftData via App Group container
        let entry = MoodEntry(date: .now, moodScore: nil)
        let refresh = Calendar.current.date(byAdding: .minute, value: 15, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

struct MoodWidgetView: View {
    var entry: MoodEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryRectangular:
            HStack {
                Image(systemName: moodIcon)
                    .foregroundStyle(moodColor)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Mood")
                        .font(.caption2.uppercaseSmallCaps())
                        .foregroundStyle(.secondary)
                    if let score = entry.moodScore {
                        Text("\(score)/10")
                            .font(.headline)
                    } else {
                        Text("Tap to log")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }
        case .accessoryCircular:
            ZStack {
                if let score = entry.moodScore {
                    Gauge(value: Double(score), in: 1...10) {
                        Image(systemName: moodIcon)
                    }
                    .gaugeStyle(.accessoryCircularCapacity)
                    .tint(moodColor)
                } else {
                    Image(systemName: "face.smiling")
                        .foregroundStyle(.secondary)
                }
            }
        default:
            EmptyView()
        }
    }

    private var moodIcon: String {
        guard let score = entry.moodScore else { return "face.smiling" }
        switch score {
        case 8...10: return "face.smiling.fill"
        case 5...7:  return "face.smiling"
        default:     return "face.dashed"
        }
    }

    private var moodColor: Color {
        guard let score = entry.moodScore else { return .secondary }
        switch score {
        case 8...10: return .green
        case 5...7:  return .yellow
        default:     return .red
        }
    }
}

struct MoodWidget: Widget {
    let kind = "MoodWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MoodWidgetProvider()) { entry in
            MoodWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Mood")
        .description("Log and view your daily mood score.")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular])
    }
}

// MARK: - Workout Toggle Widget (interactive, iOS 17+)

struct LogWorkoutIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Workout"
    static var description = IntentDescription("Mark that you worked out today.")

    func perform() async throws -> some IntentResult {
        // Write a workout entry to SwiftData via App Group shared container
        let defaults = UserDefaults(suiteName: "group.com.lifetracker")
        defaults?.set(true, forKey: "workedOutToday-\(todayKey)")
        return .result()
    }

    private var todayKey: String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        return fmt.string(from: .now)
    }
}

struct WorkoutEntry: TimelineEntry {
    let date: Date
    let workedOutToday: Bool
}

struct WorkoutWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> WorkoutEntry { WorkoutEntry(date: .now, workedOutToday: false) }
    func getSnapshot(in context: Context, completion: @escaping (WorkoutEntry) -> Void) {
        completion(WorkoutEntry(date: .now, workedOutToday: false))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<WorkoutEntry>) -> Void) {
        let fmt = DateFormatter(); fmt.dateFormat = "yyyy-MM-dd"
        let key = "workedOutToday-\(fmt.string(from: .now))"
        let worked = UserDefaults(suiteName: "group.com.lifetracker")?.bool(forKey: key) ?? false
        let entry = WorkoutEntry(date: .now, workedOutToday: worked)
        let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

struct WorkoutWidgetView: View {
    var entry: WorkoutEntry

    var body: some View {
        Button(intent: LogWorkoutIntent()) {
            HStack {
                Image(systemName: entry.workedOutToday ? "checkmark.circle.fill" : "dumbbell")
                    .foregroundStyle(entry.workedOutToday ? .green : .secondary)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Workout")
                        .font(.caption2.uppercaseSmallCaps())
                        .foregroundStyle(.secondary)
                    Text(entry.workedOutToday ? "Done today ✓" : "Tap to log")
                        .font(.caption.bold())
                        .foregroundStyle(entry.workedOutToday ? .green : .primary)
                }
                Spacer()
            }
        }
        .buttonStyle(.plain)
    }
}

struct WorkoutWidget: Widget {
    let kind = "WorkoutWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WorkoutWidgetProvider()) { entry in
            WorkoutWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Workout Log")
        .description("Tap to mark that you worked out today.")
        .supportedFamilies([.accessoryRectangular])
    }
}
