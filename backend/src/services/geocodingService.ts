import axios from 'axios'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    village?: string
    suburb?: string
    city?: string
    county?: string
    state?: string
    country?: string
  }
  importance: number
}

interface LocationSuggestion {
  id: string
  label: string
  lat: number
  lng: number
  details: {
    kelurahan?: string
    kecamatan?: string
    kabupaten?: string
    provinsi?: string
  }
}

/**
 * Search for location using Nominatim (OpenStreetMap) geocoding API
 * @param query - Location search query
 * @returns Array of location suggestions
 */
export async function searchLocation(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  try {
    const response = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 10,
        countrycodes: 'id', // Limit to Indonesia
        'accept-language': 'id'
      },
      headers: {
        'User-Agent': 'SiagaMate-AI/1.0'
      },
      timeout: 5000
    })

    const results = response.data || []

    return results.map((item) => {
      const addr = item.address || {}
      
      // Build a cleaner display name
      const parts: string[] = []
      if (addr.village || addr.suburb) parts.push(addr.village || addr.suburb || '')
      if (addr.county) parts.push(addr.county)
      if (addr.city) parts.push(addr.city)
      if (addr.state) parts.push(addr.state)

      const label = parts.filter(Boolean).join(', ') || item.display_name

      return {
        id: String(item.place_id),
        label,
        lat: Number.parseFloat(item.lat),
        lng: Number.parseFloat(item.lon),
        details: {
          kelurahan: addr.village || addr.suburb,
          kecamatan: addr.county,
          kabupaten: addr.city,
          provinsi: addr.state
        }
      }
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}

/**
 * Reverse geocode: Get location details from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Location label
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await axios.get<NominatimResult>('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'id'
      },
      headers: {
        'User-Agent': 'SiagaMate-AI/1.0'
      },
      timeout: 5000
    })

    const addr = response.data.address || {}
    const parts: string[] = []
    
    if (addr.village || addr.suburb) parts.push(addr.village || addr.suburb || '')
    if (addr.county) parts.push(addr.county)
    if (addr.city) parts.push(addr.city)
    if (addr.state) parts.push(addr.state)

    return parts.filter(Boolean).join(', ') || response.data.display_name
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}
