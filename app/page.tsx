import { RouteHeader } from "@/components/route-header"
import { RouteSearch } from "@/components/route-search"
import { QuickActions } from "@/components/quick-actions"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <RouteHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <RouteSearch />
          <QuickActions />
        </div>
      </main>
    </div>
  )
}
