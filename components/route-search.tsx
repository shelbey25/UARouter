"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Navigation, ArrowUpDown, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DirectionsResponse, RouteResults } from "@/components/route-results"
import { UserPreferencesService } from "@/lib/user-preferences"

const CAMPUS_LOCATIONS = [
  // Academic Buildings
  "Gorgas Library",
  "Rodgers Library for Science & Engineering",
  "Amelia Gayle Gorgas Library",
  "Shelby Hall",
  "Lloyd Hall",
  "Bevill Building",
  "Hardaway Hall",
  "Manly Hall",
  "Smith Hall",
  "Farrah Hall",
  "Hackberry Lane",
  "Houser Hall",
  "Reese Phifer Hall",
  "Woods Hall",
  "Clark Hall",
  "Bidgood Hall",
  "Alston Hall",
  "Carmichael Hall",
  "Osband Hall",
  "Ten Hoor Hall",
  "Morgan Hall",
  "Nott Hall",
  "Little Hall",
  "Garland Hall",
  "Graves Hall",
  "Hewson Hall",
  "Hudson Hall",
  "Kilgore Hall",
  "Marr's Spring Building",
  "Mary Harmon Bryant Hall",
  "North Lawn Hall",
  "Palmer Hall",
  "Phifer Hall",
  "Rose Administration Building",
  "Russell Hall",
  "Sloan Y. Bashinsky Sr. Computer Science Building",
  "Sparkman Center",
  "Tuomey Hall",

  // Dining & Student Life
  "Ferguson Center",
  "Riverside Dining Hall",
  "Fresh Food Company",
  "Lakeside Dining Hall",
  "Burke Dining Hall",
  "Friedman Hall Dining",
  "Julia Tutwiler Hall Dining",
  "Paty Hall Dining",
  "Presidential Village Dining",
  "Ridgecrest Dining Hall",
  "Student Recreation Center",
  "Aquatic Center",
  "Campus Recreation",

  // Residence Halls
  "Tutwiler Hall",
  "Paty Hall",
  "Friedman Hall",
  "Parham Hall",
  "Somerville Hall",
  "Palmer Hall",
  "Ridgecrest South",
  "Ridgecrest East",
  "Ridgecrest West",
  "Lakeside Community",
  "Riverside Community",
  "Presidential Village I",
  "Presidential Village II",
  "Burke Hall",
  "Harris Hall",
  "Highlands",
  "Blount Undergraduate Initiative",

  // Athletics & Recreation
  "Bryant-Denny Stadium",
  "Coleman Coliseum",
  "Sewell-Thomas Stadium",
  "Rhoads Stadium",
  "Alabama Soccer Stadium",
  "Alabama Softball Stadium",
  "Sam Bailey Track & Field Stadium",
  "Mal M. Moore Athletic Facility",
  "Hank Crisp Indoor Facility",
  "Foster Auditorium",

  // Medical & Health
  "Student Health Center",
  "Counseling Center",
  "University Medical Center",
  "Children's Hospital",
  "DCH Regional Medical Center",

  // Transportation & Parking
  "Commuter Lot",
  "Stadium Drive Parking Deck",
  "Colonial Drive Parking Deck",
  "Riverside Parking Deck",
  "10th Avenue Parking Deck",
  "Campus Drive Parking Deck",
  "Hackberry Lane Parking",
  "Rose Administration Parking",
  "Ferguson Center Parking",
  "Crimson Ride Hub",
  "Transit Plaza",

  // Other Campus Locations
  "Quad",
  "Denny Chimes",
  "President's Mansion",
  "Alumni Hall",
  "Moundville Archaeological Park",
  "Paul W. Bryant Museum",
  "Alabama Museum of Natural History",
  "Sarah Moody Gallery of Art",
  "Bama Theatre",
  "Moody Music Building",
  "Rowand-Johnson Hall",
  "University Boulevard",
  "Hackberry Lane",
  "Colonial Drive",
  "Stadium Drive",
  "Campus Drive",
  "10th Avenue",
  "15th Street",
  "6th Avenue",
  "7th Avenue",
  "8th Avenue",
  "9th Avenue",
]

export function RouteSearch() {
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [favoriteLocations, setFavoriteLocations] = useState<any[]>([])

  const [fromSuggestions, setFromSuggestions] = useState<string[]>([])
  const [toSuggestions, setToSuggestions] = useState<string[]>([])
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [fromFocusedIndex, setFromFocusedIndex] = useState(-1)
  const [toFocusedIndex, setToFocusedIndex] = useState(-1)

  const fromInputRef = useRef<HTMLInputElement>(null)
  const toInputRef = useRef<HTMLInputElement>(null)
  const fromSuggestionsRef = useRef<HTMLDivElement>(null)
  const toSuggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load favorite locations
    const preferences = UserPreferencesService.getPreferences()
    setFavoriteLocations(preferences.favoriteLocations)
  }, [])

  const filterSuggestions = (query: string): string[] => {
    if (!query.trim()) return []

    const filtered = CAMPUS_LOCATIONS.filter((location) => location.toLowerCase().includes(query.toLowerCase())).slice(
      0,
      8,
    ) // Limit to 8 suggestions

    return filtered
  }

  const handleFromLocationChange = (value: string) => {
    setFromLocation(value)
    const suggestions = filterSuggestions(value)
    setFromSuggestions(suggestions)
    setShowFromSuggestions(suggestions.length > 0)
    setFromFocusedIndex(-1)
  }

  const handleToLocationChange = (value: string) => {
    setToLocation(value)
    const suggestions = filterSuggestions(value)
    setToSuggestions(suggestions)
    setShowToSuggestions(suggestions.length > 0)
    setToFocusedIndex(-1)
  }

  const handleFromKeyDown = (e: React.KeyboardEvent) => {
    if (!showFromSuggestions) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFromFocusedIndex((prev) => (prev < fromSuggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFromFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (fromFocusedIndex >= 0) {
        selectFromSuggestion(fromSuggestions[fromFocusedIndex])
      }
    } else if (e.key === "Escape") {
      setShowFromSuggestions(false)
      setFromFocusedIndex(-1)
    }
  }

  const handleToKeyDown = (e: React.KeyboardEvent) => {
    if (!showToSuggestions) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setToFocusedIndex((prev) => (prev < toSuggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setToFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (toFocusedIndex >= 0) {
        selectToSuggestion(toSuggestions[toFocusedIndex])
      }
    } else if (e.key === "Escape") {
      setShowToSuggestions(false)
      setToFocusedIndex(-1)
    }
  }

  const selectFromSuggestion = (suggestion: string) => {
    setFromLocation(suggestion)
    setShowFromSuggestions(false)
    setFromFocusedIndex(-1)
  }

  const selectToSuggestion = (suggestion: string) => {
    setToLocation(suggestion)
    setShowToSuggestions(false)
    setToFocusedIndex(-1)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fromSuggestionsRef.current &&
        !fromSuggestionsRef.current.contains(event.target as Node) &&
        fromInputRef.current &&
        !fromInputRef.current.contains(event.target as Node)
      ) {
        setShowFromSuggestions(false)
      }
      if (
        toSuggestionsRef.current &&
        !toSuggestionsRef.current.contains(event.target as Node) &&
        toInputRef.current &&
        !toInputRef.current.contains(event.target as Node)
      ) {
        setShowToSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const popularLocations = [
    "Bryant-Denny Stadium",
    "Gorgas Library",
    "Student Recreation Center",
    "Ferguson Center",
    "Shelby Hall",
    "Rose Administration Building",
    "Tutwiler Hall",
    "Riverside Dining Hall",
  ]

  const [smartReply, setSmartReply] = useState<string | null>(null);
    const [allRoutes, setAllRoutes] = useState<DirectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);


  const handleSearch = () => {
    void (async() => {
    if (fromLocation && toLocation) {
      const preferences = UserPreferencesService.getPreferences();
      setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Locations: (from: " + fromLocation  + ", to: " + toLocation + "), Preferences: " + JSON.stringify(preferences), type: "route_recommendation" }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()
      //console.log(data.reply ?? "(no reply)")
      setSmartReply(data.reply ?? "(no reply)")
    } catch (err: any) {
    } finally {
    }



    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Locations: (from: " + fromLocation  + ", to: " + toLocation + ")", type: "routing_info" }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()
      console.log(data.reply ?? "(no reply)")
      setAllRoutes(JSON.parse(data.reply));
    } catch (err: any) {
    } finally {
      setLoading(false);
    }


      setShowResults(true)
    }
  })();
  }

  const swapLocations = () => {
    const temp = fromLocation
    setFromLocation(toLocation)
    setToLocation(temp)
  }

  const setLocationFromFavorite = (locationName: string, isDestination: boolean) => {
    if (isDestination) {
      setToLocation(locationName)
    } else {
      setFromLocation(locationName)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Plan Your Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground z-10" />
              <Input
                ref={fromInputRef}
                placeholder="From (e.g., Gorgas Library)"
                value={fromLocation}
                onChange={(e) => handleFromLocationChange(e.target.value)}
                onKeyDown={handleFromKeyDown}
                onFocus={() => {
                  if (fromSuggestions.length > 0) {
                    setShowFromSuggestions(true)
                  }
                }}
                className="pl-10"
                autoComplete="off"
              />
              {showFromSuggestions && (
                <div
                  ref={fromSuggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {fromSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion}
                      className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${
                        index === fromFocusedIndex ? "bg-muted" : ""
                      }`}
                      onClick={() => selectFromSuggestion(suggestion)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" size="icon" onClick={swapLocations} className="rounded-full">
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-primary z-10" />
              <Input
                ref={toInputRef}
                placeholder="To (e.g., Bryant-Denny Stadium)"
                value={toLocation}
                onChange={(e) => handleToLocationChange(e.target.value)}
                onKeyDown={handleToKeyDown}
                onFocus={() => {
                  if (toSuggestions.length > 0) {
                    setShowToSuggestions(true)
                  }
                }}
                className="pl-10"
                autoComplete="off"
              />
              {showToSuggestions && (
                <div
                  ref={toSuggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {toSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion}
                      className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${
                        index === toFocusedIndex ? "bg-muted" : ""
                      }`}
                      onClick={() => selectToSuggestion(suggestion)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleSearch}>
            {loading ? (
              <>
                <Search className="w-4 h-4 mr-2 animate-spin" />
                Finding routes...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find Routes
              </>
            )}
          </Button>

          {favoriteLocations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3" />
                Your Favorites
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {favoriteLocations.slice(0, 4).map((location) => (
                  <div key={location.name} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{location.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">({location.category})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setLocationFromFavorite(location.name, false)}
                      >
                        From
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setLocationFromFavorite(location.name, true)}
                      >
                        To
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Popular Destinations</h4>
            <div className="grid grid-cols-2 gap-2">
              {popularLocations.map((location) => (
                <Button
                  key={location}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-8 bg-transparent"
                  onClick={() => setToLocation(location)}
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <>
          {loading ? (
            <div className="p-4 bg-muted rounded-md flex items-center gap-3 animate-pulse">
              <Search className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="h-3 w-48 bg-border rounded" />
                <div className="h-2 w-32 bg-border rounded mt-2" />
              </div>
            </div>
          ) : (
            <RouteResults allRoutesTemp={allRoutes} smartReply={smartReply} fromLocation={fromLocation} toLocation={toLocation} onClose={() => setShowResults(false)} />
          )}
        </>
      )}
    </div>
  )
}
