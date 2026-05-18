import Foundation
import DeviceActivity
import FamilyControls
import ManagedSettings

// MARK: - DeviceActivity Service
// Tracks phone pickups, screen time, and per-app usage.
// Requires the Family Controls capability (entitlement: com.apple.developer.family-controls).
// For personal/TestFlight use: request authorization from AuthorizationCenter.shared.
// Apple does not require MDM enrollment for personal-device use.

@MainActor
final class DeviceActivityService: ObservableObject {
    static let shared = DeviceActivityService()
    @Published var isAuthorized = false

    private let center = AuthorizationCenter.shared
    private let activityName = DeviceActivityName("com.lifetracker.daily")

    private init() {}

    func requestAuthorization() async {
        do {
            try await center.requestAuthorization(for: .individual)
            isAuthorized = true
        } catch {
            print("DeviceActivity authorization failed: \(error)")
        }
    }

    // Fetch today's device pickup count from HealthKit
    // HealthKit stores "Apple Stand Hour" data but not direct pickup counts.
    // DeviceActivity provides pickup data via DeviceActivityReport extensions.
    // The report extension runs in a separate process; this service triggers data collection
    // and receives aggregated results via App Group shared storage.

    func startDailyMonitoring() {
        guard isAuthorized else { return }
        let monitor = DeviceActivityMonitor()
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )
        do {
            try monitor.startMonitoring(activityName, during: schedule)
        } catch {
            print("Failed to start DeviceActivity monitoring: \(error)")
        }
    }

    // Reads pickup count and total screen time from the shared App Group container.
    // The DeviceActivityReport extension writes aggregated data here.
    func readTodayStats() -> DeviceActivityStats? {
        guard let groupURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: "group.com.lifetracker"
        ) else { return nil }

        let statsURL = groupURL.appending(path: "devicestats.json")
        guard let data = try? Data(contentsOf: statsURL),
              let stats = try? JSONDecoder().decode(DeviceActivityStats.self, from: data)
        else { return nil }

        return stats
    }
}

struct DeviceActivityStats: Codable {
    var date: Date
    var pickupCount: Int
    var firstPickupTime: Date?
    var totalScreenTimeMinutes: Int
    var topApps: [AppUsage]
}

struct AppUsage: Codable {
    var bundleID: String
    var displayName: String
    var minutesUsed: Int
    var category: String?
}
