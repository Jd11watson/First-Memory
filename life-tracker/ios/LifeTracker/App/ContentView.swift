import SwiftUI
import SwiftData

struct ContentView: View {
    @Query private var settings: [AppSettings]
    @State private var onboardingComplete = false

    private var hasCompletedOnboarding: Bool {
        settings.first?.hasCompletedOnboarding ?? false
    }

    var body: some View {
        if hasCompletedOnboarding || onboardingComplete {
            MainTabView()
        } else {
            OnboardingView(isComplete: $onboardingComplete)
                .onChange(of: onboardingComplete) { _, complete in
                    if complete, let s = settings.first {
                        s.hasCompletedOnboarding = true
                    }
                }
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Today", systemImage: "house.fill") }

            ChoresView()
                .tabItem { Label("Chores", systemImage: "checkmark.circle.fill") }

            ContactsView()
                .tabItem { Label("People", systemImage: "person.2.fill") }

            TrendsView()
                .tabItem { Label("Trends", systemImage: "chart.line.uptrend.xyaxis") }

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(.orange)
    }
}
