import SwiftUI
import SwiftData
import HealthKit

struct OnboardingView: View {
    @Environment(\.modelContext) private var context
    @Binding var isComplete: Bool

    @State private var page = 0
    @State private var userName = ""
    @State private var promptHour = 21
    @State private var promptMinute = 0
    @State private var selectedFriends: [String] = []
    @State private var newFriendName = ""
    @State private var healthKitGranted = false
    @State private var notifGranted = false

    private let pages = ["Welcome", "Your Name", "Permissions", "Close Friends", "Evening Prompt"]

    var body: some View {
        TabView(selection: $page) {
            // Page 0: Welcome
            OnboardingPage(
                icon: "chart.line.uptrend.xyaxis",
                iconColor: .orange,
                title: "Life Tracker",
                subtitle: "Understand what you do to the nth degree.\nYour phone already knows a lot — let's make it meaningful.",
                page: 0, current: $page
            )
            .tag(0)

            // Page 1: Name
            VStack(spacing: 32) {
                OnboardingHeader(icon: "person.fill", color: .blue, title: "What should we call you?")
                TextField("Your name", text: $userName)
                    .font(.title2)
                    .multilineTextAlignment(.center)
                    .textFieldStyle(.roundedBorder)
                    .padding(.horizontal, 48)
                Spacer()
                NextButton(page: $page, isEnabled: !userName.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
            .tag(1)

            // Page 2: Permissions
            VStack(spacing: 24) {
                OnboardingHeader(icon: "lock.shield.fill", color: .green, title: "Grant Access")
                Text("Your data never leaves your device. We only read from Apple's built-in frameworks.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                PermissionRow(
                    icon: "heart.fill", color: .red,
                    title: "Apple Health",
                    subtitle: "Sleep, heart rate, workouts, steps",
                    isGranted: healthKitGranted
                ) {
                    Task {
                        try? await HealthKitService.shared.requestPermissions()
                        healthKitGranted = HealthKitService.shared.isAuthorized
                    }
                }

                PermissionRow(
                    icon: "bell.fill", color: .orange,
                    title: "Notifications",
                    subtitle: "Evening check-in prompt at your chosen time",
                    isGranted: notifGranted
                ) {
                    NotificationService.shared.requestPermissions()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1) { notifGranted = true }
                }

                Spacer()
                NextButton(page: $page, isEnabled: true, label: healthKitGranted ? "Next" : "Skip for now")
            }
            .padding()
            .tag(2)

            // Page 3: Close Friends
            VStack(spacing: 16) {
                OnboardingHeader(icon: "person.2.fill", color: .purple, title: "Close Friends")
                Text("Add people you want to stay in touch with. You'll get nudged when too much time has passed.")
                    .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)

                HStack {
                    TextField("Friend's name", text: $newFriendName)
                        .textFieldStyle(.roundedBorder)
                    Button {
                        let name = newFriendName.trimmingCharacters(in: .whitespaces)
                        if !name.isEmpty { selectedFriends.append(name); newFriendName = "" }
                    } label: {
                        Image(systemName: "plus.circle.fill").font(.title2)
                    }
                    .disabled(newFriendName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal)

                List {
                    ForEach(selectedFriends, id: \.self) { name in
                        Label(name, systemImage: "person.fill")
                    }
                    .onDelete { selectedFriends.remove(atOffsets: $0) }
                }
                .listStyle(.plain)

                NextButton(page: $page, isEnabled: true, label: selectedFriends.isEmpty ? "Skip" : "Next")
            }
            .padding(.top)
            .tag(3)

            // Page 4: Evening Prompt Time
            VStack(spacing: 24) {
                OnboardingHeader(icon: "moon.stars.fill", color: .indigo, title: "Evening Check-In")
                Text("Pick a time when you'll have 30 seconds to reflect on your day.")
                    .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)

                DatePicker("", selection: Binding(
                    get: { timeFromComponents() },
                    set: { updateComponents(from: $0) }
                ), displayedComponents: .hourAndMinute)
                .datePickerStyle(.wheel)
                .labelsHidden()

                Spacer()

                Button("Get Started") {
                    finishOnboarding()
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                .controlSize(.large)
                .padding(.horizontal)
            }
            .padding()
            .tag(4)
        }
        .tabViewStyle(.page(indexDisplayMode: .always))
        .indexViewStyle(.page(backgroundDisplayMode: .always))
        .animation(.easeInOut, value: page)
    }

    private func timeFromComponents() -> Date {
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: .now)
        comps.hour = promptHour; comps.minute = promptMinute
        return Calendar.current.date(from: comps) ?? .now
    }

    private func updateComponents(from date: Date) {
        promptHour = Calendar.current.component(.hour, from: date)
        promptMinute = Calendar.current.component(.minute, from: date)
    }

    private func finishOnboarding() {
        let settings = AppSettings(userName: userName, eveningPromptHour: promptHour, eveningPromptMinute: promptMinute)
        context.insert(settings)

        for name in selectedFriends {
            let contact = Contact(name: name, relationshipType: .friend)
            context.insert(contact)
        }

        NotificationService.shared.scheduleEveningPrompt(hour: promptHour, minute: promptMinute)
        try? context.save()
        isComplete = true
    }
}

// MARK: - Supporting Components

struct OnboardingPage: View {
    let icon: String, iconColor: Color, title: String, subtitle: String
    let page: Int
    @Binding var current: Int

    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            Image(systemName: icon)
                .font(.system(size: 80))
                .foregroundStyle(iconColor)
                .symbolEffect(.pulse)
            Text(title).font(.largeTitle.bold())
            Text(subtitle).font(.body).foregroundStyle(.secondary).multilineTextAlignment(.center).padding(.horizontal)
            Spacer()
            NextButton(page: $current, isEnabled: true, label: "Get Started")
        }
        .padding()
    }
}

struct OnboardingHeader: View {
    let icon: String, color: Color, title: String
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 52)).foregroundStyle(color)
            Text(title).font(.title.bold())
        }
    }
}

struct PermissionRow: View {
    let icon: String, color: Color, title: String, subtitle: String
    let isGranted: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon).font(.title2).foregroundStyle(color).frame(width: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.headline)
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: isGranted ? "checkmark.circle.fill" : "chevron.right")
                    .foregroundStyle(isGranted ? .green : .secondary)
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
        .disabled(isGranted)
    }
}

struct NextButton: View {
    @Binding var page: Int
    let isEnabled: Bool
    var label: String = "Next"

    var body: some View {
        Button(label) { page += 1 }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
            .controlSize(.large)
            .disabled(!isEnabled)
            .frame(maxWidth: .infinity)
            .padding(.horizontal)
    }
}
