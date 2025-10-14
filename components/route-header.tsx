import { MapPin, Menu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PreferencesDialog } from "@/components/preferences-dialog"

export function RouteHeader() {
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Tide Routes</h1>
                <p className="text-sm text-muted-foreground">University of Alabama Campus Navigation</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PreferencesDialog>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </PreferencesDialog>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
