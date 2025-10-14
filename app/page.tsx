import { RouteHeader } from "@/components/route-header"
import { RouteSearch } from "@/components/route-search"
import { QuickActions } from "@/components/quick-actions"
import { WeatherWidget } from "@/components/weather-widget"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <RouteHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RouteSearch />
            <QuickActions />
          </div>
          <div className="space-y-6">
            <WeatherWidget />
          </div>
        </div>
      </main>
    </div>
  )
}
