import SwiftUI
import SwiftData

struct ContactsView: View {
    @Query(sort: \Contact.name) private var contacts: [Contact]
    @Environment(\.modelContext) private var context
    @State private var showAddContact = false

    private var overdue: [Contact] { contacts.filter(\.isOverdue).sorted { ($0.daysSinceContact ?? 0) > ($1.daysSinceContact ?? 0) } }
    private var current: [Contact] { contacts.filter { !$0.isOverdue } }

    var body: some View {
        NavigationStack {
            List {
                if !overdue.isEmpty {
                    Section("Reach Out") {
                        ForEach(overdue) { contact in
                            ContactRow(contact: contact)
                        }
                    }
                }
                if !current.isEmpty {
                    Section("All Good") {
                        ForEach(current) { contact in
                            ContactRow(contact: contact)
                        }
                    }
                }
            }
            .navigationTitle("People")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showAddContact = true } label: { Image(systemName: "plus") }
                }
            }
            .sheet(isPresented: $showAddContact) {
                AddContactSheet()
            }
            .overlay {
                if contacts.isEmpty {
                    ContentUnavailableView(
                        "No contacts tracked",
                        systemImage: "person.2",
                        description: Text("Add close friends and family to get nudged when you haven't been in touch.")
                    )
                }
            }
        }
    }
}

struct ContactRow: View {
    let contact: Contact
    @State private var showLogSheet = false

    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            Circle()
                .fill(contact.isOverdue ? .red.opacity(0.15) : .green.opacity(0.15))
                .frame(width: 44, height: 44)
                .overlay {
                    Text(contact.name.prefix(1).uppercased())
                        .font(.headline.bold())
                        .foregroundStyle(contact.isOverdue ? .red : .green)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(contact.name).font(.subheadline.bold())
                if let days = contact.daysSinceContact {
                    Text("\(days) days ago · \(contact.contactType.icon)")
                        .font(.caption)
                        .foregroundStyle(contact.isOverdue ? .red : .secondary)
                } else {
                    Text("Never logged")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Button {
                showLogSheet = true
            } label: {
                Image(systemName: "phone.fill")
                    .foregroundStyle(.blue)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
        .sheet(isPresented: $showLogSheet) {
            LogContactSheet(contact: contact)
        }
    }
}

struct LogContactSheet: View {
    let contact: Contact
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var medium: ContactMedium = .call
    @State private var notes = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("How did you connect?") {
                    Picker("Medium", selection: $medium) {
                        ForEach(ContactMedium.allCases, id: \.self) { m in
                            Label(m.rawValue.capitalized, systemImage: m.icon).tag(m)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                Section("Notes (optional)") {
                    TextEditor(text: $notes)
                        .frame(height: 80)
                }
            }
            .navigationTitle("Log Contact — \(contact.name)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        let log = ContactLog(medium: medium)
                        log.notes = notes.isEmpty ? nil : notes
                        log.contact = contact
                        contact.lastContactedAt = .now
                        contact.logs.append(log)
                        try? context.save()
                        dismiss()
                    }
                }
            }
        }
    }
}

struct AddContactSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var type: RelationshipType = .friend
    @State private var intervalDays = 14

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $name)
                    Picker("Relationship", selection: $type) {
                        ForEach(RelationshipType.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) }
                    }
                    Stepper("Touch base every \(intervalDays) days", value: $intervalDays, in: 1...90)
                }
            }
            .navigationTitle("Add Contact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Add") {
                        let c = Contact(name: name, relationshipType: type, targetIntervalDays: intervalDays)
                        context.insert(c)
                        try? context.save()
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
