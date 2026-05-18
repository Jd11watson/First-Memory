import SwiftUI
import SwiftData

struct ChoresView: View {
    @Query(sort: \Chore.name) private var chores: [Chore]
    @Environment(\.modelContext) private var context
    @State private var showAddChore = false

    private var overdue: [Chore] { chores.filter(\.isOverdue) }
    private var upcoming: [Chore] {
        chores.filter { !$0.isOverdue && ($0.nextDueAt ?? .distantFuture) < Date().addingTimeInterval(86400 * 14) }
    }
    private var notDue: [Chore] { chores.filter { !$0.isOverdue && !upcoming.contains($0) } }

    var body: some View {
        NavigationStack {
            List {
                if !overdue.isEmpty {
                    Section("Overdue") {
                        ForEach(overdue) { chore in
                            ChoreRow(chore: chore)
                        }
                    }
                }
                if !upcoming.isEmpty {
                    Section("Due Soon (14 days)") {
                        ForEach(upcoming) { chore in
                            ChoreRow(chore: chore)
                        }
                    }
                }
                if !notDue.isEmpty {
                    Section("All Clear") {
                        ForEach(notDue) { chore in
                            ChoreRow(chore: chore)
                        }
                    }
                }
            }
            .navigationTitle("Chores & Maintenance")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showAddChore = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAddChore) {
                AddChoreSheet()
            }
            .overlay {
                if chores.isEmpty {
                    ContentUnavailableView(
                        "No chores tracked",
                        systemImage: "checkmark.circle",
                        description: Text("Add recurring chores and maintenance tasks to stay on top of things.")
                    )
                }
            }
        }
    }
}

struct ChoreRow: View {
    @Bindable var chore: Chore
    @Environment(\.modelContext) private var context

    var body: some View {
        HStack(spacing: 12) {
            // Status indicator
            Circle()
                .fill(statusColor)
                .frame(width: 10, height: 10)

            VStack(alignment: .leading, spacing: 2) {
                Text(chore.name)
                    .font(.subheadline.bold())
                HStack(spacing: 4) {
                    Text(chore.area.displayName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if let overdue = chore.daysOverdue {
                        Text("· \(overdue)d overdue")
                            .font(.caption)
                            .foregroundStyle(.red)
                    } else if let due = chore.nextDueAt {
                        Text("· Due \(due.formatted(.relative(presentation: .named)))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            Button {
                markComplete()
            } label: {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.green)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
    }

    private var statusColor: Color {
        if chore.isOverdue { return .red }
        if let due = chore.nextDueAt, due < Date().addingTimeInterval(86400 * 7) { return .orange }
        return .green
    }

    private func markComplete() {
        let completion = ChoreCompletion()
        chore.lastCompletedAt = .now
        chore.completions.append(completion)
        try? context.save()
    }
}

struct AddChoreSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var area: ChoreArea = .general
    @State private var intervalDays = 30

    let presets: [(name: String, area: ChoreArea, days: Int)] = [
        ("Change AC Filter", .general, 90),
        ("Clean Fridge", .kitchen, 30),
        ("Clean Bathrooms", .bathroom, 14),
        ("Mow Lawn", .yard, 7),
        ("Oil Change", .car, 90),
        ("Vacuum", .livingRoom, 7),
        ("Clean Garage", .garage, 90),
    ]

    var body: some View {
        NavigationStack {
            Form {
                Section("Presets") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(presets, id: \.name) { preset in
                                Button(preset.name) {
                                    name = preset.name
                                    area = preset.area
                                    intervalDays = preset.days
                                }
                                .buttonStyle(.bordered)
                                .font(.caption)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                }

                Section("Details") {
                    TextField("Chore name", text: $name)
                    Picker("Area", selection: $area) {
                        ForEach(ChoreArea.allCases, id: \.self) { Text($0.displayName).tag($0) }
                    }
                    Stepper("Every \(intervalDays) days", value: $intervalDays, in: 1...365, step: 1)
                }
            }
            .navigationTitle("Add Chore")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Add") {
                        let chore = Chore(name: name, area: area, intervalDays: intervalDays)
                        context.insert(chore)
                        try? context.save()
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
