"use client"

import { useState, useEffect } from "react"
import { Lightbulb, X, Star, TrendingUp, MapPin, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecommendationsEngine } from "@/lib/recommendations-engine"
import { UserPreferencesService } from "@/lib/user-preferences"

export function SmartRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const preferences = UserPreferencesService.getPreferences()
      const recs = await RecommendationsEngine.generateRecommendations(preferences)
      setRecommendations(recs)
    } catch (error) {
      console.error("Error loading recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const dismissRecommendation = (index: number) => {
    const newDismissed = new Set(dismissedRecs)
    newDismissed.add(`${recommendations[index].type}-${index}`)
    setDismissedRecs(newDismissed)
  }

  const getRecommendationIcon = (type: string, icon: string) => {
    switch (type) {
      case "weather":
        return <span className="text-lg">{icon}</span>
      case "timing":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "mode":
        return <Zap className="w-5 h-5 text-orange-500" />
      case "route":
        return <MapPin className="w-5 h-5 text-green-500" />
      case "location":
        return <Star className="w-5 h-5 text-purple-500" />
      default:
        return <TrendingUp className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const visibleRecommendations = recommendations.filter(
    (_, index) => !dismissedRecs.has(`${recommendations[index].type}-${index}`),
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (visibleRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recommendations at the moment.</p>
            <p className="text-sm">Check back later for personalized suggestions!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleRecommendations.slice(0, 4).map((rec, index) => (
          <div key={`${rec.type}-${index}`} className="flex items-start gap-3 p-3 bg-muted rounded-lg relative group">
            <div className="flex-shrink-0 mt-0.5">{getRecommendationIcon(rec.type, rec.icon)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => dismissRecommendation(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {rec.action && (
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs bg-transparent">
                  {rec.action}
                </Button>
              )}
            </div>
          </div>
        ))}

        {visibleRecommendations.length > 4 && (
          <Button variant="ghost" className="w-full text-sm" onClick={loadRecommendations}>
            Show more recommendations
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
