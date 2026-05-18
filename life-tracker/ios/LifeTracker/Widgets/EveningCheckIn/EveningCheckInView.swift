import SwiftUI
import ActivityKit
import WidgetKit

// Lock Screen Live Activity view for the evening check-in.
// This file belongs in both the main target and the Widget Extension target.

struct EveningCheckInLiveActivityView: View {
    let context: ActivityViewContext<EveningCheckInAttributes>
    private var state: EveningCheckInAttributes.ContentState { context.state }

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: state.currentStep.icon)
                    .foregroundStyle(.orange)
                Text(state.currentStep.title)
                    .font(.headline)
                Spacer()
                Text("\(stepIndex + 1)/\(totalSteps)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            // Value display
            Text(valueDisplay)
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)

            // Slider visual
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(.secondary.opacity(0.3))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(.orange)
                        .frame(width: geo.size.width * fillFraction, height: 8)
                }
            }
            .frame(height: 8)

            // Instructions
            Text(state.isComplete ? "Logged ✓" : "Swipe in app to adjust · Tap Done when ready")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var stepIndex: Int { state.currentStep.rawValue }
    private var totalSteps: Int { EveningCheckInAttributes.ContentState.CheckInStep.allCases.count }

    private var valueDisplay: String {
        switch state.currentStep {
        case .mood:   return "\(state.moodScore)/10"
        case .energy: return "\(state.energyScore)/10"
        case .stress: return "\(state.stressScore)/5"
        case .work:   return String(format: "%.1fh", state.hoursWorked)
        }
    }

    private var fillFraction: Double {
        switch state.currentStep {
        case .mood:   return Double(state.moodScore) / 10.0
        case .energy: return Double(state.energyScore) / 10.0
        case .stress: return Double(state.stressScore) / 5.0
        case .work:   return min(state.hoursWorked / 12.0, 1.0)
        }
    }
}

// MARK: - Dynamic Island Views

struct EveningCheckInIslandLeadingView: View {
    let context: ActivityViewContext<EveningCheckInAttributes>
    var body: some View {
        Image(systemName: context.state.currentStep.icon)
            .foregroundStyle(.orange)
    }
}

struct EveningCheckInIslandTrailingView: View {
    let context: ActivityViewContext<EveningCheckInAttributes>
    var body: some View {
        Text(islandValue)
            .font(.caption.bold())
            .foregroundStyle(.orange)
    }

    private var islandValue: String {
        let s = context.state
        switch s.currentStep {
        case .mood:   return "\(s.moodScore)"
        case .energy: return "\(s.energyScore)"
        case .stress: return "\(s.stressScore)"
        case .work:   return "\(Int(s.hoursWorked))h"
        }
    }
}
