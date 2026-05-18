import SwiftData
import Foundation
import CoreLocation

// MARK: - Daily Log (the catch-all for prompted + passive daily data)

@Model
final class DailyLog {
    var date: Date
    var hoursWorked: Double?
    var moodScore: Int?       // 1-10
    var energyScore: Int?     // 1-10
    var stressScore: Int?     // 1-5
    var notes: String?

    // Passive — auto-filled from HealthKit / DeviceActivity
    var phonePickups: Int?
    var firstPickupTime: Date?
    var screenTimeMinutes: Int?
    var sleepStart: Date?
    var sleepEnd: Date?
    var sleepMinutes: Int?
    var sleepStagesREM: Int?
    var sleepStagesDeep: Int?
    var restingHR: Double?
    var hrv: Double?
    var steps: Int?
    var activeCalories: Int?

    // Weather (auto-fetched from Open-Meteo)
    var weatherCondition: String?
    var tempHighF: Double?
    var tempLowF: Double?

    init(date: Date) {
        self.date = Calendar.current.startOfDay(for: date)
    }
}

// MARK: - Workouts

enum WorkoutType: String, Codable, CaseIterable {
    case run, walk, lift, yoga, swim, bike, hike, sport, other
    var displayName: String { rawValue.capitalized }
    var icon: String {
        switch self {
        case .run: return "figure.run"
        case .walk: return "figure.walk"
        case .lift: return "dumbbell"
        case .yoga: return "figure.yoga"
        case .swim: return "figure.pool.swim"
        case .bike: return "bicycle"
        case .hike: return "figure.hiking"
        case .sport: return "sportscourt"
        case .other: return "figure.strengthtraining.traditional"
        }
    }
}

enum DataSource: String, Codable {
    case manual, healthKit, appleWatch
}

@Model
final class Workout {
    var startedAt: Date
    var type: WorkoutType
    var durationMinutes: Int
    var source: DataSource
    var notes: String?
    var intensity: Int?    // 1-5
    var caloriesBurned: Int?
    var heartRateAvg: Double?
    var healthKitUUID: String?  // for deduplication

    init(startedAt: Date, type: WorkoutType, durationMinutes: Int, source: DataSource) {
        self.startedAt = startedAt
        self.type = type
        self.durationMinutes = durationMinutes
        self.source = source
    }
}

// MARK: - Contacts (Relationship Tracking)

enum RelationshipType: String, Codable, CaseIterable {
    case friend, family, colleague, mentor, other
}

enum ContactMedium: String, Codable, CaseIterable {
    case call, text, inPerson, video
    var icon: String {
        switch self {
        case .call: return "phone.fill"
        case .text: return "message.fill"
        case .inPerson: return "person.2.fill"
        case .video: return "video.fill"
        }
    }
}

@Model
final class Contact {
    var name: String
    var relationshipType: RelationshipType
    var targetIntervalDays: Int
    var lastContactedAt: Date?
    var notes: String?
    @Relationship(deleteRule: .cascade) var logs: [ContactLog] = []

    var daysSinceContact: Int? {
        guard let last = lastContactedAt else { return nil }
        return Calendar.current.dateComponents([.day], from: last, to: .now).day
    }

    var isOverdue: Bool {
        guard let days = daysSinceContact else { return false }
        return days >= targetIntervalDays
    }

    init(name: String, relationshipType: RelationshipType, targetIntervalDays: Int = 14) {
        self.name = name
        self.relationshipType = relationshipType
        self.targetIntervalDays = targetIntervalDays
    }
}

@Model
final class ContactLog {
    var contactedAt: Date
    var medium: ContactMedium
    var durationMinutes: Int?
    var notes: String?
    var contact: Contact?

    init(contactedAt: Date = .now, medium: ContactMedium) {
        self.contactedAt = contactedAt
        self.medium = medium
    }
}

// MARK: - Chores & Maintenance

enum ChoreArea: String, Codable, CaseIterable {
    case bedroom, bathroom, kitchen, livingRoom, garage, yard, car, appliance, general
    var displayName: String {
        switch self {
        case .livingRoom: return "Living Room"
        default: return rawValue.capitalized
        }
    }
}

@Model
final class Chore {
    var name: String
    var area: ChoreArea
    var intervalDays: Int
    var lastCompletedAt: Date?
    var notes: String?
    @Relationship(deleteRule: .cascade) var completions: [ChoreCompletion] = []

    var nextDueAt: Date? {
        guard let last = lastCompletedAt else { return nil }
        return Calendar.current.date(byAdding: .day, value: intervalDays, to: last)
    }

    var daysOverdue: Int? {
        guard let due = nextDueAt else { return nil }
        let days = Calendar.current.dateComponents([.day], from: due, to: .now).day ?? 0
        return days > 0 ? days : nil
    }

    var isOverdue: Bool { daysOverdue != nil }

    init(name: String, area: ChoreArea, intervalDays: Int) {
        self.name = name
        self.area = area
        self.intervalDays = intervalDays
    }
}

@Model
final class ChoreCompletion {
    var completedAt: Date
    var durationMinutes: Int?
    var notes: String?
    var chore: Chore?

    init(completedAt: Date = .now) {
        self.completedAt = completedAt
    }
}

// MARK: - Venues (Restaurants, Experiences)

enum VenueCategory: String, Codable, CaseIterable {
    case restaurant, cafe, bar, entertainment, fitness, travel, other
    var icon: String {
        switch self {
        case .restaurant: return "fork.knife"
        case .cafe: return "cup.and.saucer.fill"
        case .bar: return "wineglass.fill"
        case .entertainment: return "movieclapper.fill"
        case .fitness: return "dumbbell.fill"
        case .travel: return "airplane"
        case .other: return "mappin.fill"
        }
    }
}

enum Occasion: String, Codable, CaseIterable {
    case casual, dateNight, family, celebration, business, solo, friends
    var displayName: String {
        switch self {
        case .dateNight: return "Date Night"
        default: return rawValue.capitalized
        }
    }
}

@Model
final class Venue {
    var name: String
    var category: VenueCategory
    var address: String?
    var googlePlaceID: String?
    @Relationship(deleteRule: .cascade) var visits: [VenueVisit] = []

    var lastVisited: Date? { visits.sorted { $0.visitedAt > $1.visitedAt }.first?.visitedAt }
    var visitCount: Int { visits.count }
    var averageRating: Double? {
        let rated = visits.compactMap(\.rating)
        guard !rated.isEmpty else { return nil }
        return Double(rated.reduce(0, +)) / Double(rated.count)
    }

    init(name: String, category: VenueCategory) {
        self.name = name
        self.category = category
    }
}

@Model
final class VenueVisit {
    var visitedAt: Date
    var occasion: Occasion
    var rating: Int?       // 1-5
    var amountSpent: Double?
    var notes: String?
    var photoLocalPaths: [String] = []
    var venue: Venue?

    init(visitedAt: Date = .now, occasion: Occasion) {
        self.visitedAt = visitedAt
        self.occasion = occasion
    }
}

// MARK: - Spirituality

@Model
final class SpiritualityLog {
    var date: Date
    var attendedService: Bool
    var serviceType: String?   // church, small group, prayer, retreat, etc.
    var connectionScore: Int?  // 1-10
    var notes: String?

    init(date: Date, attendedService: Bool) {
        self.date = Calendar.current.startOfDay(for: date)
        self.attendedService = attendedService
    }
}

// MARK: - Finance (Manual, No Third-Party)

enum SpendCategory: String, Codable, CaseIterable {
    case food, entertainment, shopping, essentials, health, travel, giving, other
    var displayName: String { rawValue.capitalized }
}

@Model
final class SpendingLog {
    var weekOf: Date         // start of the week
    var estimatedSpend: Double
    var category: SpendCategory?
    var notes: String?
    var wasUnplanned: Bool

    init(weekOf: Date, estimatedSpend: Double) {
        self.weekOf = weekOf
        self.estimatedSpend = estimatedSpend
        self.wasUnplanned = false
    }
}

// MARK: - Insights (System-Generated)

enum InsightType: String, Codable {
    case anomaly, correlation, streak, nudge, weeklySummary
}

@Model
final class Insight {
    var generatedAt: Date
    var title: String
    var body: String
    var type: InsightType
    var isRead: Bool
    var categories: [String]   // which tracking categories this references

    init(title: String, body: String, type: InsightType, categories: [String] = []) {
        self.generatedAt = .now
        self.title = title
        self.body = body
        self.type = type
        self.isRead = false
        self.categories = categories
    }
}

// MARK: - App Settings

@Model
final class AppSettings {
    var eveningPromptHour: Int     // 0-23
    var eveningPromptMinute: Int   // 0-59
    var hasCompletedOnboarding: Bool
    var userName: String

    static var defaultSettings: AppSettings {
        AppSettings(userName: "", eveningPromptHour: 21, eveningPromptMinute: 0)
    }

    init(userName: String, eveningPromptHour: Int, eveningPromptMinute: Int) {
        self.userName = userName
        self.eveningPromptHour = eveningPromptHour
        self.eveningPromptMinute = eveningPromptMinute
        self.hasCompletedOnboarding = false
    }
}
