import Foundation
import HealthKit
import SwiftData

@MainActor
final class HealthKitService: ObservableObject {
    static let shared = HealthKitService()
    private let store = HKHealthStore()
    @Published var isAuthorized = false

    private init() {}

    // MARK: - Permissions

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        let quantityTypes: [HKQuantityTypeIdentifier] = [
            .heartRate,
            .restingHeartRate,
            .heartRateVariabilitySDNN,
            .stepCount,
            .activeEnergyBurned,
            .appleExerciseTime,
        ]
        for id in quantityTypes {
            types.insert(HKQuantityType(id))
        }
        types.insert(HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!)
        types.insert(HKObjectType.workoutType())
        return types
    }

    func requestPermissions() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        try await store.requestAuthorization(toShare: [], read: readTypes)
        isAuthorized = true
    }

    // MARK: - Sync Entry Point

    func syncLatestData() async {
        let today = Calendar.current.startOfDay(for: .now)
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
        await syncDay(yesterday)
        await syncDay(today)
    }

    func syncDay(_ date: Date) async {
        async let sleep = fetchSleep(for: date)
        async let rhr = fetchRestingHR(for: date)
        async let hrv = fetchHRV(for: date)
        async let steps = fetchSteps(for: date)
        async let calories = fetchActiveCalories(for: date)

        let (sleepData, rhrValue, hrvValue, stepCount, calCount) = await (sleep, rhr, hrv, steps, calories)

        // Update DailyLog via SwiftData on main actor
        // Caller should ensure model context is available; here we emit via NotificationCenter
        // for the view layer to pick up and persist.
        let payload = HealthSyncPayload(
            date: date,
            sleepStart: sleepData?.start,
            sleepEnd: sleepData?.end,
            sleepMinutes: sleepData?.minutes,
            sleepStagesREM: sleepData?.remMinutes,
            sleepStagesDeep: sleepData?.deepMinutes,
            restingHR: rhrValue,
            hrv: hrvValue,
            steps: stepCount,
            activeCalories: calCount
        )
        NotificationCenter.default.post(name: .healthDataSynced, object: payload)
    }

    // MARK: - Sleep

    struct SleepData {
        var start: Date, end: Date, minutes: Int
        var remMinutes: Int?, deepMinutes: Int?
    }

    func fetchSleep(for date: Date) async -> SleepData? {
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        let (start, end) = dayBounds(for: date, offsetHours: -6) // look back 6h for previous night
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                guard let samples = samples as? [HKCategorySample], !samples.isEmpty else {
                    continuation.resume(returning: nil)
                    return
                }
                let asleep = samples.filter { $0.value != HKCategoryValueSleepAnalysis.awake.rawValue }
                guard let first = asleep.first, let last = asleep.last else {
                    continuation.resume(returning: nil)
                    return
                }
                let totalMinutes = asleep.reduce(0) { $0 + Int($1.endDate.timeIntervalSince($1.startDate) / 60) }
                let remMinutes = asleep
                    .filter { $0.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue }
                    .reduce(0) { $0 + Int($1.endDate.timeIntervalSince($1.startDate) / 60) }
                let deepMinutes = asleep
                    .filter { $0.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue }
                    .reduce(0) { $0 + Int($1.endDate.timeIntervalSince($1.startDate) / 60) }
                continuation.resume(returning: SleepData(
                    start: first.startDate,
                    end: last.endDate,
                    minutes: totalMinutes,
                    remMinutes: remMinutes > 0 ? remMinutes : nil,
                    deepMinutes: deepMinutes > 0 ? deepMinutes : nil
                ))
            }
            store.execute(query)
        }
    }

    // MARK: - Heart Rate

    func fetchRestingHR(for date: Date) async -> Double? {
        await fetchLatestQuantity(.restingHeartRate, for: date, unit: .count().unitDivided(by: .minute()))
    }

    func fetchHRV(for date: Date) async -> Double? {
        await fetchLatestQuantity(.heartRateVariabilitySDNN, for: date, unit: .secondUnit(with: .milli))
    }

    func fetchSteps(for date: Date) async -> Int? {
        guard let v = await fetchSumQuantity(.stepCount, for: date, unit: .count()) else { return nil }
        return Int(v)
    }

    func fetchActiveCalories(for date: Date) async -> Int? {
        guard let v = await fetchSumQuantity(.activeEnergyBurned, for: date, unit: .kilocalorie()) else { return nil }
        return Int(v)
    }

    // MARK: - Workouts

    func fetchRecentWorkouts(days: Int = 7) async -> [HKWorkout] {
        let start = Calendar.current.date(byAdding: .day, value: -days, to: .now)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: .now, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: 100, sortDescriptors: [sort]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }
    }

    // MARK: - Helpers

    private func dayBounds(for date: Date, offsetHours: Int = 0) -> (Date, Date) {
        let cal = Calendar.current
        let start = cal.date(byAdding: .hour, value: offsetHours, to: cal.startOfDay(for: date))!
        let end = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: date))!
        return (start, end)
    }

    private func fetchLatestQuantity(_ identifier: HKQuantityTypeIdentifier, for date: Date, unit: HKUnit) async -> Double? {
        let type = HKQuantityType(identifier)
        let (start, end) = dayBounds(for: date)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                guard let sample = (samples as? [HKQuantitySample])?.first else {
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: sample.quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func fetchSumQuantity(_ identifier: HKQuantityTypeIdentifier, for date: Date, unit: HKUnit) async -> Double? {
        let type = HKQuantityType(identifier)
        let (start, end) = dayBounds(for: date)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
                continuation.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }
}

// MARK: - Sync Payload

struct HealthSyncPayload {
    var date: Date
    var sleepStart: Date?
    var sleepEnd: Date?
    var sleepMinutes: Int?
    var sleepStagesREM: Int?
    var sleepStagesDeep: Int?
    var restingHR: Double?
    var hrv: Double?
    var steps: Int?
    var activeCalories: Int?
}

extension Notification.Name {
    static let healthDataSynced = Notification.Name("healthDataSynced")
}
