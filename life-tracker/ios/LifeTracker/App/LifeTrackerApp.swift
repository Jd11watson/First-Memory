import SwiftUI
import SwiftData
import HealthKit
import BackgroundTasks

@main
struct LifeTrackerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            DailyLog.self,
            Workout.self,
            Contact.self,
            ContactLog.self,
            Chore.self,
            ChoreCompletion.self,
            Venue.self,
            VenueVisit.self,
            SpiritualityLog.self,
            SpendingLog.self,
            Insight.self,
            AppSettings.self,
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false, cloudKitDatabase: .automatic)
        do {
            return try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(sharedModelContainer)
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        registerBackgroundTasks()
        NotificationService.shared.requestPermissions()
        NotificationService.shared.scheduleEveningPrompt()
        return true
    }

    private func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.lifetracker.healthsync", using: nil) { task in
            guard let refreshTask = task as? BGAppRefreshTask else { return }
            Task {
                await HealthKitService.shared.syncLatestData()
                refreshTask.setTaskCompleted(success: true)
            }
        }
    }
}
