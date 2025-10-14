"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Settings, Star, MapPin, Accessibility, Thermometer, Bell } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPreferencesService, type UserPreferences } from "@/lib/user-preferences"

interface PreferencesDialogProps {
  children: React.ReactNode
  onPreferencesChange?: (preferences: UserPreferences) => void
}

export function PreferencesDialog({ children, onPreferencesChange }: PreferencesDialogProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(UserPreferencesService.getPreferences())
  const [newFavorite, setNewFavorite] = useState({ name: "", category: "academic" as const })

  useEffect(() => {
    const loadedPreferences = UserPreferencesService.getPreferences()
    setPreferences(loadedPreferences)
  }, [])

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates }
    setPreferences(updated)
    UserPreferencesService.savePreferences(updated)
    onPreferencesChange?.(updated)
  }

  const toggleTransportMode = (mode: "walking" | "bus" | "bike" | "scooter", preferred: boolean) => {
    if (preferred) {
      const newPreferred = [...preferences.preferredModes]
      if (!newPreferred.includes(mode)) {
        newPreferred.push(mode)
      }
      const newAvoided = preferences.avoidModes.filter((m) => m !== mode)
      updatePreferences({ preferredModes: newPreferred, avoidModes: newAvoided })
    } else {
      const newAvoided = [...preferences.avoidModes]
      if (!newAvoided.includes(mode)) {
        newAvoided.push(mode)
      }
      const newPreferred = preferences.preferredModes.filter((m) => m !== mode)
      updatePreferences({ preferredModes: newPreferred, avoidModes: newAvoided })
    }
  }

  const addFavoriteLocation = () => {
    if (newFavorite.name.trim()) {
      const location = {
        name: newFavorite.name.trim(),
        address: newFavorite.name.trim(),
        category: newFavorite.category,
      }

      const updatedFavorites = [...preferences.favoriteLocations, location]
      updatePreferences({ favoriteLocations: updatedFavorites })
      setNewFavorite({ name: "", category: "academic" })
    }
  }

  const removeFavoriteLocation = (locationName: string) => {
    const updatedFavorites = preferences.favoriteLocations.filter((fav) => fav.name !== locationName)
    updatePreferences({ favoriteLocations: updatedFavorites })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Preferences
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transport" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="accessibility">Access</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="transport" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transportation Modes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { mode: "walking" as const, label: "Walking", icon: "🚶" },
                  { mode: "bus" as const, label: "Crimson Ride Bus", icon: "🚌" },
                  { mode: "bike" as const, label: "Biking", icon: "🚲" },
                  { mode: "scooter" as const, label: "Veo Scooter", icon: "🛴" },
                ].map(({ mode, label, icon }) => (
                  <div key={mode} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <Label>{label}</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={preferences.preferredModes.includes(mode)}
                          onCheckedChange={(checked) => toggleTransportMode(mode, !!checked)}
                        />
                        <Label className="text-sm">Prefer</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={preferences.avoidModes.includes(mode)}
                          onCheckedChange={(checked) => toggleTransportMode(mode, !checked)}
                        />
                        <Label className="text-sm">Avoid</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Walking Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Maximum Walking Distance: {preferences.maxWalkingDistance} miles</Label>
                  <Slider
                    value={[preferences.maxWalkingDistance]}
                    onValueChange={([value]) => updatePreferences({ maxWalkingDistance: value })}
                    max={2}
                    min={0.1}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Walking Time: {preferences.maxWalkingTime} minutes</Label>
                  <Slider
                    value={[preferences.maxWalkingTime]}
                    onValueChange={([value]) => updatePreferences({ maxWalkingTime: value })}
                    max={30}
                    min={5}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Route Priorities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Prioritize routes by:</Label>
                  <Select
                    value={preferences.prioritizeBy}
                    onValueChange={(value: "time" | "cost" | "environment" | "comfort") =>
                      updatePreferences({ prioritizeBy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Fastest Time</SelectItem>
                      <SelectItem value="cost">Lowest Cost</SelectItem>
                      <SelectItem value="environment">Environmental Impact</SelectItem>
                      <SelectItem value="comfort">Comfort & Reliability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fitness Level:</Label>
                  <Select
                    value={preferences.fitnessLevel}
                    onValueChange={(value: "low" | "moderate" | "high") => updatePreferences({ fitnessLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Prefer easier routes</SelectItem>
                      <SelectItem value="moderate">Moderate - Balanced approach</SelectItem>
                      <SelectItem value="high">High - Don't mind physical activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Avoid hills when possible</Label>
                  <Switch
                    checked={preferences.avoidHills}
                    onCheckedChange={(checked) => updatePreferences({ avoidHills: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Prefer covered routes</Label>
                  <Switch
                    checked={preferences.preferCoveredRoutes}
                    onCheckedChange={(checked) => updatePreferences({ preferCoveredRoutes: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Budget-conscious (avoid paid options)</Label>
                  <Switch
                    checked={preferences.budgetConstraints}
                    onCheckedChange={(checked) => updatePreferences({ budgetConstraints: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Prioritize eco-friendly options</Label>
                  <Switch
                    checked={preferences.sustainabilityFocus}
                    onCheckedChange={(checked) => updatePreferences({ sustainabilityFocus: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  Weather Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rain threshold (avoid outdoor modes): {preferences.rainThreshold}%</Label>
                  <Slider
                    value={[preferences.rainThreshold]}
                    onValueChange={([value]) => updatePreferences({ rainThreshold: value })}
                    max={100}
                    min={0}
                    step={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Walking Temperature Range</Label>
                    <div className="space-y-1">
                      <Label className="text-sm">Min: {preferences.temperatureComfort.minWalking}°F</Label>
                      <Slider
                        value={[preferences.temperatureComfort.minWalking]}
                        onValueChange={([value]) =>
                          updatePreferences({
                            temperatureComfort: { ...preferences.temperatureComfort, minWalking: value },
                          })
                        }
                        max={70}
                        min={20}
                        step={5}
                      />
                      <Label className="text-sm">Max: {preferences.temperatureComfort.maxWalking}°F</Label>
                      <Slider
                        value={[preferences.temperatureComfort.maxWalking]}
                        onValueChange={([value]) =>
                          updatePreferences({
                            temperatureComfort: { ...preferences.temperatureComfort, maxWalking: value },
                          })
                        }
                        max={110}
                        min={70}
                        step={5}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Biking Temperature Range</Label>
                    <div className="space-y-1">
                      <Label className="text-sm">Min: {preferences.temperatureComfort.minBiking}°F</Label>
                      <Slider
                        value={[preferences.temperatureComfort.minBiking]}
                        onValueChange={([value]) =>
                          updatePreferences({
                            temperatureComfort: { ...preferences.temperatureComfort, minBiking: value },
                          })
                        }
                        max={70}
                        min={20}
                        step={5}
                      />
                      <Label className="text-sm">Max: {preferences.temperatureComfort.maxBiking}°F</Label>
                      <Slider
                        value={[preferences.temperatureComfort.maxBiking]}
                        onValueChange={([value]) =>
                          updatePreferences({
                            temperatureComfort: { ...preferences.temperatureComfort, maxBiking: value },
                          })
                        }
                        max={110}
                        min={70}
                        step={5}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Accessibility className="w-5 h-5" />
                  Accessibility Needs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Require mobility assistance</Label>
                  <Switch
                    checked={preferences.mobilityAssistance}
                    onCheckedChange={(checked) => updatePreferences({ mobilityAssistance: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Need wheelchair accessibility</Label>
                  <Switch
                    checked={preferences.needWheelchairAccess}
                    onCheckedChange={(checked) => updatePreferences({ needWheelchairAccess: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require elevators (avoid stairs)</Label>
                  <Switch
                    checked={preferences.requireElevators}
                    onCheckedChange={(checked) => updatePreferences({ requireElevators: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Avoid stairs when possible</Label>
                  <Switch
                    checked={preferences.avoidStairs}
                    onCheckedChange={(checked) => updatePreferences({ avoidStairs: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Weather alerts</Label>
                  <Switch
                    checked={preferences.notifications.weatherAlerts}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        notifications: { ...preferences.notifications, weatherAlerts: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Route delays</Label>
                  <Switch
                    checked={preferences.notifications.routeDelays}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        notifications: { ...preferences.notifications, routeDelays: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>New route options</Label>
                  <Switch
                    checked={preferences.notifications.newRouteOptions}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        notifications: { ...preferences.notifications, newRouteOptions: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Maintenance updates</Label>
                  <Switch
                    checked={preferences.notifications.maintenanceUpdates}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        notifications: { ...preferences.notifications, maintenanceUpdates: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Favorite Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add favorite location..."
                    value={newFavorite.name}
                    onChange={(e) => setNewFavorite({ ...newFavorite, name: e.target.value })}
                    onKeyPress={(e) => e.key === "Enter" && addFavoriteLocation()}
                  />
                  <Select
                    value={newFavorite.category}
                    onValueChange={(value: any) => setNewFavorite({ ...newFavorite, category: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="dining">Dining</SelectItem>
                      <SelectItem value="recreation">Recreation</SelectItem>
                      <SelectItem value="residence">Residence</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addFavoriteLocation}>Add</Button>
                </div>

                <div className="space-y-2">
                  {preferences.favoriteLocations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{location.category}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFavoriteLocation(location.name)}>
                        Remove
                      </Button>
                    </div>
                  ))}

                  {preferences.favoriteLocations.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">No favorite locations added yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
