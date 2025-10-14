import { type NextRequest, NextResponse } from "next/server"

const TUSCALOOSA_COORDS = {
  lat: 33.2098,
  lon: -87.5692,
}

const API_KEY = process.env.OPENWEATHER_API_KEY
const BASE_URL = "https://api.openweathermap.org/data/2.5"

function mapWeatherCondition(main: string, id: number): string {
  switch (main.toLowerCase()) {
    case "clear":
      return "Sunny"
    case "clouds":
      return id < 803 ? "Partly Cloudy" : "Cloudy"
    case "rain":
    case "drizzle":
      return id < 502 ? "Light Rain" : "Rain"
    case "thunderstorm":
      return "Thunderstorm"
    case "snow":
      return "Snow"
    case "mist":
    case "fog":
      return "Foggy"
    default:
      return "Partly Cloudy"
  }
}

function getFallbackWeather() {
  const hour = new Date().getHours()
  const season = getCurrentSeason()

  let baseTemp = 70
  if (season === "winter") baseTemp = 45
  else if (season === "summer") baseTemp = 85
  else if (season === "fall") baseTemp = 65

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

function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return "spring"
  if (month >= 6 && month <= 8) return "summer"
  if (month >= 9 && month <= 11) return "fall"
  return "winter"
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "current"

  try {
    if (!API_KEY) {
      console.log("Using fallback weather data - API key not configured")
      return NextResponse.json(getFallbackWeather())
    }

    if (type === "forecast") {
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(
          `${BASE_URL}/weather?lat=${TUSCALOOSA_COORDS.lat}&lon=${TUSCALOOSA_COORDS.lon}&appid=${API_KEY}&units=imperial`,
        ),
        fetch(
          `${BASE_URL}/forecast?lat=${TUSCALOOSA_COORDS.lat}&lon=${TUSCALOOSA_COORDS.lon}&appid=${API_KEY}&units=imperial`,
        ),
      ])

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error("Weather API request failed")
      }

      const [currentData, forecastData] = await Promise.all([currentResponse.json(), forecastResponse.json()])

      const current = {
        temperature: Math.round(currentData.main.temp),
        condition: mapWeatherCondition(currentData.weather[0].main, currentData.weather[0].id),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind?.speed || 0),
        precipitation: currentData.rain?.["1h"] || currentData.snow?.["1h"] || 0,
        visibility: Math.round((currentData.visibility || 10000) / 1609.34),
        uvIndex: 0,
        feelsLike: Math.round(currentData.main.feels_like),
        icon: currentData.weather[0].icon,
        description: currentData.weather[0].description,
      }

      const hourly = forecastData.list.slice(0, 6).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        }),
        temperature: Math.round(item.main.temp),
        condition: mapWeatherCondition(item.weather[0].main, item.weather[0].id),
        precipitation: item.rain?.["3h"] || item.snow?.["3h"] || 0,
      }))

      return NextResponse.json({
        current,
        hourly,
        alerts: [],
      })
    } else {
      const response = await fetch(
        `${BASE_URL}/weather?lat=${TUSCALOOSA_COORDS.lat}&lon=${TUSCALOOSA_COORDS.lon}&appid=${API_KEY}&units=imperial`,
      )

      if (!response.ok) {
        throw new Error("Weather API request failed")
      }

      const data = await response.json()

      const weatherData = {
        temperature: Math.round(data.main.temp),
        condition: mapWeatherCondition(data.weather[0].main, data.weather[0].id),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind?.speed || 0),
        precipitation: data.rain?.["1h"] || data.snow?.["1h"] || 0,
        visibility: Math.round((data.visibility || 10000) / 1609.34),
        uvIndex: 0,
        feelsLike: Math.round(data.main.feels_like),
        icon: data.weather[0].icon,
        description: data.weather[0].description,
      }

      return NextResponse.json(weatherData)
    }
  } catch (error) {
    console.error("Error fetching weather data:", error)
    return NextResponse.json(getFallbackWeather())
  }
}
