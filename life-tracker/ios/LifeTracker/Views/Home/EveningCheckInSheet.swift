import SwiftUI
import SwiftData

// Full-screen evening check-in presented as a sheet.
// Uses sliders and steppers — no keyboard required.

struct EveningCheckInSheet: View {
    @Bindable var log: DailyLog
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    @State private var step: CheckInStep = .mood
    @State private var hoursWorked: Double = 8.0

    enum CheckInStep: CaseIterable {
        case mood, energy, stress, work, done
        var title: String {
            switch self {
            case .mood: return "How was your mood today?"
            case .energy: return "How was your energy?"
            case .stress: return "How stressed were you?"
            case .work: return "How many hours did you work?"
            case .done: return "All logged!"
            }
        }
        var icon: String {
            switch self {
            case .mood: return "face.smiling.fill"
            case .energy: return "bolt.fill"
            case .stress: return "waveform.path.ecg"
            case .work: return "clock.fill"
            case .done: return "checkmark.circle.fill"
            }
        }
        var color: Color {
            switch self {
            case .mood: return .orange
            case .energy: return .yellow
            case .stress: return .red
            case .work: return .blue
            case .done: return .green
            }
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                // Progress
                ProgressView(value: Double(step == .done ? CheckInStep.allCases.count - 1 : step.rawIndex),
                             total: Double(CheckInStep.allCases.count - 2))
                    .tint(step.color)

                Spacer()

                // Icon + Question
                VStack(spacing: 16) {
                    Image(systemName: step.icon)
                        .font(.system(size: 60))
                        .foregroundStyle(step.color)
                        .symbolEffect(.bounce, value: step)

                    Text(step.title)
                        .font(.title2.bold())
                        .multilineTextAlignment(.center)
                }

                // Input control
                Group {
                    switch step {
                    case .mood:
                        ScoreSlider(value: Binding(
                            get: { Double(log.moodScore ?? 5) },
                            set: { log.moodScore = Int($0) }
                        ), range: 1...10, color: .orange)

                    case .energy:
                        ScoreSlider(value: Binding(
                            get: { Double(log.energyScore ?? 5) },
                            set: { log.energyScore = Int($0) }
                        ), range: 1...10, color: .yellow)

                    case .stress:
                        ScoreSlider(value: Binding(
                            get: { Double(log.stressScore ?? 3) },
                            set: { log.stressScore = Int($0) }
                        ), range: 1...5, color: .red)

                    case .work:
                        HoursWorkedPicker(hours: $hoursWorked)

                    case .done:
                        DoneCard()
                    }
                }
                .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                .animation(.spring(duration: 0.4), value: step)

                Spacer()

                // Navigation buttons
                HStack(spacing: 16) {
                    if step != .mood {
                        Button("Back") {
                            withAnimation { step = step.previous ?? .mood }
                        }
                        .buttonStyle(.bordered)
                    }

                    Button(step == .work ? "Finish" : (step == .done ? "Close" : "Next")) {
                        if step == .work {
                            log.hoursWorked = hoursWorked
                            try? context.save()
                            withAnimation { step = .done }
                        } else if step == .done {
                            dismiss()
                        } else {
                            withAnimation { step = step.next ?? .done }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(step.color)
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal)
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Skip") { dismiss() }
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct ScoreSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let color: Color

    var body: some View {
        VStack(spacing: 12) {
            Text("\(Int(value))")
                .font(.system(size: 72, weight: .bold, design: .rounded))
                .foregroundStyle(color)
                .contentTransition(.numericText())

            Slider(value: $value, in: range, step: 1)
                .tint(color)

            HStack {
                Text(range.lowerBound == 1 ? "Low" : "1")
                    .font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text(range.upperBound == 10 ? "High" : "\(Int(range.upperBound))")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal)
    }
}

struct HoursWorkedPicker: View {
    @Binding var hours: Double

    var body: some View {
        VStack(spacing: 12) {
            Text(String(format: "%.1f hrs", hours))
                .font(.system(size: 64, weight: .bold, design: .rounded))
                .foregroundStyle(.blue)
                .contentTransition(.numericText())

            Stepper("", value: $hours, in: 0...16, step: 0.5)
                .labelsHidden()
        }
    }
}

struct DoneCard: View {
    var body: some View {
        VStack(spacing: 8) {
            Text("Your day is logged.")
                .font(.headline)
            Text("Keep it up — the trends will start appearing after a few weeks.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

// MARK: - Step Helpers

extension EveningCheckInSheet.CheckInStep {
    var rawIndex: Int {
        Self.allCases.firstIndex(of: self) ?? 0
    }
    var next: Self? {
        let all = Self.allCases
        guard let idx = all.firstIndex(of: self), idx + 1 < all.count else { return nil }
        return all[idx + 1]
    }
    var previous: Self? {
        let all = Self.allCases
        guard let idx = all.firstIndex(of: self), idx > 0 else { return nil }
        return all[idx - 1]
    }
}
