import { UserPreferencesService, type UserPreferences } from "./user-preferences"
import { WeatherService } from "./weather-service"
import { TransportationCalculator } from "./transportation-calculator"

interface RouteHistory {
  from: string
  to: string
  mode: string
  timestamp: Date
  duration: number
  weather: string
  satisfaction?: number // 1-5 rating
}

interface SmartRecommendation {
  type: "route" | "timing" | "mode" | "weather" | "location"
  title: string
  description: string
  action?: string
  priority: "high" | "medium" | "low"
  icon: string
  data?: any
}

interface ContextualFactors {
  timeOfDay: "morning" | "afternoon" | "evening" | "night"
  dayOfWeek: "weekday" | "weekend"
  weather: any
  campusEvents?: string[]
  busyLocations?: string[]
}

export class RecommendationsEngine {
  private static readonly HISTORY_KEY = "tide-routes-history"
  private static readonly MAX_HISTORY = 100

  static getRouteHistory(): RouteHistory[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.HISTORY_KEY)
      if (stored) {
        const history = JSON.parse(stored)
        return history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
      }
    } catch (error) {
      console.error("Error loading route history:", error)
    }

    return []
  }

  static addToHistory(route: Omit<RouteHistory, "timestamp">): void {
    if (typeof window === "undefined") return

    try {
      const history = this.getRouteHistory()
      const newEntry: RouteHistory = {
        ...route,
        timestamp: new Date(),
      }

      history.unshift(newEntry)

      // Keep only the most recent entries
      const trimmedHistory = history.slice(0, this.MAX_HISTORY)

      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmedHistory))
    } catch (error) {
      console.error("Error saving route history:", error)
    }
  }

  static async generateRecommendations(preferences: UserPreferences): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = []
    const history = this.getRouteHistory()
    const context = await this.getContextualFactors()

    // Weather-based recommendations
    const weatherRecs = this.getWeatherRecommendations(context.weather, preferences)
    recommendations.push(...weatherRecs)

    // Time-based recommendations
    const timeRecs = this.getTimeBasedRecommendations(context, history, preferences)
    recommendations.push(...timeRecs)

    // Usage pattern recommendations
    const patternRecs = this.getUsagePatternRecommendations(history, preferences)
    recommendations.push(...patternRecs)

    // Preference optimization recommendations
    const optimizationRecs = this.getOptimizationRecommendations(preferences, history)
    recommendations.push(...optimizationRecs)

    // Location-based recommendations
    const locationRecs = this.getLocationRecommendations(history, preferences)
    recommendations.push(...locationRecs)

    // Sort by priority and return top recommendations
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 8)
  }

  private static async getContextualFactors(): Promise<ContextualFactors> {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    let timeOfDay: ContextualFactors["timeOfDay"]
    if (hour >= 6 && hour < 12) timeOfDay = "morning"
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon"
    else if (hour >= 17 && hour < 22) timeOfDay = "evening"
    else timeOfDay = "night"

    const weather = await WeatherService.getCurrentWeather()

    return {
      timeOfDay,
      dayOfWeek: dayOfWeek === 0 || dayOfWeek === 6 ? "weekend" : "weekday",
      weather,
      campusEvents: this.getMockCampusEvents(),
      busyLocations: this.getMockBusyLocations(timeOfDay),
    }
  }

  private static getWeatherRecommendations(weather: any, preferences: UserPreferences): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []

    if (weather.condition.includes("Rain")) {
      recommendations.push({
        type: "weather",
        title: "Rainy Weather Alert",
        description: "Consider using Crimson Ride or covered walkways today",
        priority: "high",
        icon: "🌧️",
        action: "View covered routes",
      })
    }

    if (weather.temperature > 85 && preferences.preferredModes.includes("walking")) {
      recommendations.push({
        type: "weather",
        title: "Hot Weather Advisory",
        description: `It's ${weather.temperature}°F outside. Stay hydrated and consider air-conditioned transportation`,
        priority: "medium",
        icon: "🌡️",
        action: "See cooler alternatives",
      })
    }

    if (weather.temperature < 35 && preferences.preferredModes.includes("bike")) {
      recommendations.push({
        type: "weather",
        title: "Cold Weather Notice",
        description: "Freezing temperatures may affect biking comfort and scooter battery life",
        priority: "medium",
        icon: "❄️",
        action: "View indoor alternatives",
      })
    }

    if (weather.windSpeed > 15) {
      recommendations.push({
        type: "weather",
        title: "High Wind Warning",
        description: `${weather.windSpeed} mph winds detected. Biking and scooters may be affected`,
        priority: "medium",
        icon: "💨",
        action: "Check wind-protected routes",
      })
    }

    return recommendations
  }

  private static getTimeBasedRecommendations(
    context: ContextualFactors,
    history: RouteHistory[],
    preferences: UserPreferences,
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []

    // Peak hours recommendation
    if (context.timeOfDay === "morning" && new Date().getHours() >= 8 && new Date().getHours() <= 10) {
      recommendations.push({
        type: "timing",
        title: "Peak Hours Alert",
        description: "Campus is busy right now. Allow extra time for bus routes",
        priority: "medium",
        icon: "⏰",
        action: "See alternative times",
      })
    }

    // Evening safety recommendation
    if (context.timeOfDay === "evening" || context.timeOfDay === "night") {
      recommendations.push({
        type: "timing",
        title: "Evening Travel Safety",
        description: "Consider well-lit routes and the Crimson Ride for safer evening travel",
        priority: "medium",
        icon: "🌙",
        action: "View safe routes",
      })
    }

    // Weekend schedule changes
    if (context.dayOfWeek === "weekend") {
      recommendations.push({
        type: "timing",
        title: "Weekend Schedule",
        description: "Crimson Ride operates on reduced weekend schedule",
        priority: "low",
        icon: "📅",
        action: "Check weekend times",
      })
    }

    return recommendations
  }

  private static getUsagePatternRecommendations(
    history: RouteHistory[],
    preferences: UserPreferences,
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []

    if (history.length === 0) return recommendations

    // Analyze frequent routes
    const routeCounts = new Map<string, number>()
    history.forEach((entry) => {
      const routeKey = `${entry.from}-${entry.to}`
      routeCounts.set(routeKey, (routeCounts.get(routeKey) || 0) + 1)
    })

    const mostFrequentRoute = Array.from(routeCounts.entries()).sort(([, a], [, b]) => b - a)[0]

    if (mostFrequentRoute && mostFrequentRoute[1] >= 3) {
      const [from, to] = mostFrequentRoute[0].split("-")
      recommendations.push({
        type: "route",
        title: "Frequent Route Detected",
        description: `You often travel from ${from} to ${to}. Save this as a favorite?`,
        priority: "low",
        icon: "⭐",
        action: "Add to favorites",
        data: { from, to },
      })
    }

    // Analyze mode preferences vs usage
    const modeUsage = new Map<string, number>()
    history.forEach((entry) => {
      modeUsage.set(entry.mode, (modeUsage.get(entry.mode) || 0) + 1)
    })

    const mostUsedMode = Array.from(modeUsage.entries()).sort(([, a], [, b]) => b - a)[0]

    if (mostUsedMode && !preferences.preferredModes.includes(mostUsedMode[0] as any)) {
      recommendations.push({
        type: "mode",
        title: "Usage Pattern Insight",
        description: `You frequently use ${mostUsedMode[0]} but it's not in your preferred modes`,
        priority: "low",
        icon: "📊",
        action: "Update preferences",
      })
    }

    return recommendations
  }

  private static getOptimizationRecommendations(
    preferences: UserPreferences,
    history: RouteHistory[],
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []

    // Budget optimization
    if (preferences.budgetConstraints) {
      const paidRoutes = history.filter((entry) => entry.mode === "scooter").length
      if (paidRoutes > 5) {
        recommendations.push({
          type: "mode",
          title: "Budget Optimization",
          description: "You've used paid scooters frequently. Consider biking to save money",
          priority: "medium",
          icon: "💰",
          action: "See free alternatives",
        })
      }
    }

    // Sustainability optimization
    if (preferences.sustainabilityFocus) {
      const carbonIntensiveRoutes = history.filter((entry) => entry.mode === "bus").length
      if (carbonIntensiveRoutes > 10) {
        recommendations.push({
          type: "mode",
          title: "Eco-Friendly Suggestion",
          description: "Try walking or biking more often to reduce your carbon footprint",
          priority: "low",
          icon: "🌱",
          action: "View eco routes",
        })
      }
    }

    // Fitness optimization
    if (preferences.fitnessLevel === "high") {
      const activeRoutes = history.filter((entry) => entry.mode === "walking" || entry.mode === "bike").length
      const totalRoutes = history.length

      if (totalRoutes > 0 && activeRoutes / totalRoutes < 0.5) {
        recommendations.push({
          type: "mode",
          title: "Fitness Opportunity",
          description: "Based on your high fitness level, consider more active transportation",
          priority: "low",
          icon: "💪",
          action: "See active routes",
        })
      }
    }

    return recommendations
  }

  private static getLocationRecommendations(
    history: RouteHistory[],
    preferences: UserPreferences,
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []

    // Suggest popular campus locations
    const campusHotspots = ["Student Recreation Center", "Ferguson Center", "Gorgas Library", "Bryant-Denny Stadium"]

    const visitedLocations = new Set([...history.map((entry) => entry.from), ...history.map((entry) => entry.to)])

    const unvisitedHotspots = campusHotspots.filter((location) => !visitedLocations.has(location))

    if (unvisitedHotspots.length > 0) {
      recommendations.push({
        type: "location",
        title: "Explore Campus",
        description: `Haven't been to ${unvisitedHotspots[0]} yet? It's a popular campus destination`,
        priority: "low",
        icon: "🗺️",
        action: "Get directions",
        data: { location: unvisitedHotspots[0] },
      })
    }

    return recommendations
  }

  private static getMockCampusEvents(): string[] {
    const events = [
      "Football Game at Bryant-Denny Stadium",
      "Career Fair at Ferguson Center",
      "Concert at Tuscaloosa Amphitheater",
      "Library Study Session",
    ]

    // Return random events based on time
    const hour = new Date().getHours()
    if (hour >= 17 && hour <= 21) {
      return [events[0], events[2]]
    } else if (hour >= 9 && hour <= 16) {
      return [events[1], events[3]]
    }

    return []
  }

  private static getMockBusyLocations(timeOfDay: string): string[] {
    switch (timeOfDay) {
      case "morning":
        return ["Gorgas Library", "Student Recreation Center", "Ferguson Center"]
      case "afternoon":
        return ["Ferguson Center", "Riverside Dining Hall", "Student Recreation Center"]
      case "evening":
        return ["Bryant-Denny Stadium", "Ferguson Center"]
      default:
        return []
    }
  }

  static getQuickRecommendation(from: string, to: string, preferences: UserPreferences, weather: any): string {
    const routes = TransportationCalculator.calculateAllRoutes(from, to, weather)

    // Filter routes based on preferences
    const suitableRoutes = routes.filter((route) =>
      UserPreferencesService.shouldRecommendMode(route.mode as any, preferences, weather),
    )

    if (suitableRoutes.length === 0) {
      return "No suitable routes found based on your current preferences and weather conditions."
    }

    // Score routes based on preferences
    const scoredRoutes = suitableRoutes
      .map((route) => ({
        ...route,
        score: UserPreferencesService.getRouteScore(route, preferences),
      }))
      .sort((a, b) => b.score - a.score)

    const bestRoute = scoredRoutes[0]
    const modeLabel = this.getModeLabel(bestRoute.mode)

    let recommendation = `For your trip from ${from} to ${to}, I recommend ${modeLabel}.`

    // Add context based on weather
    if (weather.condition.includes("Rain") && bestRoute.mode === "bus") {
      recommendation += " It's raining, so the bus will keep you dry."
    } else if (weather.temperature > 85 && bestRoute.mode === "bus") {
      recommendation += " It's hot outside, so the air-conditioned bus is your best bet."
    } else if (bestRoute.mode === "walking" && weather.temperature < 75 && weather.temperature > 45) {
      recommendation += " The weather is perfect for a pleasant walk."
    }

    // Add time context
    recommendation += ` It should take about ${bestRoute.duration} minutes.`

    return recommendation
  }

  private static getModeLabel(mode: string): string {
    switch (mode) {
      case "walking":
        return "walking"
      case "bus":
        return "taking the Crimson Ride"
      case "bike":
        return "biking"
      case "scooter":
        return "using a Veo scooter"
      default:
        return mode
    }
  }
}
