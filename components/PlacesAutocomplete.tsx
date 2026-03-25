"use client"

import { useState, useEffect, useRef } from "react"
import { useMapsLibrary } from "@vis.gl/react-google-maps"

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: { address: string; lat: number; lng: number }) => void
  placeholder?: string
  defaultValue?: string
}

export function PlacesAutocomplete({ onPlaceSelect, placeholder = "Search location...", defaultValue = "" }: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const placesLibrary = useMapsLibrary("places")
  const geocodingLibrary = useMapsLibrary("geocoding")
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (!placesLibrary) return
    autocompleteService.current = new placesLibrary.AutocompleteService()
  }, [placesLibrary])

  useEffect(() => {
    if (!geocodingLibrary) return
    geocoder.current = new geocodingLibrary.Geocoder()
  }, [geocodingLibrary])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    if (showSuggestions) document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [showSuggestions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    
    if (!val.trim() || !autocompleteService.current) {
      setPredictions([])
      setShowSuggestions(false)
      return
    }

    autocompleteService.current.getPlacePredictions(
      { input: val, componentRestrictions: { country: "in" } }, // Restrict to India, adjust if needed
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results)
          setShowSuggestions(true)
        } else {
          setPredictions([])
          setShowSuggestions(false)
        }
      }
    )
  }

  const handleSuggestionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description)
    setShowSuggestions(false)

    if (!geocoder.current) return

    geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location
        onPlaceSelect({
          address: prediction.description,
          lat: location.lat(),
          lng: location.lng()
        })
      }
    })
  }

  return (
    <div className="flex-1 relative" ref={searchRef}>
      <div className="flex items-center bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <span className="material-symbols-outlined text-[20px] text-muted-foreground pl-3 shrink-0">search</span>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (predictions.length > 0) setShowSuggestions(true) }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground px-2.5 py-2.5 outline-none truncate"
        />
        {inputValue && (
          <button
            onClick={() => { setInputValue(""); setPredictions([]); setShowSuggestions(false) }}
            className="flex items-center justify-center shrink-0 w-8 h-8 mr-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {showSuggestions && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSuggestionSelect(prediction)}
              className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-muted/40 transition-colors border-b border-border/30 last:border-b-0"
            >
              <span className="material-symbols-outlined text-[16px] text-muted-foreground shrink-0">location_on</span>
              <span className="text-foreground truncate">{prediction.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
