"use client"

import { useState, useEffect } from "react"
import { Clock, DollarSign, MapPin, ChevronDown, ChevronUp, Navigation, X, Leaf, Zap, Star, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TransportationCalculator } from "@/lib/transportation-calculator"
import { UserPreferencesService } from "@/lib/user-preferences"

interface RouteResultsProps {
  fromLocation: string
  toLocation: string
  onClose: () => void
}

export function RouteResults({ fromLocation, toLocation, onClose }: RouteResultsProps) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [smartRecommendation, setSmartRecommendation] = useState<string>("")

  useEffect(() => {
    const calculateRoutes = async () => {
      console.log("[v0] Starting route calculation for:", fromLocation, "to", toLocation)
      setLoading(true)

      try {
        const preferences = UserPreferencesService.getPreferences()

        console.log("[v0] Calculating routes without weather data")
        const calculatedRoutes = TransportationCalculator.calculateAllRoutes(fromLocation, toLocation)

        // Add UI-specific properties
        const routesWithUI = calculatedRoutes.map((route, index) => ({
          ...route,
          id: `${route.mode}-${index}`,
          expanded: false,
          steps: generateRouteSteps(route.mode, fromLocation, toLocation, route),
          carbonFootprint: calculateCarbonFootprint(route.mode, Number.parseFloat(route.distance)),
          caloriesBurned: calculateCalories(route.mode, Number.parseFloat(route.distance), route.duration),
        }))

        console.log("[v0] Routes calculated:", routesWithUI.length)
        setRoutes(routesWithUI)
        setLoading(false)

        // Generate smart recommendation
        const recommendation = generateSmartRecommendation(calculatedRoutes, preferences)
        setSmartRecommendation(recommendation)
      } catch (error) {
        console.error("[v0] Error calculating routes:", error)
        setLoading(false)
        setRoutes([])
      }
    }

    calculateRoutes()
  }, [fromLocation, toLocation])

  const generateRouteSteps = (mode: string, from: string, to: string, route: any) => {
    switch (mode) {
      case "walking":
        return [
          `Start at ${from}`,
          "Head southeast on University Blvd",
          "Turn right onto Hackberry Lane",
          "Continue straight for 0.3 miles",
          `Arrive at ${to}`,
        ]
      case "bus":
        return [
          `Walk to nearest Crimson Ride stop`,
          "Board Route 1 (Campus Loop)",
          "Ride for 3 stops (8 minutes)",
          "Exit at stop near destination",
          `Walk 2 minutes to ${to}`,
        ]
      case "bike":
        return [
          `Start biking from ${from}`,
          "Take bike lane on University Blvd",
          "Turn onto campus bike path",
          "Follow signs toward destination",
          `Arrive and lock bike near ${to}`,
        ]
      case "scooter":
        return [
          "Locate nearby Veo scooter",
          "Unlock with mobile app",
          "Ride via University Blvd",
          "Follow traffic rules and bike lanes",
          `Park scooter near ${to}`,
        ]
      case "uber":
        return (
          route.steps || [
            "Request Uber via app",
            `Wait for driver pickup (${route.waitTime} min)`,
            `Ride to ${to}`,
            "Exit at destination",
          ]
        )
      case "car":
        return (
          route.steps || [
            `Drive from ${from}`,
            "Navigate via campus roads",
            `Find parking near ${to}`,
            "Walk from parking to destination",
          ]
        )
      default:
        return [`Navigate from ${from} to ${to}`]
    }
  }

  const calculateCarbonFootprint = (mode: string, distance: number) => {
    const emissions = {
      walking: 0,
      bike: 0,
      bus: 0.2, // kg CO2 per mile (shared transportation)
      scooter: 0.1, // kg CO2 per mile (electric)
      uber: 0.4, // kg CO2 per mile (rideshare)
      car: 0.45, // kg CO2 per mile (personal vehicle)
    }
    return (emissions[mode as keyof typeof emissions] || 0) * distance
  }

  const calculateCalories = (mode: string, distance: number, duration: number) => {
    const caloriesPerMinute = {
      walking: 4,
      bike: 8,
      bus: 1,
      scooter: 2,
      uber: 1,
      car: 1,
    }
    return Math.round((caloriesPerMinute[mode as keyof typeof caloriesPerMinute] || 0) * duration)
  }

  const generateSmartRecommendation = (routes: any[], preferences: any) => {
    if (preferences.prioritizeSpeed) {
      const fastestRoute = routes.reduce((prev, current) => (prev.duration < current.duration ? prev : current))
      return `For fastest travel, we recommend ${fastestRoute.mode} (${fastestRoute.duration} min).`
    }

    if (preferences.prioritizeCost) {
      const cheapestRoute = routes.reduce((prev, current) => (prev.cost < current.cost ? prev : current))
      return `For most economical travel, we recommend ${cheapestRoute.mode} ($${cheapestRoute.cost.toFixed(2)}).`
    }

    if (preferences.prioritizeSustainability) {
      const greenestRoute = routes.reduce((prev, current) =>
        prev.carbonFootprint < current.carbonFootprint ? prev : current,
      )
      return `For most eco-friendly travel, we recommend ${greenestRoute.mode} (${greenestRoute.carbonFootprint.toFixed(1)} kg CO2).`
    }

    return "All transportation options are available. Choose based on your preference!"
  }

  const toggleRouteExpansion = (routeId: string) => {
    setRoutes(routes.map((route) => (route.id === routeId ? { ...route, expanded: !route.expanded } : route)))
  }

  const getRouteIcon = (mode: string) => {
    switch (mode) {
      case "walking":
        return "🚶"
      case "bus":
        return "🚌"
      case "bike":
        return "🚴"
      case "scooter":
        return "🛴"
      case "uber":
        return "🚗"
      case "car":
        return "🅿️"
      default:
        return "📍"
    }
  }

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 90) return "text-green-600"
    if (reliability >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Finding Routes...</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              <span>Route Options</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            From <strong>{fromLocation}</strong> to <strong>{toLocation}</strong>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {smartRecommendation && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-start gap-2">
                <Star className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">Smart Recommendation</p>
                  <p className="text-sm text-muted-foreground">{smartRecommendation}</p>
                </div>
              </div>
            </div>
          )}

          {routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No routes found. Please check your locations and try again.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((route) => (
                <Card key={route.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getRouteIcon(route.mode)}</div>
                        <div>
                          <h3 className="font-semibold capitalize">{route.mode}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {route.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />${route.cost.toFixed(2)}
                            </span>
                            <span>{route.distance}</span>
                            {route.parkingTime && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Car className="w-3 h-3" />+{route.parkingTime}min parking
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getReliabilityColor(route.reliability)}>
                          {route.reliability}% reliable
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => toggleRouteExpansion(route.id)}>
                          {route.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {route.expanded && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Route Details</h4>
                            <div className="space-y-1">
                              {route.steps.map((step: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mt-0.5">
                                    {index + 1}
                                  </div>
                                  <span className="text-muted-foreground">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                                <Leaf className="w-3 h-3" />
                              </div>
                              <div className="text-xs text-muted-foreground">Carbon</div>
                              <div className="text-sm font-medium">{route.carbonFootprint.toFixed(1)} kg</div>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                                <Zap className="w-3 h-3" />
                              </div>
                              <div className="text-xs text-muted-foreground">Calories</div>
                              <div className="text-sm font-medium">{route.caloriesBurned}</div>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                                <Clock className="w-3 h-3" />
                              </div>
                              <div className="text-xs text-muted-foreground">Arrival</div>
                              <div className="text-sm font-medium">
                                {new Date(Date.now() + route.duration * 60000).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          </div>

                          <Button className="w-full" size="sm">
                            <Navigation className="w-4 h-4 mr-2" />
                            Start Navigation
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
