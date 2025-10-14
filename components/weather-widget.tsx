"use client"

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, Thermometer, Wind, Droplets, Eye, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WeatherService } from "@/lib/weather-service"

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null)
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchWeatherData = async () => {
    setLoading(true)
    try {
      const [currentWeather, weatherForecast] = await Promise.all([
        WeatherService.getCurrentWeather(),
        WeatherService.getWeatherForecast(),
      ])

      setWeather(currentWeather)
      setForecast(weatherForecast)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching weather:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeatherData()

    // Update weather every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "Sunny":
        return <Sun className="w-8 h-8 text-yellow-500" />
      case "Partly Cloudy":
        return <Cloud className="w-8 h-8 text-gray-500" />
      case "Cloudy":
        return <Cloud className="w-8 h-8 text-gray-600" />
      case "Light Rain":
      case "Rain":
        return <CloudRain className="w-8 h-8 text-blue-500" />
      case "Thunderstorm":
        return <CloudRain className="w-8 h-8 text-purple-500" />
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />
    }
  }

  if (loading || !weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Tuscaloosa Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const recommendation = WeatherService.getRouteRecommendation(weather)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Tuscaloosa Weather
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchWeatherData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {lastUpdated && <p className="text-xs text-muted-foreground">Updated {lastUpdated.toLocaleTimeString()}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.condition)}
            <div>
              <div className="text-2xl font-bold">{weather.temperature}°F</div>
              <div className="text-sm text-muted-foreground">{weather.condition}</div>
              <div className="text-xs text-muted-foreground">Feels like {weather.feelsLike}°F</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-muted-foreground">Humidity</div>
              <div className="font-medium">{weather.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-muted-foreground">Wind</div>
              <div className="font-medium">{weather.windSpeed} mph</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-500" />
            <div>
              <div className="text-muted-foreground">Visibility</div>
              <div className="font-medium">{weather.visibility} mi</div>
            </div>
          </div>
          {weather.precipitation > 0 && (
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-muted-foreground">Rain</div>
                <div className="font-medium">{weather.precipitation.toFixed(1)}"</div>
              </div>
            </div>
          )}
        </div>

        {forecast?.hourly && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Next 6 Hours</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {forecast.hourly.map((hour: any, index: number) => (
                <div key={index} className="flex-shrink-0 text-center p-2 bg-muted rounded-lg min-w-[60px]">
                  <div className="text-xs text-muted-foreground">{hour.time}</div>
                  <div className="text-sm font-medium">{hour.temperature}°</div>
                  {hour.precipitation > 0 && (
                    <div className="text-xs text-blue-500">{hour.precipitation.toFixed(1)}"</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium text-muted-foreground mb-1">Route Recommendation</div>
          <div className="text-sm">{recommendation}</div>
        </div>

        {forecast?.alerts && forecast.alerts.length > 0 && (
          <div className="space-y-2">
            {forecast.alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === "severe" || alert.severity === "extreme"
                    ? "bg-red-50 border-red-500 dark:bg-red-950"
                    : "bg-yellow-50 border-yellow-500 dark:bg-yellow-950"
                }`}
              >
                <div className="text-sm font-medium">{alert.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{alert.description}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
