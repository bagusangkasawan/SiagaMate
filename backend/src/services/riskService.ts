import { 
  fetchLatestEarthquake, 
  fetchWeatherWarningDigest,
  fetchWeatherForecast,
  analyzeWeatherRisk
} from './bmkgService.js'

type RiskLevel = 'low' | 'medium' | 'high'

/**
 * City coordinates for matching user location to forecast cities
 * Maps major Indonesian cities for weather forecast matching
 */
const cityCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
  'Jakarta': { lat: -6.2088, lng: 106.8456, name: 'Jakarta' },
  'Surabaya': { lat: -7.2504, lng: 112.7488, name: 'Surabaya' },
  'Bandung': { lat: -6.9147, lng: 107.6098, name: 'Bandung' },
  'Medan': { lat: 3.1957, lng: 98.6711, name: 'Medan' },
  'Semarang': { lat: -6.9674, lng: 110.4161, name: 'Semarang' },
  'Makassar': { lat: -5.3596, lng: 119.4233, name: 'Makassar' },
  'Palembang': { lat: -2.9268, lng: 104.7483, name: 'Palembang' },
  'Denpasar': { lat: -8.6705, lng: 115.2126, name: 'Denpasar' },
  'Yogyakarta': { lat: -7.7956, lng: 110.3695, name: 'Yogyakarta' },
  'Manado': { lat: 1.4748, lng: 124.7662, name: 'Manado' },
  'Pontianak': { lat: -0.0261, lng: 109.3319, name: 'Pontianak' },
  'Banjarmasin': { lat: -3.3257, lng: 114.5938, name: 'Banjarmasin' }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
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

/**
 * Determine risk level based on magnitude AND proximity to epicenter
 * - Very close (< 50km): proximity increases risk level
 * - Nearby (50-100km): standard magnitude-based risk
 * - Far (>= 100km): conservative magnitude-based risk
 */
function calculateRiskLevel(magnitude: string | number, distanceKm: number): RiskLevel {
  const mag = typeof magnitude === 'string' ? Number.parseFloat(magnitude) : magnitude
  
  if (Number.isNaN(mag) || mag === 0) return 'low'
  
  // Very close (< 50 km) - proximity significantly increases risk
  if (distanceKm < 50) {
    if (mag >= 6.5) return 'high'
    if (mag >= 5.0) return 'high'  // M5+ nearby = HIGH RISK
    if (mag >= 4.0) return 'medium'  // M4+ nearby = MEDIUM RISK (felt strongly)
    return 'low'  // M < 4.0 even nearby
  }
  
  // Nearby (50-100 km) - standard magnitude-based risk
  if (distanceKm < 100) {
    if (mag >= 6.5) return 'high'
    if (mag >= 5.5) return 'medium'
    if (mag >= 4.5) return 'low'
    return 'low'
  }
  
  // Far (>= 100 km) - conservative; need higher magnitude to be significant
  if (mag >= 6.5) return 'high'
  if (mag >= 5.5) return 'medium'
  return 'low'
}

/**
 * Check if weather warning is active from BMKG
 */
function hasWeatherAlert(weatherSummary: string): boolean {
  const keywords = ['hujan lebat', 'banjir', 'angin kencang', 'puting beliung', 'cuaca ekstrem']
  return keywords.some(keyword => weatherSummary.toLowerCase().includes(keyword))
}

/**
 * Find nearest forecast city to user location
 * Returns city data with distance
 */
function findNearestCity(userLat: number, userLng: number): { 
  city: string
  distance: number
  coords: { lat: number; lng: number }
} {
  let nearest = { 
    city: 'Jakarta', 
    distance: Infinity, 
    coords: { lat: cityCoordinates['Jakarta'].lat, lng: cityCoordinates['Jakarta'].lng } 
  }
  
  for (const [key, { lat, lng }] of Object.entries(cityCoordinates)) {
    const distance = calculateDistance(userLat, userLng, lat, lng)
    if (distance < nearest.distance) {
      nearest = { city: key, distance, coords: { lat, lng } }
    }
  }
  
  return nearest
}

/**
 * Determine rainfall risk based on weather codes
 * - Heavy rain (kode: 63, 95, 97) = HIGH
 * - Moderate rain (61, 80) = MEDIUM
 * - Light rain (60) OR high humidity (>80%) = LOW
 * - Clear = LOW
 */
function calculateRainfallRisk(weatherCode: string, humidity: number | null, windSpeed: number | null): RiskLevel {
  // Heavy rain codes
  if (['63', '95', '97'].includes(weatherCode)) return 'high'
  
  // Moderate rain codes
  if (['61', '80'].includes(weatherCode)) {
    // Add wind risk factor for longsor
    if (windSpeed && windSpeed > 40) return 'high'
    return 'medium'
  }
  
  // Light rain or high humidity
  if (weatherCode === '60' || (humidity && humidity > 80)) return 'low'
  
  // Default: no rain = low risk
  return 'low'
}

function firstAidByType(disasterType: string) {
  const playbooks: Record<string, string[]> = {
    banjir: [
      'Matikan aliran listrik dari MCB utama jika aman dilakukan.',
      'Pindahkan dokumen penting ke tempat tinggi dan kedap air.',
      'Hindari berjalan di arus deras lebih dari 15 cm.'
    ],
    'gempa-bumi': [
      'Lakukan Drop, Cover, and Hold selama guncangan.',
      'Jauhi kaca, lemari tinggi, dan plafon rapuh.',
      'Setelah guncangan berhenti, evakuasi ke titik kumpul terbuka.'
    ],

    default: [
      'Aktifkan rencana komunikasi keluarga.',
      'Siapkan tas siaga 72 jam.',
      'Pantau kanal resmi BMKG, BNPB, dan BPBD.'
    ]
  }

  return playbooks[disasterType] || playbooks.default
}

export async function predictRisk({
  lat,
  lng,
  disasterType = 'banjir',
  profile = 'warga',
  earthquake: selectedEarthquake,
  adminLevel4Code,
  kelurahan,
  kecamatan,
  kabupaten,
  provinsi
}: {
  lat: number
  lng: number
  disasterType?: string
  profile?: string
  earthquake?: any
  adminLevel4Code?: string
  kelurahan?: string
  kecamatan?: string
  kabupaten?: string
  provinsi?: string
}) {
  let earthquake = selectedEarthquake || null
  let weatherWarning = null
  let weatherForecast = null
  let weatherRiskAnalysis = null
  let riskLevel: RiskLevel = 'low'
  let riskDescription = 'Tidak ada data peringatan dari BMKG saat ini.'

  try {
    // Fetch BMKG data only: earthquake + weather warning + weather forecast
    const fetchPromises: any[] = [
      fetchLatestEarthquake(),
      fetchWeatherWarningDigest(),
      fetchWeatherForecast(lat, lng)
    ]

    const results = await Promise.all(fetchPromises)
    
    const latestEarthquake = results[0]
    const weatherWarningData = results[1]
    const weatherForecastData = results[2]

    if (!earthquake) {
      earthquake = latestEarthquake
    }
    weatherWarning = weatherWarningData
    
    // Parse weather forecast if available
    if (weatherForecastData && weatherForecastData.forecast && weatherForecastData.forecast.length > 0) {
      weatherRiskAnalysis = analyzeWeatherRisk(weatherForecastData.forecast)
      weatherForecast = {
        source: weatherForecastData.source,
        location: weatherForecastData.location,
        forecast: weatherForecastData.forecast,
        riskLevel: weatherRiskAnalysis.riskLevel,
        riskIndicators: weatherRiskAnalysis.indicators,
        hasHeavyRain: weatherRiskAnalysis.hasHeavyRain
      }
    }

    // Risk calculation based on disaster type
    if (disasterType === 'gempa-bumi') {
      // For earthquakes: use magnitude + distance proximity
      if (earthquake && earthquake.coordinates && earthquake.magnitude) {
        const distance = calculateDistance(lat, lng, earthquake.coordinates.lat, earthquake.coordinates.lng)
        riskLevel = calculateRiskLevel(earthquake.magnitude, distance)
      } else {
        riskLevel = 'low'
      }
      
      // Adjust with weather if needed
      const hasWeather = hasWeatherAlert(weatherWarning.summary)
      if (hasWeather && riskLevel !== 'high') {
        if (riskLevel === 'medium') {
          riskLevel = 'high'
        } else {
          riskLevel = 'medium'
        }
      }

      if (earthquake && earthquake.magnitude !== '0' && earthquake.magnitude !== 'N/A') {
        riskDescription = `Gempa M${earthquake.magnitude} di ${earthquake.region}. ${earthquake.potential}`
      }
    } else if (disasterType === 'banjir') {
      // For floods: use weather forecast analysis only
      if (weatherRiskAnalysis) {
        riskLevel = weatherRiskAnalysis.riskLevel
      }

      if (riskLevel === 'high') {
        riskDescription = `⚠️ Peringatan: Prakiraan cuaca menunjukkan hujan lebat dalam 3 hari ke depan. Waspada kemungkinan banjir.`
      } else if (riskLevel === 'medium') {
        riskDescription = `🟡 Risiko Sedang: Prakiraan cuaca menunjukkan hujan yang perlu dipantau. Persiapkan diri jika diperlukan.`
      } else {
        riskDescription = `✅ Risiko Rendah: Prakiraan cuaca normal tanpa hujan signifikan. Kondisi aman untuk kegiatan outdoor.`
      }
    }
  } catch (error) {
    riskDescription = 'Data BMKG tidak dapat diakses. Gunakan panduan darurat lokal.'
  }

  return {
    disasterType,
    location: { lat, lng },
    riskLevel,
    riskDescription,
    bmkgData: {
      earthquake: earthquake ? {
        magnitude: earthquake.magnitude,
        region: earthquake.region,
        potential: earthquake.potential,
        depth: earthquake.depth,
        dateTime: earthquake.dateTime,
        source: 'BMKG Official',
        coordinates: earthquake.coordinates
      } : null,
      weatherWarning: weatherWarning ? {
        summary: weatherWarning.summary,
        source: 'BMKG Official'
      } : null,
      weatherForecast: weatherForecast || null
    },
    firstAidChecklist: firstAidByType(disasterType),
    generatedAt: new Date().toISOString(),
    dataSource: 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)',
    transparency: 'Risk level berdasarkan prakiraan cuaca resmi Open-Meteo (WMO weather data) tanpa data alarm aktif'
  }
}
