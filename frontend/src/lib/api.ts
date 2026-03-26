export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

/**
 * Fetch wrapper that automatically attaches Authorization header if token provided.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(url, { ...options, headers })
}

export function severityLabel(s: 'low' | 'medium' | 'high') {
  return s === 'high' ? 'Tinggi' : s === 'medium' ? 'Sedang' : 'Rendah'
}

/**
 * Format ISO date string from BMKG to readable Indonesian format
 * e.g., "2026-03-23T04:19:45+00:00" -> "23 Mar 2026, 11:19 WIB"
 */
export function formatBmkgDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    
    // Convert to WIB (UTC+7)
    const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    
    const day = wibDate.getUTCDate()
    const month = months[wibDate.getUTCMonth()]
    const year = wibDate.getUTCFullYear()
    const hours = wibDate.getUTCHours().toString().padStart(2, '0')
    const minutes = wibDate.getUTCMinutes().toString().padStart(2, '0')
    
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`
  } catch {
    return isoString
  }
}

/**
 * Short date format for ticker
 * e.g., "2026-03-23T04:19:45+00:00" -> "23 Mar, 11:19 WIB"
 */
export function formatBmkgDateShort(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    
    // Convert to WIB (UTC+7)
    const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    
    const day = wibDate.getUTCDate()
    const month = months[wibDate.getUTCMonth()]
    const hours = wibDate.getUTCHours().toString().padStart(2, '0')
    const minutes = wibDate.getUTCMinutes().toString().padStart(2, '0')
    
    return `${day} ${month}, ${hours}:${minutes} WIB`
  } catch {
    return isoString
  }
}

export function riskColor(level: 'low' | 'medium' | 'high') {
  if (level === 'high') return '#f43f5e' // rose-500
  if (level === 'medium') return '#f59e0b' // amber-500
  return '#10b981' // emerald-500
}

export function magClass(mag: string) {
  const m = parseFloat(mag || '0')
  if (m >= 6) return 'high'
  if (m >= 5) return 'medium'
  return 'low'
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}
