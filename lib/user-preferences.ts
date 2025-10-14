export interface UserPreferences {
  // Transportation preferences
  preferredModes: Array<"walking" | "bus" | "bike" | "scooter">
  avoidModes: Array<"walking" | "bus" | "bike" | "scooter">
  maxWalkingDistance: number // in miles
  maxWalkingTime: number // in minutes

  // Route preferences
  prioritizeBy: "time" | "cost" | "environment" | "comfort"
  avoidHills: boolean
  preferCoveredRoutes: boolean

  // Weather preferences
  rainThreshold: number // 0-100, when to avoid outdoor modes
  temperatureComfort: {
    minWalking: number
    maxWalking: number
    minBiking: number
    maxBiking: number
  }

  // Accessibility needs
  mobilityAssistance: boolean
  requireElevators: boolean
  avoidStairs: boolean
  needWheelchairAccess: boolean

  // Personal info
  fitnessLevel: "low" | "moderate" | "high"
  budgetConstraints: boolean
  sustainabilityFocus: boolean

  // Saved locations
  favoriteLocations: Array<{
    name: string
    address: string
    category: "academic" | "dining" | "recreation" | "residence" | "other"
    coordinates?: [number, number]
  }>

  // Schedule integration
  classSchedule?: Array<{
    building: string
    startTime: string
    endTime: string
    days: string[]
  }>

  // Notification preferences
  notifications: {
    weatherAlerts: boolean
    routeDelays: boolean
    newRouteOptions: boolean
    maintenanceUpdates: boolean
  }
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredModes: ["walking", "bus", "bike", "scooter"],
  avoidModes: [],
  maxWalkingDistance: 1.0,
  maxWalkingTime: 20,
  prioritizeBy: "time",
  avoidHills: false,
  preferCoveredRoutes: false,
  rainThreshold: 30,
  temperatureComfort: {
    minWalking: 35,
    maxWalking: 90,
    minBiking: 40,
    maxBiking: 85,
  },
  mobilityAssistance: false,
  requireElevators: false,
  avoidStairs: false,
  needWheelchairAccess: false,
  fitnessLevel: "moderate",
  budgetConstraints: false,
  sustainabilityFocus: false,
  favoriteLocations: [],
  notifications: {
    weatherAlerts: true,
    routeDelays: true,
    newRouteOptions: false,
    maintenanceUpdates: true,
  },
}

export class UserPreferencesService {
  private static readonly STORAGE_KEY = "tide-routes-preferences"

  static getPreferences(): UserPreferences {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new preference fields
        return { ...DEFAULT_PREFERENCES, ...parsed }
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
    }

    return DEFAULT_PREFERENCES
  }

  static savePreferences(preferences: UserPreferences): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  static updatePreferences(updates: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences()
    const updated = { ...current, ...updates }
    this.savePreferences(updated)
    return updated
  }

  static addFavoriteLocation(location: UserPreferences["favoriteLocations"][0]): void {
    const preferences = this.getPreferences()
    const exists = preferences.favoriteLocations.some((fav) => fav.name === location.name)

    if (!exists) {
      preferences.favoriteLocations.push(location)
      this.savePreferences(preferences)
    }
  }

  static removeFavoriteLocation(locationName: string): void {
    const preferences = this.getPreferences()
    preferences.favoriteLocations = preferences.favoriteLocations.filter((fav) => fav.name !== locationName)
    this.savePreferences(preferences)
  }

  static getFilteredTransportModes(preferences: UserPreferences): Array<"walking" | "bus" | "bike" | "scooter"> {
    return preferences.preferredModes.filter((mode) => !preferences.avoidModes.includes(mode))
  }

  static shouldRecommendMode(
    mode: "walking" | "bus" | "bike" | "scooter",
    preferences: UserPreferences,
    weather?: { temperature: number; condition: string; precipitation: number },
  ): boolean {
    // Check if mode is avoided
    if (preferences.avoidModes.includes(mode)) return false

    // Check weather conditions
    if (weather) {
      if (mode === "walking") {
        if (
          weather.temperature < preferences.temperatureComfort.minWalking ||
          weather.temperature > preferences.temperatureComfort.maxWalking
        ) {
          return false
        }
      }

      if (mode === "bike") {
        if (
          weather.temperature < preferences.temperatureComfort.minBiking ||
          weather.temperature > preferences.temperatureComfort.maxBiking
        ) {
          return false
        }
      }

      // Rain threshold check for outdoor modes
      if (
        (mode === "walking" || mode === "bike" || mode === "scooter") &&
        weather.precipitation > preferences.rainThreshold
      ) {
        return false
      }
    }

    // Budget constraints
    if (preferences.budgetConstraints && mode === "scooter") {
      return false
    }

    // Accessibility needs
    if (preferences.mobilityAssistance && (mode === "walking" || mode === "bike")) {
      return false
    }

    return preferences.preferredModes.includes(mode)
  }

  static getRouteScore(route: any, preferences: UserPreferences): number {
    let score = 100

    // Prioritization scoring
    switch (preferences.prioritizeBy) {
      case "time":
        score -= route.duration * 2
        break
      case "cost":
        score -= route.cost * 50
        break
      case "environment":
        score -= route.carbonFootprint * 0.1
        if (route.carbonFootprint === 0) score += 20
        break
      case "comfort":
        score += route.reliability * 0.5
        if (route.mode === "bus") score += 15 // Climate controlled
        break
    }

    // Sustainability bonus
    if (preferences.sustainabilityFocus && route.carbonFootprint === 0) {
      score += 25
    }

    // Fitness level adjustments
    if (route.caloriesBurned) {
      switch (preferences.fitnessLevel) {
        case "low":
          score -= route.caloriesBurned * 0.1
          break
        case "high":
          score += route.caloriesBurned * 0.05
          break
      }
    }

    // Mode preference bonus
    if (preferences.preferredModes.includes(route.mode)) {
      const index = preferences.preferredModes.indexOf(route.mode)
      score += (4 - index) * 10 // Higher score for more preferred modes
    }

    return Math.max(0, score)
  }

  static getPersonalizedRecommendation(routes: any[], preferences: UserPreferences, weather?: any): string {
    const availableRoutes = routes.filter((route) => this.shouldRecommendMode(route.mode, preferences, weather))

    if (availableRoutes.length === 0) {
      return "No suitable routes found based on your preferences. Consider adjusting your settings."
    }

    const scoredRoutes = availableRoutes
      .map((route) => ({
        ...route,
        personalScore: this.getRouteScore(route, preferences),
      }))
      .sort((a, b) => b.personalScore - a.personalScore)

    const bestRoute = scoredRoutes[0]

    let recommendation = `Based on your preferences, we recommend ${this.getModeLabel(bestRoute.mode)}.`

    if (preferences.prioritizeBy === "time") {
      recommendation += ` It's the fastest option at ${bestRoute.duration} minutes.`
    } else if (preferences.prioritizeBy === "cost") {
      recommendation += ` It costs ${bestRoute.cost === 0 ? "nothing" : `$${bestRoute.cost.toFixed(2)}`}.`
    } else if (preferences.prioritizeBy === "environment") {
      recommendation += ` It produces ${bestRoute.carbonFootprint}g of CO₂.`
    } else if (preferences.prioritizeBy === "comfort") {
      recommendation += ` It has ${bestRoute.reliability}% reliability.`
    }

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
