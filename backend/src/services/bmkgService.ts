import axios from 'axios'
import { env } from '../config/env.js'
import type { AlertItem, Coordinates, RiskLevel } from '../types/domain.js'

interface BmkgEarthquake {
  Tanggal?: string
  Jam?: string
  DateTime?: string
  Coordinates?: string
  Magnitude?: string
  Kedalaman?: string
  Wilayah?: string
  Potensi?: string
  Dirasakan?: string
  Shakemap?: string
}

function parseCoordinates(rawCoordinates?: string): Coordinates {
  if (!rawCoordinates) {
    return { lat: -6.2, lng: 106.8 }
  }

  const [latRaw, lngRaw] = rawCoordinates.split(',').map((item) => item.trim())
  const lat = Number.parseFloat(latRaw)
  const lng = Number.parseFloat(lngRaw)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { lat: -6.2, lng: 106.8 }
  }

  return { lat, lng }
}

function severityFromMagnitude(magnitudeText?: string): RiskLevel {
  const magnitude = Number.parseFloat(magnitudeText || '0')
  if (magnitude >= 6) return 'high'
  if (magnitude >= 5) return 'medium'
  return 'low'
}

function normalizeEarthquake(item?: BmkgEarthquake) {
  if (!item) return null

  return {
    source: 'BMKG',
    dateTime: item.DateTime || `${item.Tanggal || ''} ${item.Jam || ''}`.trim(),
    magnitude: item.Magnitude || 'N/A',
    depth: item.Kedalaman || 'N/A',
    region: item.Wilayah || 'Indonesia',
    potential: item.Potensi || 'Pantau kanal resmi BMKG',
    felt: item.Dirasakan || null,
    shakemap: item.Shakemap || null,
    coordinates: parseCoordinates(item.Coordinates)
  }
}

export async function fetchLatestEarthquake() {
  const response = await axios.get(env.bmkgEarthquakeFeed, { timeout: 8000 })
  const earthquake = normalizeEarthquake(response?.data?.Infogempa?.gempa)

  if (!earthquake) {
    throw new Error('Data autogempa BMKG tidak tersedia')
  }

  return earthquake
}

export async function fetchFeltEarthquakes(limit = 5) {
  const response = await axios.get(env.bmkgFeltEarthquakeFeed, { timeout: 8000 })
  const rows = response?.data?.Infogempa?.gempa
  const list = Array.isArray(rows) ? rows : []

  return list
    .slice(0, limit)
    .map((row) => normalizeEarthquake(row))
    .filter(Boolean)
}

export async function fetchRecentEarthquakes(limit = 10) {
  const response = await axios.get(env.bmkgRecentEarthquakeFeed, { timeout: 8000 })
  const rows = response?.data?.Infogempa?.gempa
  const list = Array.isArray(rows) ? rows : []

  return list
    .slice(0, limit)
    .map((row) => normalizeEarthquake(row))
    .filter(Boolean)
}

export async function fetchWeatherWarningDigest() {
  try {
    const response = await axios.get(env.bmkgWeatherWarningFeed, {
      timeout: 8000,
      responseType: 'text'
    })

    const text = typeof response.data === 'string' ? response.data : ''
    const compact = text.replace(/\s+/g, ' ').slice(0, 380)

    return {
      source: 'BMKG Weather Warning',
      summary: compact || 'Data peringatan cuaca tersedia namun belum dapat diringkas.',
      feed: env.bmkgWeatherWarningFeed
    }
  } catch (error) {
    return {
      source: 'BMKG Weather Warning',
      summary: 'Feed peringatan cuaca BMKG belum tersedia saat ini.',
      feed: env.bmkgWeatherWarningFeed
    }
  }
}

function fallbackAlert(lat: number, lng: number): AlertItem {
  return {
    id: `fb-${Date.now()}`,
    title: 'Mode Siaga Aktif',
    severity: 'low',
    message:
      'Data BMKG sementara tidak dapat diakses. Gunakan panduan darurat lokal sambil menunggu sinkronisasi.',
    category: 'sistem',
    action: 'Pastikan nomor darurat dan jalur evakuasi sudah diketahui.',
    payload: {
      source: 'SiagaMate Fallback',
      dateTime: new Date().toISOString(),
      region: 'Pemantauan nasional',
      coordinates: { lat, lng }
    }
  }
}

export async function getAlertsByLocation(lat: number, lng: number): Promise<AlertItem[]> {
  try {
    const [latest, felt, weather] = await Promise.all([
      fetchLatestEarthquake(),
      fetchFeltEarthquakes(3),
      fetchWeatherWarningDigest()
    ])

    const earthquakeAlert: AlertItem = {
      id: `eq-${Date.now()}`,
      title: 'Update Gempa Terkini',
      severity: severityFromMagnitude(latest.magnitude),
      message: `${latest.region} | M ${latest.magnitude} | ${latest.potential}`,
      category: 'gempa-bumi',
      action: 'Siapkan tas siaga, cek struktur bangunan, dan update keluarga.',
      payload: latest
    }

    const feltAlert: AlertItem = {
      id: `felt-${Date.now()}`,
      title: 'Gempa Dirasakan (BMKG)',
      severity: 'medium',
      message:
        felt.length > 0
          ? `${felt.length} kejadian terbaru terdeteksi pada feed gempadirasakan.`
          : 'Belum ada data gempa dirasakan terbaru.',
      category: 'gempa-bumi',
      action: 'Pastikan titik kumpul keluarga tetap siap.',
      payload: felt
    }

    const weatherAlert: AlertItem = {
      id: `weather-${Date.now()}`,
      title: 'Peringatan Cuaca BMKG',
      severity: 'medium',
      message: weather.summary,
      category: 'cuaca-ekstrem',
      action: 'Pantau potensi hujan lebat, angin kencang, dan banjir lokal.',
      payload: weather
    }

    return [earthquakeAlert, feltAlert, weatherAlert]
  } catch (error) {
    return [fallbackAlert(lat, lng)]
  }
}

export async function getBmkgMultiFeed() {
  const [latest, felt, recent, weather] = await Promise.all([
    fetchLatestEarthquake(),
    fetchFeltEarthquakes(7),
    fetchRecentEarthquakes(12),
    fetchWeatherWarningDigest()
  ])

  return {
    generatedAt: new Date().toISOString(),
    feeds: {
      latestEarthquake: latest,
      feltEarthquakes: felt,
      recentEarthquakes: recent,
      weatherWarning: weather
    }
  }
}


/**
 * Fetch disaster data from BNPB API
 * BNPB (Badan Nasional Penanggulangan Bencana) provides structured disaster alerts
 * Better for flood/landslide data than BMKG text parsing
 */
export async function fetchBnpbDisasters() {
  try {
    const response = await axios.get(env.bnpbDisasterApi, {
      timeout: 10000,
      params: {
        // Get only current/active disasters
        status: 'Aktif'
      }
    })

    const data = response?.data?.data || response?.data || []
    const disasters = Array.isArray(data) ? data : []

    return {
      source: 'BNPB',
      generatedAt: new Date().toISOString(),
      disasters: disasters.map((disaster: any) => ({
        id: disaster.id || disaster.Pkey || '',
        type: disaster.name || disaster.Tipe || '', // Banjir, Longsor, etc.
        status: disaster.status || 'Aktif',
        province: disaster.province || disaster.provinsi || '',
        district: disaster.district || disaster.District || '',
        village: disaster.village || disaster.kelurahan || '',
        coordinates: {
          lat: Number.parseFloat(disaster.Longlatu || disaster.latitude || '0'),
          lng: Number.parseFloat(disaster.Longlatit || disaster.longitude || '0')
        },
        affectedPeople: disaster.affectedPeople || disaster.jumlahKejadian || 0,
        description: disaster.description || disaster.keterangan || '',
        createdAt: disaster.createdAt || disaster.Tanggal || new Date().toISOString()
      }))
    }
  } catch (error) {
    console.error('BNPB API fetch error:', error)
    return {
      source: 'BNPB',
      generatedAt: new Date().toISOString(),
      disasters: []
    }
  }
}

/**
 * Check if there's active BNPB disaster within distance threshold (km) from user location
 */
export function checkNearbyBnpbDisasters(
  userLat: number,
  userLng: number,
  disasters: any[],
  disasterType: string,
  distanceThreshold = 100
): any[] {
  return disasters.filter((d: any) => {
    // Filter by disaster type (Banjir, Longsor, etc.)
    if (!d.type.toLowerCase().includes(disasterType.toLowerCase())) {
      return false
    }

    // Check distance
    const disasterLat = d.coordinates?.lat || 0
    const disasterLng = d.coordinates?.lng || 0
    
    if (disasterLat === 0 || disasterLng === 0) return false

    const distanceKm = calculateDistance(userLat, userLng, disasterLat, disasterLng)
    return distanceKm <= distanceThreshold
  })
}

/**
 * Calculate distance in km using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.asin(Math.sqrt(a))
  return Math.round(R * c * 10) / 10
}

// No longer need admin level IV mapping - Ewa Weather API uses simple lat/lon

/**
 * Forecast item structure from Open-Meteo API
 */
interface OpenMeteoForecast {
  time: string
  temperature_2m: number
  weather_code: number
  relative_humidity_2m: number
  wind_speed_10m: number
  wind_direction_10m: number
}

/**
 * WMO Weather codes mapping to Indonesian descriptions
 */
const wmoWeatherMap: Record<number, string> = {
  0: 'Cerah',
  1: 'Sebagian Berawan',
  2: 'Berawan',
  3: 'Mendung',
  45: 'Kabut',
  48: 'Kabut es',
  51: 'Gerimis Ringan',
  53: 'Gerimis Sedang',
  55: 'Gerimis Lebat',
  61: 'Hujan Ringan',
  63: 'Hujan Sedang',
  65: 'Hujan Lebat',
  71: 'Salju Ringan',
  73: 'Salju Sedang',
  75: 'Salju Lebat',
  77: 'Butir Salju',
  80: 'Hujan Ringan Interval',
  81: 'Hujan Sedang Interval',
  82: 'Hujan Lebat Interval',
  85: 'Salju Ringan Interval',
  86: 'Salju Lebat Interval',
  95: 'Badai Petir',
  96: 'Badai Petir Ringan',
  99: 'Badai Petir Lebat'
}

/**
 * Fetch weather forecast from Open-Meteo (free, no API key needed)
 * Returns 7-day hourly forecast with temperature, humidity, wind
 */
export async function fetchWeatherForecast(lat: number, lon: number) {
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return {
      source: 'Open-Meteo Weather',
      forecast: [],
      generatedAt: new Date().toISOString()
    }
  }

  try {
    const response = await axios.get(
      'https://api.open-meteo.com/v1/forecast',
      {
        params: {
          latitude: lat.toFixed(2),
          longitude: lon.toFixed(2),
          hourly: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m',
          timezone: 'Asia/Jakarta',
          forecast_days: 3
        },
        timeout: 8000
      }
    )

    const hourly = response.data?.hourly
    if (!hourly || !hourly.time || hourly.time.length === 0) {
      return {
        source: 'Open-Meteo Weather',
        forecast: [],
        generatedAt: new Date().toISOString()
      }
    }

    // Take data points (limit to 24 for 3 days = 1 per 3 hours approximately)
    const hourlyData: OpenMeteoForecast[] = []
    for (let i = 0; i < Math.min(hourly.time.length, 72); i += 3) {
      hourlyData.push({
        time: hourly.time[i],
        temperature_2m: hourly.temperature_2m[i] || 0,
        weather_code: hourly.weather_code[i] || 0,
        relative_humidity_2m: hourly.relative_humidity_2m[i] || 70,
        wind_speed_10m: hourly.wind_speed_10m[i] || 0,
        wind_direction_10m: hourly.wind_direction_10m[i] || 0
      })
    }

    return {
      source: 'Open-Meteo Weather',
      location: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`,
      forecast: hourlyData.map((item) => ({
        localDatetime: item.time,
        temperature: Math.round(item.temperature_2m),
        weather: wmoWeatherMap[item.weather_code] || 'Tidak diketahui',
        humidity: item.relative_humidity_2m,
        windSpeed: Math.round(item.wind_speed_10m * 10) / 10,
        windDirection: getWindDirection(item.wind_direction_10m)
      })),
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Open-Meteo Weather API error:', error instanceof Error ? error.message : error)
    return {
      source: 'Open-Meteo Weather',
      forecast: [],
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Convert wind direction degrees to cardinal direction
 */
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round((degrees % 360) / 22.5) % 16
  return directions[index] || 'Tenang'
}

/**
 * Analyze weather forecast for flood/landslide risk indicators
 * Logic: 
 * - Both ringan/sedang AND lebat present → MEDIUM risk
 * - Only lebat present → HIGH risk
 * - Only ringan/sedang present → MEDIUM risk
 * - Otherwise → check humidity/wind
 */
export function analyzeWeatherRisk(forecast: any[]): {
  riskLevel: 'low' | 'medium' | 'high'
  indicators: string[]
  hasHeavyRain: boolean
} {
  const indicatorsSet = new Set<string>() // Use Set for deduplication
  let hasHeavyRain = false
  let hasModerateRain = false
  let maxHumidity = 0
  let maxWindSpeed = 0

  if (!forecast || forecast.length === 0) {
    return { riskLevel: 'low', indicators: [], hasHeavyRain }
  }

  // Key weather conditions for flood/landslide risk
  const highRiskWeather = [
    'hujan lebat',
    'heavy rain',
    'hujan deras',
    'badai',
    'thunderstorm',
    'badai petir'
  ]

  const mediumRiskWeather = [
    'hujan',
    'rain',
    'hujan sedang',
    'moderate rain',
    'gerimis',
    'drizzle',
    'hujan ringan interval'
  ]

  const extremeWeather = [
    'badai ekstrem',
    'extreme thunderstorm',
    'tornado',
    'angin kencang ekstrem'
  ]

  // Single pass through forecast to collect all relevant data
  for (const forecast_item of forecast) {
    const weatherDesc = (forecast_item.weather || '').toLowerCase()

    // Check for extreme weather - highest priority
    if (extremeWeather.some(w => weatherDesc.includes(w))) {
      indicatorsSet.add(`⚠️ Cuaca Ekstrem: ${forecast_item.weather}`)
      hasHeavyRain = true
    }

    // Check for heavy rain
    if (highRiskWeather.some(w => weatherDesc.includes(w))) {
      indicatorsSet.add(`🌧️ Hujan Lebat`)
      hasHeavyRain = true
    }

    // Check for moderate rain
    if (mediumRiskWeather.some(w => weatherDesc.includes(w))) {
      indicatorsSet.add(`🌦️ Hujan Ringan/Sedang`)
      hasModerateRain = true
    }

    // Track max humidity (for aggregate indicator)
    if (forecast_item.humidity) {
      maxHumidity = Math.max(maxHumidity, forecast_item.humidity)
    }

    // Track max wind speed (for aggregate indicator)
    if (forecast_item.windSpeed) {
      maxWindSpeed = Math.max(maxWindSpeed, forecast_item.windSpeed)
    }
  }

  // Determine risk level based on rain combination
  let maxRiskLevel: 'low' | 'medium' | 'high' = 'low'

  if (indicatorsSet.has(`⚠️ Cuaca Ekstrem`)) {
    // Extreme weather always HIGH
    maxRiskLevel = 'high'
  } else if (hasHeavyRain && hasModerateRain) {
    // Both heavy and moderate rain present → MEDIUM
    maxRiskLevel = 'medium'
  } else if (hasHeavyRain) {
    // Only heavy rain (no moderate) → HIGH
    maxRiskLevel = 'high'
  } else if (hasModerateRain) {
    // Only moderate/ringan rain → LOW
    maxRiskLevel = 'low'
  } else {
    // No rain indicators - check humidity/wind
    maxRiskLevel = 'low'

    // Add humidity indicator if max > 85%
    if (maxHumidity > 85) {
      maxRiskLevel = 'low'
      indicatorsSet.add(`💧 Kelembaban Tinggi: ${maxHumidity}%`)
    }

    // Add wind speed indicator if max > 40 km/h
    if (maxWindSpeed > 40) {
      maxRiskLevel = 'medium'
      indicatorsSet.add(`💨 Angin Kencang: ${Math.round(maxWindSpeed * 10) / 10} km/h`)
    }
  }

  // Convert Set to Array and limit to 5 most important indicators
  const indicators = Array.from(indicatorsSet).slice(0, 5)

  return {
    riskLevel: maxRiskLevel,
    indicators,
    hasHeavyRain
  }
}

