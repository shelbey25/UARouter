interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  precipitation: number
  visibility: number
  uvIndex: number
  feelsLike: number
  icon: string
  description: string
}

interface WeatherForecast {
  current: WeatherData
  hourly: Array<{
    time: string
    temperature: number
    condition: string
    precipitation: number
  }>
  alerts?: Array<{
    title: string
    description: string
    severity: "minor" | "moderate" | "severe" | "extreme"
  }>
}

export class WeatherService {
  private static readonly TUSCALOOSA_COORDS = {
    lat: 33.2098,
    lon: -87.5692,
  }

  // Using server-side API route
  static async getCurrentWeather(): Promise<WeatherData> {
    try {
      const response = await fetch("/api/weather?type=current")

      if (!response.ok) {
        throw new Error("Weather API request failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching weather data:", error)
      return this.getFallbackWeather()
    }
  }

  static async getWeatherForecast(): Promise<WeatherForecast> {
    try {
      const response = await fetch("/api/weather?type=forecast")

      if (!response.ok) {
        throw new Error("Forecast API request failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching weather forecast:", error)
      const fallbackWeather = this.getFallbackWeather()
      return {
        current: fallbackWeather,
        hourly: this.generateFallbackHourly(),
        alerts: [],
      }
    }
  }

  private static getFallbackWeather(): WeatherData {
    // Realistic fallback weather for Tuscaloosa
    const hour = new Date().getHours()
    const season = this.getCurrentSeason()

    let baseTemp = 70
    if (season === "winter") baseTemp = 45
    else if (season === "summer") baseTemp = 85
    else if (season === "fall") baseTemp = 65

    // Add some daily variation
    const tempVariation = Math.sin(((hour - 6) * Math.PI) / 12) * 15

    return {
      temperature: Math.round(baseTemp + tempVariation),
      condition: "Partly Cloudy",
      humidity: 60 + Math.random() * 20,
      windSpeed: 5 + Math.random() * 10,
      precipitation: 0,
      visibility: 10,
      uvIndex: Math.max(0, Math.round(Math.sin(((hour - 6) * Math.PI) / 12) * 8)),
      feelsLike: Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 5),
      icon: "02d",
      description: "partly cloudy",
    }
  }

  private static generateFallbackHourly() {
    const hourly = []
    const currentHour = new Date().getHours()

    for (let i = 1; i <= 6; i++) {
      const hour = (currentHour + i) % 24
      const temp = 70 + Math.sin(((hour - 6) * Math.PI) / 12) * 10 + (Math.random() - 0.5) * 5

      hourly.push({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        }),
        temperature: Math.round(temp),
        condition: "Partly Cloudy",
        precipitation: 0,
      })
    }

    return hourly
  }

  private static getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return "spring"
    if (month >= 6 && month <= 8) return "summer"
    if (month >= 9 && month <= 11) return "fall"
    return "winter"
  }

  static getRouteRecommendation(weather: WeatherData): string {
    if (weather.condition.includes("Rain") || weather.condition.includes("Thunderstorm")) {
      return "Rainy conditions - consider Crimson Ride or covered walkways"
    }

    if (weather.temperature > 90) {
      return "Very hot - stay hydrated and use air-conditioned transportation"
    }

    if (weather.temperature < 32) {
      return "Freezing conditions - dress warmly and watch for ice"
    }

    if (weather.windSpeed > 20) {
      return "High winds - avoid biking and secure loose items"
    }

    if (weather.visibility < 2) {
      return "Low visibility - use well-lit routes and extra caution"
    }

    if (weather.temperature > 80 && weather.humidity > 80) {
      return "Hot and humid - take frequent breaks and stay hydrated"
    }

    if (weather.temperature < 40) {
      return "Cold weather - dress in layers and allow extra time"
    }

    return "Great weather for any transportation mode!"
  }

  static getTransportationImpact(weather: WeatherData) {
    return {
      walking: {
        speedMultiplier: this.getWalkingSpeedMultiplier(weather),
        recommendation: this.getWalkingRecommendation(weather),
      },
      biking: {
        speedMultiplier: this.getBikingSpeedMultiplier(weather),
        recommendation: this.getBikingRecommendation(weather),
        safety: this.getBikingSafety(weather),
      },
      bus: {
        reliability: this.getBusReliability(weather),
        recommendation: "Climate-controlled and weather-protected",
      },
      scooter: {
        availability: this.getScooterAvailability(weather),
        speedMultiplier: this.getScooterSpeedMultiplier(weather),
        recommendation: this.getScooterRecommendation(weather),
      },
    }
  }

  private static getWalkingSpeedMultiplier(weather: WeatherData): number {
    let multiplier = 1.0

    if (weather.condition.includes("Rain")) multiplier *= 0.8
    if (weather.temperature > 85) multiplier *= 0.9
    if (weather.temperature < 35) multiplier *= 0.85
    if (weather.windSpeed > 15) multiplier *= 0.95
    if (weather.visibility < 3) multiplier *= 0.9

    return multiplier
  }

  private static getWalkingRecommendation(weather: WeatherData): string {
    if (weather.condition.includes("Rain")) return "Bring umbrella and use covered walkways"
    if (weather.temperature > 85) return "Stay hydrated and use shaded paths"
    if (weather.temperature < 40) return "Dress warmly and watch for ice"
    return "Comfortable walking conditions"
  }

  private static getBikingSpeedMultiplier(weather: WeatherData): number {
    let multiplier = 1.0

    if (weather.condition.includes("Rain")) multiplier *= 0.6
    if (weather.windSpeed > 10) multiplier *= 0.85
    if (weather.temperature > 90) multiplier *= 0.9
    if (weather.visibility < 5) multiplier *= 0.8

    return multiplier
  }

  private static getBikingRecommendation(weather: WeatherData): string {
    if (weather.condition.includes("Rain")) return "Not recommended - slippery and dangerous"
    if (weather.windSpeed > 15) return "Strong winds - ride with caution"
    if (weather.visibility < 3) return "Low visibility - use lights and reflective gear"
    return "Good biking conditions"
  }

  private static getBikingSafety(weather: WeatherData): "high" | "medium" | "low" {
    if (weather.condition.includes("Rain") || weather.visibility < 2) return "low"
    if (weather.windSpeed > 15 || weather.visibility < 5) return "medium"
    return "high"
  }

  private static getBusReliability(weather: WeatherData): number {
    let reliability = 85

    if (weather.condition.includes("Thunderstorm")) reliability -= 15
    if (weather.condition.includes("Snow")) reliability -= 20
    if (weather.visibility < 1) reliability -= 10

    return Math.max(50, reliability)
  }

  private static getScooterAvailability(weather: WeatherData): number {
    if (weather.condition.includes("Rain") || weather.condition.includes("Snow")) return 20
    if (weather.windSpeed > 20) return 40
    if (weather.temperature < 32 || weather.temperature > 100) return 60
    return 90
  }

  private static getScooterSpeedMultiplier(weather: WeatherData): number {
    let multiplier = 1.0

    if (weather.condition.includes("Rain")) multiplier *= 0.5
    if (weather.windSpeed > 12) multiplier *= 0.8
    if (weather.visibility < 5) multiplier *= 0.9

    return multiplier
  }

  private static getScooterRecommendation(weather: WeatherData): string {
    if (weather.condition.includes("Rain")) return "Service suspended due to weather"
    if (weather.windSpeed > 15) return "High winds - ride with extreme caution"
    if (weather.temperature < 32) return "Cold weather may affect battery performance"
    return "Good scooter conditions"
  }
}
