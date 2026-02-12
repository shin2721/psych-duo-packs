import SwiftUI
import WidgetKit

private let appGroupId = "group.com.shin27.psycle.expowidgets"
private let payloadKey = "psycle_widget_payload"
private let deepLinkUrl = URL(string: "psycle://quests")

private struct WidgetRecentDay: Decodable, Identifiable {
  let date: String
  let lessonsCompleted: Int
  let xp: Int

  var id: String {
    date
  }

  private enum CodingKeys: String, CodingKey {
    case date
    case lessonsCompleted
    case xp
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    date = try container.decodeIfPresent(String.self, forKey: .date) ?? ""
    lessonsCompleted = try container.decodeIfPresent(Int.self, forKey: .lessonsCompleted) ?? 0
    xp = try container.decodeIfPresent(Int.self, forKey: .xp) ?? 0
  }
}

private struct WidgetPayload: Decodable {
  let studyStreak: Int
  let todayLessons: Int
  let todayXP: Int
  let totalXP: Int
  let recentDays: [WidgetRecentDay]
  let updatedAtMs: Int

  static let empty = WidgetPayload(
    studyStreak: 0,
    todayLessons: 0,
    todayXP: 0,
    totalXP: 0,
    recentDays: [],
    updatedAtMs: 0
  )

  private enum CodingKeys: String, CodingKey {
    case studyStreak
    case todayLessons
    case todayXP
    case totalXP
    case recentDays
    case updatedAtMs
  }

  init(studyStreak: Int, todayLessons: Int, todayXP: Int, totalXP: Int, recentDays: [WidgetRecentDay], updatedAtMs: Int) {
    self.studyStreak = studyStreak
    self.todayLessons = todayLessons
    self.todayXP = todayXP
    self.totalXP = totalXP
    self.recentDays = recentDays
    self.updatedAtMs = updatedAtMs
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    studyStreak = try container.decodeIfPresent(Int.self, forKey: .studyStreak) ?? 0
    todayLessons = try container.decodeIfPresent(Int.self, forKey: .todayLessons) ?? 0
    todayXP = try container.decodeIfPresent(Int.self, forKey: .todayXP) ?? 0
    totalXP = try container.decodeIfPresent(Int.self, forKey: .totalXP) ?? 0
    recentDays = try container.decodeIfPresent([WidgetRecentDay].self, forKey: .recentDays) ?? []
    updatedAtMs = try container.decodeIfPresent(Int.self, forKey: .updatedAtMs) ?? 0
  }

  static func load() -> WidgetPayload {
    guard
      let defaults = UserDefaults(suiteName: appGroupId),
      let raw = defaults.string(forKey: payloadKey),
      let data = raw.data(using: .utf8),
      let decoded = try? JSONDecoder().decode(WidgetPayload.self, from: data)
    else {
      return .empty
    }

    return decoded
  }
}

private struct PsycleWidgetEntry: TimelineEntry {
  let date: Date
  let payload: WidgetPayload
}

private struct PsycleWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> PsycleWidgetEntry {
    PsycleWidgetEntry(date: Date(), payload: .empty)
  }

  func getSnapshot(in context: Context, completion: @escaping (PsycleWidgetEntry) -> Void) {
    completion(PsycleWidgetEntry(date: Date(), payload: WidgetPayload.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PsycleWidgetEntry>) -> Void) {
    let entry = PsycleWidgetEntry(date: Date(), payload: WidgetPayload.load())
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

private struct PsycleStreakWidgetView: View {
  let entry: PsycleWidgetProvider.Entry

  var body: some View {
    ZStack {
      LinearGradient(
        colors: [Color(red: 0.03, green: 0.08, blue: 0.18), Color(red: 0.02, green: 0.05, blue: 0.11)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )

      VStack(alignment: .leading, spacing: 8) {
        Text("Psycle")
          .font(.caption2)
          .foregroundColor(.white.opacity(0.75))

        Text("🔥 \(entry.payload.studyStreak)-day streak")
          .font(.system(size: 16, weight: .bold))
          .foregroundColor(.white)

        Text(entry.payload.todayLessons > 0 ? "Today: \(entry.payload.todayLessons) lessons" : "No lessons yet today")
          .font(.caption)
          .foregroundColor(.white.opacity(0.85))

        HStack(spacing: 4) {
          ForEach(recentDaysForChart()) { day in
            RoundedRectangle(cornerRadius: 2)
              .fill(day.lessonsCompleted > 0 ? Color(red: 0.66, green: 1.0, blue: 0.38) : Color.white.opacity(0.16))
              .frame(width: 10, height: 10)
          }
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .padding(12)
    }
    .widgetURL(deepLinkUrl)
  }

  private func recentDaysForChart() -> [WidgetRecentDay] {
    if entry.payload.recentDays.count <= 7 {
      return entry.payload.recentDays
    }

    return Array(entry.payload.recentDays.suffix(7))
  }
}

struct PsycleStreakWidget: Widget {
  let kind = "PsycleStreakWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PsycleWidgetProvider()) { entry in
      PsycleStreakWidgetView(entry: entry)
    }
    .configurationDisplayName("Psycle Streak")
    .description("Track your current streak and daily study progress.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
