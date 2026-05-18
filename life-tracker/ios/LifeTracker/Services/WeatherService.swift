import Foundation
import CoreLocation

// Open-Meteo — free, no API key required
// Docs: https://open-meteo.com/en/docs

struct WeatherService {
    static func fetchWeather(latitude: Double, longitude: Double, date: Date) async -> WeatherResult? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let dateStr = formatter.string(from: date)

        var components = URLComponents(string: "https://api.open-meteo.com/v1/forecast")!
        components.queryItems = [
            .init(name: "latitude", value: String(latitude)),
            .init(name: "longitude", value: String(longitude)),
            .init(name: "daily", value: "temperature_2m_max,temperature_2m_min,weathercode"),
            .init(name: "temperature_unit", value: "fahrenheit"),
            .init(name: "timezone", value: TimeZone.current.identifier),
            .init(name: "start_date", value: dateStr),
            .init(name: "end_date", value: dateStr),
        ]

        guard let url = components.url,
              let (data, _) = try? await URLSession.shared.data(from: url),
              let response = try? JSONDecoder().decode(OpenMeteoResponse.self, from: data),
              let high = response.daily.temperature2mMax.first,
              let low = response.daily.temperature2mMin.first,
              let code = response.daily.weathercode.first
        else { return nil }

        return WeatherResult(
            tempHighF: high,
            tempLowF: low,
            condition: weatherCodeDescription(code)
        )
    }

    private static func weatherCodeDescription(_ code: Int) -> String {
        switch code {
        case 0: return "Clear"
        case 1...3: return "Partly Cloudy"
        case 45, 48: return "Foggy"
        case 51...67: return "Rainy"
        case 71...77: return "Snowy"
        case 80...82: return "Showers"
        case 85, 86: return "Snow Showers"
        case 95: return "Thunderstorm"
        case 96, 99: return "Severe Thunderstorm"
        default: return "Unknown"
        }
    }
}

struct WeatherResult {
    var tempHighF: Double
    var tempLowF: Double
    var condition: String
}

private struct OpenMeteoResponse: Decodable {
    let daily: DailyData
    struct DailyData: Decodable {
        let temperature2mMax: [Double]
        let temperature2mMin: [Double]
        let weathercode: [Int]
        enum CodingKeys: String, CodingKey {
            case temperature2mMax = "temperature_2m_max"
            case temperature2mMin = "temperature_2m_min"
            case weathercode
        }
    }
}
