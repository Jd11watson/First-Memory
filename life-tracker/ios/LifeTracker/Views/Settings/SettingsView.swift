import SwiftUI
import SwiftData

struct SettingsView: View {
    @Query private var settingsList: [AppSettings]
    @Environment(\.modelContext) private var context

    private var settings: AppSettings {
        if let s = settingsList.first { return s }
        let s = AppSettings.defaultSettings
        context.insert(s)
        return s
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Profile") {
                    HStack {
                        Text("Name")
                        Spacer()
                        Text(settings.userName).foregroundStyle(.secondary)
                    }
                }

                Section("Evening Check-In") {
                    DatePicker(
                        "Prompt Time",
                        selection: Binding(
                            get: { timeFrom(hour: settings.eveningPromptHour, minute: settings.eveningPromptMinute) },
                            set: { date in
                                settings.eveningPromptHour = Calendar.current.component(.hour, from: date)
                                settings.eveningPromptMinute = Calendar.current.component(.minute, from: date)
                                NotificationService.shared.scheduleEveningPrompt(
                                    hour: settings.eveningPromptHour,
                                    minute: settings.eveningPromptMinute
                                )
                                try? context.save()
                            }
                        ),
                        displayedComponents: .hourAndMinute
                    )
                }

                Section("Integrations") {
                    NavigationLink("Apple Health") {
                        HealthPermissionsView()
                    }
                    NavigationLink("Screen Time (DeviceActivity)") {
                        DeviceActivityPermissionsView()
                    }
                }

                Section("Data") {
                    Button("Export All Data (JSON)") {
                        exportData()
                    }
                    Button("Reset Onboarding", role: .destructive) {
                        settings.hasCompletedOnboarding = false
                        try? context.save()
                    }
                }

                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0").foregroundStyle(.secondary)
                    }
                    HStack {
                        Text("Data Storage")
                        Spacer()
                        Text("On-Device + iCloud").foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }

    private func timeFrom(hour: Int, minute: Int) -> Date {
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: .now)
        comps.hour = hour; comps.minute = minute
        return Calendar.current.date(from: comps) ?? .now
    }

    private func exportData() {
        // Trigger JSON export of all SwiftData records to a shareable file
        // Implementation: serialize all models to JSON and present UIActivityViewController
    }
}

struct HealthPermissionsView: View {
    @ObservedObject var healthKit = HealthKitService.shared
    var body: some View {
        Form {
            Section {
                HStack {
                    Label("Apple Health", systemImage: "heart.fill")
                    Spacer()
                    Text(healthKit.isAuthorized ? "Connected" : "Not Connected")
                        .foregroundStyle(healthKit.isAuthorized ? .green : .secondary)
                }
            }
            if !healthKit.isAuthorized {
                Section {
                    Button("Grant Access") {
                        Task { try? await healthKit.requestPermissions() }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            Section("What We Read") {
                Label("Sleep stages & duration", systemImage: "moon.fill")
                Label("Resting heart rate", systemImage: "heart.fill")
                Label("Heart rate variability", systemImage: "waveform.path.ecg")
                Label("Steps & active calories", systemImage: "figure.walk")
                Label("Workouts", systemImage: "dumbbell.fill")
            }
        }
        .navigationTitle("Apple Health")
    }
}

struct DeviceActivityPermissionsView: View {
    @ObservedObject var deviceActivity = DeviceActivityService.shared
    var body: some View {
        Form {
            Section {
                HStack {
                    Label("Screen Time", systemImage: "iphone")
                    Spacer()
                    Text(deviceActivity.isAuthorized ? "Connected" : "Not Connected")
                        .foregroundStyle(deviceActivity.isAuthorized ? .green : .secondary)
                }
            }
            Section("About This Permission") {
                Text("Screen Time access uses Apple's Family Controls framework. This lets us read your daily phone pickup count and app usage time — no content is read, only usage duration.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if !deviceActivity.isAuthorized {
                Section {
                    Button("Grant Access") {
                        Task { await deviceActivity.requestAuthorization() }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
        .navigationTitle("Screen Time")
    }
}
