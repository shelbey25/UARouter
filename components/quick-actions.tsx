import { Bus, Bike, Footprints, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  const transportModes = [
    {
      icon: Footprints,
      name: "Walking",
      description: "Free • 3-4 mph average",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: Bus,
      name: "Crimson Ride",
      description: "Free • Every 10-15 min",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Bike,
      name: "Biking",
      description: "Free • 12-15 mph average",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: Zap,
      name: "Veo Scooter",
      description: "$1 + $0.15/min • 15 mph",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transportation Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {transportModes.map((mode) => {
            const IconComponent = mode.icon
            return (
              <Button key={mode.name} variant="outline" className="h-auto p-4 justify-start bg-transparent">
                <div className={`w-10 h-10 rounded-lg ${mode.bgColor} flex items-center justify-center mr-3`}>
                  <IconComponent className={`w-5 h-5 ${mode.color}`} />
                </div>
                <div className="text-left">
                  <div className="font-medium">{mode.name}</div>
                  <div className="text-xs text-muted-foreground">{mode.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
