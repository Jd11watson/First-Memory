import ActivityKit
import Foundation

// MARK: - Evening Check-In Live Activity
// Appears on Lock Screen + Dynamic Island at 9pm.
// User swipes through mood/energy/stress sliders + enters hours worked.
// No keyboard required for mood/energy/stress (sliders); hours worked uses a stepper.

struct EveningCheckInAttributes: ActivityAttributes {
    public typealias Status = ContentState

    public struct ContentState: Codable, Hashable {
        var moodScore: Int = 5         // 1-10
        var energyScore: Int = 5       // 1-10
        var stressScore: Int = 3       // 1-5
        var hoursWorked: Double = 8.0
        var currentStep: CheckInStep = .mood
        var isComplete: Bool = false

        enum CheckInStep: Int, Codable, CaseIterable {
            case mood, energy, stress, work
            var title: String {
                switch self {
                case .mood: return "Mood"
                case .energy: return "Energy"
                case .stress: return "Stress"
                case .work: return "Hours Worked"
                }
            }
            var icon: String {
                switch self {
                case .mood: return "face.smiling"
                case .energy: return "bolt.fill"
                case .stress: return "waveform.path.ecg"
                case .work: return "clock.fill"
                }
            }
            var next: CheckInStep? {
                let all = CheckInStep.allCases
                guard let idx = all.firstIndex(of: self), idx + 1 < all.count else { return nil }
                return all[idx + 1]
            }
        }
    }

    var userName: String
}
