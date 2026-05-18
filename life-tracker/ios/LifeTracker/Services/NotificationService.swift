import UserNotifications
import ActivityKit

final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    func requestPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    // MARK: - Evening Prompt

    func scheduleEveningPrompt(hour: Int = 21, minute: Int = 0) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["evening-prompt"])

        let content = UNMutableNotificationContent()
        content.title = "Evening Check-in"
        content.body = "Swipe to log your day — takes 30 seconds."
        content.sound = .default
        content.userInfo = ["action": "evening-checkin"]

        var comps = DateComponents()
        comps.hour = hour
        comps.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
        let request = UNNotificationRequest(identifier: "evening-prompt", content: content, trigger: trigger)
        center.add(request)
    }

    // MARK: - Contact Nudge

    func scheduleContactNudge(contactName: String, daysSince: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Stay Connected"
        content.body = "It's been \(daysSince) days since you reached out to \(contactName)."
        content.sound = .default
        content.userInfo = ["action": "contact-nudge", "name": contactName]
        content.categoryIdentifier = "CONTACT_NUDGE"

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        let id = "contact-\(contactName.lowercased().replacingOccurrences(of: " ", with: "-"))"
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    // MARK: - Chore Reminder

    func scheduleChoreReminder(choreName: String, daysOverdue: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Chore Due"
        content.body = "\(choreName) is \(daysOverdue) day\(daysOverdue == 1 ? "" : "s") overdue."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        let id = "chore-\(choreName.lowercased().replacingOccurrences(of: " ", with: "-"))"
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    // MARK: - Live Activity (Evening Check-In)

    func startEveningCheckInActivity() {
        let attributes = EveningCheckInAttributes(userName: "")
        let state = EveningCheckInAttributes.ContentState()
        let content = ActivityContent(state: state, staleDate: .now.addingTimeInterval(3600 * 4))
        do {
            _ = try Activity<EveningCheckInAttributes>.request(
                attributes: attributes,
                content: content,
                pushType: nil
            )
        } catch {
            print("Failed to start Live Activity: \(error)")
        }
    }

    func endAllCheckInActivities() {
        Task {
            for activity in Activity<EveningCheckInAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
    }
}
