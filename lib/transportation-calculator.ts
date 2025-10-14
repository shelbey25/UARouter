interface Location {
  name: string
  coordinates: [number, number] // [lat, lng]
  busStops?: string[]
  bikeParking?: boolean
  scooterZone?: boolean
  parkingAvailable?: boolean
  parkingWalkTime?: number // minutes to walk from parking to destination
}

interface RouteCalculation {
  mode: "walking" | "bus" | "bike" | "scooter" | "uber" | "car"
  duration: number
  cost: number
  distance: string
  steps: string[]
  reliability: number // 0-100 score
  carbonFootprint: number // grams CO2
  caloriesBurned?: number
  waitTime?: number
  parkingTime?: number
}

// Mock campus locations database
const CAMPUS_LOCATIONS: Record<string, Location> = {
  "Gorgas Library": {
    name: "Gorgas Library",
    coordinates: [33.2098, -87.5692],
    busStops: ["Library Circle", "University Blvd"],
    bikeParking: true,
    scooterZone: true,
    parkingAvailable: true,
    parkingWalkTime: 3,
  },
  "Bryant-Denny Stadium": {
    name: "Bryant-Denny Stadium",
    coordinates: [33.208, -87.5502],
    busStops: ["Stadium Drive", "Paul W. Bryant Drive"],
    bikeParking: true,
    scooterZone: true,
    parkingAvailable: true,
    parkingWalkTime: 5,
  },
  "Student Recreation Center": {
    name: "Student Recreation Center",
    coordinates: [33.2115, -87.5445],
    busStops: ["Recreation Center"],
    bikeParking: true,
    scooterZone: true,
    parkingAvailable: true,
    parkingWalkTime: 2,
  },
  "Ferguson Center": {
    name: "Ferguson Center",
    coordinates: [33.2105, -87.5678],
    busStops: ["Ferguson Center", "University Blvd"],
    bikeParking: true,
    scooterZone: true,
    parkingAvailable: true,
    parkingWalkTime: 4,
  },
}

export class TransportationCalculator {
  private static calculateDistance(from: Location, to: Location): number {
    // Haversine formula for distance calculation
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(to.coordinates[0] - from.coordinates[0])
    const dLon = this.toRadians(to.coordinates[1] - from.coordinates[1])
    const lat1 = this.toRadians(from.coordinates[0])
    const lat2 = this.toRadians(to.coordinates[0])

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private static getTimeOfDayMultiplier(): number {
    const hour = new Date().getHours()
    // Peak hours: 8-10am, 12-2pm, 4-6pm
    if ((hour >= 8 && hour <= 10) || (hour >= 12 && hour <= 14) || (hour >= 16 && hour <= 18)) {
      return 1.3 // 30% longer during peak times
    }
    return 1.0
  }

  static calculateWalkingRoute(from: Location, to: Location): RouteCalculation {
    const distance = this.calculateDistance(from, to)
    const baseSpeed = 3.5 // mph
    const duration = Math.round((distance / baseSpeed) * 60) // minutes
    const caloriesBurned = Math.round(distance * 100) // ~100 calories per mile

    return {
      mode: "walking",
      duration,
      cost: 0,
      distance: `${distance.toFixed(1)} mi`,
      steps: [
        `Head towards ${to.name}`,
        `Follow campus walkways`,
        `Total walking distance: ${distance.toFixed(1)} miles`,
      ],
      reliability: 95,
      carbonFootprint: 0,
      caloriesBurned,
    }
  }

  static calculateBusRoute(from: Location, to: Location): RouteCalculation {
    const distance = this.calculateDistance(from, to)
    const timeMultiplier = this.getTimeOfDayMultiplier()

    // Base bus travel time + waiting time
    const travelTime = Math.max(5, Math.round((distance / 15) * 60)) // 15 mph average
    const waitTime = Math.round(8 * timeMultiplier) // 8 min average wait, longer during peak
    const walkTime = 3 // 3 min walk to/from stops

    const totalDuration = travelTime + waitTime + walkTime

    const hasNearbyStops = from.busStops && to.busStops && from.busStops.length > 0 && to.busStops.length > 0

    return {
      mode: "bus",
      duration: totalDuration,
      cost: 0,
      distance: `${distance.toFixed(1)} mi`,
      steps: [
        `Walk to nearest bus stop (${Math.round(walkTime / 2)} min)`,
        `Wait for Crimson Ride (${waitTime} min)`,
        `Ride to destination area (${travelTime} min)`,
        `Walk to ${to.name} (${Math.round(walkTime / 2)} min)`,
      ],
      reliability: hasNearbyStops ? 85 : 60,
      carbonFootprint: Math.round(distance * 150), // grams CO2 per mile
      waitTime,
    }
  }

  static calculateBikeRoute(from: Location, to: Location): RouteCalculation {
    const distance = this.calculateDistance(from, to)
    const baseSpeed = 12 // mph
    const duration = Math.round((distance / baseSpeed) * 60)
    const caloriesBurned = Math.round(distance * 250) // ~250 calories per mile biking

    return {
      mode: "bike",
      duration,
      cost: 0,
      distance: `${distance.toFixed(1)} mi`,
      steps: [
        `Take bike lanes along main campus routes`,
        `Follow designated bike paths`,
        `Park at bike racks near ${to.name}`,
      ],
      reliability: 90,
      carbonFootprint: 0,
      caloriesBurned,
    }
  }

  static calculateScooterRoute(from: Location, to: Location): RouteCalculation {
    const distance = this.calculateDistance(from, to)
    const baseSpeed = 15 // mph
    const duration = Math.round((distance / baseSpeed) * 60)
    const baseCost = 1.0 // Base unlock fee
    const perMinuteCost = 0.15
    const totalCost = baseCost + duration * perMinuteCost

    // Dynamic pricing during peak hours
    const timeMultiplier = this.getTimeOfDayMultiplier()
    const finalCost = totalCost * (timeMultiplier > 1 ? 1.2 : 1.0)

    return {
      mode: "scooter",
      duration,
      cost: finalCost,
      distance: `${distance.toFixed(1)} mi`,
      steps: [
        `Find nearby Veo scooter using app`,
        `Scan QR code to unlock ($${baseCost.toFixed(2)})`,
        `Follow bike lanes to destination`,
        `Park in designated scooter zone`,
      ],
      reliability: 85,
      carbonFootprint: Math.round(distance * 50), // Lower than bus, higher than bike/walk
    }
  }

  static calculateUberRoute(from: Location, to: Location): RouteCalculation {
    const distance = this.calculateDistance(from, to)
    const timeMultiplier = this.getTimeOfDayMultiplier()

    // Uber travel time (faster than bus, affected by traffic)
    const travelTime = Math.round((distance / 25) * 60 * timeMultiplier) // 25 mph average with traffic
    const waitTime = Math.round(5 * timeMultiplier) // 5 min average wait, longer during peak
    const totalDuration = travelTime + waitTime

    // Uber pricing: base fare + per mile + per minute + surge
    const baseFare = 2.5
    const perMile = 1.75
    const perMinute = 0.25
    const surgePricing = timeMultiplier > 1 ? 1.5 : 1.0 // 50% surge during peak hours

    const totalCost = (baseFare + distance * perMile + travelTime * perMinute) * surgePricing

    return {
      mode: "uber",
      duration: totalDuration,
      cost: totalCost,
      distance: `${distance.toFixed(1)} mi`,
      steps: [
        `Request Uber via app`,
        `Wait for driver pickup (${waitTime} min)`,
        `Ride to ${to.name} (${travelTime} min)`,
        `Exit at destination`,
      ],
      reliability: 90,
      carbonFootprint: Math.round(distance * 400), // Higher than other modes
      waitTime,
    }
  }

  static calculateCarRoute(from: Location, to: Location): RouteCalculation {
    const distance = this.calculateDistance(from, to)
    const timeMultiplier = this.getTimeOfDayMultiplier()

    // Driving time (similar to Uber but no wait time)
    const drivingTime = Math.round((distance / 25) * 60 * timeMultiplier) // 25 mph average with traffic

    // Parking time - varies by destination
    const parkingSearchTime = Math.round(3 * timeMultiplier) // 3 min to find parking, longer during peak
    const parkingWalkTime = to.parkingWalkTime || 5 // Walk from parking to destination
    const totalParkingTime = parkingSearchTime + parkingWalkTime

    const totalDuration = drivingTime + totalParkingTime

    // Car costs: gas + parking
    const gasPerMile = 0.15 // Approximate gas cost per mile
    const parkingCost = distance > 0.5 ? 3.0 : 0 // $3 parking for longer trips
    const totalCost = distance * gasPerMile + parkingCost

    return {
      mode: "car",
      duration: totalDuration,
      cost: totalCost,
      distance: `${distance.toFixed(1)} mi`,
      steps: [
        `Drive from ${from.name}`,
        `Navigate via campus roads (${drivingTime} min)`,
        `Find parking near ${to.name} (${parkingSearchTime} min)`,
        `Walk from parking to destination (${parkingWalkTime} min)`,
      ],
      reliability: to.parkingAvailable ? 80 : 60, // Lower reliability if parking is limited
      carbonFootprint: Math.round(distance * 450), // Highest carbon footprint
      parkingTime: totalParkingTime,
    }
  }

  static calculateAllRoutes(fromName: string, toName: string): RouteCalculation[] {
    const from = CAMPUS_LOCATIONS[fromName]
    const to = CAMPUS_LOCATIONS[toName]

    if (!from || !to) {
      throw new Error("Location not found")
    }

    return [
      this.calculateWalkingRoute(from, to),
      this.calculateBusRoute(from, to),
      this.calculateBikeRoute(from, to),
      this.calculateScooterRoute(from, to),
      this.calculateUberRoute(from, to),
      this.calculateCarRoute(from, to),
    ].sort((a, b) => a.duration - b.duration) // Sort by duration
  }

  static getLocationSuggestions(query: string): string[] {
    const locations = Object.keys(CAMPUS_LOCATIONS)
    return locations.filter((location) => location.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
  }
}
